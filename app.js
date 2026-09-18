(() => {
  'use strict';


  const FURNITURE_CATALOG = [
    { type: 'bed', label: '單人床', w: 80, h: 190, height: 45, shape: 'rect' },
    { type: 'wardrobe', label: '衣櫃', w: 81, h: 59, height: 204, shape: 'rect' },
    { type: 'desk', label: '書桌', w: 140, h: 65, height: 75, shape: 'rect' },
    { type: 'drawer', label: '五層收納櫃', w: 50, h: 20, height: 100, shape: 'rect' },
    { type: 'chair', label: '辦公椅', w: 58, h: 58, height: 90, shape: 'rect' },
    { type: 'fan', label: '電風扇', w: 34, h: 34, height: 50, shape: 'circle' },
  ];

  const WALLPAPERS = [
    { id: 'warm-white', label: '暖白', color: '#EDEAE3' },
    { id: 'sand', label: '沙米', color: '#D8C9AE' },
    { id: 'sage', label: '鼠尾草綠', color: '#8A9A80' },
    { id: 'sky', label: '霧藍', color: '#93A8B8' },
    { id: 'clay', label: '陶土橘', color: '#B97A56' },
    { id: 'blush', label: '淺粉', color: '#DEC4C0' },
    { id: 'navy', label: '深藍', color: '#33475B' },
    { id: 'charcoal', label: '炭灰', color: '#4B4B4E' },
  ];

  const FLOORS = [
    { id: 'oak', label: '淺橡木', cls: 'floor-oak' },
    { id: 'walnut', label: '胡桃木', cls: 'floor-walnut' },
    { id: 'herringbone', label: '人字拼', cls: 'floor-herringbone' },
    { id: 'tile', label: '灰石磚', cls: 'floor-tile' },
    { id: 'concrete', label: '水泥自流平', cls: 'floor-concrete' },
    { id: 'carpet', label: '淺灰地毯', cls: 'floor-carpet' },
  ];

  const WALLS = [
    { key: 'top', label: '上', icon: 'ph-arrow-up' },
    { key: 'right', label: '右', icon: 'ph-arrow-right' },
    { key: 'bottom', label: '下', icon: 'ph-arrow-down' },
    { key: 'left', label: '左', icon: 'ph-arrow-left' },
  ];

  const WALLPAPER_MAP = Object.fromEntries(WALLPAPERS.map((w) => [w.id, w]));
  const FLOOR_MAP = Object.fromEntries(FLOORS.map((f) => [f.id, f]));

  // Hand-drawn top-down furniture illustrations, one gradient palette shared across the set.
  // Each viewBox matches the item's real cm footprint, so proportions are true to scale.
  const FURNITURE_ICONS = {
    bed: `<svg viewBox="0 0 80 190" preserveAspectRatio="none">
      <defs>
        <linearGradient id="bedWood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#e7c197"/><stop offset="1" stop-color="#b8834f"/>
        </linearGradient>
        <linearGradient id="bedDuvet" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#aabb9a"/><stop offset="1" stop-color="#84957a"/>
        </linearGradient>
      </defs>
      <rect x="4" y="13" width="72" height="175" rx="5" fill="#f7f2e7" stroke="#d8cfb9" stroke-width="0.8"/>
      <rect x="2" y="1" width="76" height="12" rx="3" fill="url(#bedWood)" stroke="#8a5a2e" stroke-width="0.8"/>
      <rect x="7" y="17" width="29" height="32" rx="9" fill="#fffdf8" stroke="#d8cfb9" stroke-width="0.8"/>
      <rect x="44" y="17" width="29" height="32" rx="9" fill="#fffdf8" stroke="#d8cfb9" stroke-width="0.8"/>
      <path d="M15 31 Q22 35 29 31" fill="none" stroke="#d8cfb9" stroke-width="0.8"/>
      <path d="M52 31 Q59 35 66 31" fill="none" stroke="#d8cfb9" stroke-width="0.8"/>
      <rect x="4" y="60" width="72" height="128" rx="6" fill="url(#bedDuvet)"/>
      <path d="M4 60 H27 L4 83 Z" fill="#f7f2e7" stroke="#c9c0a8" stroke-width="0.6"/>
      <path d="M8 102 H72" stroke="#697a5e" stroke-width="1" opacity="0.55"/>
      <path d="M8 144 H72" stroke="#697a5e" stroke-width="1" opacity="0.55"/>
    </svg>`,
    wardrobe: `<svg viewBox="0 0 81 59" preserveAspectRatio="none">
      <defs>
        <linearGradient id="wardWood" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#e7c197"/><stop offset="1" stop-color="#b8834f"/>
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="79" height="57" rx="3" fill="url(#wardWood)" stroke="#8a5a2e" stroke-width="1"/>
      <rect x="5" y="5" width="33" height="49" rx="2" fill="none" stroke="#8a5a2e" stroke-width="0.8" opacity="0.55"/>
      <rect x="43" y="5" width="33" height="49" rx="2" fill="none" stroke="#8a5a2e" stroke-width="0.8" opacity="0.55"/>
      <line x1="40.5" y1="3" x2="40.5" y2="56" stroke="#7a4d24" stroke-width="1.4"/>
      <rect x="35.4" y="27" width="2.8" height="8" rx="1.4" fill="#e4e4e7" stroke="#8a8a92" stroke-width="0.5"/>
      <rect x="42.8" y="27" width="2.8" height="8" rx="1.4" fill="#e4e4e7" stroke="#8a8a92" stroke-width="0.5"/>
    </svg>`,
    desk: `<svg viewBox="0 0 140 65" preserveAspectRatio="none">
      <defs>
        <linearGradient id="deskWood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#e7c197"/><stop offset="1" stop-color="#c99b6a"/>
        </linearGradient>
        <linearGradient id="deskScreen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#3b5a7a"/><stop offset="1" stop-color="#1f2933"/>
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="138" height="63" rx="4" fill="url(#deskWood)" stroke="#8a5a2e" stroke-width="0.8"/>
      <rect x="27" y="6" width="37" height="24" rx="2" fill="url(#deskScreen)" stroke="#52525b" stroke-width="1.2"/>
      <rect x="76" y="6" width="37" height="24" rx="2" fill="url(#deskScreen)" stroke="#52525b" stroke-width="1.2"/>
      <rect x="43" y="30" width="6" height="5" fill="#52525b"/>
      <rect x="92" y="30" width="6" height="5" fill="#52525b"/>
      <rect x="37" y="42" width="52" height="14" rx="2" fill="#e8e6e1" stroke="#a1a1aa" stroke-width="0.8"/>
      <rect x="98" y="44" width="10" height="16" rx="5" fill="#e8e6e1" stroke="#a1a1aa" stroke-width="0.8"/>
    </svg>`,
    drawer: `<svg viewBox="0 0 50 20" preserveAspectRatio="none">
      <defs>
        <linearGradient id="drawWood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#e7c197"/><stop offset="1" stop-color="#b8834f"/>
        </linearGradient>
      </defs>
      <rect x="0.6" y="0.6" width="48.8" height="18.8" rx="1.5" fill="url(#drawWood)" stroke="#8a5a2e" stroke-width="0.6"/>
      ${[4, 8, 12, 16].map((y) => `<line x1="2" y1="${y}" x2="48" y2="${y}" stroke="#8a5a2e" stroke-width="0.5" opacity="0.6"/>`).join('')}
      ${[2, 6, 10, 14, 18].map((cy) => `<rect x="23" y="${cy - 0.6}" width="4" height="1.2" rx="0.6" fill="#e4e4e7" stroke="#8a8a92" stroke-width="0.25"/>`).join('')}
    </svg>`,
    chair: `<svg viewBox="0 0 58 58" preserveAspectRatio="none">
      <defs>
        <linearGradient id="chairBack" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#5c6b80"/><stop offset="1" stop-color="#3d4a5c"/>
        </linearGradient>
        <linearGradient id="chairSeat" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#6b7a8f"/><stop offset="1" stop-color="#4a5568"/>
        </linearGradient>
      </defs>
      <rect x="9" y="3" width="40" height="17" rx="8" fill="url(#chairBack)" stroke="#2f3946" stroke-width="1"/>
      <rect x="7" y="19" width="44" height="34" rx="12" fill="url(#chairSeat)" stroke="#2f3946" stroke-width="1"/>
      <line x1="29" y1="6" x2="29" y2="17" stroke="#2f3946" stroke-width="0.8" opacity="0.5"/>
      <circle cx="29" cy="36" r="4" fill="none" stroke="#2f3946" stroke-width="0.8" opacity="0.5"/>
      <circle cx="29" cy="36" r="1.8" fill="#71717a"/>
    </svg>`,
    fan: `<svg viewBox="0 0 34 34" preserveAspectRatio="none">
      <defs>
        <radialGradient id="fanBody" cx="50%" cy="50%" r="60%">
          <stop offset="0" stop-color="#f4f4f5"/><stop offset="1" stop-color="#c7ccd1"/>
        </radialGradient>
      </defs>
      <circle cx="17" cy="17" r="16.2" fill="url(#fanBody)" stroke="#9a9aa2" stroke-width="1"/>
      <g stroke="#9a9aa2" stroke-width="0.6" opacity="0.7">
        <line x1="17" y1="2" x2="17" y2="32"/><line x1="2" y1="17" x2="32" y2="17"/>
        <line x1="6.4" y1="6.4" x2="27.6" y2="27.6"/><line x1="27.6" y1="6.4" x2="6.4" y2="27.6"/>
      </g>
      <path d="M17 17 L17 6 A11 11 0 0 1 26.5 12 Z" fill="#93a4b8" opacity="0.85"/>
      <path d="M17 17 L26.5 22 A11 11 0 0 1 17 28 Z" fill="#93a4b8" opacity="0.7"/>
      <path d="M17 17 L7.5 22 A11 11 0 0 0 17 28 Z" fill="#93a4b8" opacity="0.55"/>
      <circle cx="17" cy="17" r="3.4" fill="#4b5563" stroke="#33383f" stroke-width="0.6"/>
    </svg>`,
  };

  const DEFAULT_STATE = {
    room: { width: 243, depth: 264, height: 240, wallThickness: 10 },
    wallpaper: 'warm-white',
    floor: 'oak',
    door: { wall: 'top', pos: 15, width: 80, height: 200, angle: 90, hinge: 'start', swing: 'inward' },
    window: { wall: 'bottom', pos: 55, width: 140 },
    items: [
      { id: 'wardrobe-1', type: 'wardrobe', label: '衣櫃', w: 81, h: 59, height: 204, shape: 'rect', x: 10, y: 10, rot: 0 },
      { id: 'drawer-1', type: 'drawer', label: '五層收納櫃', w: 50, h: 20, height: 100, shape: 'rect', x: 100, y: 10, rot: 0 },
      { id: 'bed-1', type: 'bed', label: '單人床', w: 80, h: 190, height: 45, shape: 'rect', x: 153, y: 10, rot: 0 },
      { id: 'fan-1', type: 'fan', label: '電風扇', w: 34, h: 34, height: 50, shape: 'circle', x: 12, y: 212, rot: 0 },
      { id: 'chair-1', type: 'chair', label: '辦公椅', w: 58, h: 58, height: 90, shape: 'rect', x: 96, y: 172, rot: 0 },
      { id: 'desk-1', type: 'desk', label: '書桌', w: 140, h: 65, height: 75, shape: 'rect', x: 60, y: 188, rot: 0 },
    ],
    selectedId: null,
  };

  let state = structuredClone(DEFAULT_STATE);
  let zoom = 1;
  let justAddedId = null;
  let viewMode = '2d';
  let snapDragToGrid = true;
  let panX2D = 0;
  let panY2D = 0;
  let zoomFrame = null;
  let panDrag = null;
  let suppressPanClick = false;
  let preview3D = null;
  let previewLoad = null;
  let previewError = '';

  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
  const debounce = (fn, ms) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  };
  const wallIsHorizontal = (wall) => wall === 'top' || wall === 'bottom';
  const wallLength = (wall) => (wallIsHorizontal(wall) ? state.room.width : state.room.depth);
  const itemFootprint = (item) => (item.rot === 90 ? { w: item.h, h: item.w } : { w: item.w, h: item.h });
  const snapCm = (value, step = 5) => Math.round(value / step) * step;

  function itemsOverlap(a, b) {
    const af = itemFootprint(a);
    const bf = itemFootprint(b);
    // Ignore floating-point noise where measured decimal edges merely touch.
    return a.id !== b.id && a.x < b.x + bf.w - 1e-6 && a.x + af.w > b.x + 1e-6
      && a.y < b.y + bf.h - 1e-6 && a.y + af.h > b.y + 1e-6;
  }

  function setItemPosition(item, x, y, { snap = false } = {}) {
    const { w, h } = itemFootprint(item);
    item.x = +clamp(snap ? snapCm(x) : x, 0, Math.max(0, state.room.width - w)).toFixed(1);
    item.y = +clamp(snap ? snapCm(y) : y, 0, Math.max(0, state.room.depth - h)).toFixed(1);
  }

  function itemOutsideRoom(item) {
    const { w, h } = itemFootprint(item);
    return item.x + w > state.room.width + 1e-6 || item.y + h > state.room.depth + 1e-6 || item.height > state.room.height;
  }

  function updatePlacementFeedback() {
    // ponytail: pairwise checks suit a roomful of furniture; use a spatial index for hundreds of items.
    const overlapping = new Set(state.items.filter((a) => state.items.some((b) => itemsOverlap(a, b))).map((item) => item.id));
    document.querySelectorAll('#room-stage [data-id]').forEach((el) => {
      const item = state.items.find((entry) => entry.id === el.dataset.id);
      el.classList.toggle('is-overlapping', overlapping.has(item.id));
      el.classList.toggle('is-outside', itemOutsideRoom(item));
    });
    const status = document.getElementById('item-placement-status');
    const item = state.items.find((entry) => entry.id === state.selectedId);
    status.hidden = !item;
    const warnings = [];
    if (item && itemOutsideRoom(item)) warnings.push('超出房間尺寸');
    if (overlapping.has(state.selectedId)) warnings.push('與其他家具重疊');
    status.querySelector('i').className = warnings.length ? 'ph ph-warning' : 'ph ph-check-circle';
    status.querySelector('span').textContent = warnings.join('；') || '位置正常';
  }

  function layoutBounds() {
    const doorBounds = doorPlanBounds();
    const bounds = {
      width: Math.max(state.room.width, doorBounds.maxX),
      depth: Math.max(state.room.depth, doorBounds.maxY),
      height: Math.max(state.room.height, state.door.height),
      minX: Math.min(0, doorBounds.minX), minY: Math.min(0, doorBounds.minY),
    };
    for (const item of state.items) {
      const { w, h } = itemFootprint(item);
      bounds.width = Math.max(bounds.width, item.x + w);
      bounds.depth = Math.max(bounds.depth, item.y + h);
      bounds.height = Math.max(bounds.height, item.height);
    }
    bounds.width -= bounds.minX;
    bounds.depth -= bounds.minY;
    return bounds;
  }

  function computeScale() {
    const wrap = document.getElementById('canvas-wrap');
    const bounds = layoutBounds();
    const availW = Math.max(120, wrap.clientWidth - (wrap.clientWidth < 480 ? 64 : 128));
    const availH = Math.max(120, wrap.clientHeight - 128);
    const fit = Math.min(availW / (bounds.width + state.room.wallThickness * 2),
      availH / (bounds.depth + state.room.wallThickness * 2));
    return fit * zoom;
  }

  function clampAllToRoom() {
    state.items.forEach((it) => setItemPosition(it, it.x, it.y));
    ['door', 'window'].forEach((k) => {
      const cfg = state[k];
      const len = wallLength(cfg.wall);
      cfg.width = Math.min(cfg.width, len);
      cfg.pos = clamp(cfg.pos, 0, Math.max(0, len - cfg.width));
    });
    state.door.height = Math.min(state.door.height, state.room.height);
  }

  // ---------- Room canvas ----------

  // Plan coordinates: x right, y down; along-wall starts left (top/bottom) or top (left/right).
  // The hinge is on the inner wall plane. The 3.5 cm leaf thickness is illustrative.
  function doorPlan(angle = state.door.angle) {
    const cfg = state.door;
    const horizontal = wallIsHorizontal(cfg.wall);
    const tangent = horizontal ? { x: 1, y: 0 } : { x: 0, y: 1 };
    const normal = {
      top: { x: 0, y: 1 }, bottom: { x: 0, y: -1 },
      left: { x: 1, y: 0 }, right: { x: -1, y: 0 },
    }[cfg.wall];
    const along = cfg.pos + (cfg.hinge === 'end' ? cfg.width : 0);
    const hinge = horizontal
      ? { x: along, y: cfg.wall === 'bottom' ? state.room.depth : 0 }
      : { x: cfg.wall === 'right' ? state.room.width : 0, y: along };
    const sign = cfg.hinge === 'end' ? -1 : 1;
    const direction = cfg.swing === 'outward' ? -1 : 1;
    const radians = angle * Math.PI / 180;
    const dx = tangent.x * sign * Math.cos(radians) + normal.x * direction * Math.sin(radians);
    const dy = tangent.y * sign * Math.cos(radians) + normal.y * direction * Math.sin(radians);
    return {
      hinge,
      closedTip: { x: hinge.x + tangent.x * sign * cfg.width, y: hinge.y + tangent.y * sign * cfg.width },
      tip: { x: hinge.x + dx * cfg.width, y: hinge.y + dy * cfg.width },
      rotation: Math.atan2(dy, dx) * 180 / Math.PI,
      sweep: (tangent.x * normal.y - tangent.y * normal.x) * sign * direction > 0 ? 1 : 0,
      perpendicularReach: Math.abs(cfg.width * Math.sin(radians)),
    };
  }

  function doorPlanBounds() {
    const plan = doorPlan();
    const points = [plan.hinge, plan.closedTip, plan.tip];
    if (state.door.angle >= 90) points.push(doorPlan(90).tip);
    return {
      minX: Math.min(...points.map((p) => p.x)) - 2,
      minY: Math.min(...points.map((p) => p.y)) - 2,
      maxX: Math.max(...points.map((p) => p.x)) + 2,
      maxY: Math.max(...points.map((p) => p.y)) + 2,
    };
  }

  function buildDoorPlan(scale, roomWpx, roomDpx) {
    const cfg = state.door;
    const plan = doorPlan();
    const wall = state.room.wallThickness;
    const point = (p) => `${p.x + wall} ${p.y + wall}`;
    const horizontal = wallIsHorizontal(cfg.wall);
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('door-plan');
    svg.setAttribute('width', roomWpx);
    svg.setAttribute('height', roomDpx);
    svg.setAttribute('viewBox', `0 0 ${roomWpx / scale} ${roomDpx / scale}`);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', `門寬 ${cfg.width} 公分，開啟 ${cfg.angle} 度，${cfg.swing === 'inward' ? '內開' : '外開'}`);
    const label = doorPlan(cfg.angle / 2).tip;
    const labelX = plan.hinge.x + (label.x - plan.hinge.x) * .65 + wall;
    const labelY = plan.hinge.y + (label.y - plan.hinge.y) * .65 + wall;
    const gapX = horizontal ? wall + cfg.pos : cfg.wall === 'right' ? wall + state.room.width : 0;
    const gapY = horizontal ? cfg.wall === 'bottom' ? wall + state.room.depth : 0 : wall + cfg.pos;
    svg.innerHTML = `<rect class="door-gap" x="${gapX}" y="${gapY}" width="${horizontal ? cfg.width : wall}" height="${horizontal ? wall : cfg.width}"/>
      <path class="door-sweep" d="M ${point(plan.closedTip)} A ${cfg.width} ${cfg.width} 0 0 ${plan.sweep} ${point(plan.tip)}"/>
      <path class="door-leaf-plan" d="M ${point(plan.hinge)} L ${point(plan.tip)}"/>
      <circle class="door-hinge-plan" cx="${plan.hinge.x + wall}" cy="${plan.hinge.y + wall}" r="2.5"/>
      <text x="${labelX}" y="${labelY}" style="font-size:${12 / scale}px">${cfg.angle}°</text>`;
    return svg;
  }


  function buildOpening(kind, cfg, scale, roomWpx, roomDpx) {
    if (kind === 'door') return buildDoorPlan(scale, roomWpx, roomDpx);
    const el = document.createElement('div');
    el.style.position = 'absolute';
    const lengthPx = cfg.width * scale;
    const horizontal = wallIsHorizontal(cfg.wall);
    const wall = state.room.wallThickness * scale;

    el.className = 'window-glass';

    if (horizontal) {
      el.style.left = wall + cfg.pos * scale + 'px';
      el.style.width = lengthPx + 'px';
      el.style.height = wall + 'px';
      el.style.top = cfg.wall === 'top' ? '0px' : roomDpx - wall + 'px';
    } else {
      el.style.top = wall + cfg.pos * scale + 'px';
      el.style.height = lengthPx + 'px';
      el.style.width = wall + 'px';
      el.style.left = cfg.wall === 'left' ? '0px' : roomWpx - wall + 'px';
    }

    if (kind === 'window') {
      const mullion = document.createElement('div');
      mullion.style.position = 'absolute';
      mullion.style.background = 'color-mix(in oklab, #0369a1 55%, transparent)';
      if (horizontal) {
        mullion.style.left = '50%';
        mullion.style.top = '0';
        mullion.style.bottom = '0';
        mullion.style.width = '1px';
      } else {
        mullion.style.top = '50%';
        mullion.style.left = '0';
        mullion.style.right = '0';
        mullion.style.height = '1px';
      }
      el.appendChild(mullion);
    }


    return el;
  }

  function buildItemEl(item, scale) {
    const { w: wCm, h: hCm } = itemFootprint(item);
    const el = document.createElement('div');
    el.className = 'furniture-piece' + (item.id === state.selectedId ? ' is-selected' : '') + (item.id === justAddedId ? ' is-new' : '');
    el.style.left = (state.room.wallThickness + item.x) * scale + 'px';
    el.style.top = (state.room.wallThickness + item.y) * scale + 'px';
    el.style.width = wCm * scale + 'px';
    el.style.height = hCm * scale + 'px';
    el.style.borderRadius = item.shape === 'circle' ? '9999px' : '6px';
    el.dataset.id = item.id;
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', `${item.label}，位置 X ${item.x} Y ${item.y} 公分，可拖曳或用方向鍵移動`);

    const icon = document.createElement('div');
    icon.className = 'piece-icon icon-fill';
    icon.style.width = item.w * scale + 'px';
    icon.style.height = item.h * scale + 'px';
    icon.style.transform = `translate(-50%, -50%) rotate(${item.rot}deg)`;
    icon.innerHTML = FURNITURE_ICONS[item.type] || '';
    el.appendChild(icon);

    if (hCm * scale >= 22) {
      const label = document.createElement('div');
      label.className = 'piece-label';
      label.textContent = item.label;
      el.appendChild(label);
    }

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      selectItemLight(item.id, el);
    });
    el.addEventListener('keydown', (e) => handleItemKeydown(e, item));
    attachDrag(el, item);

    return el;
  }

  // Selects without rebuilding the room DOM, so the element mid-drag never gets swapped out from under the pointer.
  function selectItemLight(id, el) {
    if (state.selectedId === id) return;
    const prev = document.querySelector('.furniture-piece.is-selected');
    if (prev) prev.classList.remove('is-selected');
    if (el) el.classList.add('is-selected');
    state.selectedId = id;
    renderInspector();
  }

  function attachDrag(el, item) {
    el.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      e.preventDefault();
      el.focus(); // preventDefault above suppresses the browser's implicit focus-on-pointerdown
      selectItemLight(item.id, el);
      try { el.setPointerCapture(e.pointerId); } catch { /* not all pointer environments support capture */ }
      const scale = computeScale();
      const startX = e.clientX;
      const startY = e.clientY;
      const origX = item.x;
      const origY = item.y;

      const onMove = (ev) => {
        setItemPosition(item, origX + (ev.clientX - startX) / scale, origY + (ev.clientY - startY) / scale, { snap: snapDragToGrid });
        el.style.left = (state.room.wallThickness + item.x) * scale + 'px';
        el.style.top = (state.room.wallThickness + item.y) * scale + 'px';
        syncItemInputs();
        el.setAttribute('aria-label', `${item.label}，位置 X ${item.x} Y ${item.y} 公分，可拖曳或用方向鍵移動`);
        updatePlacementFeedback();
      };
      const onUp = () => {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        document.removeEventListener('pointercancel', onUp);
      };
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp, { once: true });
      document.addEventListener('pointercancel', onUp, { once: true });
    });
  }

  function handleItemKeydown(e, item) {
    const step = e.shiftKey ? 10 : 1;
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        selectItem(item.id);
        return;
      case 'ArrowLeft': setItemPosition(item, item.x - step, item.y); break;
      case 'ArrowRight': setItemPosition(item, item.x + step, item.y); break;
      case 'ArrowUp': setItemPosition(item, item.x, item.y - step); break;
      case 'ArrowDown': setItemPosition(item, item.x, item.y + step); break;
      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        deleteItem(item.id);
        return;
      case 'r':
      case 'R':
        e.preventDefault();
        rotateItem(item.id);
        return;
      default:
        return;
    }
    e.preventDefault();
    state.selectedId = item.id;
    renderRoom();
    renderInspector();
  }

  function buildDimLabel(text, style) {
    const el = document.createElement('div');
    el.className = 'absolute rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] px-2 py-0.5 text-[10px] font-[var(--font-mono)] tabular-nums text-[var(--color-muted)] shadow-sm whitespace-nowrap';
    Object.assign(el.style, style);
    el.textContent = text;
    return el;
  }

  function render2DRoom() {
    const scale = computeScale();
    const wall = state.room.wallThickness * scale;
    const bounds = layoutBounds();
    const w = state.room.width * scale + wall * 2;
    const d = state.room.depth * scale + wall * 2;
    const stage = document.getElementById('room-stage');
    stage.style.width = bounds.width * scale + wall * 2 + 'px';
    stage.style.height = bounds.depth * scale + wall * 2 + 'px';
    const content = document.createElement('div');
    content.className = 'room-2d-content';
    Object.assign(content.style, { position: 'absolute', left: -bounds.minX * scale + 'px',
      top: -bounds.minY * scale + 'px', width: w + 'px', height: d + 'px' });
    stage.appendChild(content);

    const wallBox = document.createElement('div');
    wallBox.className = 'absolute rounded-sm';
    wallBox.style.width = w + 'px';
    wallBox.style.height = d + 'px';
    wallBox.style.background = WALLPAPER_MAP[state.wallpaper].color;
    content.appendChild(wallBox);

    const floor = document.createElement('div');
    floor.className = 'room-2d-floor absolute ' + FLOOR_MAP[state.floor].cls;
    floor.style.left = wall + 'px';
    floor.style.top = wall + 'px';
    floor.style.width = state.room.width * scale + 'px';
    floor.style.height = state.room.depth * scale + 'px';
    content.appendChild(floor);

    content.appendChild(buildOpening('door', state.door, scale, w, d));
    content.appendChild(buildOpening('window', state.window, scale, w, d));

    state.items.forEach((item) => content.appendChild(buildItemEl(item, scale)));

    content.appendChild(buildDimLabel(`${state.room.width} cm`, { left: w / 2 + 'px', top: d + 10 + 'px', transform: 'translateX(-50%)' }));
    content.appendChild(buildDimLabel(`${state.room.depth} cm`, { top: d / 2 + 'px', left: w + 10 + 'px', transform: 'translateY(-50%)' }));

  }

  function finishPanDrag() {
    if (!panDrag) return;
    const stage = document.getElementById('room-stage');
    const { pointerId, moved } = panDrag;
    panDrag = null;
    suppressPanClick = moved;
    stage.classList.remove('is-panning');
    if (stage.hasPointerCapture(pointerId)) stage.releasePointerCapture(pointerId);
  }

  function setViewZoom(value) {
    zoom = clamp(value, 0.25, 4);
    if (viewMode === '3d' && preview3D) {
      preview3D.setZoom(zoom);
      document.getElementById('zoom-label').textContent = Math.round(zoom * 100) + '%';
    } else {
      renderRoom();
    }
  }

  function wireViewportControls() {
    const stage = document.getElementById('room-stage');
    const canvas = document.getElementById('canvas-wrap');
    canvas.addEventListener('pointerdown', (event) => {
      if (viewMode !== '2d' || event.button !== 1 || !event.isPrimary || panDrag
        || event.target.closest('#view-toolbar')) return;
      event.preventDefault();
      suppressPanClick = false;
      panDrag = { pointerId: event.pointerId, x: event.clientX, y: event.clientY,
        panX: panX2D, panY: panY2D, moved: false };
    });
    document.addEventListener('pointermove', (event) => {
      if (!panDrag || event.pointerId !== panDrag.pointerId) return;
      const dx = event.clientX - panDrag.x, dy = event.clientY - panDrag.y;
      if (!panDrag.moved && Math.hypot(dx, dy) < 4) return;
      if (!panDrag.moved) {
        panDrag.moved = true;
        stage.setPointerCapture(event.pointerId);
        stage.focus({ preventScroll: true });
        stage.classList.add('is-panning');
      }
      event.preventDefault();
      panX2D = panDrag.panX + dx;
      panY2D = panDrag.panY + dy;
      stage.style.translate = `${panX2D}px ${panY2D}px`;
    });
    for (const type of ['pointerup', 'pointercancel']) {
      document.addEventListener(type, (event) => {
        if (panDrag?.pointerId === event.pointerId) finishPanDrag();
      });
    }
    stage.addEventListener('lostpointercapture', finishPanDrag);
    window.addEventListener('blur', finishPanDrag);
    stage.addEventListener('click', (event) => {
      if (!suppressPanClick || event.detail === 0) return;
      suppressPanClick = false;
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);
    canvas.addEventListener('auxclick', (event) => {
      if (event.button === 1) event.preventDefault();
    });
    canvas.addEventListener('wheel', (event) => {
      if (viewMode !== '2d' || event.ctrlKey || event.target.closest('#view-toolbar')) return;
      event.preventDefault();
      if (panDrag || event.deltaY === 0) return;
      const pixels = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? canvas.clientHeight : 1);
      zoom = clamp(zoom * Math.exp(-pixels * 0.0015), 0.25, 4);
      if (zoomFrame !== null) return;
      zoomFrame = requestAnimationFrame(() => {
        zoomFrame = null;
        renderRoom();
      });
    }, { passive: false });
    stage.addEventListener('keydown', (event) => {
      if (event.target !== stage) return;
      if (event.key === '+' || event.key === '=' || event.key === '-') {
        event.preventDefault();
        setViewZoom(+(zoom + (event.key === '-' ? -0.1 : 0.1)).toFixed(2));
        return;
      }
      if (viewMode === '3d') {
        preview3D?.handleKey(event);
        return;
      }
      if (event.altKey && event.key.startsWith('Arrow')) {
        if (event.key === 'ArrowLeft') panX2D -= 20;
        if (event.key === 'ArrowRight') panX2D += 20;
        if (event.key === 'ArrowUp') panY2D -= 20;
        if (event.key === 'ArrowDown') panY2D += 20;
      } else if (event.key === 'Home') {
        panX2D = 0;
        panY2D = 0;
      } else return;
      event.preventDefault();
      stage.style.translate = `${panX2D}px ${panY2D}px`;
    });
    window.addEventListener('pagehide', (event) => {
      if (!event.persisted) preview3D?.dispose();
    });
  }

  function render3DRoom() {
    const stage = document.getElementById('room-stage');
    const canvas = document.getElementById('canvas-wrap');
    const width = Math.max(120, canvas.clientWidth - 32);
    const height = Math.max(180, canvas.clientHeight - 116);
    stage.style.width = width + 'px';
    stage.style.height = height + 'px';
    stage.setAttribute('aria-busy', String(!preview3D && !previewError));
    if (!preview3D || previewError) {
      const message = document.createElement('p');
      message.className = 'preview-message';
      message.textContent = previewError || '正在載入 Three.js 3D 預覽…';
      stage.replaceChildren(message);
      if (!previewLoad && !previewError) {
        previewLoad = import('./room-three.js').then(({ createRoomPreview }) => {
          preview3D = createRoomPreview(stage, {
            onSelect: selectItem,
            onZoom: (value) => {
              if (viewMode !== '3d') return;
              zoom = value;
              document.getElementById('zoom-label').textContent = Math.round(zoom * 100) + '%';
            },
            onError: (message) => {
              previewError = message;
              if (viewMode === '3d') renderRoom();
            },
          });
          if (viewMode === '3d') renderRoom();
          else preview3D.setVisible(false);
        }).catch(() => {
          previewError = '無法啟動 3D 預覽。請確認網路連線與瀏覽器 WebGL 2 支援後重新整理；仍可使用 2D 編輯。';
          if (viewMode === '3d') renderRoom();
        }).finally(() => { previewLoad = null; });
      }
      return;
    }
    const caption = buildDimLabel(`${state.room.width} × ${state.room.depth} cm · 高 ${state.room.height} cm`, {
      left: '50%', bottom: '0', transform: 'translateX(-50%)', pointerEvents: 'none',
    });
    stage.replaceChildren(preview3D.canvas, caption);
    preview3D.resize(width, height);
    preview3D.update(state, {
      bounds: layoutBounds(), doorPlan: doorPlan(), wallColor: WALLPAPER_MAP[state.wallpaper].color, zoom,
      overlappingIds: state.items.filter((a) => state.items.some((b) => itemsOverlap(a, b))).map((item) => item.id),
      outsideIds: state.items.filter(itemOutsideRoom).map((item) => item.id),
    });
    preview3D.setVisible(true);
  }

  function renderRoom() {
    finishPanDrag();
    const focusedId = document.activeElement?.closest('[data-id]')?.dataset.id;
    const stage = document.getElementById('room-stage');
    preview3D?.setVisible(false);
    stage.replaceChildren();
    stage.style.translate = viewMode === '2d' ? `${panX2D}px ${panY2D}px` : 'none';
    stage.setAttribute('aria-busy', 'false');
    stage.classList.toggle('is-3d', viewMode === '3d');
    stage.tabIndex = 0;
    stage.setAttribute('role', 'group');
    stage.setAttribute('aria-label', viewMode === '3d' ? '3D 房間視角，方向鍵旋轉，Alt 加方向鍵平移，Home 還原' : '2D 房間平面，Alt 加方向鍵平移，Home 還原');
    stage.setAttribute('aria-describedby', 'room-view-status');
    if (viewMode === '3d') render3DRoom();
    else render2DRoom();
    updatePlacementFeedback();
    justAddedId = null;
    document.getElementById('zoom-label').textContent = Math.round(zoom * 100) + '%';
    document.getElementById('btn-view-2d').setAttribute('aria-pressed', String(viewMode === '2d'));
    document.getElementById('btn-view-3d').setAttribute('aria-pressed', String(viewMode === '3d'));
    document.getElementById('btn-snap-grid').setAttribute('aria-pressed', String(snapDragToGrid));
    document.getElementById('btn-snap-grid').disabled = viewMode === '3d';
    const reset = document.getElementById('btn-zoom-reset');
    reset.setAttribute('aria-label', '重設視角、平移與縮放');
    reset.title = '重設視角、平移與縮放';
    document.getElementById('room-view-status').textContent = viewMode === '2d'
      ? '2D 依公分等比繪製。滾輪縮放，按住滾輪拖曳平移；Alt＋方向鍵平移，Home 還原。'
      : previewError || '左鍵／單指拖曳旋轉，滾輪縮放，按住滾輪拖曳平移。方向鍵旋轉、Alt＋方向鍵平移、Home 還原；家具清單也可鍵盤選取。';
    if (focusedId) {
      const focused = [...document.querySelectorAll('#room-stage [data-id]')].find((el) => el.dataset.id === focusedId);
      (focused || document.getElementById(`btn-view-${viewMode}`)).focus({ preventScroll: true });
    }
  }

  // ---------- Selection & mutation ----------

  function selectItem(id) {
    state.selectedId = id;
    renderRoom();
    renderInspector();
  }

  function deleteItem(id) {
    state.items = state.items.filter((i) => i.id !== id);
    if (state.selectedId === id) state.selectedId = null;
    renderRoom();
    renderInspector();
  }

  function moveItemLayer(id, target) {
    const index = state.items.findIndex((item) => item.id === id);
    if (index < 0 || viewMode !== '2d') return;
    target = clamp(target, 0, state.items.length - 1);
    if (target === index) return;
    // Array order is the 2D paint order and is already preserved by JSON export.
    const [item] = state.items.splice(index, 1);
    state.items.splice(target, 0, item);
    state.selectedId = id;
    renderRoom();
    renderInspector();
  }

  function rotateItem(id) {
    const item = state.items.find((i) => i.id === id);
    if (!item) return;
    item.rot = item.rot === 90 ? 0 : 90;
    setItemPosition(item, item.x, item.y);
    renderRoom();
    renderInspector();
  }

  function addItem(type) {
    const catalog = FURNITURE_CATALOG.find((f) => f.type === type);
    const count = state.items.filter((i) => i.type === type).length;
    const x = clamp(state.room.width / 2 - catalog.w / 2 + count * 15, 0, Math.max(0, state.room.width - catalog.w));
    const y = clamp(state.room.depth / 2 - catalog.h / 2 + count * 15, 0, Math.max(0, state.room.depth - catalog.h));
    const item = {
      id: crypto.randomUUID(), type, label: catalog.label,
      w: catalog.w, h: catalog.h, height: catalog.height, shape: catalog.shape,
      x, y, rot: 0,
    };
    setItemPosition(item, item.x, item.y);
    state.items.push(item);
    justAddedId = item.id;
    selectItem(item.id);
  }

  // ---------- Inspector ----------

  function syncItemInputs() {
    const item = state.items.find((i) => i.id === state.selectedId);
    if (!item) return;
    document.getElementById('input-item-x').value = item.x;
    document.getElementById('input-item-y').value = item.y;
  }

  function renderInspector() {
    const item = state.items.find((i) => i.id === state.selectedId);
    const roomSection = document.getElementById('room-settings-section');
    const itemSection = document.getElementById('item-inspector-section');
    renderFurnitureLayers();
    ['input-item-x', 'input-item-y', 'btn-rotate-item'].forEach((id) => {
      document.getElementById(id).disabled = viewMode === '3d';
    });
    updatePlacementFeedback();

    if (!item) {
      roomSection.classList.remove('hidden');
      itemSection.classList.add('hidden');
      return;
    }

    roomSection.classList.add('hidden');
    itemSection.classList.remove('hidden');
    const { w, h } = itemFootprint(item);
    document.getElementById('item-inspector-title').textContent = item.label;
    document.getElementById('item-inspector-dims').textContent = `佔地 ${w} × ${h} cm`;
    document.getElementById('input-item-width').value = item.w;
    document.getElementById('input-item-depth').value = item.h;
    document.getElementById('input-item-height').value = item.height;
    const xInput = document.getElementById('input-item-x');
    const yInput = document.getElementById('input-item-y');
    xInput.value = item.x;
    yInput.value = item.y;
    xInput.max = +Math.max(0, state.room.width - w).toFixed(1);
    yInput.max = +Math.max(0, state.room.depth - h).toFixed(1);
  }

  function refreshDoorWindowControls() {
    [
      { kind: 'door', picker: 'door-wall-picker', slider: 'input-door-pos', label: 'door-pos-label' },
      { kind: 'window', picker: 'window-wall-picker', slider: 'input-window-pos', label: 'window-pos-label' },
    ].forEach(({ kind, picker, slider, label }) => {
      const cfg = state[kind];
      document.querySelectorAll(`#${picker} .wall-pick-btn`).forEach((btn) => {
        btn.setAttribute('aria-pressed', String(btn.dataset.wall === cfg.wall));
      });
      const len = wallLength(cfg.wall);
      const sliderEl = document.getElementById(slider);
      sliderEl.min = 0;
      sliderEl.max = Math.max(0, len - cfg.width);
      sliderEl.value = cfg.pos;
      document.getElementById(label).textContent = `${+cfg.pos.toFixed(1)} cm`;
    });
    for (const key of ['width', 'height', 'angle', 'hinge', 'swing']) {
      document.getElementById(`input-door-${key}`).value = state.door[key];
    }
    document.getElementById('input-door-width').max = wallLength(state.door.wall);
    document.getElementById('input-door-height').max = state.room.height;
    const reach = +doorPlan().perpendicularReach.toFixed(1);
    document.getElementById('door-measurements').textContent =
      `角度 ${state.door.angle}° · 門寬／旋轉半徑 ${state.door.width} cm · 門高 ${state.door.height} cm · 垂直伸出 ${reach} cm`;
  }

  function syncRoomInputs() {
    for (const key of ['width', 'depth', 'height', 'wallThickness']) {
      document.getElementById(`input-room-${key}`).value = state.room[key];
    }
  }

  // ---------- Left panel: catalog / swatches ----------

  function renderFurnitureLayers() {
    const list = document.getElementById('furniture-layers');
    const active = document.activeElement;
    const focusId = active.closest('[data-layer-id]')?.dataset.layerId;
    const focusAction = active.dataset.layerAction;
    list.replaceChildren();
    for (let index = state.items.length - 1; index >= 0; index--) {
      const item = state.items[index];
      const selected = item.id === state.selectedId;
      const row = document.createElement('li');
      row.className = 'furniture-layer' + (selected ? ' is-selected' : '');
      row.dataset.layerId = item.id;
      row.draggable = viewMode === '2d';
      const select = document.createElement('button');
      select.type = 'button';
      select.className = 'layer-select';
      select.setAttribute('aria-pressed', String(selected));
      const grip = document.createElement('i');
      grip.className = 'ph ph-dots-six-vertical';
      grip.setAttribute('aria-hidden', 'true');
      grip.title = '拖曳調整層級';
      const thumb = document.createElement('span');
      thumb.className = 'layer-thumbnail icon-fill';
      thumb.setAttribute('aria-hidden', 'true');
      const scale = 36 / Math.max(item.w, item.h);
      thumb.style.width = item.w * scale + 'px';
      thumb.style.height = item.h * scale + 'px';
      thumb.innerHTML = FURNITURE_ICONS[item.type];
      const text = document.createElement('span');
      text.className = 'layer-label';
      const name = document.createElement('span');
      name.textContent = item.label;
      const size = document.createElement('small');
      size.textContent = `${item.w} × ${item.h} × ${item.height} cm`;
      text.append(name, size);
      select.append(grip, thumb, text);
      select.addEventListener('click', () => selectItem(item.id));
      row.appendChild(select);
      if (selected) {
        const actions = document.createElement('div');
        actions.className = 'layer-actions';
        for (const [action, label, target] of [
          ['up', '上移', index + 1], ['down', '下移', index - 1],
          ['front', '置頂', state.items.length - 1], ['back', '置底', 0],
        ]) {
          const button = document.createElement('button');
          button.type = 'button';
          button.dataset.layerAction = action;
          button.textContent = label;
          button.setAttribute('aria-label', `${label} ${item.label}`);
          button.disabled = viewMode !== '2d' || target < 0 || target >= state.items.length || target === index;
          button.addEventListener('click', () => moveItemLayer(item.id, target));
          actions.appendChild(button);
        }
        row.appendChild(actions);
      }
      row.addEventListener('dragstart', (event) => {
        event.dataTransfer.setData('text/plain', item.id);
        event.dataTransfer.effectAllowed = 'move';
      });
      row.addEventListener('dragover', (event) => {
        if (viewMode !== '2d') return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        row.dataset.drop = event.clientY < row.getBoundingClientRect().top + row.offsetHeight / 2 ? 'before' : 'after';
      });
      row.addEventListener('dragleave', () => { delete row.dataset.drop; });
      row.addEventListener('drop', (event) => {
        event.preventDefault();
        const id = event.dataTransfer.getData('text/plain');
        const from = state.items.findIndex((entry) => entry.id === id);
        const before = row.dataset.drop === 'before';
        delete row.dataset.drop;
        if (from < 0 || id === item.id) return;
        moveItemLayer(id, index + (before ? 1 : 0) - (from < index ? 1 : 0));
      });
      row.addEventListener('dragend', () => {
        list.querySelectorAll('[data-drop]').forEach((entry) => { delete entry.dataset.drop; });
      });
      list.appendChild(row);
    }
    if (!state.items.length) {
      const empty = document.createElement('li');
      empty.className = 'text-xs text-[var(--color-muted)]';
      empty.textContent = '尚無家具，展開「新增家具」加入。';
      list.appendChild(empty);
    }
    const index = state.items.findIndex((item) => item.id === state.selectedId);
    document.getElementById('item-layer-status').textContent = index < 0 ? ''
      : `第 ${index + 1} / ${state.items.length} 層（1 為底層）`;
    if (focusId) {
      const row = list.querySelector(`[data-layer-id="${CSS.escape(focusId)}"]`);
      const button = focusAction && row?.querySelector(`[data-layer-action="${focusAction}"]`);
      (button && !button.disabled ? button : row?.querySelector('.layer-select'))?.focus({ preventScroll: true });
    }
  }

  function renderCatalogPanel() {
    const container = document.getElementById('furniture-catalog');
    container.innerHTML = '';
    FURNITURE_CATALOG.forEach((f) => {
      const card = document.createElement('div');
      card.className = 'flex items-center gap-3 rounded-xl border border-[var(--color-border)] p-2.5 hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-surface-hover)] transition-colors';

      const thumbWrap = document.createElement('div');
      thumbWrap.className = 'shrink-0 flex items-center justify-center size-14 rounded-lg bg-[var(--color-canvas)]';
      const thumb = document.createElement('div');
      const s = Math.min(38 / f.w, 38 / f.h);
      thumb.className = 'relative';
      thumb.style.width = Math.max(10, f.w * s) + 'px';
      thumb.style.height = Math.max(10, f.h * s) + 'px';
      thumb.style.borderRadius = f.shape === 'circle' ? '9999px' : '4px';
      thumb.style.border = '1.5px solid color-mix(in oklab, var(--color-foreground) 30%, transparent)';
      thumb.style.background = '#f7f6f4';
      thumb.style.overflow = 'hidden';
      const thumbIcon = document.createElement('div');
      thumbIcon.className = 'absolute icon-fill';
      thumbIcon.style.inset = '0';
      thumbIcon.innerHTML = FURNITURE_ICONS[f.type] || '';
      thumb.appendChild(thumbIcon);
      thumbWrap.appendChild(thumb);

      const info = document.createElement('div');
      info.className = 'min-w-0 flex-1';
      info.innerHTML = `<p class="text-sm font-medium truncate">${f.label}</p><p class="text-xs text-[var(--color-muted)] font-[var(--font-mono)] tabular-nums">${f.w} × ${f.h} cm</p>`;

      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className = 'shrink-0 size-8 inline-flex items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-hover)] active:scale-95 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2';
      addBtn.setAttribute('aria-label', `加入 ${f.label}`);
      addBtn.innerHTML = '<i class="ph ph-plus"></i>';
      addBtn.addEventListener('click', () => addItem(f.type));

      card.append(thumbWrap, info, addBtn);
      container.appendChild(card);
    });
  }

  function renderWallpaperGrid() {
    const grid = document.getElementById('wallpaper-grid');
    grid.innerHTML = '';
    WALLPAPERS.forEach((w) => {
      const wrap = document.createElement('div');
      wrap.className = 'flex flex-col items-center gap-1';
      const btn = document.createElement('button');
      btn.type = 'button';
      const active = w.id === state.wallpaper;
      btn.setAttribute('aria-pressed', String(active));
      btn.className = 'relative aspect-square w-full rounded-lg border-2 transition-transform hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 ' + (active ? 'border-[var(--color-primary)]' : 'border-transparent');
      btn.style.background = w.color;
      if (active) btn.innerHTML = '<i class="ph ph-check-bold absolute inset-0 m-auto text-white drop-shadow" style="font-size:14px"></i>';
      btn.addEventListener('click', () => {
        state.wallpaper = w.id;
        renderRoom();
        renderWallpaperGrid();
      });
      const caption = document.createElement('span');
      caption.className = 'text-[10px] text-[var(--color-muted)] truncate w-full text-center';
      caption.textContent = w.label;
      wrap.append(btn, caption);
      grid.appendChild(wrap);
    });
  }

  function renderFloorGrid() {
    const grid = document.getElementById('floor-grid');
    grid.innerHTML = '';
    FLOORS.forEach((f) => {
      const wrap = document.createElement('div');
      wrap.className = 'flex flex-col items-center gap-1';
      const btn = document.createElement('button');
      btn.type = 'button';
      const active = f.id === state.floor;
      btn.setAttribute('aria-pressed', String(active));
      btn.className = `relative aspect-square w-full rounded-lg border-2 ${f.cls} transition-transform hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 ` + (active ? 'border-[var(--color-primary)]' : 'border-transparent');
      if (active) btn.innerHTML = '<i class="ph ph-check-bold absolute inset-0 m-auto text-[var(--color-primary)] drop-shadow" style="font-size:14px"></i>';
      btn.addEventListener('click', () => {
        state.floor = f.id;
        renderRoom();
        renderFloorGrid();
      });
      const caption = document.createElement('span');
      caption.className = 'text-[10px] text-[var(--color-muted)] truncate w-full text-center';
      caption.textContent = f.label;
      wrap.append(btn, caption);
      grid.appendChild(wrap);
    });
  }

  function buildWallPicker(containerId, kind) {
    const container = document.getElementById(containerId);
    WALLS.forEach((w) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.wall = w.key;
      btn.className = 'wall-pick-btn flex flex-col items-center gap-0.5 rounded-lg border border-[var(--color-border)] py-1.5 text-[10px] text-[var(--color-muted)] transition-colors active:scale-95 hover:bg-[var(--color-surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] aria-pressed:border-[var(--color-primary)] aria-pressed:text-[var(--color-primary)] aria-pressed:bg-[var(--color-primary)]/5';
      btn.innerHTML = `<i class="ph ${w.icon} text-sm"></i>${w.label}`;
      btn.addEventListener('click', () => {
        const cfg = state[kind];
        cfg.wall = w.key;
        const len = wallLength(w.key);
        cfg.width = Math.min(cfg.width, len);
        cfg.pos = clamp(cfg.pos, 0, Math.max(0, len - cfg.width));
        renderRoom();
        refreshDoorWindowControls();
      });
      container.appendChild(btn);
    });
  }

  // ---------- Wiring ----------

  function wireEvents() {
    wireViewportControls();
    document.querySelectorAll('#panel-left, #panel-right').forEach((panel) => {
      panel.addEventListener('keydown', (event) => {
        // Keep native control keys out of Preline's global dialog shortcuts.
        // Tab and Escape still reach its focus trap and dismiss handler.
        if (event.key !== 'Tab' && event.key !== 'Escape'
          && event.target.matches('input, select, summary, button:not([data-hs-overlay])')) {
          event.stopPropagation();
        }
      });
    });
    ['2d', '3d'].forEach((mode) => {
      document.getElementById(`btn-view-${mode}`).addEventListener('click', () => {
        viewMode = mode;
        renderRoom();
        renderInspector();
      });
    });
    document.getElementById('btn-snap-grid').addEventListener('click', () => {
      snapDragToGrid = !snapDragToGrid;
      renderRoom();
    });
    ['width', 'depth', 'height', 'wallThickness'].forEach((key) => {
      document.getElementById(`input-room-${key}`).addEventListener('change', (event) => {
        const input = event.target;
        if (!input.reportValidity()) return;
        state.room[key] = input.valueAsNumber;
        clampAllToRoom();
        syncRoomInputs();
        renderRoom();
        renderInspector();
        refreshDoorWindowControls();
      });
    });
    for (const [name, key] of [['width', 'w'], ['depth', 'h'], ['height', 'height']]) {
      document.getElementById(`input-item-${name}`).addEventListener('change', (event) => {
        const item = state.items.find((entry) => entry.id === state.selectedId);
        if (!item || !event.target.reportValidity()) return;
        item[key] = event.target.valueAsNumber;
        setItemPosition(item, item.x, item.y);
        renderRoom();
        renderInspector();
      });
    }

    document.getElementById('input-door-pos').addEventListener('input', (e) => {
      state.door.pos = Number(e.target.value);
      document.getElementById('door-pos-label').textContent = `${state.door.pos} cm`;
      renderRoom();
    });
    for (const key of ['width', 'height', 'angle']) {
      document.getElementById(`input-door-${key}`).addEventListener('change', (event) => {
        if (!event.target.reportValidity()) return;
        state.door[key] = event.target.valueAsNumber;
        state.door.pos = clamp(state.door.pos, 0, wallLength(state.door.wall) - state.door.width);
        refreshDoorWindowControls();
        renderRoom();
      });
    }
    for (const key of ['hinge', 'swing']) {
      document.getElementById(`input-door-${key}`).addEventListener('change', (event) => {
        state.door[key] = event.target.value;
        refreshDoorWindowControls();
        renderRoom();
      });
    }
    document.getElementById('input-window-pos').addEventListener('input', (e) => {
      state.window.pos = Number(e.target.value);
      document.getElementById('window-pos-label').textContent = `${state.window.pos} cm`;
      renderRoom();
    });

    document.getElementById('input-item-x').addEventListener('input', (e) => {
      const item = state.items.find((i) => i.id === state.selectedId);
      if (!item) return;
      setItemPosition(item, Number(e.target.value) || 0, item.y);
      renderRoom();
    });
    document.getElementById('input-item-y').addEventListener('input', (e) => {
      const item = state.items.find((i) => i.id === state.selectedId);
      if (!item) return;
      setItemPosition(item, item.x, Number(e.target.value) || 0);
      renderRoom();
    });
    ['input-item-x', 'input-item-y'].forEach((id) => {
      document.getElementById(id).addEventListener('change', syncItemInputs);
    });
    document.getElementById('btn-rotate-item').addEventListener('click', () => {
      if (state.selectedId) rotateItem(state.selectedId);
    });
    document.getElementById('btn-delete-item').addEventListener('click', () => {
      if (state.selectedId) deleteItem(state.selectedId);
    });
    document.getElementById('btn-select-room').addEventListener('click', () => selectItem(null));

    document.getElementById('room-stage').addEventListener('click', () => {
      if (viewMode === '2d') selectItem(null);
    });

    document.getElementById('btn-zoom-in').addEventListener('click', () => {
      setViewZoom(+(zoom + 0.1).toFixed(2));
    });
    document.getElementById('btn-zoom-out').addEventListener('click', () => {
      setViewZoom(+(zoom - 0.1).toFixed(2));
    });
    document.getElementById('btn-zoom-reset').addEventListener('click', () => {
      zoom = 1;
      panX2D = 0;
      panY2D = 0;
      if (viewMode === '3d') preview3D?.resetView(1);
      renderRoom();
    });

    document.getElementById('btn-confirm-reset').addEventListener('click', () => {
      state = structuredClone(DEFAULT_STATE);
      zoom = 1;
      panX2D = 0;
      panY2D = 0;
      preview3D?.resetView(1);
      syncRoomInputs();
      renderWallpaperGrid();
      renderFloorGrid();
      refreshDoorWindowControls();
      renderRoom();
      renderInspector();
    });

    document.getElementById('btn-copy-json').addEventListener('click', (e) => {
      const span = e.currentTarget.querySelector('span');
      const original = span.textContent;
      navigator.clipboard.writeText(JSON.stringify(state, null, 2)).then(() => {
        span.textContent = '已複製到剪貼簿';
        setTimeout(() => { span.textContent = original; }, 1500);
      });
    });
    let printViewMode = null;
    const preparePrint = () => {
      if (printViewMode !== null) return;
      printViewMode = viewMode;
      viewMode = '2d';
      renderRoom();
      renderInspector();
    };
    const restorePrint = () => {
      if (printViewMode === null) return;
      viewMode = printViewMode;
      printViewMode = null;
      renderRoom();
      renderInspector();
    };
    window.addEventListener('beforeprint', preparePrint);
    window.addEventListener('afterprint', restorePrint);
    document.getElementById('btn-print').addEventListener('click', () => {
      preparePrint();
      try { window.print(); } finally { restorePrint(); }
    });

    window.addEventListener('resize', debounce(renderRoom, 100));
  }

  function init() {
    if (window.HSStaticMethods) window.HSStaticMethods.autoInit();
    renderCatalogPanel();
    renderWallpaperGrid();
    renderFloorGrid();
    buildWallPicker('door-wall-picker', 'door');
    buildWallPicker('window-wall-picker', 'window');
    wireEvents();
    syncRoomInputs();
    refreshDoorWindowControls();
    renderRoom();
    renderInspector();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
