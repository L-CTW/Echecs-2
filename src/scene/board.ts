import * as THREE from "three";
import { BOARD_HALF, SQUARE_SIZE } from "../board/coords";

export function buildChessBoard(): THREE.Group {
  const group = new THREE.Group();

  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(9.2, 0.35, 9.2),
    new THREE.MeshStandardMaterial({
      color: 0x2c2438,
      roughness: 0.45,
      metalness: 0.35,
    }),
  );
  slab.position.y = 0.05;
  slab.castShadow = true;
  slab.receiveShadow = true;
  group.add(slab);

  const trim = new THREE.Mesh(
    new THREE.BoxGeometry(9.6, 0.2, 9.6),
    new THREE.MeshStandardMaterial({ color: 0x4a3a28, metalness: 0.5, roughness: 0.4 }),
  );
  trim.position.y = -0.08;
  group.add(trim);

  const lightSquare = new THREE.Color(0x7a6a88);
  const darkSquare = new THREE.Color(0x2a2238);

  for (let f = 0; f < 8; f++) {
    for (let r = 0; r < 8; r++) {
      const isLight = (f + r) % 2 === 0;
      const tile = new THREE.Mesh(
        new THREE.BoxGeometry(SQUARE_SIZE * 0.98, 0.08, SQUARE_SIZE * 0.98),
        new THREE.MeshStandardMaterial({
          color: isLight ? lightSquare : darkSquare,
          roughness: isLight ? 0.35 : 0.55,
          metalness: isLight ? 0.25 : 0.15,
          emissive: isLight ? 0x100818 : 0x000000,
          emissiveIntensity: isLight ? 0.15 : 0,
        }),
      );
      tile.position.set((f - 3.5) * SQUARE_SIZE, 0.28, (3.5 - r) * SQUARE_SIZE);
      tile.receiveShadow = true;
      tile.userData.square = `${String.fromCharCode(97 + f)}${r + 1}`;
      group.add(tile);
    }
  }

  const borderGlow = new THREE.PointLight(0xaa88cc, 1.1, BOARD_HALF * 4);
  borderGlow.position.set(0, 2, 0);
  group.add(borderGlow);

  return group;
}

export function highlightSquare(color: number, opacity: number): THREE.Mesh {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(0.92, 0.92),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
    }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.34;
  m.renderOrder = 2;
  return m;
}
