// Authoring helper. Run bakeSofaVisibility(model, THREE) in a WebGL2 browser and save its
// result as SOFA_VISIBILITY in the sample. The shipped viewer does no lighting bake.
function bakeSofaVisibility(model,T) {
  const resolution=480,renderer=new T.WebGLRenderer({antialias:false}),scene=new T.Scene();
  const depth=new T.ShaderMaterial({side:T.DoubleSide,vertexShader:`
    void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}
  `,fragmentShader:`
    void main(){float n=floor(gl_FragCoord.z*65535.0+0.5);
      gl_FragColor=vec4(floor(n/256.0)/255.0,mod(n,256.0)/255.0,0.0,1.0);}
  `});
  renderer.setClearColor(0xffffff);scene.overrideMaterial=depth;
  const copy=model.clone(true);scene.add(copy);copy.updateMatrixWorld(true);
  const positions=[],normals=[],counts=[];
  copy.traverse(m=>{
    if(!m.isMesh)return;
    const p=m.geometry.attributes.position,n=m.geometry.attributes.normal,norm=new T.Matrix3().getNormalMatrix(m.matrixWorld);
    counts.push(p.count);
    const a=new T.Vector3();
    for(let i=0;i<p.count;i++){
      positions.push(...a.fromBufferAttribute(p,i).applyMatrix4(m.matrixWorld).toArray());
      normals.push(...a.fromBufferAttribute(n,i).applyMatrix3(norm).normalize().toArray());
    }
  });
  const target=new T.WebGLRenderTarget(resolution,resolution),pixels=new Uint8Array(resolution*resolution*4);
  renderer.setRenderTarget(target);
  const camera=new T.OrthographicCamera(-1.18,1.18,1.18,-1.18,.25,5),centre=new T.Vector3(0,.43,0);
  const count=positions.length/3,occ=new Float32Array(count),ambient=new Float32Array(count),
    lit=new Float32Array(count),key=new Float32Array(count);
  function sample(direction,windowSample){
    const v=direction.normalize();
    camera.position.copy(centre).addScaledVector(v,3);camera.lookAt(centre);camera.updateMatrixWorld(true);
    renderer.render(scene,camera);renderer.readRenderTargetPixels(target,0,0,resolution,resolution,pixels);
    const m=new T.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse).elements;
    for(let k=0,i=0;k<count;k++,i+=3){
      const nx=normals[i],ny=normals[i+1],nz=normals[i+2],cos=nx*v.x+ny*v.y+nz*v.z;
      if(cos<=0)continue;
      const x=positions[i]+.004*nx,y=positions[i+1]+.004*ny,z=positions[i+2]+.004*nz;
      const u=(m[0]*x+m[4]*y+m[8]*z+m[12]+1)*.5;
      const t=(m[1]*x+m[5]*y+m[9]*z+m[13]+1)*.5;
      const screenDepth=(m[2]*x+m[6]*y+m[10]*z+m[14]+1)*.5;
      const index=4*(Math.floor(t*resolution)*resolution+Math.floor(u*resolution));
      const delta=(screenDepth-(pixels[index]*256+pixels[index+1])/65535)*(camera.far-camera.near);
      if(windowSample){key[k]+=cos;lit[k]+=cos*(delta<.007?1:0);}
      else{ambient[k]+=cos;if(delta>.007)occ[k]+=cos*Math.exp(-delta/.33);}
    }
  }
  const golden=2.399963229728653;
  for(let i=0;i<64;i++){
    const y=(i+.5)*2/64-1,r=Math.sqrt(1-y*y);
    sample(new T.Vector3(r*Math.cos(i*golden),y,r*Math.sin(i*golden)),false);
  }
  // Broad left-hand window. Cosine weighting keeps grazing faces from acquiring black fringes.
  for(let i=0;i<48;i++){
    const r=Math.sqrt((i+.5)/48),a=i*golden;
    sample(new T.Vector3(-2.4,1.7+1.65*r*Math.cos(a),1.45+1.65*r*Math.sin(a)),true);
  }
  const packed=new Uint8Array(count*2);
  for(let i=0;i<count;i++){
    packed[2*i]=Math.round(255*(1-occ[i]/(ambient[i]||1)));
    packed[2*i+1]=Math.round(255*(key[i]?lit[i]/key[i]:1));
  }
  let bytes='';for(let i=0;i<packed.length;i+=16000)bytes+=String.fromCharCode(...packed.subarray(i,i+16000));
  target.dispose();depth.dispose();renderer.dispose();renderer.forceContextLoss();
  return {counts,data:btoa(bytes)};
}
