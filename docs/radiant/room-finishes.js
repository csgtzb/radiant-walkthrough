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
  const boards=photoFinishes.material('floor',{roughness:.60,clearcoat:.17,clearcoatRoughness:.48});
  const paint=photoFinishes.material('wall',{roughness:.86,vertexColors:true});
  const tile=photoFinishes.material('tile',{roughness:.46,clearcoat:.16,clearcoatRoughness:.42});
  const tileFloor=photoFinishes.material('tileFloor',{roughness:.65});
  const splash=photoFinishes.material('splash',{roughness:.32});
  const balcony=photoFinishes.material('balcony',{roughness:.85});
  const wool=photoFinishes.material('wool',{roughness:.91,sheen:.13,sheenRoughness:.96});
  const cotton=photoFinishes.material('linen',{roughness:.93,sheen:.09,sheenRoughness:1});
  const skyline=load(ROOM_IMAGES.toronto_view,'Riverdale Park East · Dillan Payne',true);
  skyline.wrapS=T.MirroredRepeatWrapping;skyline.wrapT=T.ClampToEdgeWrapping;
  return {boards,paint,tile,tileFloor,splash,balcony,wool,cotton,skyline,ready:Promise.all([...pending,photoFinishes.ready()])};
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
  mat.userData.photoSource='skyline';
  const view=new T.Mesh(geo,mat);view.name='window-view';return view;
}
