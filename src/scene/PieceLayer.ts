import * as THREE from "three";
import type { Square } from "chess.js";
import { ChessEngine } from "../game/ChessEngine";
import { squareToWorld } from "../board/coords";
import { createPieceMesh, type PieceColor } from "./pieceFactory";

type PieceKey = string;

function key(square: Square, type: string, color: PieceColor): PieceKey {
  return `${square}:${color}${type}`;
}

export class PieceLayer {
  readonly group = new THREE.Group();
  private meshes = new Map<PieceKey, THREE.Mesh>();

  constructor(private engine: ChessEngine) {}

  syncFromEngine(): void {
  const needed = new Set<PieceKey>();
    for (let f = 0; f < 8; f++) {
      for (let r = 1; r <= 8; r++) {
        const sq = `${String.fromCharCode(97 + f)}${r}` as Square;
        const piece = this.engine.get(sq);
        if (!piece) continue;
        const k = key(sq, piece.type, piece.color);
        needed.add(k);
        if (!this.meshes.has(k)) {
          const mesh = createPieceMesh(piece.type, piece.color);
          this.placeOnSquare(mesh, sq);
          this.meshes.set(k, mesh);
          this.group.add(mesh);
        } else {
          this.placeOnSquare(this.meshes.get(k)!, sq);
        }
      }
    }
    for (const [k, mesh] of this.meshes) {
      if (!needed.has(k)) {
        this.group.remove(mesh);
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
        this.meshes.delete(k);
      }
    }
  }

  getMeshAt(square: Square): THREE.Mesh | undefined {
    for (const [k, mesh] of this.meshes) {
      if (k.startsWith(`${square}:`)) return mesh;
    }
    return undefined;
  }

  meshSquare(mesh: THREE.Mesh): Square | null {
    for (const [k, m] of this.meshes) {
      if (m === mesh) {
        return k.split(":")[0] as Square;
      }
    }
    return null;
  }

  placeOnSquare(mesh: THREE.Mesh, square: Square): void {
    const { x, z } = squareToWorld(square);
    mesh.position.set(x, 0.32, z);
    mesh.rotation.y = mesh.userData.pieceColor === "w" ? 0 : Math.PI;
  }

  rekey(from: Square, to: Square): void {
    for (const [k, mesh] of this.meshes) {
      if (k.startsWith(`${from}:`)) {
        const suffix = k.split(":")[1]!;
        this.meshes.delete(k);
        this.meshes.set(`${to}:${suffix}`, mesh);
        this.placeOnSquare(mesh, to);
        return;
      }
    }
  }

  async animateMove(
    from: Square,
    to: Square,
    duration: number,
  ): Promise<void> {
    const mesh = this.getMeshAt(from);
    if (!mesh) return;
    const start = mesh.position.clone();
    const { x, z } = squareToWorld(to);
    const end = new THREE.Vector3(x, 0.32, z);
    const t0 = performance.now();
    return new Promise((resolve) => {
      const step = () => {
        const t = Math.min(1, (performance.now() - t0) / (duration * 1000));
        const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        if (t < 0.15 || t > 0.85) {
          mesh.position.y = 0.32 + Math.sin(t * Math.PI) * 0.25;
        }
        mesh.position.lerpVectors(start, end, e);
        mesh.position.x = start.x + (end.x - start.x) * e;
        mesh.position.z = start.z + (end.z - start.z) * e;
        if (t < 1) requestAnimationFrame(step);
        else {
          mesh.position.copy(end);
          mesh.position.y = 0.32;
          resolve();
        }
      };
      step();
    });
  }

  removeAt(square: Square): THREE.Mesh | undefined {
    for (const [k, mesh] of this.meshes) {
      if (k.startsWith(`${square}:`)) {
        this.group.remove(mesh);
        this.meshes.delete(k);
        return mesh;
      }
    }
    return undefined;
  }

  dispose(): void {
    for (const mesh of this.meshes.values()) {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
    this.meshes.clear();
  }
}
