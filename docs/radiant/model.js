// Scene geometry and floor shading are both derived from the traced layout.
let refreshFloorShading;
function createApartment(scene) {
  const T=THREE, p=PLAN.parameters;
  const finish=photoFinishes.material;
  const plaster=roomFinishes.paint, plasterEdge=plaster, base=finish('ceiling',{roughness:.87});
  const trim=finish('trim',{roughness:.49}),doorPaint=trim,entryOak=chairFinishes.oak;
  const frame=finish('frame',{metalness:.42,roughness:.41}),cap=frame;
  const hardware=finish('metal',{metalness:.82,roughness:.29}),gasket=finish('seal',{roughness:.70});
  const glass=finish('glass',{transparent:true,opacity:.095,depthWrite:false,roughness:.09,metalness:.16,side:T.DoubleSide});
  const ceiling=new T.Group();scene.add(ceiling);ceiling.visible=false;
  function box(bounds,low,high,material,name,cast=true) {
    const [a,b,c,d]=bounds;
    if(high-low<=.00001||c-a<=.00001||d-b<=.00001)return;
    const wall=Array.isArray(material);
    const g=wall?new T.BoxGeometry(c-a,high-low,d-b,Math.ceil((c-a)/.24),Math.ceil((high-low)/.24),Math.ceil((d-b)/.24)):new T.BoxGeometry(c-a,high-low,d-b);
    const mesh=new T.Mesh(g,material);
    mesh.position.set((a+c)/2,(high+low)/2,(b+d)/2);mesh.name=name;
    mesh.castShadow=cast;mesh.receiveShadow=true;scene.add(mesh);return mesh;
  }
  function thinBounds(s,thick) {
    const [a,b,c,d]=s.bounds,mid=s.axis==='x'?(b+d)/2:(a+c)/2;
    return s.axis==='x'?[a,mid-thick/2,c,mid+thick/2]:[mid-thick/2,b,mid+thick/2,d];
  }
  // Positions along a wall use its own axis; offsets run across its thickness.
  function openingBox(s,a,b,offset,depth,lo,hi,material,name,cast=true){
    const [x,z,X,Z]=s.bounds,alongX=s.axis==='x',mid=(alongX?z+Z:x+X)/2+offset;
    return box(alongX?[a,mid-depth/2,b,mid+depth/2]:[mid-depth/2,a,mid+depth/2,b],lo,hi,material,s.id+'/'+name,cast);
  }
  function pane(s,low,high,railing=false){
    const alongX=s.axis==='x',[x,z,X,Z]=s.bounds,a=alongX?x:z,b=alongX?X:Z;
    const member=(i,j,offset,depth,lo,hi,material,name,cast)=>openingBox(s,i,j,offset,depth,lo,hi,material,name,cast);
    const face=alongX?1:-1,stile=railing?.023:.041;
    member(a,b,0,railing?.035:.086,low,low+stile,frame,'sill');
    member(a,b,0,railing?.035:.086,high-stile,high,frame,'head');
    const n=railing?Math.ceil((b-a)/1.18):s.opening.kind==='window'?2:1;
    for(let i=0;i<n;i++){
      const start=a+(b-a)*i/n,end=a+(b-a)*(i+1)/n;
      member(start,end,0,.009,low+stile,high-stile,glass,'glazing',false);
      for(const t of [start,end-stile])member(t,t+stile,0,railing?.035:.080,low,high,frame,'mullion');
      if(railing)continue;
      for(const t of [start+stile,end-stile-.007])member(t,t+.007,face*.012,.034,low+stile,high-stile,gasket,'glazing-bead');
      if(i===n-1){
        for(const y of [low+.062,high-.076])member(start+stile,end-stile,face*.017,.037,y,y+.014,frame,'sash');
        const t=end-.083;
        member(t,t+.014,face*.053,.026,low+(high-low)*.35,low+(high-low)*.35+.105,hardware,'window-latch');
      }
    }
    if(s.opening?.kind==='window'){
      const reveal=(alongX?Z-z:X-x)/2;
      member(a-.015,b+.015,face*(reveal/2+.01),reveal+.055,low-.022,low+.004,trim,'interior-stool');
      member(a,b,face*(reveal+.006),.015,low-.064,low-.023,trim,'apron');
    }
  }
  function door(s){
    const {start:a,end:b,kind}=s.opening,alongX=s.axis==='x',[x,z,X,Z]=s.bounds;
    const thickness=alongX?Z-z:X-x,H=p.doorHead;
    const member=(i,j,offset,depth,lo,hi,mat,name)=>openingBox(s,i,j,offset,depth,lo,hi,mat,name);
    for(const q of [a,b-.025])member(q,q+.025,0,thickness+.015,0,H,trim,'jamb');
    member(a,b,0,thickness+.015,H-.024,H,trim,'head-jamb');
    for(const sign of [-1,1]){
      for(const q of [a-.052,b-.010])member(q,q+.062,sign*(thickness/2+.007),.014,.001,H+.060,trim,'casing');
      member(a-.052,b+.052,sign*(thickness/2+.007),.014,H-.002,H+.059,trim,'head-casing');
    }
    const entry=kind==='entry';
    const bounds=entry?[a+.029,(Z+z)/2-.023,b-.029,(Z+z)/2+.023]:doorLeafBounds(s);
    const leafAlongX=bounds[2]-bounds[0]>bounds[3]-bounds[1];
    const left=leafAlongX?bounds[0]:bounds[1],right=leafAlongX?bounds[2]:bounds[3],W=right-left;
    const leaf={id:s.id,axis:leafAlongX?'x':'z',bounds};
    const doorMesh=box(bounds,.014,H-.027,entry?entryOak:doorPaint,s.id+'/leaf');
    if(entry)mapArchitecturalUV(doorMesh,1.8,false);
    const handle=entry?right-.091:PLAN.doorSwing[s.id][1]>0?right-.084:left+.084;
    for(const face of [-1,1]){
      const near=face*.022,leverDir=handle>(left+right)/2?-1:1;
      const block=(i,j,offset,depth,lo,hi,m,n)=>openingBox(leaf,i,j,offset,depth,lo,hi,m,n);
      // A shallow panel and bevel create readable joinery in grazing window light.
      if(!entry){
        for(const y of [.27,1.74])block(left+.11*W,right-.11*W,near,.009,y,y+.015,trim,'panel-rail');
        for(const t of [left+.11*W,right-.11*W-.015])block(t,t+.015,near,.009,.27,1.755,trim,'panel-stile');
      }
      block(handle-.023,handle+.023,face*.025,.012,.94,1.002,hardware,'rosette');
      block(handle-.010,handle+.010,face*.043,.034,.962,.980,hardware,'lever-neck');
      block(Math.min(handle,handle+.10*leverDir),Math.max(handle,handle+.10*leverDir),face*.061,.018,.961,.979,hardware,'lever');
    }
  }
  // Align the photographed stone pattern with the wet wall.
  function tileUV(uv,i,x,y){
    uv.setXY(i,x/.60,y/.45);
  }
  function mapArchitecturalUV(mesh,period,bake){
    const g=mesh.geometry,{position,normal,uv}=g.attributes,colors=[];
    const others=bake?wallSpans.filter(s=>s.id!==mesh.name && blocksMovement(s)):[];
    for(let i=0;i<position.count;i++){
      const x=position.getX(i)+mesh.position.x,y=position.getY(i)+mesh.position.y,z=position.getZ(i)+mesh.position.z;
      const side=Math.abs(normal.getX(i))>.5,top=Math.abs(normal.getY(i))>.5;
      if(mesh.material===roomFinishes.tile)tileUV(uv,i,side?z:x,top?-z:y);
      else uv.setXY(i,(side?z:x)/period,(top?-z:y)/period);
      if(bake){
        let clearance=2;
        for(const {bounds:[a,b,A,B]} of others)clearance=Math.min(clearance,Math.hypot(Math.max(a-x,0,x-A),Math.max(b-z,0,z-B)));
        const shade=(1-.22*Math.exp(-clearance/.25))*(1-.14*Math.exp(-y/.22))*(1-.13*Math.exp(-(p.clearHeight-y)/.18));
        colors.push(shade,shade,shade);
      }
    }
    if(bake)g.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  }
  function skirting(s){
    const [a,b,c,d]=s.bounds;
    box([a-.009,b-.009,c+.009,d+.009],.002,.103,trim,s.id+'/baseboard',false);
    box([a-.007,b-.007,c+.007,d+.007],.103,.114,trim,s.id+'/baseboard-cap',false);
  }
  for(const s of wallSpans) {
    // Box face slots are +X, -X, +Y, -Y, +Z, -Z; preserve room-facing identities.
    const sides=[plaster,plaster,plasterEdge,plaster,plaster,plaster];
    const solid=(lo,hi)=>{
      const mesh=box(s.bounds,lo,hi,sides,s.id);
      if(mesh)mapArchitecturalUV(mesh,3,true);
      if(mesh)mesh.userData.surfaceIds=['east','west','top','bottom','south','north'].map(face=>s.id+'/'+face);
    };
    if(!s.opening){
      solid(0,p.clearHeight);
      skirting(s);
      continue;
    }
    const {kind,profile}=s.opening;
    const lo=kind==='window'?p.windowSill:0;
    const hi=Math.min(profile==='door'?p.doorHead:kind==='window'?p.windowHead:p.sliderHead,p.clearHeight);
    solid(0,lo);solid(hi,p.clearHeight);
    if(kind==='glass'||kind==='window')pane(s,lo,hi);
    if(kind==='window')skirting(s);
    if(profile==='door')door(s);
    if(profile==='slider'){
      for(const y of [.003,hi-.023])box(thinBounds(s,.083),y,y+.019,frame,s.id+'/slider-track',false);
      // Park the operable panel on the inner track over the fixed glazing.
      const end=s.opening.start-.025,start=end-(s.opening.end-s.opening.start);
      const rail=(a,b,depth,offset,lo,high,m,n)=>openingBox(s,a,b,offset,depth,lo,high,m,n,false);
      rail(start,end,.008,-.067,.063,hi-.050,glass,'slider-lite');
      for(const t of [start,end-.043])rail(t,t+.043,.043,-.067,.019,hi-.018,frame,'slider-stile');
      for(const y of [.019,hi-.064])rail(start,end,.043,-.067,y,y+.046,frame,'slider-rail');
      for(const y of [.87,1.12])rail(end-.041,end-.025,.042,-.10,y,y+.014,hardware,'slider-pull-mount');
      rail(end-.041,end-.025,.015,-.124,.87,1.134,hardware,'slider-pull');
    }
  }
  for(const r of PLAN.rails) {
    const [a,b,c,d]=r.bounds,alongX=c-a>d-b;
    const s={...r,axis:alongX?'x':'z'};
    pane(s,.07,p.guardHeight,true);
    box(thinBounds(s,.065),p.guardHeight-.03,p.guardHeight+.015,cap,r.id+'/rail');
  }
  // A second UV channel holds contact shading at apartment scale, separate from all finish repeats.
  function visibilityMap(){
    const canvas=document.createElement('canvas');canvas.width=783;canvas.height=844;
    const ctx=canvas.getContext('2d'),k=PLAN.source.metersPerPixel;
    ctx.fillStyle='#fff';ctx.fillRect(0,0,783,844);
    for(const [blur,alpha] of [[17,.38],[6,.30],[1.5,.21]]){
      ctx.filter='blur('+blur+'px)';ctx.fillStyle='rgba(0,0,0,'+alpha+')';
      for(const [x,z,X,Z] of obstacles)ctx.fillRect(x/k,z/k,(X-x)/k,(Z-z)/k);
    }
    return new T.CanvasTexture(canvas);
  }
  let contact=visibilityMap();contact.channel=1;
  const floorMats=new Set();
  function finishFloor(g,material,period,name,height=0){
    const m=material.clone();m.aoMap=contact;m.aoMapIntensity=.65;floorMats.add(m);
    // The contact bake also attenuates the unshadowed room fill under seats and cabinets.
    m.onBeforeCompile=shader=>{
      shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',
        '#include <map_fragment>\n diffuseColor.rgb *= mix(0.48, 1.0, texture2D(aoMap, vAoMapUv).r);');
    };
    const {position,uv}=g.attributes,k=PLAN.source.metersPerPixel,ao=new Float32Array(position.count*2);
    for(let i=0;i<uv.count;i++){
      const x=position.getX(i),z=-position.getY(i);
      if(material===roomFinishes.tile)tileUV(uv,i,x,z);else uv.setXY(i,z/.44,-x/1.20);
      ao[i*2]=x/(783*k);ao[i*2+1]=1-z/(844*k);
    }
    g.setAttribute('uv1',new T.BufferAttribute(ao,2));
    const mesh=new T.Mesh(g,m);mesh.rotation.x=-Math.PI/2;mesh.position.y=height;mesh.receiveShadow=true;mesh.name=name;scene.add(mesh);
  }
  for(const f of PLAN.floors){
    const shape=new T.Shape(f.polygon.map(([x,z])=>new T.Vector2(x,-z)));
    const slab=new T.Mesh(new T.ExtrudeGeometry(shape,{depth:.15,bevelEnabled:false}),base);
    slab.rotation.x=-Math.PI/2;slab.position.y=-.151;slab.castShadow=true;slab.receiveShadow=true;scene.add(slab);
    const g=new T.ShapeGeometry(shape),interior=f.id==='interior';
    finishFloor(g,interior?roomFinishes.boards:roomFinishes.balcony,interior?1.7:1.90,f.id+'/floor');
    if(interior){
      const lid=new T.Mesh(g,finish('ceiling',{roughness:.88,side:T.DoubleSide}));lid.rotation.x=-Math.PI/2;lid.position.y=p.clearHeight;
      lid.castShadow=true;ceiling.add(lid);
    }
  }
  for(const [lo,hi] of [[3.928,5.443],[5.711,7.265]]){
    const x=.342,X=2.72;
    const poly=new T.Shape([new T.Vector2(x,-lo),new T.Vector2(X,-lo),new T.Vector2(X,-hi),new T.Vector2(x,-hi)]);
    finishFloor(new T.ShapeGeometry(poly),roomFinishes.tileFloor,1.90,'bath/tile-floor',.004);
  }
  // Layout-defined wet-wall finishes and the tile splash along the fixed kitchen services.
  function tileFace(bounds,lo,hi,name,finish=roomFinishes.tile){
    const mesh=box(bounds,lo,hi,finish,name,false);
    mapArchitecturalUV(mesh,1.90,false);
  }
  for(const [lo,hi] of [[3.934,5.432],[5.721,7.255]]){
    tileFace([.346,lo,.357,hi],.006,p.clearHeight-.012,'bath/wet-wall');
    for(const z of [lo,hi-.012])tileFace([.35,z,1.15,z+.012],.006,p.clearHeight-.012,'bath/return-tile');
  }
  tileFace([4.10,6.529,6.55,6.541],.901,1.485,'kitchen/backsplash',roomFinishes.splash);
  for(const fixture of PLAN.fixtures)scene.add(createFixture(fixture));
  refreshFloorShading=()=>{
    const replacement=visibilityMap();replacement.channel=1;
    for(const m of floorMats)m.aoMap=replacement;
    contact.dispose();contact=replacement;
  };
  return ceiling;
}
