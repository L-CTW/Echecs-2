import * as THREE from "three";
import type { PieceSymbol } from "chess.js";
import { marbleWhite, obsidianBlack } from "./materials";

export type PieceColor = "w" | "b";

function merge(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const merged = new THREE.BufferGeometry();
  const positions: number[] = [];
  const normals: number[] = [];
  for (const g of geos) {
    const pos = g.getAttribute("position");
    const norm = g.getAttribute("normal");
    for (let i = 0; i < pos.count; i++) {
      positions.push(pos.getX(i), pos.getY(i), pos.getZ(i));
      if (norm) normals.push(norm.getX(i), norm.getY(i), norm.getZ(i));
    }
    g.dispose();
  }
  merged.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  if (normals.length) merged.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  merged.computeVertexNormals();
  return merged;
}

function basePedestal(): THREE.BufferGeometry[] {
  const parts: THREE.BufferGeometry[] = [];
  const base = new THREE.CylinderGeometry(0.38, 0.42, 0.12, 32);
  base.translate(0, 0.06, 0);
  parts.push(base);
  const ring = new THREE.TorusGeometry(0.35, 0.04, 12, 32);
  ring.rotateX(Math.PI / 2);
  ring.translate(0, 0.14, 0);
  parts.push(ring);
  return parts;
}

function pawnGeometries(): THREE.BufferGeometry[] {
  const parts = basePedestal();
  const body = new THREE.CylinderGeometry(0.14, 0.22, 0.35, 24);
  body.translate(0, 0.35, 0);
  parts.push(body);
  const head = new THREE.SphereGeometry(0.18, 24, 24);
  head.translate(0, 0.68, 0);
  parts.push(head);
  return parts;
}

function rookGeometries(): THREE.BufferGeometry[] {
  const parts = basePedestal();
  const tower = new THREE.CylinderGeometry(0.22, 0.28, 0.55, 6);
  tower.translate(0, 0.4, 0);
  parts.push(tower);
  const top = new THREE.CylinderGeometry(0.3, 0.28, 0.15, 6);
  top.translate(0, 0.72, 0);
  parts.push(top);
  return parts;
}

function bishopGeometries(): THREE.BufferGeometry[] {
  const parts = basePedestal();
  const body = new THREE.CylinderGeometry(0.12, 0.24, 0.5, 24);
  body.translate(0, 0.38, 0);
  parts.push(body);
  const mitre = new THREE.ConeGeometry(0.2, 0.35, 24);
  mitre.translate(0, 0.78, 0);
  parts.push(mitre);
  const notch = new THREE.SphereGeometry(0.08, 12, 12);
  notch.translate(0, 0.72, 0.12);
  parts.push(notch);
  return parts;
}

function queenGeometries(): THREE.BufferGeometry[] {
  const parts = basePedestal();
  const dress = new THREE.CylinderGeometry(0.15, 0.3, 0.45, 24);
  dress.translate(0, 0.35, 0);
  parts.push(dress);
  const neck = new THREE.CylinderGeometry(0.1, 0.14, 0.2, 20);
  neck.translate(0, 0.68, 0);
  parts.push(neck);
  const crown = new THREE.OctahedronGeometry(0.22, 0);
  crown.translate(0, 0.95, 0);
  parts.push(crown);
  for (let i = 0; i < 5; i++) {
    const spike = new THREE.ConeGeometry(0.04, 0.14, 8);
    const a = (i / 5) * Math.PI * 2;
    spike.translate(Math.cos(a) * 0.16, 1.02, Math.sin(a) * 0.16);
    parts.push(spike);
  }
  return parts;
}

function kingGeometries(): THREE.BufferGeometry[] {
  const parts = basePedestal();
  const body = new THREE.CylinderGeometry(0.16, 0.26, 0.5, 24);
  body.translate(0, 0.38, 0);
  parts.push(body);
  const crossV = new THREE.BoxGeometry(0.06, 0.28, 0.06);
  crossV.translate(0, 0.95, 0);
  parts.push(crossV);
  const crossH = new THREE.BoxGeometry(0.22, 0.06, 0.06);
  crossH.translate(0, 1.02, 0);
  parts.push(crossH);
  return parts;
}

function knightGeometries(): THREE.BufferGeometry[] {
  const parts = basePedestal();
  const neck = new THREE.BoxGeometry(0.2, 0.35, 0.45);
  neck.translate(0.05, 0.45, 0.05);
  neck.rotateY(-0.4);
  parts.push(neck);
  const head = new THREE.ConeGeometry(0.18, 0.4, 16, 1, false, 0, Math.PI);
  head.rotateZ(Math.PI / 2);
  head.rotateY(-0.5);
  head.translate(0.22, 0.72, 0.15);
  parts.push(head);
  const ear = new THREE.ConeGeometry(0.06, 0.15, 8);
  ear.translate(0.35, 0.88, 0.1);
  ear.rotateZ(-0.6);
  parts.push(ear);
  return parts;
}

const GEO_BUILDERS: Record<PieceSymbol, () => THREE.BufferGeometry[]> = {
  p: pawnGeometries,
  r: rookGeometries,
  n: knightGeometries,
  b: bishopGeometries,
  q: queenGeometries,
  k: kingGeometries,
};

export function createPieceMesh(type: PieceSymbol, color: PieceColor): THREE.Mesh {
  const geos = GEO_BUILDERS[type]();
  const geometry = merge(geos);
  const material = color === "w" ? marbleWhite() : obsidianBlack();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData = { pieceType: type, pieceColor: color };
  return mesh;
}
