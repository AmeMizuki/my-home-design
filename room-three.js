import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createFurnitureBuilder } from './furniture-three.js';

const clamp = THREE.MathUtils.clamp;
const radians = THREE.MathUtils.degToRad;
const FLOOR_COLORS = {
  oak: '#d9bd97', walnut: '#6b4a34', herringbone: '#cbb08a',
  tile: '#c7c9cc', concrete: '#b7b8b6', carpet: '#d6d3ce',
};
const ORBIT_FOV = 42;
const PERSON_FOV = 65;
// A 170 cm person: standing eyes ~158 cm, seated eyes ~79 cm above the seat.
const STAND_EYE = 158;
const SEATED_EYE = 79;
const WALL_MARGIN = 20;
const WALK_SPEED = 120; // cm/s, a relaxed indoor pace
const RUN_SPEED = 250;
const TURN_SPEED = 90; // degrees/s
const LOOK_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
const WALK_KEYS = [...LOOK_KEYS, 'w', 'a', 's', 'd'];

export function createRoomPreview(stage, { onSelect, onZoom, onError }) {
  // Creation errors deliberately reach the caller; there is no simulated 3D fallback.
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  const canvas = renderer.domElement;
  canvas.className = 'room-three-canvas';
  canvas.tabIndex = -1;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', '3D 房間預覽；在預覽區使用方向鍵旋轉，Alt 加方向鍵平移，Home 重設視角。家具可由左側圖層清單選取。');
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;

  const scene = new THREE.Scene();
  let environmentMap;
  scene.environmentIntensity = 0.3;
  updateEnvironment();
  const camera = new THREE.PerspectiveCamera(ORBIT_FOV, 1, 0.1, 20000);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = false;
  controls.autoRotate = false;
  controls.screenSpacePanning = true;
  controls.minPolarAngle = radians(5);
  controls.maxPolarAngle = radians(85);
  controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.PAN, RIGHT: THREE.MOUSE.PAN };
  controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
  const furnitureBuilder = createFurnitureBuilder();
  const architecture = new THREE.Group();
  const furniture = new THREE.Group();
  const markings = new THREE.Group();
  architecture.name = 'Room';
  furniture.name = 'Furniture';
  markings.name = 'Placement outlines';
  scene.add(architecture, furniture, markings);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x84745e, 0.8));
  const light = new THREE.DirectionalLight(0xfff5e5, 2.5);
  light.castShadow = true;
  light.shadow.mapSize.set(2048, 2048);
  light.shadow.bias = -0.0002;
  light.shadow.normalBias = 0.7;
  scene.add(light, light.target);

  // Room primitives/materials survive rebuilds. Only outline geometries are per-model.
  const cube = new THREE.BoxGeometry(1, 1, 1);
  const plane = new THREE.PlaneGeometry(1, 1);
  const sphere = new THREE.SphereGeometry(1, 12, 8);
  const materials = new Map();
  const textures = new Set();
  const floorMaterials = new Map();
  const wallMaterial = material('wall', '#EDEAE3');
  const frameMaterial = material('window frame', '#e8e6e1');
  const glassMaterial = material('glass', '#93cce2', { transparent: true, opacity: 0.3, depthWrite: false, roughness: 0.16 });
  const edgeMaterial = material('door edge', '#856948');
  const knobMaterial = material('door knob', '#4a4640', { metalness: 0.6, roughness: 0.35 });
  const tokens = getComputedStyle(stage);
  const selectionMaterial = new THREE.LineBasicMaterial({ color: tokens.getPropertyValue('--color-primary').trim() || '#2563eb', depthTest: false });
  const overlapMaterial = new THREE.LineDashedMaterial({ color: tokens.getPropertyValue('--color-muted').trim() || '#71717a', dashSize: 6, gapSize: 3, depthTest: false });
  const outsideMaterial = new THREE.LineDashedMaterial({ color: tokens.getPropertyValue('--color-danger').trim() || '#dc2626', dashSize: 2, gapSize: 3, depthTest: false });
  const ceilingMaterial = material('ceiling', '#f4f2ee');
  const wallGroups = new Map();
  const furnitureModels = new Map();
  let architectureKey = '';
  const center = new THREE.Vector3();
  const offset = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const spherical = new THREE.Spherical();
  const pan = new THREE.Vector3();
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const activePointers = new Set();
  let clickStart = null;
  let visible = true;
  let contextLost = false;
  let disposed = false;
  let frame = null;
  let changingCamera = false;
  let initialized = false;
  let fitDistance = 1;
  let currentZoom = 1;
  let width = 1;
  let height = 1;
  let bounds = null;
  let pixelRatio = 0;
  let wallThickness = 0;
  let lastState = null;
  // First-person camera: { mode, itemId, key }; orbitSaved restores the overview on exit.
  let person = null;
  let orbitSaved = null;
  const held = new Set();
  let running = false;
  let moveFrame = null;
  let lastTick = 0;

  function updateEnvironment() {
    environmentMap?.dispose();
    const room = new RoomEnvironment();
    const generator = new THREE.PMREMGenerator(renderer);
    try {
      environmentMap = generator.fromScene(room);
      scene.environment = environmentMap.texture;
    } finally {
      room.dispose();
      generator.dispose();
    }
  }

  function material(name, color, extra = {}) {
    if (!materials.has(name)) materials.set(name, new THREE.MeshStandardMaterial({ color, roughness: 0.82, ...extra }));
    return materials.get(name);
  }

  function texture(draw) {
    const image = document.createElement('canvas');
    image.width = image.height = 256;
    draw(image.getContext('2d'));
    const result = new THREE.CanvasTexture(image);
    result.colorSpace = THREE.SRGBColorSpace;
    result.wrapS = result.wrapT = THREE.RepeatWrapping;
    result.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    textures.add(result);
    return result;
  }

  function floorMaterial(kind, roomWidth, roomDepth) {
    if (!floorMaterials.has(kind)) {
      const map = texture((ctx) => {
        ctx.fillStyle = FLOOR_COLORS[kind] || FLOOR_COLORS.oak;
        ctx.fillRect(0, 0, 256, 256);
        ctx.lineWidth = 2;
        ctx.strokeStyle = kind === 'walnut' ? 'rgba(0,0,0,.18)' : 'rgba(0,0,0,.1)';
        if (kind === 'oak' || kind === 'walnut') {
          for (const x of [0, 128, 256]) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 256); ctx.stroke();
          }
          ctx.strokeStyle = 'rgba(255,255,255,.18)';
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(128, 0); ctx.moveTo(128, 128); ctx.lineTo(256, 128); ctx.stroke();
          ctx.lineWidth = 0.7;
          ctx.strokeStyle = 'rgba(80,50,20,.07)';
          for (let x = 9; x < 256; x += 13) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.bezierCurveTo(x + 5, 80, x - 5, 160, x, 256); ctx.stroke();
          }
        } else if (kind === 'herringbone') {
          for (let i = -256; i <= 512; i += 64) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i - 256, 256); ctx.moveTo(i, 0); ctx.lineTo(i + 256, 256); ctx.stroke();
          }
        } else if (kind === 'tile') {
          ctx.lineWidth = 4;
          ctx.strokeRect(0, 0, 256, 256);
        } else {
          ctx.fillStyle = 'rgba(0,0,0,.07)';
          const step = kind === 'carpet' ? 8 : 12;
          for (let x = 0; x < 256; x += step) for (let y = 0; y < 256; y += step) {
            ctx.beginPath(); ctx.arc(x + (y % (step * 2) ? step / 2 : 0), y, 1.3, 0, Math.PI * 2); ctx.fill();
          }
        }
      });
      const result = material('floor ' + kind, '#ffffff', { map, roughness: kind === 'tile' ? 0.6 : 0.95 });
      floorMaterials.set(kind, result);
    }
    const result = floorMaterials.get(kind);
    const repeat = kind === 'oak' || kind === 'walnut' ? [76, 180]
      : kind === 'tile' ? [60, 60] : kind === 'herringbone' ? [96, 96] : [48, 48];
    result.map.repeat.set(roomWidth / repeat[0], roomDepth / repeat[1]);
    return result;
  }

  function doorMaterial(back) {
    const name = back ? 'door back' : 'door front';
    if (!materials.has(name)) {
      const map = texture((ctx) => {
        ctx.fillStyle = back ? '#d5bd98' : '#c3a881';
        ctx.fillRect(0, 0, 256, 256);
        ctx.fillStyle = back ? '#ceb38d' : '#bda079';
        for (let x = 0; x < 256; x += 24) ctx.fillRect(x, 0, 3, 256);
        ctx.strokeStyle = '#927957'; ctx.lineWidth = 2; ctx.strokeRect(30, 20, 196, 216);
        ctx.strokeStyle = '#ddc9a7'; ctx.strokeRect(33, 23, 190, 210);
      });
      material(name, '#ffffff', { map });
    }
    return materials.get(name);
  }

  function box(parent, name, x, y, z, w, h, d, mat) {
    if (w <= 0 || h <= 0 || d <= 0) return null;
    const mesh = new THREE.Mesh(cube, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.scale.set(w, h, d);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function wallBox(group, side, room, x, y, w, h, thickness, mat, name) {
    const horizontal = side === 'top' || side === 'bottom';
    const plane = side === 'top' || side === 'left' ? -room.wallThickness / 2
      : (horizontal ? room.depth : room.width) + room.wallThickness / 2;
    return horizontal
      ? box(group, name, x + w / 2, y + h / 2, plane, w, h, thickness, mat)
      : box(group, name, plane, y + h / 2, x + w / 2, thickness, h, w, mat);
  }

  // Subdivide at every opening edge, then omit cells inside the union of openings.
  // Unlike one door-specific split, this also handles overlapping door/window spans.
  function rectangles(rect, holes, add) {
    const xs = [...new Set([rect.x, rect.x + rect.w, ...holes.flatMap((hole) => [clamp(hole.x, rect.x, rect.x + rect.w), clamp(hole.x + hole.w, rect.x, rect.x + rect.w)])])].sort((a, b) => a - b);
    const ys = [...new Set([rect.y, rect.y + rect.h, ...holes.flatMap((hole) => [clamp(hole.y, rect.y, rect.y + rect.h), clamp(hole.y + hole.h, rect.y, rect.y + rect.h)])])].sort((a, b) => a - b);
    for (let xi = 0; xi < xs.length - 1; xi++) for (let yi = 0; yi < ys.length - 1; yi++) {
      const x = xs[xi], y = ys[yi], w = xs[xi + 1] - x, h = ys[yi + 1] - y;
      if (!holes.some((hole) => x + w / 2 > hole.x && x + w / 2 < hole.x + hole.w && y + h / 2 > hole.y && y + h / 2 < hole.y + hole.h)) add(x, y, w, h);
    }
  }

  function buildRoom(state, options) {
    const key = JSON.stringify([state.room, state.door, state.window, state.floor, options.wallColor]);
    if (key === architectureKey) return;
    architectureKey = key;
    architecture.clear();
    renderer.shadowMap.needsUpdate = true;
    wallGroups.clear();
    const room = state.room;
    const t = room.wallThickness;
    wallMaterial.color.set(options.wallColor);
    const floor = new THREE.Mesh(plane, floorMaterial(state.floor, room.width, room.depth));
    // Plane UVs align with the ground rather than each of the box's six faces.
    floor.rotation.x = -Math.PI / 2;
    floor.scale.set(room.width, room.depth, 1);
    floor.position.set(room.width / 2, 0, room.depth / 2);
    floor.receiveShadow = true;
    floor.name = 'Floor';
    architecture.add(floor);
    const ceiling = new THREE.Mesh(plane, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.scale.set(room.width, room.depth, 1);
    ceiling.position.set(room.width / 2, room.height, room.depth / 2);
    ceiling.name = 'Ceiling';
    ceiling.visible = !!person;
    architecture.add(ceiling);
    // Keep the slab below the floor plane so their coplanar triangles cannot z-fight.
    box(architecture, 'Floor foundation', room.width / 2, -2.05, room.depth / 2, room.width + t * 2, 4, room.depth + t * 2, edgeMaterial);
    const windowHeight = Math.min(100, room.height);
    const sill = Math.min(90, Math.max(0, room.height - windowHeight));
    for (const side of ['top', 'right', 'bottom', 'left']) {
      const group = new THREE.Group();
      group.name = side + ' wall';
      architecture.add(group);
      wallGroups.set(side, group);
      const horizontal = side === 'top' || side === 'bottom';
      const length = horizontal ? room.width : room.depth;
      const doorHole = state.door.wall === side
        ? { x: state.door.pos, y: 0, w: state.door.width, h: Math.min(state.door.height, room.height) } : null;
      const windowHole = state.window.wall === side
        ? { x: state.window.pos, y: sill, w: state.window.width, h: windowHeight } : null;
      const holes = [doorHole, windowHole].filter(Boolean);
      rectangles({ x: horizontal ? -t : 0, y: 0, w: length + (horizontal ? t * 2 : 0), h: room.height }, holes,
        (x, y, w, h) => wallBox(group, side, room, x, y, w, h, t, wallMaterial, 'Wall segment'));
      if (windowHole) {
        const { x, y, w, h } = windowHole;
        const frame = Math.min(3, w / 4, h / 4);
        const addWindow = (rect, mat, thickness, name) => rectangles(rect, doorHole ? [doorHole] : [],
          (px, py, pw, ph) => wallBox(group, side, room, px, py, pw, ph, thickness, mat, name));
        addWindow(windowHole, glassMaterial, 0.5, 'Window glass');
        for (const rect of [
          { x, y, w, h: frame }, { x, y: y + h - frame, w, h: frame },
          { x, y, w: frame, h }, { x: x + w - frame, y, w: frame, h },
          { x: x + w / 3 - frame / 2, y, w: frame, h },
          { x: x + w * 2 / 3 - frame / 2, y, w: frame, h },
        ]) addWindow(rect, frameMaterial, t + 1, 'Window frame');
      }
    }
    const door = new THREE.Group();
    const cfg = state.door;
    const plan = options.doorPlan;
    door.name = 'Door leaf';
    door.position.set(plan.hinge.x, 0, plan.hinge.y);
    door.rotation.y = -radians(plan.rotation);
    architecture.add(door);
    box(door, 'Measured door slab', cfg.width / 2, cfg.height / 2, 0, cfg.width, cfg.height, 3.5,
      [edgeMaterial, edgeMaterial, edgeMaterial, edgeMaterial, doorMaterial(false), doorMaterial(true)]);
    for (const sign of [-1, 1]) {
      box(door, 'Door knob stem', cfg.width * 0.9, cfg.height * 0.55, sign * 2.4, 1.4, 1.4, 2, knobMaterial);
      const knob = new THREE.Mesh(sphere, knobMaterial);
      knob.name = 'Door knob';
      knob.position.set(cfg.width * 0.9, cfg.height * 0.55, sign * 3.6);
      knob.scale.setScalar(2.1);
      knob.castShadow = true;
      door.add(knob);
    }
  }

  function updateFurniture(state, options) {
    const ids = new Set(state.items.map((item) => item.id));
    for (const [id, model] of furnitureModels) {
      if (ids.has(id)) continue;
      furniture.remove(model.group);
      furnitureModels.delete(id);
      renderer.shadowMap.needsUpdate = true;
    }
    for (const line of markings.children) line.geometry.dispose();
    markings.clear();
    const overlapping = new Set(options.overlappingIds);
    const outside = new Set(options.outsideIds);
    for (const item of state.items) {
      const w = item.rot % 180 === 90 ? item.h : item.w;
      const d = item.rot % 180 === 90 ? item.w : item.h;
      let model = furnitureModels.get(item.id);
      const previous = model?.item;
      if (!previous || ['type', 'w', 'h', 'height'].some((key) => previous[key] !== item[key])) {
        if (model) furniture.remove(model.group);
        model = { group: furnitureBuilder.build(item) };
        furnitureModels.set(item.id, model);
        furniture.add(model.group);
        renderer.shadowMap.needsUpdate = true;
      }
      const group = model.group;
      group.name = item.label;
      if (!previous || ['x', 'y', 'rot'].some((key) => previous[key] !== item[key])) {
        renderer.shadowMap.needsUpdate = true;
      }
      group.position.set(item.x + w / 2, 0, item.y + d / 2);
      group.rotation.y = -radians(item.rot);
      model.item = { ...item };
      if (overlapping.has(item.id)) outline(item, w, d, 2, overlapMaterial);
      if (outside.has(item.id)) outline(item, w, d, 4, outsideMaterial);
      if (item.id === state.selectedId) outline(item, w, d, 0, selectionMaterial);
    }
  }

  function outline(item, w, d, padding, mat) {
    const x = item.x - padding, z = item.y - padding;
    const points = [[x, z], [x + w + padding * 2, z], [x + w + padding * 2, z + d + padding * 2], [x, z + d + padding * 2], [x, z]];
    const geometry = new THREE.BufferGeometry().setFromPoints(points.map(([px, pz]) => new THREE.Vector3(px, 0.7 + padding * 0.05, pz)));
    const line = new THREE.Line(geometry, mat);
    line.computeLineDistances();
    line.renderOrder = 10;
    markings.add(line);
  }

  function cutaway() {
    direction.subVectors(camera.position, controls.target);
    const facing = { top: -direction.z, bottom: direction.z, left: -direction.x, right: direction.x };
    const ceiling = architecture.getObjectByName('Ceiling');
    if (ceiling) ceiling.visible = !!person;
    for (const [side, group] of wallGroups) {
      const next = !!person || facing[side] <= 0;
      if (group.visible !== next) {
        group.visible = next;
        renderer.shadowMap.needsUpdate = true;
      }
    }
  }

  function requestRender() {
    if (!visible || contextLost || disposed || frame !== null) return;
    frame = requestAnimationFrame(() => {
      frame = null;
      if (!visible || contextLost || disposed) return;
      cutaway();
      try {
        renderer.render(scene, camera);
      } catch (error) {
        onError?.('3D 預覽繪製失敗：' + error.message);
      }
    });
  }

  function controlChanged() {
    if (changingCamera || disposed) return;
    if (person) return requestRender();
    const next = clamp(fitDistance / camera.position.distanceTo(controls.target), 0.25, 4);
    if (Math.abs(next - currentZoom) > 0.00001) {
      currentZoom = next;
      onZoom?.(currentZoom);
    }
    requestRender();
  }

  function placeCamera() {
    changingCamera = true;
    controls.minDistance = fitDistance / 4;
    controls.maxDistance = fitDistance / 0.25;
    offset.subVectors(camera.position, controls.target);
    if (offset.lengthSq() === 0) offset.setFromSphericalCoords(1, radians(58), radians(-32));
    offset.setLength(fitDistance / currentZoom);
    camera.position.copy(controls.target).add(offset);
    controls.update();
    changingCamera = false;
    requestRender();
  }

  function fit() {
    if (!bounds) return;
    const radius = Math.hypot(bounds.width + wallThickness * 2, bounds.depth + wallThickness * 2, bounds.height + 4) / 2;
    const vertical = radians(ORBIT_FOV) / 2;
    const horizontal = Math.atan(Math.tan(vertical) * camera.aspect);
    fitDistance = radius / Math.sin(Math.min(vertical, horizontal)) * 1.08;
    camera.near = Math.max(0.1, radius / 5000);
    camera.far = Math.max(20000, fitDistance * 20);
    camera.fov = person ? clamp(PERSON_FOV / currentZoom, 10, 110) : ORBIT_FOV;
    camera.updateProjectionMatrix();
    if (person) requestRender();
    else placeCamera();
  }

  function lookFrom(eye, look) {
    changingCamera = true;
    camera.position.copy(eye);
    controls.target.copy(eye).add(look.normalize());
    controls.update();
    changingCamera = false;
  }

  function personItem(mode, state) {
    const selected = state.items.find((item) => item.id === state.selectedId && item.type === mode);
    return selected || state.items.find((item) => item.id === person?.itemId && item.type === mode)
      || state.items.find((item) => item.type === mode);
  }

  // Item-local vector (cm, origin at footprint center, model depth along +z) to world space.
  function fromItem(item, vector, isPoint) {
    vector.applyAxisAngle(THREE.Object3D.DEFAULT_UP, -radians(item.rot));
    if (!isPoint) return vector;
    const w = item.rot % 180 === 90 ? item.h : item.w;
    const d = item.rot % 180 === 90 ? item.w : item.h;
    return vector.add(new THREE.Vector3(item.x + w / 2, 0, item.y + d / 2));
  }

  // Stand in the room's center, facing away from the door wall.
  function standingStart(state) {
    const { room, door } = state;
    const [dx, dz] = { top: [0, 1], bottom: [0, -1], left: [1, 0], right: [-1, 0] }[door.wall];
    return [new THREE.Vector3(room.width / 2, STAND_EYE, room.depth / 2), new THREE.Vector3(dx, -0.12, dz)];
  }

  function applyCameraMode(mode, state) {
    const item = mode === 'bed' || mode === 'chair' ? personItem(mode, state) : null;
    if (mode === 'orbit' || (mode !== 'walk' && !item)) {
      if (!person) return;
      person = null;
      stopMoving();
      controls.enableZoom = controls.enablePan = true;
      controls.rotateSpeed = 1;
      controls.minPolarAngle = radians(5);
      controls.maxPolarAngle = radians(85);
      camera.position.copy(orbitSaved.position);
      controls.target.copy(orbitSaved.target);
      currentZoom = orbitSaved.zoom;
      renderer.shadowMap.needsUpdate = true;
      fit();
      onZoom?.(currentZoom);
      return;
    }
    const key = JSON.stringify(item ? [mode, item.id, item.x, item.y, item.rot, item.w, item.h, item.height] : [mode]);
    if (person?.key === key) {
      if (mode === 'walk') walk(0, 0, state.room);
      return;
    }
    if (!person) {
      orbitSaved = { position: camera.position.clone(), target: controls.target.clone(), zoom: currentZoom };
      controls.enableZoom = controls.enablePan = false;
      controls.minDistance = 0;
      controls.rotateSpeed = 0.4;
      controls.minPolarAngle = radians(1);
      controls.maxPolarAngle = radians(179);
      renderer.shadowMap.needsUpdate = true;
    }
    person = { mode, itemId: item?.id, key };
    currentZoom = 1;
    onZoom?.(1);
    let eye, look;
    if (mode === 'walk') [eye, look] = standingStart(state);
    else if (mode === 'bed') {
      // Head on the pillow (model depth .11-.27, top at .82 of height), gazing up toward the foot.
      eye = fromItem(item, new THREE.Vector3(0, item.height * 0.82 + 8, item.h * -0.31), true);
      look = fromItem(item, new THREE.Vector3(0, 1, 0.4), false);
    } else {
      // Seat top is at .515 of the chair height; the backrest sits toward -z.
      eye = fromItem(item, new THREE.Vector3(0, item.height * 0.515 + SEATED_EYE, 0), true);
      look = fromItem(item, new THREE.Vector3(0, -0.3, 1), false);
    }
    lookFrom(eye, look);
    fit();
  }

  // ponytail: walls clamp the walker, furniture does not; add collision boxes if walking through beds bothers.
  function walk(forward, sideways, room) {
    direction.subVectors(controls.target, camera.position).setY(0).normalize();
    pan.set(-direction.z, 0, direction.x).multiplyScalar(sideways).addScaledVector(direction, forward);
    pan.add(camera.position);
    pan.x = clamp(pan.x, WALL_MARGIN, room.width - WALL_MARGIN);
    pan.z = clamp(pan.z, WALL_MARGIN, room.depth - WALL_MARGIN);
    pan.sub(camera.position);
    camera.position.add(pan);
    controls.target.add(pan);
    controls.update();
    requestRender();
  }

  function update(state, options) {
    if (disposed) return;
    buildRoom(state, options);
    updateFurniture(state, options);
    if (!bounds || Object.keys(options.bounds).some((key) => bounds[key] !== options.bounds[key])
      || wallThickness !== state.room.wallThickness) renderer.shadowMap.needsUpdate = true;
    bounds = { ...options.bounds };
    wallThickness = state.room.wallThickness;
    lastState = state;
    currentZoom = clamp(options.zoom ?? currentZoom, 0.25, 4);
    // While first-person, keep the saved overview camera following room changes instead.
    const orbitTarget = person ? orbitSaved.target : controls.target;
    const orbitPosition = person ? orbitSaved.position : camera.position;
    pan.copy(orbitTarget).sub(center);
    center.set(bounds.minX + bounds.width / 2, bounds.height / 2, bounds.minY + bounds.depth / 2);
    offset.subVectors(orbitPosition, orbitTarget);
    orbitTarget.copy(center).add(pan);
    if (!initialized) offset.setFromSphericalCoords(1, radians(58), radians(-32));
    orbitPosition.copy(orbitTarget).add(offset);
    initialized = true;
    const radius = Math.hypot(bounds.width, bounds.depth, bounds.height) / 2 + wallThickness;
    light.target.position.copy(center);
    light.position.set(center.x - radius, center.y + radius * 2, center.z + radius);
    const shadow = light.shadow.camera;
    shadow.left = shadow.bottom = -radius * 1.25;
    shadow.right = shadow.top = radius * 1.25;
    shadow.near = 1;
    shadow.far = radius * 6;
    shadow.updateProjectionMatrix();
    fit();
    applyCameraMode(options.cameraMode || 'orbit', state);
  }

  function resize(nextWidth, nextHeight) {
    if (disposed) return;
    nextWidth = Math.max(1, nextWidth);
    nextHeight = Math.max(1, nextHeight);
    const nextRatio = Math.min(window.devicePixelRatio || 1, 2);
    if (width === nextWidth && height === nextHeight && pixelRatio === nextRatio) return;
    width = nextWidth;
    height = nextHeight;
    pixelRatio = nextRatio;
    renderer.setDrawingBufferSize(width, height, pixelRatio);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    fit();
  }

  function setZoom(zoom) {
    if (disposed) return;
    currentZoom = clamp(zoom, 0.25, 4);
    if (person) fit();
    else placeCamera();
    onZoom?.(currentZoom);
  }

  function resetView(zoom = 1) {
    if (disposed) return;
    if (person) {
      person.key = '';
      applyCameraMode(person.mode, lastState);
      return;
    }
    currentZoom = clamp(zoom, 0.25, 4);
    controls.target.copy(center);
    offset.setFromSphericalCoords(fitDistance / currentZoom, radians(58), radians(-32));
    camera.position.copy(center).add(offset);
    placeCamera();
    onZoom?.(currentZoom);
  }

  function keyName(event) {
    return event.key.length === 1 ? event.key.toLowerCase() : event.key;
  }

  function keyUp(event) {
    running = event.shiftKey;
    held.delete(keyName(event));
  }

  function stopMoving() {
    held.clear();
    if (moveFrame !== null) cancelAnimationFrame(moveFrame);
    moveFrame = null;
    lastTick = 0;
  }

  // Held keys move/turn continuously per frame instead of stepping on keyboard auto-repeat.
  function tick(now) {
    moveFrame = null;
    if (!person || !held.size || !visible || contextLost || disposed) {
      lastTick = 0;
      return;
    }
    const dt = lastTick ? Math.min((now - lastTick) / 1000, 0.1) : 1 / 60;
    lastTick = now;
    const has = (...keys) => keys.some((key) => held.has(key));
    const yaw = has('ArrowLeft') - has('ArrowRight');
    const pitch = person.mode === 'walk' ? 0 : has('ArrowUp') - has('ArrowDown');
    if (yaw || pitch) {
      spherical.setFromVector3(offset.subVectors(controls.target, camera.position));
      spherical.theta += yaw * radians(TURN_SPEED) * dt;
      spherical.phi = clamp(spherical.phi - pitch * radians(TURN_SPEED) * dt, controls.minPolarAngle, controls.maxPolarAngle);
      controls.target.copy(camera.position).add(offset.setFromSpherical(spherical));
      controls.update();
    }
    if (person.mode === 'walk') {
      const forward = has('w', 'ArrowUp') - has('s', 'ArrowDown');
      const sideways = has('d') - has('a');
      const length = Math.hypot(forward, sideways);
      const distance = (running ? RUN_SPEED : WALK_SPEED) * dt / (length || 1);
      if (length) walk(forward * distance, sideways * distance, lastState.room);
    }
    requestRender();
    moveFrame = requestAnimationFrame(tick);
  }

  // Main owns the stage's key listener; OrbitControls never installs its arrow-key handler.
  function handleKey(event) {
    if (!visible || contextLost || disposed || event.ctrlKey || event.metaKey) return false;
    if (event.key === 'Home') {
      event.preventDefault();
      resetView(currentZoom);
      return true;
    }
    if (person && !event.altKey) {
      const key = keyName(event);
      running = event.shiftKey;
      if (!(person.mode === 'walk' ? WALK_KEYS : LOOK_KEYS).includes(key)) return false;
      event.preventDefault();
      held.add(key);
      if (moveFrame === null) moveFrame = requestAnimationFrame(tick);
      return true;
    }
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return false;
    event.preventDefault();
    if (person && event.altKey) return true;
    if (event.altKey) {
      camera.updateMatrixWorld();
      const distance = camera.position.distanceTo(controls.target);
      const amount = 20 * 2 * distance * Math.tan(radians(camera.fov) / 2) / height;
      pan.setFromMatrixColumn(camera.matrix, event.key === 'ArrowLeft' || event.key === 'ArrowRight' ? 0 : 1);
      pan.multiplyScalar(amount * (event.key === 'ArrowLeft' || event.key === 'ArrowDown' ? -1 : 1));
      camera.position.add(pan);
      controls.target.add(pan);
    } else {
      spherical.setFromVector3(offset.subVectors(camera.position, controls.target));
      const step = radians(event.shiftKey ? 15 : 5);
      if (event.key === 'ArrowLeft') spherical.theta -= step;
      if (event.key === 'ArrowRight') spherical.theta += step;
      if (event.key === 'ArrowUp') spherical.phi -= step;
      if (event.key === 'ArrowDown') spherical.phi += step;
      spherical.phi = clamp(spherical.phi, controls.minPolarAngle, controls.maxPolarAngle);
      camera.position.copy(controls.target).add(offset.setFromSpherical(spherical));
    }
    controls.update();
    requestRender();
    return true;
  }

  function pointerDown(event) {
    if (!visible || contextLost || disposed) return;
    activePointers.add(event.pointerId);
    if (activePointers.size !== 1 || !event.isPrimary || event.button !== 0 || event.shiftKey || event.ctrlKey || event.metaKey) {
      clickStart = null;
      return;
    }
    clickStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
    stage.focus({ preventScroll: true });
  }

  function pointerMove(event) {
    if (clickStart?.id === event.pointerId && Math.hypot(event.clientX - clickStart.x, event.clientY - clickStart.y) > 4) clickStart = null;
  }

  function pointerUp(event) {
    const start = clickStart;
    activePointers.delete(event.pointerId);
    clickStart = null;
    if (!start || start.id !== event.pointerId || activePointers.size || event.button !== 0 || !visible || contextLost) return;
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 4) return;
    const rect = canvas.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) return;
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
    scene.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
    raycaster.setFromCamera(pointer, camera);
    // Architecture intentionally cannot intercept selection, including cutaway walls.
    const hit = raycaster.intersectObjects(furniture.children, true)[0];
    let object = hit?.object;
    while (object && object.userData.itemId == null) object = object.parent;
    onSelect?.(object?.userData.itemId ?? null);
  }

  function cancelPointers() {
    clickStart = null;
    activePointers.clear();
  }

  function cancelFrame() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
  }

  function setVisible(value) {
    if (disposed || visible === value) return;
    visible = value;
    controls.enabled = visible && !contextLost;
    if (visible) controls.connect(canvas);
    else {
      controls.disconnect();
      cancelPointers();
      stopMoving();
      cancelFrame();
    }
    requestRender();
  }

  function lostContext(event) {
    event.preventDefault();
    contextLost = true;
    controls.enabled = false;
    cancelPointers();
    stopMoving();
    cancelFrame();
    onError?.('3D 顯示連線已中斷，正在等待 WebGL 恢復。仍可使用 2D 編輯。');
  }

  function restoredContext() {
    if (disposed) return;
    contextLost = false;
    renderer.shadowMap.needsUpdate = true;
    updateEnvironment();
    controls.enabled = visible;
    // WebGLRenderer restores its internals; retained CPU geometries/textures re-upload on render.
    for (const map of textures) map.needsUpdate = true;
    for (const mat of materials.values()) mat.needsUpdate = true;
    resize(width, height);
    onError?.('');
    requestRender();
  }

  function windowResize() { resize(width, height); }

  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelFrame();
    controls.removeEventListener('change', controlChanged);
    controls.dispose();
    canvas.removeEventListener('pointerdown', pointerDown, true);
    canvas.removeEventListener('webglcontextlost', lostContext);
    canvas.removeEventListener('webglcontextrestored', restoredContext);
    document.removeEventListener('pointermove', pointerMove, true);
    document.removeEventListener('pointerup', pointerUp, true);
    document.removeEventListener('pointercancel', cancelPointers, true);
    window.removeEventListener('blur', cancelPointers);
    window.removeEventListener('blur', stopMoving);
    window.removeEventListener('keyup', keyUp);
    stopMoving();
    window.removeEventListener('resize', windowResize);
    furnitureBuilder.dispose();
    for (const line of markings.children) line.geometry.dispose();
    furnitureModels.clear();
    cube.dispose();
    plane.dispose();
    sphere.dispose();
    for (const mat of materials.values()) mat.dispose();
    for (const mat of [selectionMaterial, overlapMaterial, outsideMaterial]) mat.dispose();
    for (const map of textures) map.dispose();
    light.shadow.dispose();
    environmentMap.dispose();
    scene.clear();
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  }

  controls.addEventListener('change', controlChanged);
  canvas.addEventListener('pointerdown', pointerDown, true);
  canvas.addEventListener('webglcontextlost', lostContext);
  canvas.addEventListener('webglcontextrestored', restoredContext);
  document.addEventListener('pointermove', pointerMove, true);
  document.addEventListener('pointerup', pointerUp, true);
  document.addEventListener('pointercancel', cancelPointers, true);
  window.addEventListener('blur', cancelPointers);
  window.addEventListener('blur', stopMoving);
  window.addEventListener('keyup', keyUp);
  window.addEventListener('resize', windowResize);

  return { canvas, update, resize, setVisible, setZoom, resetView, handleKey, dispose };
}
