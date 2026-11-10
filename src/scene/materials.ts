import * as THREE from "three";

export function marbleWhite(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0xf4efe6),
    roughness: 0.32,
    metalness: 0.05,
    clearcoat: 0.4,
    clearcoatRoughness: 0.2,
    emissive: new THREE.Color(0x221810),
    emissiveIntensity: 0.03,
  });
}

export function obsidianBlack(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0x0c0814),
    roughness: 0.18,
    metalness: 0.85,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    emissive: new THREE.Color(0x180830),
    emissiveIntensity: 0.12,
  });
}

export function stainedGlass(color: number, opacity = 0.85): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
}
