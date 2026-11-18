// Scene geometry and floor shading are both derived from the traced layout.
function createApartment(scene) {
  const T=THREE, p=PLAN.parameters;
  const mat=(color,extras={})=>new T.MeshStandardMaterial({color,roughness:.87,...extras});
  const plaster=mat(0xf6f4e9), plasterEdge=mat(0xfbf9ef), base=mat(0xd8d8cb);
  const trim=mat(0xe3e1d8);
  const frame=mat(0x9dada4,{metalness:.18}), cap=mat(0x627b6e);
  const glass=mat(0xb6d4cb,{transparent:true,opacity:.25,depthWrite:false,roughness:.24});
  const ceiling=new T.Group();scene.add(ceiling);ceiling.visible=false;
  function box(bounds,low,high,material,name,cast=true) {
    const [a,b,c,d]=bounds;
    if(high-low<=.00001||c-a<=.00001||d-b<=.00001)return;
    const mesh=new T.Mesh(new T.BoxGeometry(c-a,high-low,d-b),material);
    mesh.position.set((a+c)/2,(high+low)/2,(b+d)/2);mesh.name=name;
    mesh.castShadow=cast;mesh.receiveShadow=true;scene.add(mesh);return mesh;
  }
  function thinBounds(s,thick) {
    const [a,b,c,d]=s.bounds,mid=s.axis==='x'?(b+d)/2:(a+c)/2;
    return s.axis==='x'?[a,mid-thick/2,c,mid+thick/2]:[mid-thick/2,b,mid+thick/2,d];
  }
  function pane(s,low,high) {
    const bounds=thinBounds(s,.054),[a,b,c,d]=bounds,alongX=s.axis==='x';
    const start=alongX?a:b,end=alongX?c:d;
    box(thinBounds(s,.016),low+.027,high-.027,glass,s.id+'/glass',false);
    box(bounds,low,low+.035,frame,s.id+'/sill',false);
    box(bounds,high-.035,high,frame,s.id+'/head',false);
    const n=Math.max(1,Math.ceil((end-start)/1.12));
    for(let i=0;i<=n;i++) {
      const center=start+.015+(end-start-.03)*i/n;
      box(alongX?[center-.015,b,center+.015,d]:[a,center-.015,c,center+.015],low,high,frame,s.id+'/frame',false);
    }
  }
  for(const s of wallSpans) {
    // Box face slots are +X, -X, +Y, -Y, +Z, -Z; preserve room-facing identities.
    const sides=[plaster,plaster,plasterEdge,plaster,plaster,plaster];
    const solid=(lo,hi)=>{
      const mesh=box(s.bounds,lo,hi,sides,s.id);
      if(mesh)mesh.userData.surfaceIds=['east','west','top','bottom','south','north'].map(face=>s.id+'/'+face);
    };
    if(!s.opening){
      solid(0,p.clearHeight);
      const [a,b,c,d]=s.bounds;
      box([a-.005,b-.005,c+.005,d+.005],.002,.066,trim,s.id+'/baseboard',false);
      continue;
    }
    const {kind,profile}=s.opening;
    const lo=kind==='window'?p.windowSill:0;
    const hi=Math.min(profile==='door'?p.doorHead:kind==='window'?p.windowHead:p.sliderHead,p.clearHeight);
    solid(0,lo);solid(hi,p.clearHeight);
    if(kind==='glass'||kind==='window')pane(s,lo,hi);
  }
  for(const r of PLAN.rails) {
    const [a,b,c,d]=r.bounds,alongX=c-a>d-b;
    const s={...r,axis:alongX?'x':'z'};
    pane(s,.07,p.guardHeight);
    box(thinBounds(s,.065),p.guardHeight-.03,p.guardHeight+.015,cap,r.id+'/rail');
  }
  function surfaceMap(floor) {
    const canvas=document.createElement('canvas');canvas.width=783;canvas.height=844;
    const ctx=canvas.getContext('2d'),k=PLAN.source.metersPerPixel;
    ctx.fillStyle=floor.id==='interior'?'#ebe9de':'#dcded1';ctx.fillRect(0,0,783,844);
    // Soft contact shading places walls against the floor without decorative textures.
    for(const [blur,alpha] of [[13,.22],[4,.13]]) {
      ctx.filter='blur('+blur+'px)';ctx.fillStyle='rgba(78,84,65,'+alpha+')';
      for(const b of obstacles)ctx.fillRect(b[0]/k,b[1]/k,(b[2]-b[0])/k,(b[3]-b[1])/k);
    }
    const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
    return map;
  }
  for(const f of PLAN.floors){
    const shape=new T.Shape(f.polygon.map(([x,z])=>new T.Vector2(x,-z)));
    const slab=new T.Mesh(new T.ExtrudeGeometry(shape,{depth:.15,bevelEnabled:false}),base);
    slab.rotation.x=-Math.PI/2;slab.position.y=-.151;slab.castShadow=true;slab.receiveShadow=true;scene.add(slab);
    const g=new T.ShapeGeometry(shape),pos=g.attributes.position,uv=g.attributes.uv,k=PLAN.source.metersPerPixel;
    for(let i=0;i<pos.count;i++)uv.setXY(i,pos.getX(i)/(783*k),1+pos.getY(i)/(844*k));
    const floor=new T.Mesh(g,mat(0xffffff,{map:surfaceMap(f)}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;floor.name=f.id+'/floor';scene.add(floor);
    if(f.id==='interior'){
      const lid=new T.Mesh(g,mat(0xf3f1e8,{side:T.DoubleSide}));lid.rotation.x=-Math.PI/2;lid.position.y=p.clearHeight;lid.castShadow=true;ceiling.add(lid);
    }
  }
  for(const fixture of PLAN.fixtures)scene.add(createFixture(fixture));
  return ceiling;
}
