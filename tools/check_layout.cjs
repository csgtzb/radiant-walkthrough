// Check the furnished sample from the entry, using the same person radius as the viewer.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const context = vm.createContext({ assert, console });
for (const name of ['plan', 'furniture/designs', 'furniture/layout', 'geometry']) {
  const file = path.resolve(__dirname, '../radiant', name + '.js');
  vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
}
vm.runInContext(`
  const step = .055;
  const key = (x,z) => x + ',' + z;
  const start = [PLAN.spawn.x, PLAN.spawn.z].map(v => Math.round(v / step));
  const queue = [start], visited = new Set([key(...start)]);
  for (let i = 0; i < queue.length; i++) {
    const [x,z] = queue[i];
    for (const [dx,dz] of [[1,0],[0,1],[-1,0],[0,-1]]) {
      const a = x + dx, b = z + dz, id = key(a,b);
      if (!visited.has(id) && canStand(a*step,b*step)) {
        visited.add(id); queue.push([a,b]);
      }
    }
  }
  const landings = [
    ['客厅',6.57,3.25], ['厨房',6.88,3.91], ['公卫',2.41,6.92], ['套卫',2.19,4.21],
    ['主卧',2.92,3.31], ['次卧',4.44,7.42], ['阳台',8.24,3.50], ['冰箱前',4.45,5.53],
    ['水槽前',6.43,5.56], ['浴缸旁',1.37,6.93], ['沙发前',5.13,2.17],
    ['主卧床侧',2.8,1.50], ['次卧床侧',5,8.62]
  ];
  for (const [name,x,z] of landings) {
    assert(canStand(x,z) && visited.has(key(Math.round(x/step), Math.round(z/step))), name);
  }
  const chair = PLAN.fixtures.find(f => f.design === 'C01');
  const original = chair.center;
  placeFurniture(chair,6.52,1.87,'west');
  assert(canStand(...original) && !canStand(6.52,1.87), 'collision follows the instance');
  assert(Math.abs((chair.bounds[2]-chair.bounds[0])-chair.size[1]) < 1e-8, 'rotated footprint');
  console.log(PLAN.fixtures.length + ' 件家具与设备，' + landings.length + ' 处通行点通过检查。');
`, context);
