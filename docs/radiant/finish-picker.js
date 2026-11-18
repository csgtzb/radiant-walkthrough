// Keep the geometry, UVs, lighting properties and floor contact map when changing a finish.
function setupFinishPicker(scene, redraw) {
  const targets = new Map();
  targets.set('wall', [roomFinishes.paint]);
  targets.set('floor', [scene.getObjectByName('interior/floor').material]);

  function isolate(names, finishes) {
    const copies = new Map();
    for (const name of names) {
      scene.getObjectByName(name).traverse(part => {
        if (!part.isMesh || !finishes.includes(part.material.userData.photoFinish)) return;
        const original = part.material;
        if (!copies.has(original)) copies.set(original, original.clone());
        part.material = copies.get(original);
      });
    }
    return [...copies.values()];
  }
  targets.set('cabinet', isolate(['kitchen-run', 'kitchen-island'], ['maple', 'upper']));
  targets.set('sofa', isolate(['living-sofa'], ['wool']));

  const storageKey = 'radiant/2c/finishes/v1';
  let saved;
  try { saved = JSON.parse(localStorage.getItem(storageKey)); } catch { /* optional storage */ }
  const choices = {};
  for (const select of document.querySelectorAll('select[data-finish]')) {
    const name = select.dataset.finish;
    const materials = targets.get(name);
    const originals = materials.map(material => material.userData.photoFinish);
    const label = select.closest('label');
    const sourceLink = label.parentElement.querySelector('a');
    if ([...select.options].some(option => option.value === saved?.[name])) select.value = saved[name];
    function apply() {
      const standard = select.selectedIndex === 0;
      materials.forEach((material, i) => {
        const id = standard ? originals[i] : select.value;
        material.map = photoFinishes.texture(id);
        material.userData.photoFinish = id;
        material.name = PHOTO_SAMPLES[id].label;
      });
      label.querySelector('img').src = PHOTO_SWATCHES[select.value];
      sourceLink.href = 'assets/photo-references/index.html#sample-' + select.value;
      choices[name] = select.value;
      redraw();
      photoFinishes.ready().then(redraw);
    }
    apply();
    select.addEventListener('change', () => {
      apply();
      try { localStorage.setItem(storageKey, JSON.stringify(choices)); } catch { /* session only */ }
    });
  }
}
