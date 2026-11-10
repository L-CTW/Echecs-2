import * as THREE from "three";
import { stainedGlass } from "./materials";

export type TorchHandle = {
  light: THREE.PointLight;
  flame: THREE.Mesh;
  baseIntensity: number;
  flickerPhase: number;
};

export function buildCathedral(scene: THREE.Scene): { torches: TorchHandle[]; stainLights: THREE.PointLight[] } {
  scene.background = new THREE.Color(0x030208);
  scene.fog = new THREE.FogExp2(0x08051a, 0.028);

  const amb = new THREE.AmbientLight(0x3a3058, 0.55);
  scene.add(amb);

  const moon = new THREE.DirectionalLight(0x8a9ad8, 0.42);
  moon.position.set(-12, 28, 8);
  moon.castShadow = true;
  moon.shadow.mapSize.set(2048, 2048);
  moon.shadow.camera.near = 1;
  moon.shadow.camera.far = 60;
  moon.shadow.camera.left = -18;
  moon.shadow.camera.right = 18;
  moon.shadow.camera.top = 18;
  moon.shadow.camera.bottom = -18;
  scene.add(moon);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(48, 56),
    new THREE.MeshStandardMaterial({
      color: 0x1a1420,
      metalness: 0.92,
      roughness: 0.22,
      envMapIntensity: 0.8,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.02;
  floor.receiveShadow = true;
  scene.add(floor);

  const checker = new THREE.Mesh(
    new THREE.PlaneGeometry(46, 54),
    new THREE.MeshStandardMaterial({
      color: 0x0a0610,
      metalness: 0.95,
      roughness: 0.15,
      transparent: true,
      opacity: 0.35,
    }),
  );
  checker.rotation.x = -Math.PI / 2;
  checker.position.y = -0.015;
  scene.add(checker);

  addWallsAndColumns(scene);
  const { torches, stainLights } = addWindowsAndTorches(scene);
  addVaultRibs(scene);
  addChandelier(scene);

  return { torches, stainLights };
}

function addWallsAndColumns(scene: THREE.Scene): void {
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x1e1628,
    roughness: 0.85,
    metalness: 0.05,
  });

  const backWall = new THREE.Mesh(new THREE.BoxGeometry(40, 22, 1.2), wallMat);
  backWall.position.set(0, 11, -20);
  backWall.receiveShadow = true;
  scene.add(backWall);

  const sideGeo = new THREE.BoxGeometry(1.2, 22, 36);
  const left = new THREE.Mesh(sideGeo, wallMat);
  left.position.set(-20, 11, -2);
  scene.add(left);
  const right = new THREE.Mesh(sideGeo, wallMat);
  right.position.set(20, 11, -2);
  scene.add(right);

  const colMat = new THREE.MeshStandardMaterial({
    color: 0x2a2238,
    roughness: 0.55,
    metalness: 0.12,
  });
  const positions = [
    [-14, -14],
    [-14, 8],
    [14, -14],
    [14, 8],
    [-7, -17],
    [7, -17],
  ];
  for (const [x, z] of positions) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, 18, 16), colMat);
    col.position.set(x, 9, z);
    col.castShadow = true;
    col.receiveShadow = true;
    scene.add(col);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.65, 0.6, 16), colMat);
    cap.position.set(x, 18.2, z);
    scene.add(cap);
  }
}

function addWindowsAndTorches(scene: THREE.Scene): {
  torches: TorchHandle[];
  stainLights: THREE.PointLight[];
} {
  const torches: TorchHandle[] = [];
  const stainLights: THREE.PointLight[] = [];

  const glassColors = [0xff3366, 0x44ccff, 0xffcc33, 0xaa66ff, 0x33ff99];
  const windowSlots = [
    { x: -12, y: 12, z: -19.4, rotY: 0, c: 0 },
    { x: 0, y: 14, z: -19.4, rotY: 0, c: 1 },
    { x: 12, y: 12, z: -19.4, rotY: 0, c: 2 },
    { x: -19.4, y: 11, z: -6, rotY: Math.PI / 2, c: 3 },
    { x: -19.4, y: 11, z: 6, rotY: Math.PI / 2, c: 4 },
    { x: 19.4, y: 11, z: -6, rotY: -Math.PI / 2, c: 0 },
    { x: 19.4, y: 11, z: 6, rotY: -Math.PI / 2, c: 1 },
  ];

  for (const w of windowSlots) {
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 6.5, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x15101c, roughness: 0.7 }),
    );
    frame.position.set(w.x, w.y, w.z);
    frame.rotation.y = w.rotY;
    scene.add(frame);

    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(3.6, 5.8),
      stainedGlass(glassColors[w.c]!),
    );
    glass.position.set(w.x, w.y, w.z + (w.rotY === 0 ? 0.2 : 0));
    if (w.rotY !== 0) {
      glass.position.x += w.rotY > 0 ? 0.2 : -0.2;
    }
    glass.rotation.y = w.rotY;
    scene.add(glass);

    const pl = new THREE.PointLight(glassColors[w.c]!, 1.8, 22, 2);
    pl.position.set(w.x, w.y, w.z + 2);
    scene.add(pl);
    stainLights.push(pl);

    for (let i = 0; i < 3; i++) {
      const seg = new THREE.Mesh(
        new THREE.PlaneGeometry(1.1, 5.6),
        stainedGlass(glassColors[(w.c + i) % glassColors.length]!, 0.5),
      );
      seg.position.copy(glass.position);
      seg.rotation.copy(glass.rotation);
      seg.position.x += (i - 1) * 1.15 * Math.cos(w.rotY);
      seg.position.z += (i - 1) * 1.15 * Math.sin(w.rotY);
      scene.add(seg);
    }
  }

  const torchPositions: [number, number, number][] = [
    [-10, 4, -8],
    [10, 4, -8],
    [-16, 4, 4],
    [16, 4, 4],
    [-5, 4, 12],
    [5, 4, 12],
  ];

  for (let i = 0; i < torchPositions.length; i++) {
    const [x, y, z] = torchPositions[i]!;
    const bracket = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.8, 0.15),
      new THREE.MeshStandardMaterial({ color: 0x3a3020, metalness: 0.6 }),
    );
    bracket.position.set(x, y, z);
    scene.add(bracket);

    const flame = new THREE.Mesh(
      new THREE.ConeGeometry(0.12, 0.35, 8),
      new THREE.MeshBasicMaterial({ color: 0xffaa44, transparent: true, opacity: 0.9 }),
    );
    flame.position.set(x, y + 0.55, z);
    scene.add(flame);

    const light = new THREE.PointLight(0xff8833, 2.2, 14, 2);
    light.position.set(x, y + 0.6, z);
    light.castShadow = true;
    light.shadow.mapSize.set(512, 512);
    scene.add(light);

    torches.push({
      light,
      flame,
      baseIntensity: 2.2,
      flickerPhase: i * 1.7,
    });
  }

  return { torches, stainLights };
}

function addVaultRibs(scene: THREE.Scene): void {
  const ribMat = new THREE.MeshStandardMaterial({ color: 0x151020, roughness: 0.9 });
  for (let i = -3; i <= 3; i++) {
    const rib = new THREE.Mesh(new THREE.TorusGeometry(16, 0.12, 8, 48, Math.PI), ribMat);
    rib.rotation.x = Math.PI / 2;
    rib.rotation.z = Math.PI;
    rib.position.set(i * 2.5, 19, -8);
    scene.add(rib);
  }
}

function addChandelier(scene: THREE.Scene): void {
  const group = new THREE.Group();
  group.position.set(0, 16, -4);
  const chain = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 3),
    new THREE.MeshStandardMaterial({ color: 0x443322, metalness: 0.7 }),
  );
  chain.position.y = 1.5;
  group.add(chain);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.2, 0.06, 8, 32),
    new THREE.MeshStandardMaterial({ color: 0x665544, metalness: 0.8 }),
  );
  group.add(ring);
  const glow = new THREE.PointLight(0xffcc88, 0.9, 18, 2);
  glow.position.y = -0.5;
  group.add(glow);
  scene.add(group);
}

export function updateTorches(torches: TorchHandle[], time: number): void {
  for (const t of torches) {
    const flick = Math.sin(time * 9 + t.flickerPhase) * 0.15 + Math.sin(time * 17 + t.flickerPhase * 2) * 0.08;
    t.light.intensity = t.baseIntensity * (1 + flick);
    const s = 1 + flick * 0.3;
    t.flame.scale.set(1, s, 1);
    (t.flame.material as THREE.MeshBasicMaterial).opacity = 0.75 + flick * 0.2;
  }
}
