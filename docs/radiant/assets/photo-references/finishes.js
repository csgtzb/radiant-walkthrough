// Keep the semantic finish slot on clones so furniture editing and GLB exports stay in sync.
const photoFinishes = (() => {
  const base = new URL('../unity-library/', document.currentScript.src);
  const loader = new THREE.TextureLoader();
  const textures = new Map();
  const pending = [];
  const preview = id => new URL(id + '.webp', base).href;

  function load(name, color, repeat = [1, 1]) {
    if (!name) return null;
    const key = [name, color, ...repeat].join('/');
    if (textures.has(key)) return textures.get(key);
    let texture;
    pending.push(new Promise((resolve, reject) => {
      texture = loader.load(preview(name), resolve, undefined, () => reject(new Error('材质贴图读取失败：' + name)));
    }));
    texture.name = name;
    texture.userData.mimeType = color ? 'image/jpeg' : 'image/png';
    texture.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(...repeat);
    texture.anisotropy = 8;
    textures.set(key, texture);
    return texture;
  }

  function apply(m, id) {
    const slot = UNITY_FINISHES[id];
    if (!slot) throw new Error('缺少 Unity 材质：' + id);
    m.name = slot.label;
    m.map = load(id, true, slot.repeat);
    m.normalMap = load(slot.normal, false, slot.repeat);
    m.normalScale.setScalar(slot.strength || 0);
    m.roughnessMap = load(slot.mask, false, slot.repeat);
    m.roughness = slot.roughness;
    m.metalness = slot.metalness;
    m.clearcoat = slot.clearcoat;
    m.clearcoatRoughness = Math.min(.5, slot.roughness * .7);
    m.sheen = slot.sheen || 0;
    m.sheenColor.set(0xd9cec2);
    m.sheenRoughness = .87;
    m.userData.photoFinish = id;
    m.userData.unityPreset = slot.preset;
    m.userData.materialSource = slot.source;
    m.needsUpdate = true;
    return m;
  }

  function verify(root) {
    const seen = new Set();
    root.traverse(part => {
      if (!part.isMesh) return;
      for (const m of [].concat(part.material)) {
        if (seen.has(m)) continue;
        seen.add(m);
        const id = m.userData.photoFinish, slot = UNITY_FINISHES[id];
        if (slot && m.userData.unityPreset === slot.preset &&
            m.map === load(id, true, slot.repeat) &&
            m.normalMap === load(slot.normal, false, slot.repeat) &&
            m.roughnessMap === load(slot.mask, false, slot.repeat) &&
            [m.map, m.normalMap, m.roughnessMap].every(t => !t || t.image?.width)) continue;
        if (!slot && PHOTO_SOURCES[m.userData.photoSource] && m.map?.image?.width) continue;
        throw new Error('请核对材质来源和贴图：' + (part.name || m.name));
      }
    });
  }
  return {apply, preview, verify, material:(id, options) => apply(new THREE.MeshPhysicalMaterial(options), id),
    ready:() => Promise.all(pending)};
})();
