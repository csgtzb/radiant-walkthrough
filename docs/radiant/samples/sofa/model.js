// N01 upholstery study. Local dimensions are millimetres; +Z is the front.
function makeSofaStudy() {
  const T=THREE, root=new T.Group();
  root.name='Loose-cover loveseat'; root.scale.setScalar(.001);
  const fabric=photoFinishes.material('sofaCloth',{
    roughness:1,specularIntensity:.18,sheen:.22,sheenColor:0xb6a78e,sheenRoughness:.95,vertexColors:true});
  const edgeFabric=fabric.clone();edgeFabric.vertexColors=false;
  const [sheetW,sheetH]=[270.71,271.30];
  function mesh(parent,g,mat,name) {
    const m=new T.Mesh(g,mat);m.name=name;m.castShadow=m.receiveShadow=true;parent.add(m);return m;
  }
  function geometry(points,uvs,indices,shades) {
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(points,3));
    g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));g.setIndex(indices);
    if(shades)g.setAttribute('color',new T.Float32BufferAttribute(shades,3));
    g.computeVertexNormals();return g;
  }
  const gauss=(t,s)=>Math.exp(-(t*t)/(s*s));
  // A tuck consists of a narrow hollow and a low shoulder. Each one starts at a sewn edge.
  function tuck(x,y,[cx,cy,angle,length,width,depth]) {
    const dx=x-cx,dy=y-cy,c=Math.cos(angle),s=Math.sin(angle);
    const along=dx*c+dy*s,across=dy*c-dx*s+.00065*along*along;
    return depth*gauss(along,length)*(.57*gauss(across+width*1.55,width*1.5)-gauss(across,width));
  }

  // Two separately cut covers meet on a thin French seam. Front and rear loft
  // can have different profiles while still sharing the same sewn perimeter.
  function pad(name,seat,hand,origin) {
    const part=new T.Group();part.name=name;part.position.set(...origin);root.add(part);
    // Local gathers run part-way around the bench nose where the two covers are stitched.
    const gathers=[[-613,13,4.2],[-578,9,2.5],[-495,14,3.3],[-438,9,2.1],[-276,15,3.3],
      [-178,10,2.9],[-145,9,1.8],[-46,15,3.1],[63,11,2.4],[104,8,1.9],[239,12,3.4],
      [350,15,2.9],[387,9,2.0],[477,13,3.2],[570,9,3.1],[615,14,4.5]];
    const W=seat?1400:696,H=seat?790:433,nu=seat?104:64,nv=seat?58:52;
    const folds=seat?[
      [-544,-326,.63,103,10,8],[541,-326,2.54,81,11,10],[-220,-367,1.31,60,10,4],
      [452,292,-.53,119,14,9],[-405,248,.26,142,18,11]
    ]:hand<0?[
      [-287,133,-.46,80,8,10],[-290,88,-.28,65,6,6],[270,-127,.71,110,11,14],
      [269,-156,.40,78,7,8],[-157,-170,1.06,73,10,8],[140,176,-1.30,58,9,5]
    ]:[
      [-268,145,-.7,82,8,11],[-280,111,-.39,56,6,7],[263,-138,-.68,91,11,11],
      [219,-161,-.91,68,7,6],[-192,-137,.56,106,12,10],[167,171,1.17,52,9,5]
    ];
    function surface(u,v,front){
      const a=Math.abs(u),b=Math.abs(v);
      // Shallow cut-off corners and pinched tips keep the rectangular pattern legible.
      let x=u*W*.5*(1-(seat?.041:.029)*b**7*a**3);
      let y=v*H*.5*(1-(seat?.081:.052)*a**7*b**3);
      let seam;
      if(seat){
        y+=7*Math.sin(3.4*u+.65)*b**5+4*Math.sin(6.4*u-1)*b**8;
        seam=4*Math.sin(3*u-.5)+4*Math.sin(6.1*u+1)*b**3+3*u*v;
      }else{
        y+=Math.max(v,0)**6*(4.1*Math.sin(8*u+hand)+7*Math.abs(u)**5);
        y-=((hand<0?21:16)*gauss(u-(hand<0?-.12:.21),.57)+3.8*Math.sin(6*u+hand))*Math.max(v,0)**3;
        x+=hand*(6*v+4*Math.sin(3*v+u)*a**4);
        seam=(8*Math.sin(u*3.1+hand)+4*Math.sin(6*v+hand))*Math.max(a,b)**3;
      }
      const profile=Math.max(0,(1-a**(seat?7:8))*(1-b**6));
      let loft=0;
      if(front){
        loft=(seat?112:104)*profile**(seat?.51:.56);
        if(!seat){
          const slant=y-(hand<0?.54:-.38)*x+60;
          loft+=profile*(hand<0?5:4)*(gauss(slant+48,53)-gauss(slant,37))*gauss(x+hand*90,190);
        }
        if(seat){
          loft-=profile*(21*gauss(x+150,395)*gauss(y-82,158)+11*gauss(x-370,200)*gauss(y-122,136));
        }else{
          loft+=profile*(23*gauss(y+86,100)-16*gauss(x+hand*68,157)*gauss(y-28,110));
        }
        const fade=Math.min(1,profile*9);
        for(const fold of folds)loft+=fade*(seat?.85:.48)*tuck(x,y,fold);
      }else{
        loft=seat?-96*Math.max(0,(1-a**15)*(1-b**20))**.28:-81*profile**.40;
      }
      if(seat && v < -.68){
        const rise=loft/100, attenuation=Math.max(0,-v)**12;
        for(const [centre,width,depth] of gathers){
          const dx=x-centre+rise*11*Math.sin(centre);
          y+=depth*attenuation*gauss(rise-.10,.67)*(gauss(dx,width)-.42*gauss(dx+width*1.5,width));
        }
      }
      const depth=loft+seam;
      return seat?new T.Vector3(x,depth,-y):new T.Vector3(x,y,depth);
    }
    const axis=(i,n)=>Math.sin((i/n-.5)*Math.PI);
    for(const front of [true,false]){
      const xyz=[],uvs=[],ind=[],shades=[];
      for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){
        const u=axis(i,nu),v=axis(j,nv),p=surface(u,v,front);
        xyz.push(...p.toArray());
        // Add distance around the rolled edge to the planar cloth coordinates.
        const depth=seat?p.y:p.z;
        uvs.push((p.x+Math.sign(u)*Math.abs(depth)*.55*Math.abs(u)**4)/sheetW,
          ((seat?-p.z:p.y)+Math.sign(v)*Math.abs(depth)*.58*Math.abs(v)**4)/sheetH);
        let shade=front?1:.81;
        if(front&&!seat)shade-=.24*Math.max(-v,0)**3+.12*Math.max(hand<0?u:-u,0)**6;
        if(front&&seat)shade-=.28*Math.max(v,0)**3+.13*Math.abs(u)**8;
        shades.push(shade,shade,shade);
        const k=j*(nu+1)+i,l=k+nu+1;
        if(i<nu&&j<nv)ind.push(...(front?[k,k+1,l,k+1,l+1,l]:[k,l,k+1,k+1,l,l+1]));
      }
      mesh(part,geometry(xyz,uvs,ind,shades),fabric,front?'Face panel':'Underside panel');
    }
    const rim=[];
    for(let i=0;i<nu;i++)rim.push(surface(axis(i,nu),-1,true));
    for(let j=0;j<nv;j++)rim.push(surface(1,axis(j,nv),true));
    for(let i=nu;i>0;i--)rim.push(surface(axis(i,nu),1,true));
    for(let j=nv;j>0;j--)rim.push(surface(-1,axis(j,nv),true));
    const xyz=[],uvs=[],ind=[],up=seat?new T.Vector3(0,1,0):new T.Vector3(0,0,1);
    let arc=0;
    for(let i=0;i<=rim.length;i++){
      const k=i%rim.length,p=rim[k],prev=rim[(k+rim.length-1)%rim.length],next=rim[(k+1)%rim.length];
      if(i)arc+=p.distanceTo(prev);
      const out=next.clone().sub(prev).cross(up).normalize();
      const lip=seat?12.5:9.0,flutter=(seat?1.9:1.5)*Math.sin(arc/35+hand)+.9*Math.sin(arc/13);
      for(const [width,raise] of [[-.6,1.2],[lip,flutter+1.2],[lip+.6,flutter-.9],[-.6,-1.1]]){
        xyz.push(...p.clone().addScaledVector(out,width).addScaledVector(up,raise).toArray());
        uvs.push(arc/sheetW,(width+1)/sheetH);
      }
      if(i<rim.length)for(let j=0;j<3;j++){
        const a=i*4+j;ind.push(a,a+1,a+4,a+1,a+5,a+4);
      }
    }
    const flangeMat=edgeFabric.clone();flangeMat.side=T.DoubleSide;
    mesh(part,geometry(xyz,uvs,ind),flangeMat,'Folded French seam');
    if(!seat){part.rotation.x=hand<0?-.175:-.205;part.rotation.z=hand<0?-.013:.019;}
    return part;
  }

  // The loose skirt hangs from the deck. Top and bottom edges can move independently
  // of the arm crown, unlike the old single uniformly rounded block.
  function slipcover(name,w,h,d,r,center,arm=0) {
    const g=new T.BoxGeometry(w,h,d,Math.max(6,Math.ceil(w/18)),Math.ceil(h/18),Math.ceil(d/18));
    const {position,normal,uv}=g.attributes,shades=[];
    function shapePoint(ox,oy,oz){
      const inner=new T.Vector3(THREE.MathUtils.clamp(ox,-w/2+r,w/2-r),THREE.MathUtils.clamp(oy,-h/2+r,h/2-r),THREE.MathUtils.clamp(oz,-d/2+r,d/2-r));
      const n=new T.Vector3(ox,oy,oz).sub(inner).normalize();
      const p=inner.addScaledVector(n,r),u=2*ox/w,v=oy/h+.5,t=2*oz/d;
      if(arm){
        p.x+=arm*(3.4*v*v-4.6*gauss(t+.12,.34)*v+2.1*Math.cos(t*8+arm)*(1-v)**2);
        p.y+=v**3*(8*Math.sin(t*2.5+arm*.3)-9*t);
        p.z+=Math.max(t,0)**4*(3*Math.sin(v*5+arm)-4*gauss(v-.81,.15));
      }else{
        const gathered=6*gauss(u+.72-.08*v,.068)-4*gauss(u+.62-.07*v,.042)
            +7*gauss(u-.52+.11*v,.085)-4*gauss(u-.63+.1*v,.048);
        const hem=2.7*gauss(oy+h/2-18,5.0)-1.6*gauss(oy+h/2-24,3.2);
        p.z+=Math.max(t,0)**6*((gathered+3*Math.cos(u*9+v)+2*Math.sin(u*23+1.5))*(1-v)**2+hem);
        p.y+=(1-v)**4*(4+3.4*Math.cos(7*u+t)+1.7*Math.sin(18*u));
      }
      return p;
    }
    for(let i=0;i<position.count;i++){
      const ox=position.getX(i),oy=position.getY(i),oz=position.getZ(i);
      const p=shapePoint(ox,oy,oz),v=oy/h+.5;
      position.setXYZ(i,p.x,p.y,p.z);
      const side=Math.abs(normal.getX(i))>.5,top=Math.abs(normal.getY(i))>.5;
      uv.setXY(i,(side?p.z:p.x)/sheetW,(top?-p.z:p.y)/sheetH);
      const ao=.98-.19*Math.exp(-v*12)-(!arm?.18*gauss(v-1,.16):.12*Math.max(-arm*normal.getX(i),0));
      shades.push(ao,ao,ao);
    }
    g.setAttribute('color',new T.Float32BufferAttribute(shades,3));g.computeVertexNormals();
    const m=mesh(root,g,fabric,name);m.position.set(...center);
    if(arm){
      // Follow the actual slipcover corner, including its bend from the front up over the arm.
      const half=w/2,points=[];
      for(let i=0;i<=20;i++)points.push(shapePoint(arm*(half-7),-h/2+8+(h-r-8)*i/20,d/2));
      for(let i=1;i<=8;i++){const a=i*Math.PI/16;points.push(shapePoint(arm*(half-7),h/2-r+r*Math.sin(a),d/2-r+r*Math.cos(a)));}
      for(let i=1;i<=45;i++)points.push(shapePoint(arm*(half-7),h/2,d/2-r-(d-2*r)*i/45));
      const path=new T.CatmullRomCurve3(points);
      const geo=new T.TubeGeometry(path,130,2.3,7,false);
      const uv=geo.attributes.uv;
      for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*path.getLength()/sheetW,uv.getY(i)*14.4/sheetH);
      mesh(m,geo,edgeFabric,'Slipcover return seam');
    }
    return m;
  }
  slipcover('Front apron',1450,257,960,11,[0,135,-5]);
  slipcover('Back rail',1470,682,105,24,[0,367,-460]);
  for(const hand of [-1,1]){
    slipcover('Slipcovered arm',78,650,1030,18,[hand*744,333,-2],hand);

  }
  const footMat=photoFinishes.material('maple',{roughness:.82});
  for(const x of [-683,683])for(const z of [-437,432]){
    const foot=mesh(root,new T.CylinderGeometry(28,24,34,18),footMat,'Recessed foot');foot.position.set(x,17,z);
  }
  pad('Bench cushion',true,0,[0,349,104]);
  pad('Left back cushion',false,-1,[-348,619,-241]);
  pad('Right back cushion',false,1,[348,618,-248]);
  return {model:root,ready:photoFinishes.ready()};
}
