// Each scan is mapped in metres. Data URLs keep local-file previews self contained.
const roomFinishes=(()=>{
  const T=THREE,loader=new T.TextureLoader(),pending=[];
  function load(data,name,color){
    let ok,no;
    pending.push(new Promise((resolve,reject)=>{ok=resolve;no=reject;}));
    const tex=loader.load(data,ok,undefined,()=>no(new Error('无法读取室内材质 '+name)));
    tex.name=name;tex.colorSpace=color?T.SRGBColorSpace:T.NoColorSpace;
    tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.anisotropy=8;
    return tex;
  }
  function scan(id,normalStrength,properties={}){
    const images=ROOM_IMAGES[id];
    return new T.MeshPhysicalMaterial({name:id,map:load(images.base,id+' color',true),
      normalMap:load(images.normal,id+' normal',false),normalScale:new T.Vector2(normalStrength,normalStrength),
      roughnessMap:load(images.orm,id+' roughness',false),...properties});
  }
  const boards=scan('laminate_floor_02',.52,{clearcoat:.17,clearcoatRoughness:.48});
  const paint=scan('beige_wall_002',.12,{vertexColors:true});
  const tile=scan('interior_tiles',.53,{clearcoat:.16,clearcoatRoughness:.42});
  const wool=scan('poly_wool_herringbone',.85,{specularIntensity:.24,sheen:.13,sheenRoughness:.96,sheenColor:0xad9e90});
  const cotton=scan('waffle_pique_cotton',.85,{specularIntensity:.18,sheen:.09,sheenRoughness:1,sheenColor:0xc2b49e});
  const skyline=load(ROOM_IMAGES.toronto_view,'Riverdale Park East · Dillan Payne',true);
  skyline.wrapS=T.MirroredRepeatWrapping;skyline.wrapT=T.ClampToEdgeWrapping;
  const nightSkyline=load(NIGHT_WINDOW_IMAGE,'Riverdale Park East · illustrative night',true);
  nightSkyline.wrapS=skyline.wrapS;nightSkyline.wrapT=skyline.wrapT;
  return {nightSkyline,boards,paint,tile,wool,cotton,skyline,ready:Promise.all(pending)};
})();

function makeWindowView(){
  // A distant photographic plate for the two glazed facades; its view is illustrative.
  const T=THREE,geo=new T.PlaneGeometry(1,1,80,1),pos=geo.attributes.position;
  for(let i=0;i<pos.count;i++){
    const u=geo.attributes.uv.getX(i),v=geo.attributes.uv.getY(i);
    const angle=(-82+u*238)*Math.PI/180;
    pos.setXYZ(i,4+46*Math.sin(angle),1.0+(v-.54)*34,5-46*Math.cos(angle));
    geo.attributes.uv.setX(i,(u-.5)*1.6+.5);
  }
  const mat=new T.MeshBasicMaterial({map:roomFinishes.skyline,color:new T.Color(1.65,1.65,1.65),side:T.DoubleSide});
  const view=new T.Mesh(geo,mat);view.name='window-view';return view;
}
