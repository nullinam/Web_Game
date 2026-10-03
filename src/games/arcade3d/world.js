import * as THREE from "three";

const MAT = {
  floor: "#b5aa98", darkFloor: "#514c46", wood: "#695744", lightWood: "#ab8862",
  cream: "#e4d9c8", brass: "#c2a16d", stone: "#827b71", blue: "#718b9a",
  red: "#a76e61", green: "#788b6b", black: "#171716", white: "#f1e7d6",
};

export function material(hex, roughness = 0.72, metalness = 0.04) {
  return new THREE.MeshStandardMaterial({ color: hex, roughness, metalness });
}

export function createWorld(host, options = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(options.background || "#c5c3bd");
  scene.fog = new THREE.Fog(options.background || "#c5c3bd", 38, 105);
  const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 180);
  camera.position.set(...(options.camera || [0, 16, 22]));
  camera.lookAt(...(options.lookAt || [0, 0, 0]));
  camera.up.set(0, 1, 0);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.append(renderer.domElement);
  scene.add(new THREE.HemisphereLight("#f5eee1", "#6e665b", 2.15));
  const sun = new THREE.DirectionalLight("#fff0d5", 3.1);
  sun.position.set(-13, 26, 15); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -30; sun.shadow.camera.right = 30; sun.shadow.camera.top = 30; sun.shadow.camera.bottom = -30;
  scene.add(sun);
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(150, 150), material(options.ground || MAT.floor, 0.96));
  plane.rotation.x = -Math.PI / 2; plane.position.y = -0.06; plane.receiveShadow = true; scene.add(plane);
  const world = { scene, camera, renderer, time: 0, callbacks: new Set(), raycaster: new THREE.Raycaster(), mouse: new THREE.Vector2(), disposed: false };
  let raf = 0; let prior = performance.now();
  function resize() {
    const rect = host.getBoundingClientRect(); if (!rect.width || !rect.height) return;
    renderer.setSize(rect.width, rect.height, false); camera.aspect = rect.width / rect.height; camera.updateProjectionMatrix();
  }
  const observer = new ResizeObserver(resize); observer.observe(host); resize();
  function frame(now) {
    if (world.disposed) return;
    raf = requestAnimationFrame(frame); const dt = Math.min((now - prior) / 1000, 0.05); prior = now; world.time += dt;
    for (const callback of world.callbacks) callback(dt, world.time);
    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(frame);
  world.onFrame = (callback) => { world.callbacks.add(callback); return () => world.callbacks.delete(callback); };
  world.pick = (event, objects) => {
    const rect = renderer.domElement.getBoundingClientRect();
    world.mouse.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    world.raycaster.setFromCamera(world.mouse, camera);
    return world.raycaster.intersectObjects(objects, true);
  };
  world.dispose = () => {
    world.disposed = true; cancelAnimationFrame(raf); observer.disconnect();
    scene.traverse((obj) => { if (obj.geometry) obj.geometry.dispose(); if (obj.material) for (const m of Array.isArray(obj.material) ? obj.material : [obj.material]) m.dispose(); });
    renderer.dispose(); renderer.domElement.remove();
  };
  return world;
}

export function box(scene, x, y, z, w, h, d, tint = MAT.wood, options = {}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material(tint, options.roughness ?? 0.77, options.metalness ?? 0.02));
  mesh.position.set(x, y + h / 2, z); mesh.castShadow = true; mesh.receiveShadow = true;
  if (options.parent) options.parent.add(mesh); else scene.add(mesh);
  return mesh;
}

export function sphere(scene, x, y, z, radius, tint = MAT.brass, segments = 14, options = {}) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, segments, Math.max(8, Math.floor(segments * 0.7))), material(tint, options.roughness ?? 0.68, options.metalness ?? 0.02));
  mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true;
  if (options.parent) options.parent.add(mesh); else scene.add(mesh);
  return mesh;
}

export function cylinder(scene, x, y, z, radiusTop, radiusBottom, height, tint = MAT.wood, segments = 12, options = {}) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), material(tint, options.roughness ?? 0.74, options.metalness ?? 0.05));
  mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true;
  if (options.parent) options.parent.add(mesh); else scene.add(mesh);
  return mesh;
}

export function between(scene, start, end, radius, tint, options = {}) {
  const a = new THREE.Vector3(...start), b = new THREE.Vector3(...end), delta = b.clone().sub(a);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, delta.length(), 8), material(tint, 0.68, 0.08));
  mesh.position.copy(a.add(b).multiplyScalar(0.5)); mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
  mesh.castShadow = true; mesh.receiveShadow = true;
  if (options.parent) options.parent.add(mesh); else scene.add(mesh);
  return mesh;
}

export function addStickman(scene, x = 0, z = 0, tint = MAT.blue, options = {}) {
  const group = new THREE.Group(); group.position.set(x, 0, z); scene.add(group);
  const skin = material(options.skin || "#c5a98b", 0.68);
  const clothes = material(tint, 0.72);
  const trousers = material(options.trousers || "#454541", 0.83);
  const head = sphere(scene, 0, 2.08, 0, 0.34, options.head || "#c4a990", 16, { parent: group });
  const torso = cylinder(scene, 0, 1.28, 0, 0.21, 0.31, 0.98, tint, 10, { parent: group });
  const hips = sphere(scene, 0, 0.78, 0, 0.25, options.trousers || "#454541", 12, { parent: group });
  const limbs = new THREE.Group(); group.add(limbs);
  const armL = between(scene, [-0.27, 1.63, 0], [-0.48, 1.02, 0.03], 0.075, tint, { parent: limbs });
  const armR = between(scene, [0.27, 1.63, 0], [0.48, 1.02, 0.03], 0.075, tint, { parent: limbs });
  const legL = between(scene, [-0.13, 0.72, 0], [-0.2, 0.1, -0.04], 0.09, options.trousers || "#454541", { parent: limbs });
  const legR = between(scene, [0.13, 0.72, 0], [0.2, 0.1, -0.04], 0.09, options.trousers || "#454541", { parent: limbs });
  const footL = box(scene, -0.2, 0, -0.16, 0.28, 0.12, 0.37, options.shoes || "#ddd2c1", { parent: group });
  const footR = box(scene, 0.2, 0, -0.16, 0.28, 0.12, 0.37, options.shoes || "#ddd2c1", { parent: group });
  if (options.ears) {
    const ear1 = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.4, 7), skin); ear1.position.set(-0.2, 2.46, 0); ear1.rotation.z = -0.18; group.add(ear1);
    const ear2 = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.4, 7), skin); ear2.position.set(0.2, 2.46, 0); ear2.rotation.z = 0.18; group.add(ear2);
  }
  if (options.tail) between(scene, [0, 0.9, 0.08], [0.12, 0.94, 0.65], 0.07, tint, { parent: group });
  group.userData.parts = { head, torso, hips, limbs, armL, armR, legL, legR, footL, footR };
  group.userData.step = (phase = 0, speed = 7) => {
    const t = worldTime(scene) * speed + phase;
    legL.rotation.x = Math.sin(t) * 0.55; legR.rotation.x = Math.sin(t + Math.PI) * 0.55;
    armL.rotation.x = Math.sin(t + Math.PI) * 0.35; armR.rotation.x = Math.sin(t) * 0.35;
  };
  return group;
}

function worldTime(scene) { return scene.userData.clock?.time || performance.now() / 1000; }

export function makeToken(scene, x, y, z, tint = MAT.brass, radius = 0.22) {
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, radius * 0.28, 8, 20), material(tint, 0.35, 0.34));
  mesh.rotation.x = Math.PI / 2; mesh.position.set(x, y, z); mesh.castShadow = true; scene.add(mesh); return mesh;
}

export function addGroundGrid(scene, size, divisions = size, tint = "#8b8174") {
  const grid = new THREE.GridHelper(size, divisions, tint, tint); grid.position.y = 0.01;
  const mats = Array.isArray(grid.material) ? grid.material : [grid.material]; mats.forEach((m) => { m.transparent = true; m.opacity = 0.24; });
  scene.add(grid); return grid;
}

export function addTree(scene, x, z, height = 4) {
  cylinder(scene, x, 0.65, z, 0.22, 0.32, 1.3, "#6a5544", 8);
  const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(height * 0.28, 1), material("#74836c", 0.95));
  crown.position.set(x, height * 0.72, z); crown.scale.set(1, 1.16, 1); crown.castShadow = true; scene.add(crown); return crown;
}

export function addTarget(scene, x, y, z, radius = 1) {
  const g = new THREE.Group(); g.position.set(x, y, z); scene.add(g);
  cylinder(scene, 0, -y + 1.1, 0, 0.065, 0.09, 2.2, MAT.wood, 8, { parent: g });
  [radius, radius * 0.72, radius * 0.45, radius * 0.2].forEach((r, index) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, Math.max(0.035, radius * 0.045), 8, 32), material(["#eee4d0", "#a66c58", "#ddd0b9", "#9d7853"][index], 0.58));
    ring.position.set(0, 0, 0.09 + index * 0.003); ring.castShadow = true; g.add(ring);
  });
  sphere(scene, 0, 0, 0.1, radius * 0.11, "#bd9c69", 12, { parent: g });
  return g;
}

export const palette = MAT;
