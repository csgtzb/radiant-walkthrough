function inspectSample({model,ready,views,contactMap,stage={}}) {
  const T=THREE, canvas=document.querySelector('canvas');
  let renderer;
  try {renderer=new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});}
  catch {document.querySelector('#error').hidden=false;return;}
  const scene=new T.Scene(), ortho=new T.OrthographicCamera(), photo=new T.PerspectiveCamera(24,1,.05,30);
  let camera=photo;
  scene.background=new T.Color(stage.background??0xe4e2dc);
  scene.add(model);
  if(stage.environmentIntensity===undefined)lightSampleReflections(renderer,model);
  else{scene.environment=lightSampleReflections(renderer);scene.environmentIntensity=stage.environmentIntensity;}
  renderer.toneMapping=T.NeutralToneMapping;
  renderer.toneMappingExposure=.98;
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.shadowMap.enabled=stage.castShadow??true; renderer.shadowMap.type=T.PCFShadowMap;
  scene.add(new T.HemisphereLight(0xf5f7fb,0xb5aaa0,.25));
  const sun=new T.DirectionalLight(0xfff9ed,stage.keyIntensity??1.35);
  sun.position.set(...(stage.keyPosition??[-2.8,3.5,2.2]));sun.castShadow=renderer.shadowMap.enabled;sun.shadow.mapSize.set(1024,1024);
  Object.assign(sun.shadow.camera,{left:-1.5,right:1.5,top:1.5,bottom:-1.5,near:.1,far:9});
  sun.shadow.radius=2.5;sun.shadow.bias=-.00025;sun.shadow.normalBias=.001;scene.add(sun);
  const floor=new T.Mesh(new T.PlaneGeometry(30,30),photoFinishes.material('ceiling',{roughness:1}));
  floor.rotation.x=-Math.PI/2;floor.position.y=-.002;scene.add(floor);
  const contact=new T.Mesh(new T.PlaneGeometry(...(stage.floorSize??[2.2,2.2])),new T.MeshBasicMaterial({
    map:contactMap,blending:T.MultiplyBlending,transparent:true,depthWrite:false,toneMapped:false}));
  contact.rotation.x=-Math.PI/2;contact.position.y=-.0015;scene.add(contact);
  const target=new T.Vector3(0,.47,0), buttons=[...document.querySelectorAll('[data-view]')];
  let [yaw,pitch,zoom,x,y,z]=views.orbit,drag;
  target.set(x,y,z);
  function draw() {
    const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;
    renderer.setSize(w,h,false);
    const distance=stage.cameraDistance??3;
    const aspect=w/h, half=Math.max(.64,(stage.halfWidth??.54)/aspect)/zoom;
    photo.aspect=aspect; photo.zoom=zoom*Math.min(1,aspect/(stage.fitAspect??.84));photo.updateProjectionMatrix();
    Object.assign(ortho,{left:-half*aspect,right:half*aspect,top:half,bottom:-half,near:.1,far:20});
    camera.position.set(target.x+distance*Math.sin(yaw)*Math.cos(pitch),target.y+distance*Math.sin(pitch),target.z+distance*Math.cos(yaw)*Math.cos(pitch));
    camera.lookAt(target);camera.updateProjectionMatrix();renderer.render(scene,camera);
  }
  for(const b of buttons)b.onclick=()=>{
    const view=b.dataset.view, [angle,elevation,mag,x,y,z]=views[view];
    yaw=angle;pitch=elevation;zoom=mag;target.set(x,y,z);
    camera=['front','side','top'].includes(view)?ortho:photo;
    buttons.forEach(other=>other.setAttribute('aria-pressed',String(other===b)));
    draw();
  };
  canvas.addEventListener('wheel',event=>{
    event.preventDefault();
    zoom=Math.max(stage.minZoom??.9,Math.min(stage.maxZoom??2.8,zoom*Math.exp(-.0015*event.deltaY)));
    draw();
  },{passive:false});
  canvas.onpointerdown=e=>{drag=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);};
  canvas.onpointermove=e=>{
    if(!drag)return;
    yaw-=(e.clientX-drag[0])*.009;pitch=Math.max(.02,Math.min(1.56,pitch+(e.clientY-drag[1])*.009));
    drag=[e.clientX,e.clientY];buttons.forEach(b=>b.setAttribute('aria-pressed','false'));draw();
  };
  canvas.onlostpointercapture=()=>drag=null;
  Promise.all([ready,photoFinishes.ready()]).then(()=>{photoFinishes.verify(model);draw();}).catch(error=>{
    const notice=document.querySelector('#error');notice.textContent=error.message;notice.hidden=false;
  });
  new ResizeObserver(draw).observe(canvas);draw();
}
