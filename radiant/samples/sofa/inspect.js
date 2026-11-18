const sofaStudy=makeSofaStudy();
// Indirect contact follows the cushions into the GLB. Window-light visibility is specific to this studio.
function applyStudioLighting(model, bake) {
  const samples = atob(bake.data);
  let offset = 0, part = 0;
  model.traverse(mesh => {
    if (!mesh.isMesh) return;
    const geometry = mesh.geometry, count = geometry.attributes.position.count;
    if (count !== bake.counts[part++]) throw new Error('软包造型已变更，需要重新计算光照。');
    let colors = geometry.getAttribute('color');
    if (!colors) {
      colors = new THREE.BufferAttribute(new Float32Array(count * 3).fill(1), 3);
      geometry.setAttribute('color', colors);
    }
    const windowLight = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const ambient = .32 + .68 * samples.charCodeAt(offset++) / 255;
      windowLight[i] = samples.charCodeAt(offset++) / 255;
      colors.setXYZ(i, colors.getX(i) * ambient, colors.getY(i) * ambient, colors.getZ(i) * ambient);
    }
    geometry.setAttribute('studioVisibility', new THREE.BufferAttribute(windowLight, 1));
    mesh.material.vertexColors = true;
    mesh.material.onBeforeCompile = shader => {
      shader.vertexShader = 'attribute float studioVisibility; varying float vStudioVisibility;\n' +
        shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vStudioVisibility=studioVisibility;');
      const lighting = THREE.ShaderChunk.lights_fragment_begin.replace(
        /getDirectionalLightInfo\(\s*directionalLight,\s*directLight\s*\);/,
        '$&\n directLight.color *= vStudioVisibility;'
      );
      shader.fragmentShader = 'varying float vStudioVisibility;\n' + shader.fragmentShader.replace('#include <lights_fragment_begin>', lighting);
    };
  });
}
applyStudioLighting(sofaStudy.model, SOFA_VISIBILITY);
const floorCanvas=document.createElement('canvas');floorCanvas.width=720;floorCanvas.height=500;
const ctx=floorCanvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,720,500);
// Diffuse shadow of the continuous skirt and the short recessed feet, on a 2.88 m floor card.
for(const [blur,opacity,dx,dz] of [[24,.28,21,9],[10,.38,9,4],[4,.47,1,0]]){
  ctx.filter='blur('+blur+'px)';ctx.fillStyle='rgba(30,24,18,'+opacity+')';
  ctx.beginPath();ctx.roundRect(360-191+dx,250-120+dz,382,240,8);ctx.fill();
}
const groundMap=new THREE.CanvasTexture(floorCanvas);
inspectSample({model:sofaStudy.model,ready:sofaStudy.ready,contactMap:groundMap,
  stage:{background:0xe9e6df,environmentIntensity:.42,keyIntensity:3.55,keyPosition:[-2.4,1.7,1.45],castShadow:false,cameraDistance:5.0,
    floorSize:[2.88,2],fitAspect:1.57,halfWidth:.93,minZoom:.7,maxZoom:5.5},
  views:{orbit:[.245,.125,1.35,0,.56,0],seat:[.37,.24,3.90,-.12,.34,.34],
    back:[.22,.13,3.75,.04,.625,-.20],side:[Math.PI/2,0,1.15,0,.415,0]}});
