// Pure layout functions used by the viewer, collision checks, and drawing overlay.
function splitWall(wall) {
  const [x0,z0,x1,z1] = wall.bounds;
  const alongX = wall.axis === 'x';
  const start = alongX ? x0 : z0, end = alongX ? x1 : z1;
  const spans = [];
  function append(a,b,opening) {
    if (b > a) spans.push({id:wall.id, axis:wall.axis, opening, bounds:alongX?[a,z0,b,z1]:[x0,a,x1,b]});
  }
  let cursor = start;
  for (const opening of wall.openings) {
    append(cursor,opening.start,null);
    append(opening.start,opening.end,opening);
    cursor = opening.end;
  }
  append(cursor,end,null);
  return spans;
}
const wallSpans = PLAN.walls.flatMap(splitWall);
const blocksMovement = (s) => !s.opening || ['glass','window'].includes(s.opening.kind);
function doorLeafBounds(span){
  const [end,sign]=PLAN.doorSwing[span.id],opening=span.opening;
  const alongX=span.axis==='x',hinge=end==='start'?opening.start+.052:opening.end-.052;
  const edge=span.bounds[(alongX?1:0)+(sign>0?2:0)];
  const tip=edge+sign*(opening.end-opening.start-.087);
  const lo=Math.min(edge,tip),hi=Math.max(edge,tip);
  return alongX?[hinge-.020,lo,hinge+.020,hi]:[lo,hinge-.020,hi,hinge+.020];
}
const openLeaves=wallSpans.filter(s=>s.opening?.profile==='door'&&PLAN.doorSwing[s.id]).map(doorLeafBounds);
const obstacles = [...wallSpans.filter(blocksMovement).map(s=>s.bounds), ...PLAN.rails.map(r=>r.bounds), PLAN.entryBoundary, ...openLeaves, ...PLAN.fixtures.map(f=>f.bounds)];
function insidePolygon(x,z,polygon) {
  let inside=false;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++) {
    const [ax,az]=polygon[i], [bx,bz]=polygon[j];
    if ((az>z)!==(bz>z) && x<(bx-ax)*(z-az)/(bz-az)+ax) inside=!inside;
  }
  return inside;
}
function canStand(x,z,r=PLAN.parameters.bodyRadius) {
  if (!PLAN.floors.some(f=>insidePolygon(x,z,f.polygon))) return false;
  return !obstacles.some(([x0,z0,x1,z1])=>{
    const dx=x-Math.max(x0,Math.min(x,x1)), dz=z-Math.max(z0,Math.min(z,z1));
    return dx*dx+dz*dz < r*r;
  });
}
function movePerson(person,dx,dz) {
  const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/(PLAN.parameters.bodyRadius/2)));
  for(let i=0;i<steps;i++) {
    if(canStand(person.x+dx/steps,person.z)) person.x+=dx/steps;
    if(canStand(person.x,person.z+dz/steps)) person.z+=dz/steps;
  }
}
