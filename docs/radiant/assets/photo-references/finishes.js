// Keep the source identifier on the material through Three.js clones and GLB export.
const photoFinishes = (() => {
  const loader = new THREE.TextureLoader();
  const textures = new Map(), pending = [];
  function texture(id) {
    const key=id;
    if (textures.has(key)) return textures.get(key);
    if (!PHOTO_SAMPLES[id] || !PHOTO_SWATCHES[id]) throw new Error('缺少实拍取样：'+id);
    const record=PHOTO_SOURCES[PHOTO_SAMPLES[id].source];
    if (record?.city!=='Toronto' || !Number.isInteger(record.year) || record.year<2021 || !record.unit || !record.yearSource) {
      throw new Error('室内饰面需要多伦多 2021 年以后的竣工及套房来源：'+id);
    }
    let map;
    pending.push(new Promise((resolve, reject) => {
      map = loader.load(PHOTO_SWATCHES[id], resolve, undefined, () => reject(new Error('实拍贴图加载失败：'+id)));
    }));
    map.name = PHOTO_SAMPLES[id].label;
    map.userData.mimeType = 'image/jpeg';
    map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = map.wrapT = THREE.MirroredRepeatWrapping;
    map.anisotropy = 8;
    textures.set(key, map);
    return map;
  }
  function material(id, options = {}) {
    const m = new THREE.MeshPhysicalMaterial({name:PHOTO_SAMPLES[id].label, map:texture(id), ...options});
    m.userData.photoFinish = id;
    return m;
  }
  function verify(root) {
    const checked = new Set();
    root.traverse(part => {
      if (!part.isMesh) return;
      for (const m of [].concat(part.material)) {
        if (checked.has(m)) continue;
        checked.add(m);
        const id = m.userData.photoFinish;
        const source = id ? PHOTO_SAMPLES[id]?.source : m.userData.photoSource;
        if (!PHOTO_SOURCES[source] || !m.map?.image?.width || (id && m.map !== textures.get(id))) {
          throw new Error('请核对该部件的实拍来源与贴图：' + (part.name || m.name || part.type));
        }
      }
    });
  }
  return {material, texture, verify, ready:() => Promise.all(pending)};
})();
