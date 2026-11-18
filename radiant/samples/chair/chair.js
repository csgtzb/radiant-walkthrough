// The two elevations supply every member's outline and transverse span, in mm.
const chairFinishes = (() => {
  const pending=[], loader=new THREE.TextureLoader();
  function map(key,color=false) {
    let resolve,reject;
    pending.push(new Promise((ok,fail)=>{resolve=ok;reject=fail;}));
    const tex=loader.load(CHAIR_FABRIC[key],resolve,undefined,()=>reject(new Error('圈绒贴图未能载入')));
    tex.name='Wool Boucle '+key; tex.userData.mimeType='image/jpeg';
    tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.anisotropy=8;
    if(color)tex.colorSpace=THREE.SRGBColorSpace;
    return tex;
  }
  const arm=map('arm');
  const fabric=new THREE.MeshPhysicalMaterial({name:'Wool Boucle',map:map('Diffuse',true),normalMap:map('nor_gl'),
    normalScale:new THREE.Vector2(.72,.72),roughnessMap:arm,aoMap:arm,aoMapIntensity:.55,
    sheen:.35,sheenRoughness:.92,sheenColor:0xcac0ad});
  const oak=vanityFinishes.oak.clone();oak.aoMap=null;
  return {oak,fabric,ready:Promise.all([vanityFinishes.ready,...pending])};
})();

function buildDrawnChair() {
  const T=THREE,drawing=CHAIR_DRAWING,group=new T.Group();
  group.name='C01';group.scale.setScalar(.001);
  const hw=drawing.width/2,hd=drawing.depth/2,H=drawing.height;
  // The source fabric measures roughly 400 mm vertically, with a 1024 × 1269 pixel sample.
  const textileH=400,textileW=textileH*1024/1269;
  function add(name,geometry,material) {
    const mesh=new T.Mesh(geometry,material);
    mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true; group.add(mesh);
  }
  function wood(part,shape,x,name) {
    const b=part.name==='armrest'?5:2;
    const geometry=new T.ExtrudeGeometry(shape,{depth:part.width,curveSegments:16,bevelSize:b,bevelThickness:b,bevelSegments:4});
    // Constrain the outer bevel to the drafted envelope.
    geometry.computeBoundingBox();
    const box=geometry.boundingBox,profileBox=new T.Box2().setFromPoints(shape.getPoints(16));
    const from=box.getSize(new T.Vector3()),to=profileBox.getSize(new T.Vector2());
    geometry.translate(-box.min.x,-box.min.y,-box.min.z);
    geometry.scale(to.x/from.x,to.y/from.y,part.width/from.z);
    geometry.translate(profileBox.min.x,profileBox.min.y,0);
    geometry.applyMatrix4(new T.Matrix4().set(0,0,1,x-hw,0,-1,0,H,1,0,0,-hd,0,0,0,1));
    const {position,normal,uv}=geometry.attributes;
    const offset=(drawing.parts.indexOf(part)*.11+x/1100)%1;
    // Match the rake of each leg to the line from its upper end to its foot.
    const top=shape.getPointAt(0),bottom=shape.getPoints(16).reduce((a,b)=>a.y>b.y?a:b);
    const rake=new T.Vector2(top.y-bottom.y,bottom.x-top.x).normalize();
    for(let i=0;i<position.count;i++){
      const X=position.getX(i),Y=position.getY(i),Z=position.getZ(i);
      const side=Math.abs(normal.getX(i))>.65;
      let u,v;
      if(part.grain==='cross'){u=Math.abs(normal.getY(i))>.65?Z:Y;v=X;}
      else if(part.grain==='leg'){u=side?Z*rake.x-Y*rake.y:X;v=Y*rake.x+Z*rake.y;}
      else {u=side?Y:X;v=Z;}
      uv.setXY(i,offset+u/1800,.19+v/1800);
    }
    add(name,geometry,chairFinishes.oak);
  }
  function cushion(part,shape) {
    // Sweep the sewn side profile across the chair. Quarter-round shoulders meet two flat boxing panels.
    const pts=shape.getSpacedPoints(128).slice(0,-1);
    if(T.ShapeUtils.isClockWise(pts))pts.reverse();
    const n=pts.length,r=23,start=part.x-hw,end=start+part.width;
    const inward=pts.map((p,i)=>{
      const t=pts[(i+1)%n].clone().sub(pts[(i+n-1)%n]).normalize();
      return new T.Vector2(-t.y,t.x);
    });
    const arc=[0];
    for(let i=0;i<n;i++)arc.push(arc[i]+pts[i].distanceTo(pts[(i+1)%n]));
    const centres=[start+r,end-r],positions=[],uv=[],indices=[];
    const world=(i,x,inset)=>new T.Vector3(x,H-pts[i].y-inset*inward[i].y,pts[i].x+inset*inward[i].x-hd);
    const steps=8,rings=[];
    for(let i=0;i<=steps;i++){
      const a=Math.PI/2*i/steps;
      rings.push([centres[0]-r*Math.cos(a),r*(1-Math.sin(a))]);
    }
    for(let i=steps;i>=0;i--){
      const a=Math.PI/2*i/steps;
      rings.push([centres[1]+r*Math.cos(a),r*(1-Math.sin(a))]);
    }
    rings.forEach(([x,inset],k)=>{
      for(let j=0;j<=n;j++){
        positions.push(...world(j%n,x,inset).toArray());
        uv.push((x-start)/textileW,arc[j]/textileH);
        if(k>0 && j<n){
          const a=(k-1)*(n+1)+j,b=a+n+1;
          indices.push(a,a+1,b,a+1,b+1,b);
        }
      }
    });
    for(const [side,x] of [start,end].entries()){
      const contour=pts.map((p,i)=>p.clone().addScaledVector(inward[i],r));
      const first=positions.length/3;
      contour.forEach((p,i)=>{positions.push(...world(i,x,r).toArray());uv.push(p.x/textileW,-p.y/textileH);});
      for(const face of T.ShapeUtils.triangulateShape(contour,[])){
        if(side===0)face.reverse();
        indices.push(...face.map(i=>first+i));
      }
      // A narrow fabric-covered welt follows the seam between boxing and the rounded shoulder.
      const angle=.50, inset=r*(1-Math.sin(angle));
      const seamX=side?centres[1]+r*Math.cos(angle):centres[0]-r*Math.cos(angle);
      const curve=new T.CatmullRomCurve3(pts.map((p,i)=>world(i,seamX,inset)),true);
      const tube=new T.TubeGeometry(curve,164,2.1,8,true);
      const seamUV=tube.attributes.uv;
      for(let i=0;i<seamUV.count;i++)seamUV.setXY(i,seamUV.getX(i)*arc[n]/textileW,seamUV.getY(i)*13.2/textileH);
      add(part.name+'-welt-'+side,tube,chairFinishes.fabric);
    }
    const geometry=new T.BufferGeometry();
    geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
    geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
    geometry.setIndex(indices);geometry.computeVertexNormals();
    add(part.name,geometry,chairFinishes.fabric);
  }
  for(const part of drawing.parts){
    const shape=new T.Shape(),ops={M:'moveTo',L:'lineTo',Q:'quadraticCurveTo',C:'bezierCurveTo',Z:'closePath'};
    for(const [op,...args] of part.profile)shape[ops[op]](...args);
    if(part.finish==='fabric')cushion(part,shape);
    else{
      wood(part,shape,part.x,part.name+(part.paired?'-left':''));
      if(part.paired)wood(part,shape,drawing.width-part.x-part.width,part.name+'-right');
    }
  }
  return group;
}
