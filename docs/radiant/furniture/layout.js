// A placement owns its centre and heading. The same footprint drives collisions and the plan.
const headingAngle={south:0,east:Math.PI/2,north:Math.PI,west:-Math.PI/2};
function placementBounds(f,x,z,front){
  const [w,d]=f.size;
  const lateral=front==='east'||front==='west';
  const dx=(lateral?d:w)/2,dz=(lateral?w:d)/2;
  return [x-dx,z-dz,x+dx,z+dz];
}
function placeFurniture(f,x,z,front){
  f.center=[x,z];f.front=front;
  // Preserve the bounds reference shared with the collision index.
  f.bounds.splice(0,4,...placementBounds(f,x,z,front));
}
const standardPlacements=PLAN.placements.map(([id,design,x,z,front])=>{
  const {name,size:[w,d,h]}=HOME_DESIGNS[design];
  const f={id,design,kind:'library',name,size:[w/1000,d/1000],height:h/1000,bounds:[]};
  placeFurniture(f,x,z,front);return f;
});
for(const f of PLAN.fixtures){
  const [x,z,X,Z]=f.bounds;f.size=[X-x,Z-z];f.center=[(X+x)/2,(Z+z)/2];
}
PLAN.fixtures.push(...standardPlacements);
