// Drawing coordinates: x from the left, down from the countertop, z from the back.
function buildDrawnVanity() {
  const T = THREE, {parts, basin, reedPitch} = VANITY_DRAWING;
  const group = new T.Group();
  group.name = 'V01';
  const [, , , width, thickness, depth] = parts.top;
  const height = parts.plinth[1] + parts.plinth[4];
  const {oak,marble:stone} = vanityFinishes;
  const ceramic=photoFinishes.material('porcelain',{roughness:.16,clearcoat:1,clearcoatRoughness:.10});
  const hardware=photoFinishes.material('chrome',{roughness:.24,metalness:.85});
  const gasket=photoFinishes.material('seal',{roughness:.62});
  function put(name, geometry, material, x, down, z) {
    const mesh = new T.Mesh(geometry, material);
    mesh.name = name;
    mesh.position.set(x - width/2, height - down, z - depth/2);
    if(material===oak || material===stone)
      mapVanityFinish(geometry,name,mesh.position,material===stone);
    if(material===oak)mapBoardVisibility(geometry,name,mesh.position);
    mesh.castShadow = mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }
  function board(name, dims, material) {
    const [x, y, z, w, h, d] = dims;
    return put(name, new VanityRoundedBox(w,h,d,2,Math.min(1.1,w/4,h/4,d/4)), material, x+w/2, y+h/2, z+d/2);
  }
  for (const [name, dims] of Object.entries(parts)) {
    if (name === 'top') continue;
    const [x,y,z,w,h,d] = dims;
    if (name === 'tap-stem') {
      put(name, new T.CylinderGeometry(w/2,w/2,h,32), hardware, x+w/2,y+h/2,z+d/2);
      put('tap-foot',new T.CylinderGeometry(13,14,4,48),hardware,x+w/2,-2,z+d/2);
      const lever=board('mixer-lever',[x+w-1,-106,z+4,5,39,8],hardware);
      lever.rotation.x=-.12;
    } else if (name.startsWith('pull-')) {
      board(name,[x,y,z+d-5,w,h,5],hardware);
      for(const side of [7,w-7]){
        const mount=put(name+'-mount',new T.CylinderGeometry(3.1,3.1,d-5,24),hardware,x+side,y+h/2,z+(d-5)/2);
        mount.rotation.x=Math.PI/2;
      }
    } else if (name === 'upper' || name === 'lower') {
      // The 2 mm relief is cut within the front envelope.
      board(name, [x,y,z,w,h,d-2], oak);
      const profile = new T.Shape();
      profile.moveTo(-4,0); profile.quadraticCurveTo(-3,2,0,2);
      profile.quadraticCurveTo(3,2,4,0); profile.closePath();
      const rib = new T.ExtrudeGeometry(profile,{depth:h,bevelEnabled:false,curveSegments:4});
      rib.rotateX(Math.PI/2);
      for(let at=Math.ceil((x+4)/reedPitch)*reedPitch; at+4<=x+w; at+=reedPitch)
        put(name+'-reed',rib.clone(),oak,at,y,z+d-2);
      rib.dispose();
    } else {
      const dark = name.startsWith('pull-') || name === 'spout';
      board(name,dims,dark ? hardware : oak);
    }
  }
  const spout=parts.spout;
  put('aerator-seat',new T.CylinderGeometry(7,6.6,1.8,32),gasket,
    spout[0]+spout[3]/2, spout[1]+spout[4]+.6, spout[2]+spout[5]-10);
  // A tiny arris on stone catches the light at both the outer edge and the basin cut.
  const edge=1;
  const outline = new T.Shape();
  outline.moveTo(edge,-edge); outline.lineTo(width-edge,-edge); outline.lineTo(width-edge,edge-depth); outline.lineTo(edge,edge-depth); outline.closePath();
  const cutout = new T.Path();
  cutout.absellipse(basin.cx,-basin.cz,basin.rx,basin.rz,0,Math.PI*2,false);
  outline.holes.push(cutout);
  const top = new T.ExtrudeGeometry(outline,{depth:thickness-2*edge,bevelEnabled:true,bevelSize:edge,bevelThickness:edge,bevelSegments:3,curveSegments:48});
  top.rotateX(-Math.PI/2);
  put('top',top,stone,0,thickness-edge,0);
  const curve = new T.QuadraticBezierCurve(new T.Vector2(0,-basin.bottom),
    new T.Vector2(basin.controlRadius,-basin.controlDepth),new T.Vector2(basin.rz+1,-basin.rimDepth+.4));
  ceramic.side = T.DoubleSide;
  const bowl = put('basin',new T.LatheGeometry(curve.getPoints(24),96), ceramic,basin.cx,0,basin.cz);
  bowl.scale.x=basin.rx/basin.rz;
  bowl.castShadow=false; // The recessed liner receives the basin rim shadow.
  put('drain-seat',new T.CylinderGeometry(17,16,2,48),gasket,basin.cx,basin.bottom-2,basin.cz);
  put('drain',new T.CylinderGeometry(14.5,15.5,2.5,48),hardware,basin.cx,basin.bottom-3.8,basin.cz);
  group.scale.setScalar(.001);
  return group;
}
