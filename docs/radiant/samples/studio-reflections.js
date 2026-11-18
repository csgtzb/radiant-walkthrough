function lightSampleReflections(renderer,...models) {
  const T=THREE, bytes=Uint8Array.from(atob(VANITY_STUDIO_RGB16),c=>c.charCodeAt(0));
  const rgb=new Uint16Array(bytes.buffer), rgba=new Uint16Array(512*256*4);
  for(let i=0,j=0;i<rgb.length;i+=3,j+=4){
    rgba[j]=rgb[i];rgba[j+1]=rgb[i+1];rgba[j+2]=rgb[i+2];rgba[j+3]=0x3c00;
  }
  const pano=new T.DataTexture(rgba,512,256,T.RGBAFormat,T.HalfFloatType);
  pano.mapping=T.EquirectangularReflectionMapping;pano.colorSpace=T.LinearSRGBColorSpace;
  pano.flipY=true;pano.minFilter=pano.magFilter=T.LinearFilter;pano.needsUpdate=true;
  const generator=new T.PMREMGenerator(renderer), light=generator.fromEquirectangular(pano);
  for(const model of models)model.traverse(part=>{
    if(!part.isMesh)return;
    part.material.envMap=light.texture;
    part.material.envMapIntensity=1.0;
    part.material.envMapRotation.y=.70;
    part.material.needsUpdate=true;
  });
  pano.dispose();generator.dispose();
  return light.texture;
}
