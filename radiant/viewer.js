(() => {
  const $=id=>document.getElementById(id), stage=$('stage');
  let mode='overview',view='model',fallbackLook=false,drag=null,ready=false;
  const keys=new Set(),person={x:0,z:0,yaw:0,pitch:0};
  let needsRender=true;
  let labelsVisible=true,resetView=()=>{},drawOverview=()=>{},walk,ortho,renderer,ceiling;
  const ui=(id,visible)=>$(id).hidden=!visible;
  const eyeControl=$('eye-height');
  let eyeHeight=PLAN.parameters.eyeHeight;
  eyeControl.value=eyeHeight;
  function updateEyeHeight(){
    eyeHeight=Number(eyeControl.value);
    $('eye-value').value=eyeHeight.toFixed(2)+' m';
    needsRender=true;
  }
  updateEyeHeight();
  eyeControl.addEventListener('input',updateEyeHeight);
  function clearInput(){keys.clear();drag=null;}
  function releaseMouse(){if(document.pointerLockElement===stage)document.exitPointerLock();}
  function sync(){
    needsRender=true;
    const overview=mode==='overview',active=mode==='walking';
    ui('model-view',view==='model');ui('plan-view',view==='plan');
    $('model-tab').setAttribute('aria-pressed',String(view==='model'));
    $('plan-tab').setAttribute('aria-pressed',String(view==='plan'));
    ui('orbit-tools',overview);ui('overview-bar',overview);ui('model-heading',overview);
    ui('walk-bar',active);ui('crosshair',active);ui('pause-layer',mode==='paused');
    ui('labels',overview&&labelsVisible);if(ceiling)ceiling.visible=!overview;
    if(renderer)renderer.shadowMap.needsUpdate=true;
  }
  function overview(){mode='overview';clearInput();releaseMouse();sync();drawOverview();}
  function selectView(next){
    view=next;overview();if(next==='model'&&ready)resize();
    ui('notice',next==='model'&&!ready);
  }
  $('plan-tab').onclick=$('thumbnail').onclick=()=>selectView('plan');
  $('model-tab').onclick=()=>selectView('model');
  function pause(){if(mode!=='walking')return;mode='paused';clearInput();releaseMouse();sync();$('resume').focus();}
  function startWalk(reset){
    if(!ready)return;
    if(reset)Object.assign(person,PLAN.spawn,{pitch:0});
    mode='walking';fallbackLook=false;clearInput();sync();stage.focus({preventScroll:true});
    $('walk-help').textContent='WASD / 方向键移动 · 鼠标转向 · Esc 暂停';
    function fallback(){
      if(mode!=='walking'||document.pointerLockElement===stage)return;
      fallbackLook=true;$('walk-help').textContent='WASD / 方向键移动 · 按住鼠标拖动转向 · Esc 暂停';
    }
    try{
      if(!stage.requestPointerLock)fallback();
      else {const request=stage.requestPointerLock();if(request?.catch)request.catch(fallback);}
    }catch{fallback();}
  }
  $('enter').onclick=()=>startWalk(true);$('resume').onclick=()=>startWalk(false);$('respawn').onclick=()=>startWalk(true);$('exit').onclick=overview;$('pause').onclick=pause;
  let hadLock=false,skipLockDelta=false;
  document.addEventListener('pointerlockchange',()=>{
    const locked=document.pointerLockElement===stage;
    if(locked&&mode!=='walking'){releaseMouse();return;}
    if(locked)skipLockDelta=true;
    if(!locked&&hadLock&&mode==='walking')pause();hadLock=locked;
  });
  document.addEventListener('pointerlockerror',()=>{if(mode==='walking'){fallbackLook=true;$('walk-help').textContent='WASD / 方向键移动 · 按住鼠标拖动转向 · Esc 暂停';}});
  function steer(dx,dy){
    person.yaw+=dx*.0025;
    person.pitch=Math.max(-1.35,Math.min(1.35,person.pitch-dy*.0025));
  }
  document.addEventListener('mousemove',e=>{if(mode!=='walking'||document.pointerLockElement!==stage)return;
    if(skipLockDelta){skipLockDelta=false;return;}
    if(Math.abs(e.movementX)<240&&Math.abs(e.movementY)<240)steer(e.movementX,e.movementY);});
  addEventListener('blur',pause);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
  const moveKeys=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
  addEventListener('keydown',e=>{
    if(mode==='walking'){
      if(e.code==='Escape'){pause();return;}
      if(moveKeys.includes(e.code)){e.preventDefault();keys.add(e.code);}
    }
  });
  addEventListener('keyup',e=>keys.delete(e.code));
  try{
    renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
  }catch{
    $('notice').textContent='此浏览器未能启动 WebGL 2。可先打开「图纸核对」，或在启用硬件加速的桌面浏览器中查看三维模型。';ui('notice',true);$('enter').disabled=true;return;
  }
  const T=THREE,scene=new T.Scene();
  stage.prepend(renderer.domElement);stage.tabIndex=-1;
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;
  scene.background=new T.Color(0xe8ebe1);
  const ground=new T.Mesh(new T.PlaneGeometry(200,200),new T.MeshStandardMaterial({color:0xdfe4db,roughness:1}));
  ground.rotation.x=-Math.PI/2;ground.position.y=-.159;ground.receiveShadow=true;scene.add(ground);
  const ambient=new T.HemisphereLight(0xf4f8ff,0xe8dfd3,1.22);scene.add(ambient);
  // Broad pools of indirect light keep white corners legible at eye level.
  for(const [x,z,intensity] of [[3.1,6.1,7],[2.0,8.1,4],[5.6,3.1,9],[1.9,2.25,5],[5.65,8.05,5],[1.4,4.7,2],[1.3,6.4,2]]){
    const fill=new T.PointLight(0xfff4e3,intensity,5.8,2);
    fill.position.set(x,PLAN.parameters.clearHeight-.36,z);scene.add(fill);
  }
  const sunlight=new T.DirectionalLight(0xfff4df,2.55);sunlight.position.set(12,18,-1);sunlight.target.position.set(4,0,5);sunlight.castShadow=true;
  Object.assign(sunlight.shadow.camera,{left:-9,right:9,top:9,bottom:-9,near:.1,far:40});
  sunlight.shadow.mapSize.set(2048,2048);sunlight.shadow.normalBias=.018;sunlight.shadow.bias=-.00018;
  scene.add(sunlight,sunlight.target);
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.02;
  ceiling=createApartment(scene);
  walk=new T.PerspectiveCamera(68,1,.045,80);walk.rotation.order='YXZ';ortho=new T.OrthographicCamera(-9,9,9,-9,.1,100);
  const center=new T.Vector3(4.48,.90,4.94),v=new T.Vector3();
  const orbit={angle:.31,lift:1.02,zoom:1};
  function resize(){
    const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;
    const aspect=w/h;
    renderer.setSize(w,h,false);walk.aspect=aspect;walk.updateProjectionMatrix();
    // Keep the architectural model between the view heading and bottom controls.
    const half=Math.max(7.5,7.1/aspect)/orbit.zoom;
    Object.assign(ortho,{left:-half*aspect,right:half*aspect,top:half,bottom:-half});
    ortho.updateProjectionMatrix();drawOverview();
  }
  const names=PLAN.roomLabels.filter(r=>['主卧','客厅','次卧','阳台'].includes(r.name)).map(r=>{
    const el=document.createElement('span');el.className='room-label';el.textContent=r.name;$('labels').append(el);return {...r,el};
  });
  drawOverview=()=>{
    needsRender=true;
    const range=21,across=range*Math.cos(orbit.lift);
    ortho.position.set(center.x+across*Math.sin(orbit.angle),center.y+range*Math.sin(orbit.lift),center.z+across*Math.cos(orbit.angle));
    ortho.lookAt(center);ortho.updateMatrixWorld();
    for(const r of names){
      v.set(r.point[0],.32,r.point[1]).project(ortho);
      r.el.style.left=(50+50*v.x)+'%';r.el.style.top=(50-50*v.y)+'%';
    }
  };
  resetView=()=>{Object.assign(orbit,{angle:.31,lift:1.02,zoom:1});resize();};
  function zoom(factor){orbit.zoom=Math.max(.60,Math.min(2.5,orbit.zoom*factor));resize();}
  $('zoom-in').onclick=()=>zoom(1.15);$('zoom-out').onclick=()=>zoom(1/1.15);$('reset').onclick=resetView;
  $('labels-btn').onclick=()=>{labelsVisible=!labelsVisible;$('labels-btn').setAttribute('aria-pressed',String(labelsVisible));sync();};
  stage.addEventListener('wheel',e=>{if(mode==='overview'){e.preventDefault();zoom(Math.exp(-e.deltaY*.001));}},{passive:false});
  stage.addEventListener('pointerdown',e=>{
    if(e.button===0&&(mode==='overview'||(mode==='walking'&&fallbackLook))){
      drag={x:e.clientX,y:e.clientY};stage.setPointerCapture(e.pointerId);
    }
  });
  stage.addEventListener('pointermove',e=>{
    if(!drag)return;
    const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag={x:e.clientX,y:e.clientY};
    if(mode==='overview'){
      orbit.angle-=dx*.007;orbit.lift=Math.max(.32,Math.min(1.55,orbit.lift+dy*.005));drawOverview();
    }else if(fallbackLook&&mode==='walking')steer(dx,dy);
  });
  for(const event of ['pointerup','pointercancel','lostpointercapture'])stage.addEventListener(event,()=>drag=null);
  new ResizeObserver(resize).observe(stage);ready=true;resize();sync();
  const held=(a,b)=>Number(keys.has(a)||keys.has(b));
  let last=performance.now();
  renderer.setAnimationLoop(time=>{
    const dt=Math.min(.06,Math.max(0,(time-last)/1000));last=time;
    if(view!=='model'||document.hidden||(mode!=='walking'&&!needsRender))return;
    needsRender=false;
    if(mode==='walking'){
      const forward=held('KeyW','ArrowUp')-held('KeyS','ArrowDown');
      const right=held('KeyD','ArrowRight')-held('KeyA','ArrowLeft');
      const speed=1.65*dt/Math.max(1,Math.hypot(forward,right));
      const s=Math.sin(person.yaw),c=Math.cos(person.yaw);
      movePerson(person,(s*forward+c*right)*speed,(-c*forward+s*right)*speed);
    }
    if(mode!=='overview'){
      walk.position.set(person.x,eyeHeight,person.z);walk.rotation.set(person.pitch,-person.yaw,0,'YXZ');
    }
    renderer.render(scene,mode==='overview'?ortho:walk);
  });
})();
