// The window plates share one projection. All lighting and framing dimensions are in metres.
function createAtmosphere(scene, ceiling, windowView, renderer) {
  const T = THREE, height = PLAN.parameters.clearHeight;
  const daylight = new T.Group(), practicals = new T.Group();
  scene.add(daylight, practicals);
  const finish=photoFinishes.material;
  const brass=finish('brass',{roughness:.37,metalness:.68}),bronze=finish('frame',{roughness:.45,metalness:.55});
  const paper=finish('mount',{roughness:.92}),pottery=finish('bowl',{roughness:.42});
  const opal=finish('opal',{roughness:.36,emissive:0xffdfad});
  const linen=finish('shade',{roughness:.94,emissive:0xffc684,side:T.DoubleSide});
  const lampLights = [], pending = [];
  function part(parent, geometry, material, x, y, z) {
    const obj = new T.Mesh(geometry, material);
    obj.position.set(x, y, z);
    obj.receiveShadow = true;
    obj.castShadow = material !== opal && material !== linen;
    parent.add(obj);
    return obj;
  }
  function cylinder(parent, mat, x, y, z, top, bottom, h) {
    return part(parent, new T.CylinderGeometry(top, bottom, h, 40), mat, x, y, z);
  }
  function turned(parent, mat, x, y, z, profile) {
    return part(parent, new T.LatheGeometry(profile.map(([r,h])=>new T.Vector2(r,h)),56), mat, x,y,z);
  }
  function block(parent, mat, x, y, z, w, h, d) {
    return part(parent, new T.BoxGeometry(w,h,d), mat, x,y,z);
  }
  function point(parent, color, strength, reach, x, y, z) {
    const light = new T.PointLight(color,strength,reach,2);
    light.position.set(x,y,z);
    parent.add(light);
    return light;
  }
  function downlight(x,z,strength,reach,radius=.105) {
    cylinder(ceiling, bronze,x,height-.016,z,radius,radius,.025);
    cylinder(ceiling, opal,x,height-.037,z,radius*.92,radius*.85,.025);
    point(practicals,0xffdfaf,strength,reach,x,height-.12,z);
  }
  // Light enters through the glazed elevations, accompanied by a shadow-casting sun.
  const sky = new T.HemisphereLight(0xe3efff,0xcbb69e,.64);
  scene.add(sky);
  for (const [x,z,power] of [[5.30,.57,8],[2.07,.57,7],[7.10,2.45,8],[7.10,4.48,6],[7.09,8.24,8]]) {
    point(daylight,0xe9f2ff,power,5.6,x,1.87,z);
  }
  const sun = new T.DirectionalLight(0xffefd7,2.65);
  sun.position.set(14,7,-3);sun.target.position.set(3.8,0,5.6);sun.castShadow=true;
  Object.assign(sun.shadow.camera,{left:-9,right:9,top:9,bottom:-9,near:.1,far:42});
  sun.shadow.mapSize.set(2048,2048);sun.shadow.normalBias=.006;sun.shadow.bias=-.00018;
  daylight.add(sun,sun.target);

  for(const [x,z,power,reach] of [[5.70,2.03,3.1,4.9],[3.15,5.66,5,3.1],[1.25,8.55,7,3.9],
      [1.48,4.58,5,2.7],[1.50,6.56,5,2.7],[5.76,5.66,4,2.9]]) downlight(x,z,power,reach);
  function taskBeam(x,y,z,power,reach,angle) {
    const beam=new T.SpotLight(0xffdfb5,power,reach,angle,.66,2);
    beam.position.set(x,y,z);beam.target.position.set(x,0,z);
    beam.castShadow=true;beam.shadow.mapSize.set(512,512);
    beam.shadow.camera.near=.065;beam.shadow.normalBias=.006;beam.shadow.bias=-.00035;
    practicals.add(beam,beam.target);
  }
  taskBeam(5.70,height-.125,2.03,4.9,4.9,1.16);
  // Two suspended opal globes share the island work surface.
  for (const x of [5.08,6.08]) {
    const z=4.67;
    cylinder(ceiling,bronze,x,height-.015,z,.055,.055,.03);
    cylinder(ceiling,bronze,x,2.49,z,.005,.005,.40);
    cylinder(ceiling,brass,x,2.272,z,.025,.035,.057);
    const globe=part(ceiling,new T.SphereGeometry(.122,36,24),opal,x,2.16,z);
    globe.scale.y=.90;
    point(practicals,0xffdbad,2.6,3.3,x,2.02,z);
    taskBeam(x,2.022,z,2.2,3.3,.99);
  }
  // Recessed strips below the wall units wash the worktop. The hood has its own diffuser.
  const counter=scene.getObjectByName('kitchen-run');
  const counterLights=new T.Group();
  counter.add(counterLights);
  for(const [x,width,y,z] of [[-1.092,.87,1.517,.056],[-.417,.425,1.517,.056],[.258,.78,1.517,.086]]){
    block(counter,opal,x,y,z,width,.008,.016);
    const beam=new T.SpotLight(0xffead2,1.65*width,1.18,1.18,.88,2);
    beam.distance=y-.90+.6;
    beam.position.set(x,y-.01,z);
    beam.target.position.set(x,.90,z+.06);
    counterLights.add(beam,beam.target);
  }
  // Fixtures mounted on movable furniture retain their lamps and light sources when repositioned.
  for (const id of ['main-nightstand','second-nightstand']) {
    const stand=scene.getObjectByName(id), y=.486;
    turned(stand,pottery,0,y,0,[[.005,0],[.069,0],[.079,.012],[.096,.075],[.091,.112],[.065,.15],[.04,.16],[.036,.18]]);
    cylinder(stand,brass,0,y+.201,0,.013,.013,.052);
    const shade=part(stand,new T.CylinderGeometry(.095,.137,.169,48,1,true),linen,0,y+.294,0);
    const rim=finish('shade',{roughness:.8});
    for(const [h,r] of [[.21,.137],[.378,.095]]) {
      const seam=part(stand,new T.TorusGeometry(r,.0023,6,48),rim,0,y+h,0);seam.rotation.x=Math.PI/2;
    }
    shade.castShadow=false;
    lampLights.push(point(stand,0xffc98d,2.6,2.5,0,y+.29,0));
  }
  // A tapered plaster ceiling rose and opal diffuser add reading light in both bedrooms.
  for (const [x,z] of [[1.91,2.13],[5.68,8.26]]) downlight(x,z,5,3.8,.165);

  const frameMat=chairFinishes.oak;
  const loader=new T.TextureLoader();
  function frame(key, wallX, y, z, width, matBorder) {
    const g=new T.Group(), art=ART_PRINTS[key], h=width/art.aspect, rail=.022;
    scene.add(g);g.name='print/'+key;g.position.set(wallX+.002,y,z);g.rotation.y=Math.PI/2;
    const w=width+2*matBorder, outerH=h+2*matBorder;
    block(g,paper,0,0,.011,w,outerH,.020);
    block(g,frameMat,0,(outerH+rail)/2,.024,w+2*rail,rail,.046);
    block(g,frameMat,0,-(outerH+rail)/2,.024,w+2*rail,rail,.046);
    for(const side of [-1,1]) block(g,frameMat,side*(w+rail)/2,0,.024,rail,outerH,.046);
    let loaded,failed;
    pending.push(new Promise((ok,no)=>{loaded=ok;failed=no;}));
    const map=loader.load(key==='wellart' ? 'assets/living/print.jpg' : art.image,loaded,undefined,()=>failed(new Error('本地建筑摄影加载失败')));
    map.colorSpace=T.SRGBColorSpace;map.anisotropy=8;
    part(g,new T.PlaneGeometry(width,h),new T.MeshStandardMaterial({map,roughness:.94,userData:{photoSource:key}}),0,0,.022);
    return g;
  }
  const landscape=frame('wellart',4.05107,1.62,1.82,1.05,.041);
  frame('pjart',.53617,1.52,1.89,.62,.052);
  // Brass picture light anchored to the living-room wall. A soft-edged beam grazes the framed print.
  block(landscape,brass,0,.54,.025,.126,.066,.044);
  block(landscape,brass,0,.54,.107,.015,.018,.17);
  const hood=cylinder(landscape,brass,0,.525,.19,.028,.028,.49);
  hood.rotation.z=Math.PI/2;
  block(landscape,opal,0,.502,.19,.45,.009,.027);
  const wash=new T.SpotLight(0xffe1bb,1.05,1.85,1.17,.89,2);
  wash.position.set(4.25,2.10,1.82);wash.target.position.set(4.06,1.49,1.82);
  practicals.add(wash,wash.target);

  // A hollow wheel-thrown vessel and shallow companion dish are supported by the coffee table.
  const table=scene.getObjectByName('living-table'), teal=finish('glaze',{roughness:.30});
  turned(table,teal,-.07,.384,.015,[[.031,0],[.048,.004],[.064,.020],[.075,.062],[.073,.101],
    [.059,.134],[.033,.152],[.029,.175],[.031,.182],[.025,.183],[.023,.155],[.049,.123],[.057,.081],[.039,.022],[0,.018]]);
  turned(table,pottery,.099,.384,-.055,[[.028,0],[.040,.002],[.062,.014],[.078,.031],[.076,.036],[.061,.025],[.038,.014],[0,.012]]);
  return {ready:Promise.all(pending),set(mode) {
    const night=mode==='night';
    daylight.visible=!night;practicals.visible=night;
    counterLights.visible=night;
    lampLights.forEach(lamp=>lamp.visible=night);
    opal.emissiveIntensity=night?2.1:0;
    linen.emissiveIntensity=night?.95:0;
    sky.color.set(night?0xa9c2ed:0xe3efff);
    sky.groundColor.set(night?0x90705d:0xcbb69e);sky.intensity=night?.24:.65;
    renderer.toneMappingExposure=night?.88:1.0;
    scene.environmentIntensity=night?.125:.41;
    scene.background.set(night?0x333d49:0xe8ebe1);
    windowView.material.color.setScalar(night?.09:1.65);
    renderer.shadowMap.needsUpdate=true;
  }};
}
