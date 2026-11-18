// Vertex records use metres × 8192, normalized normals, and UVs × 128.
function buildLivingPiece(group) {
  const piece = new THREE.Group();
  function bytes(text) {
    return Uint8Array.from(atob(text), ch => ch.charCodeAt(0)).buffer;
  }
  for (const part of livingRoomMeshes.filter(part => part.group === group)) {
    const data = new Int16Array(bytes(part.v));
    const count = data.length / 8;
    const positions = new Float32Array(count * 3);
    const normals = new Float32Array(count * 3);
    const uv = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      for (let axis = 0; axis < 3; axis++) {
        positions[3*i+axis] = data[8*i+axis] / 8192;
        normals[3*i+axis] = data[8*i+3+axis] / 32767;
      }
      uv[2*i] = data[8*i+6] / 128;
      uv[2*i+1] = data[8*i+7] / 128;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    const indices = part.wide ? new Uint32Array(bytes(part.i)) : new Uint16Array(bytes(part.i));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    const textile = ['oatFabric', 'loomPillow', 'basketPillow','rugPile'].includes(part.finish);
    const material = photoFinishes.material(part.finish, {
      roughness: part.finish === 'stone' ? .28 : textile ? .92 : .65,
      sheen: textile ? .26 : 0, sheenRoughness: .92
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = group + '/' + part.finish;
    mesh.castShadow = group !== 'rug';
    mesh.receiveShadow = true;
    piece.add(mesh);
  }
  return piece;
}
