const floorLoader=new THREE.TextureLoader();
let floorTexture;
const floorReady=new Promise((resolve,reject)=>{
  floorTexture=floorLoader.load(CHAIR_FLOOR,resolve,undefined,reject);
});
inspectSample({contactMap:floorTexture,model:buildDrawnChair(),ready:Promise.all([chairFinishes.ready,floorReady]),
  views:{orbit:[.65,.34,1.00,0,.37,0],front:[0,0,1.24,0,.39,0],side:[-Math.PI/2,0,1.24,0,.39,0],
    top:[0,Math.PI/2-.00001,1.24,0,.39,0],joinery:[1.08,.30,2.55,.23,.49,.08],fabric:[.58,.60,2.75,.17,.49,.02]}});
