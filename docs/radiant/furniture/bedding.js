// The front and back of a stuffed cover meet along a raised, sewn perimeter.
// Dimensions use the same millimetres as the furniture drawings.
function tailoredPillow(width, height, depth, material, phase, uvTiles) {
  const T=THREE, group=new T.Group(), nx=42, ny=30;
  const positions=[], tex=[], indices=[], edge=[];
  function point(u,v,face) {
    const edgeX=Math.abs(u), edgeY=Math.abs(v);
    const fullness=Math.pow(Math.max(0,(1-edgeX**3.5)*(1-edgeY**3.4)),.60);
    const pleat=(at,slant)=>Math.exp(-(((u-at-slant*(1-v))/.062)**2));
    const gather=(pleat(-.66,.35)+pleat(.55,-.28))*Math.exp(-(((v-.77)/.31)**2));
    const depression=5*Math.exp(-(((u+.14)/.42)**2+((v-.23)/.56)**2));
    return new T.Vector3(
      u*width*.5*(1-.056*edgeY**5),
      v*height*.5*(1-.068*edgeX**4)+4*Math.sin(3*u+phase)*edgeY**4,
      face*(1.8+fullness*(depth*.5-13*gather-depression))+2*Math.sin(v*15+phase)*edgeX**7
    );
  }
  const count=(nx+1)*(ny+1);
  for(const face of [1,-1]){
    for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
      const u=2*i/nx-1,v=2*j/ny-1,p=point(u,v,face);
      positions.push(p.x,p.y,p.z);tex.push(i/nx*uvTiles[0],j/ny*uvTiles[1]);
      if(i===nx||j===ny)continue;
      const a=j*(nx+1)+i+(face===1?0:count),b=a+nx+1;
      if(face===1)indices.push(a,a+1,b,a+1,b+1,b);
      else indices.push(a,b,a+1,a+1,b,b+1);
    }
  }
  for(let i=0;i<=nx;i++)edge.push(i);
  for(let j=1;j<=ny;j++)edge.push(j*(nx+1)+nx);
  for(let i=nx-1;i>=0;i--)edge.push(ny*(nx+1)+i);
  for(let j=ny-1;j>0;j--)edge.push(j*(nx+1));
  const line=[];
  edge.forEach((a,i)=>{
    const b=edge[(i+1)%edge.length];
    indices.push(a,a+count,b,b,a+count,b+count);
    line.push(new T.Vector3(positions[3*a],positions[3*a+1],positions[3*a+2]-1.8));
  });
  const surface=new T.BufferGeometry();
  surface.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  surface.setAttribute('uv',new T.Float32BufferAttribute(tex,2));surface.setIndex(indices);surface.computeVertexNormals();
  const cord=new T.TubeGeometry(new T.CatmullRomCurve3(line,true),edge.length,2.25,6,true);
  for(const geometry of [surface,cord]){
    const mesh=new T.Mesh(geometry,material);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);
  }
  return group;
}
