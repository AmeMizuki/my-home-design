import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export function createFurnitureBuilder() {
  const geometries = {
    box: new THREE.BoxGeometry(1, 1, 1),
    cylinder: new THREE.CylinderGeometry(.5, .5, 1, 32),
    ring: new THREE.TorusGeometry(.495, .005, 6, 64),
  };
  const blade = new THREE.Shape();
  blade.moveTo(0, 0);
  blade.bezierCurveTo(-.18, .18, -.32, .66, -.06, .84);
  blade.bezierCurveTo(.22, .98, .62, .67, .48, .48);
  blade.bezierCurveTo(.34, .28, .10, .12, 0, 0);
  geometries.blade = new THREE.ExtrudeGeometry(blade, { depth: 1, bevelEnabled: false, curveSegments: 10 });
  geometries.blade.translate(0, 0, -.5);

  const textures = [];
  const materials = {};
  const models = new Map();
  let disposed = false;
  // Each small tile is shared by every face and instance of its material.
  for (const [name, color, roughness, metalness] of [
    ['oak', '#c5a57b', .72, 0], ['fabric', '#81968f', .95, 0],
    ['linen', '#f2ebdc', .96, 0], ['metal', '#91a0a6', .3, .72],
    ['dark', '#39454a', .64, .12], ['rubber', '#30383b', .96, 0],
    ['white', '#e4e6df', .48, 0], ['mesh', '#455750', .9, 0],
    ['cage', '#71848d', .34, .65], ['blade', '#a9c0b8', .46, .08],
  ]) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      dispose();
      throw new Error('無法建立家具材質。');
    }
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 64, 64);
    if (name === 'oak') {
      ctx.strokeStyle = 'rgba(109,76,40,.17)';
      ctx.lineWidth = .7;
      for (let x = 0; x < 64; x += 4) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.bezierCurveTo(x + 3, 18, x - 3, 46, x, 64);
        ctx.stroke();
      }
    } else if (['fabric', 'linen', 'mesh', 'rubber'].includes(name)) {
      const step = name === 'mesh' ? 4 : 2;
      ctx.fillStyle = name === 'mesh' ? 'rgba(0,0,0,.35)' : 'rgba(0,0,0,.09)';
      for (let x = 0; x < 64; x += step) ctx.fillRect(x, 0, .7, 64);
      ctx.fillStyle = name === 'mesh' ? 'rgba(228,236,228,.3)' : 'rgba(255,255,255,.14)';
      for (let y = 0; y < 64; y += step) ctx.fillRect(0, y, 64, .7);
    } else {
      ctx.fillStyle = 'rgba(255,255,255,.035)';
      for (let y = 0; y < 64; y += 2) ctx.fillRect(0, y, 64, 1);
    }
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    textures.push(map);
    materials[name] = new THREE.MeshStandardMaterial({ map, roughness, metalness });
    materials[name].name = name;
  }

  const up = new THREE.Vector3(0, 1, 0);
  const direction = new THREE.Vector3();

  function build(item) {
    if (disposed) throw new Error('Furniture builder has been disposed.');
    if (!models.has(item.type)) models.set(item.type, buildModel(item.type));
    const root = models.get(item.type).clone();
    root.name = item.label || item.type;
    root.userData.itemId = item.id;
    root.scale.set(item.w, item.height, item.h);
    // Normalize the chair's unused margins, not the measured footprint.
    if (item.type === 'chair') root.scale.set(item.w / .9, item.height, item.h / .895);
    return root;
  }

  function buildModel(type) {
    const root = new THREE.Group();
    const centerDepth = type === 'chair' ? .4925 : .5;

    function mesh(kind, material, parent = root) {
      const part = new THREE.Mesh(geometries[kind], materials[material]);
      part.name = `${type}-${material}`;
      part.castShadow = part.receiveShadow = true;
      parent.add(part);
      return part;
    }
    // Preserve the old model fractions: x, ground depth, elevation, w, d, h.
    function box(x, d, y, w, depth, h, material) {
      const part = mesh('box', material);
      part.position.set(x + w / 2 - .5, y + h / 2, d + depth / 2 - centerDepth);
      part.scale.set(w, h, depth);
      return part;
    }
    function cylinder(x, d, y, w, depth, h, material, upright = false) {
      const part = mesh('cylinder', material);
      part.position.set(x + w / 2 - .5, y + h / 2, d + depth / 2 - centerDepth);
      if (upright) {
        part.rotation.x = Math.PI / 2;
        part.scale.set(w, depth, h);
      } else part.scale.set(w, h, depth);
      return part;
    }
    function wire(x1, y1, z1, x2, y2, z2, thickness, material = 'cage') {
      const part = mesh('cylinder', material);
      direction.set(x2 - x1, y2 - y1, z2 - z1);
      part.position.set((x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2);
      part.scale.set(thickness, direction.length(), thickness);
      part.quaternion.setFromUnitVectors(up, direction.normalize());
      return part;
    }

    switch (type) {
      case 'bed':
        for (const x of [.05, .87]) for (const d of [.08, .88]) box(x, d, 0, .08, .07, .16, 'oak');
        box(0, .04, .12, 1, .96, .24, 'oak');
        box(0, 0, .1, 1, .04, .9, 'oak');
        box(.04, .075, .36, .92, .9, .33, 'linen');
        box(.04, .35, .69, .92, .625, .04, 'fabric');
        box(.13, .11, .69, .74, .16, .13, 'linen');
        break;
      case 'desk':
        box(0, 0, .94, 1, 1, .06, 'oak');
        for (const x of [.03, .92]) for (const d of [.07, .87]) box(x, d, 0, .05, .06, .94, 'metal');
        for (const d of [.07, .87]) box(.03, d, .85, .94, .045, .08, 'metal');
        for (const x of [.03, .92]) box(x, .07, .85, .05, .86, .08, 'metal');
        box(.03, .07, .28, .94, .04, .045, 'metal');
        break;
      case 'wardrobe':
      case 'drawer':
        box(.035, .045, 0, .93, .91, .06, 'dark');
        box(0, 0, .06, 1, .055, .94, 'oak');
        for (const x of [0, .955]) box(x, 0, .06, .045, .96, .94, 'oak');
        box(0, 0, .965, 1, .97, .035, 'oak');
        box(0, 0, .06, 1, .97, .035, 'oak');
        if (type === 'wardrobe') {
          // Two full-width drawers below a shelf, double doors over the hanging space.
          for (const y of [.095, .212]) {
            box(.05, .93, y, .9, .045, .112, 'oak');
            box(.40, .975, y + .048, .20, .025, .016, 'metal');
          }
          box(.045, .05, .322, .91, .88, .012, 'oak');
          for (const x of [.05, .5075]) box(x, .93, .329, .4425, .045, .621, 'oak');
          for (const x of [.455, .525]) box(x, .975, .58, .018, .025, .13, 'metal');
        } else {
          for (let i = 0; i < 5; i++) {
            const y = .095 + i * .172;
            box(.05, .93, y, .9, .045, .157, 'white');
            box(.36, .975, y + .10, .28, .025, .017, 'metal');
          }
        }
        break;
      case 'chair':
        for (let i = 0; i < 5; i++) {
          const angle = -Math.PI / 2 + i * Math.PI * 2 / 5;
          const dx = .41 * Math.cos(angle), dz = .41 * Math.sin(angle);
          const spoke = mesh('box', 'metal');
          spoke.position.set(dx / 2, .0825, dz / 2 + .5 - centerDepth);
          spoke.scale.set(.41, .035, .055);
          spoke.rotation.y = -angle;
          cylinder(.5 + dx - .055, .5 + dz - .045, 0, .11, .09, .075, 'rubber', true);
        }
        cylinder(.425, .425, .075, .15, .15, .055, 'dark');
        cylinder(.46, .46, .13, .08, .08, .31, 'metal');
        box(.28, .34, .405, .44, .35, .035, 'dark');
        box(.12, .24, .44, .76, .70, .075, 'fabric');
        for (const x of [.19, .76]) box(x, .1, .40, .05, .08, .54, 'metal');
        box(.14, .09, .53, .72, .09, .47, 'mesh');
        for (const x of [.05, .87]) {
          box(x, .5, .48, .08, .08, .17, 'metal');
          box(x, .25, .65, .08, .6, .04, 'dark');
        }
        break;
      case 'fan': {
        cylinder(.12, 0, 0, .76, 1, .065, 'white');
        cylinder(.435, .42, .065, .13, .13, .48, 'metal');
        cylinder(.37, .23, .57, .26, .16, .22, 'white', true);
        const rotor = new THREE.Group();
        rotor.position.set(0, .68, 0);
        rotor.scale.set(.5, .32, .012);
        root.add(rotor);
        for (let i = 0; i < 3; i++) mesh('blade', 'blade', rotor).rotation.z = i * Math.PI * 2 / 3;
        // Real open wire surfaces on both sides, with a full-depth cage rim.
        for (const z of [-.125, .105]) {
          for (const diameter of [1, .8, .6, .4, .2]) {
            const ring = mesh('ring', 'cage');
            ring.position.set(0, .68, z);
            ring.scale.set(diameter, .64 * diameter, 1);
          }
          for (let i = 0; i < 18; i++) {
            const a = i * Math.PI / 9;
            wire(0, .68, z, .495 * Math.cos(a), .68 + .3168 * Math.sin(a), z, .004);
          }
        }
        for (let i = 0; i < 18; i++) {
          const a = i * Math.PI / 9;
          const x = .495 * Math.cos(a), y = .68 + .3168 * Math.sin(a);
          wire(x, y, -.125, x, y, .105, .004);
        }
        cylinder(.415, .35, .625, .17, .28, .11, 'metal', true);
        break;
      }
      default:
        throw new Error(`Unknown furniture type: ${type}`);
    }
    // Bake static parts once per furniture type: one draw per material, shared by all copies.
    root.updateMatrixWorld(true);
    const batches = new Map();
    root.traverse((part) => {
      if (!part.isMesh) return;
      if (!batches.has(part.material)) batches.set(part.material, []);
      batches.get(part.material).push(part.geometry.clone().applyMatrix4(part.matrixWorld));
    });
    root.clear();
    for (const [material, parts] of batches) {
      const geometry = mergeGeometries(parts);
      for (const part of parts) part.dispose();
      if (!geometry) throw new Error(`Cannot merge furniture geometry: ${type}`);
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();
      const part = new THREE.Mesh(geometry, material);
      part.castShadow = part.receiveShadow = true;
      root.add(part);
    }
    return root;
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    for (const model of models.values()) {
      for (const part of model.children) part.geometry.dispose();
    }
    models.clear();
    for (const geometry of Object.values(geometries)) geometry.dispose();
    for (const material of Object.values(materials)) material.dispose();
    for (const texture of textures) texture.dispose();
  }

  return { build, dispose };
}
