// Load once for both the walkthrough and the standalone inspector. Embedded JPEGs also work on file://.
const vanityFinishes = (() => {
  const loader = new THREE.TextureLoader(), pending = [];
  function texture(data, label, isColor) {
    let loaded, failed;
    pending.push(new Promise((resolve, reject) => { loaded=resolve; failed=reject; }));
    const map=loader.load(data,loaded,undefined,()=>failed(new Error('无法读取饰面贴图 '+label)));
    map.name=label;
    map.colorSpace=isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    map.wrapS=map.wrapT=THREE.RepeatWrapping;
    map.anisotropy=4;
    map.userData.mimeType='image/jpeg';
    return map;
  }
  const oak=photoFinishes.material('vanity',{roughness:.52}), marble=photoFinishes.material('stone',{roughness:.34});
  const atlas=texture(VANITY_CONTACTS.atlas,'Board ambient visibility',false);
  atlas.channel=1;atlas.flipY=false;atlas.generateMipmaps=false;atlas.minFilter=THREE.LinearFilter;
  atlas.wrapS=atlas.wrapT=THREE.ClampToEdgeWrapping;
  atlas.userData.mimeType='image/png';
  oak.aoMap=atlas;oak.aoMapIntensity=.94;
  const contactFloor=texture(VANITY_CONTACTS.floor,'Floor ambient visibility',false);
  return {oak,marble,contactFloor,ready:Promise.all([...pending,photoFinishes.ready()])};
})();

// UVs are calculated in millimetres. Position offsets are the centre/origin used to place the part.
function mapVanityFinish(geometry,name,origin,isStone) {
  const {position,normal,uv}=geometry.attributes;
  const horizontal=['shelf','base','plinth'].includes(name);
  const drawer=['upper','lower'].includes(name)||name.endsWith('-reed');
  const width=VANITY_DRAWING.parts.top[3], depth=VANITY_DRAWING.parts.top[5];
  for(let i=0;i<position.count;i++){
    const x=position.getX(i)+origin.x+width/2, y=position.getY(i)+origin.y;
    const z=position.getZ(i)+origin.z+depth/2;
    const nx=normal.getX(i),ny=normal.getY(i),nz=normal.getZ(i);
    let u,v;
    if(isStone){
      // Unfold the thickness onto the slab perimeter (including the curved basin cut).
      const drop=VANITY_DRAWING.parts.plinth[1]+VANITY_DRAWING.parts.plinth[4]-y;
      u=.13+(x+drop*nx)/240;
      v=.81-(z+drop*nz)/137;
    }else{
      const top=Math.abs(ny)>.65, side=Math.abs(nx)>.65&&!drawer;
      if(horizontal){
        u=top?z:y; v=side?z:x;
      }else{
        u=side?z:x; v=top?z:y;
      }
      // Adjacent boards are cut from separate areas of the veneer sheet.
      const offset=drawer?.10:name==='right'?.58:name==='left'?.32:horizontal?.24:.44;
      u=offset+u/420; v=.15+v/420;
    }
    uv.setXY(i,u,v);
  }
}

// A separate, non-overlapping UV set locates each panel face in the baked visibility atlas.
function mapBoardVisibility(geometry,name,origin) {
  const {boards,tile}=VANITY_CONTACTS;
  const board=name.replace(/-reed$/,'');
  const row=boards.indexOf(board);
  const [x,down,z,w,h,d]=VANITY_DRAWING.parts[board];
  const {position,normal}=geometry.attributes, uv=new Float32Array(position.count*2);
  const clamp=v=>Math.max(0,Math.min(1,v));
  for(let i=0;i<position.count;i++){
    const a=(position.getX(i)+origin.x+345-x)/w;
    const b=(position.getY(i)+origin.y-(850-down-h))/h;
    const c=(position.getZ(i)+origin.z+250-z)/d;
    const nx=normal.getX(i),ny=normal.getY(i),nz=normal.getZ(i);
    let face,u,v;
    if(Math.abs(ny)>=Math.max(Math.abs(nx),Math.abs(nz))){face=ny>0?2:3;u=a;v=c;}
    else if(Math.abs(nx)>Math.abs(nz)&&!name.endsWith('-reed')){face=nx>0?0:1;u=b;v=c;}
    else{face=nz>0?4:5;u=a;v=b;}
    const stride=tile+2;
    uv[2*i]=(face*stride+1.5+clamp(u)*(tile-1))/(6*stride);
    uv[2*i+1]=(row*stride+1.5+clamp(v)*(tile-1))/(boards.length*stride);
  }
  geometry.setAttribute('uv1',new THREE.BufferAttribute(uv,2));
}
