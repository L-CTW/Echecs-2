import * as THREE from "three";
import { squareToWorld } from "../board/coords";
import type { Square } from "chess.js";

export type CameraMode = "dramatic" | "player" | "gallery" | "bishop";

const PRESETS: Record<CameraMode, { pos: THREE.Vector3; target: THREE.Vector3; fov: number }> = {
  dramatic: {
    pos: new THREE.Vector3(7.5, 7.2, 9.5),
    target: new THREE.Vector3(0, 0.3, 0),
    fov: 42,
  },
  player: {
    pos: new THREE.Vector3(0.5, 5.5, 11),
    target: new THREE.Vector3(0, 0.2, -1),
    fov: 48,
  },
  gallery: {
    pos: new THREE.Vector3(0, 18, 0.5),
    target: new THREE.Vector3(0, 0, 0),
    fov: 38,
  },
  bishop: {
    pos: new THREE.Vector3(-11, 6, 5),
    target: new THREE.Vector3(2, 0.5, -2),
    fov: 45,
  },
};

export class CameraRig {
  mode: CameraMode = "dramatic";
  private currentPos = new THREE.Vector3();
  private currentTarget = new THREE.Vector3();
  private desiredPos = new THREE.Vector3();
  private desiredTarget = new THREE.Vector3();
  private desiredFov = 42;
  private captureBlend = 0;
  constructor(
    readonly camera: THREE.PerspectiveCamera,
    private dom: HTMLElement,
  ) {
    const p = PRESETS.dramatic;
    this.currentPos.copy(p.pos);
    this.currentTarget.copy(p.target);
    this.desiredPos.copy(p.pos);
    this.desiredTarget.copy(p.target);
    camera.position.copy(p.pos);
    camera.fov = p.fov;
  }

  setMode(mode: CameraMode): void {
    this.mode = mode;
    if (this.captureBlend <= 0) {
      this.applyPreset(mode);
    }
  }

  private applyPreset(mode: CameraMode): void {
    const p = PRESETS[mode];
    this.desiredPos.copy(p.pos);
    this.desiredTarget.copy(p.target);
    this.desiredFov = p.fov;
  }

  focusCapture(square: Square): void {
    this.captureBlend = 1;
    const { x, z } = squareToWorld(square);
    this.desiredTarget.set(x, 0.6, z);
    this.desiredPos.set(x + 2.2, 2.4, z + 2.8);
    this.desiredFov = 32;
  }

  releaseCapture(): void {
    this.captureBlend = 0;
    this.applyPreset(this.mode);
  }

  resize(): void {
    const w = this.dom.clientWidth;
    const h = this.dom.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  update(dt: number): void {
    if (this.captureBlend > 0) {
      this.captureBlend = Math.max(0, this.captureBlend - dt * 0.35);
      if (this.captureBlend <= 0) {
        this.releaseCapture();
      }
    }

    const smooth = 1 - Math.pow(0.001, dt);
    this.currentPos.lerp(this.desiredPos, smooth);
    this.currentTarget.lerp(this.desiredTarget, smooth);
    this.camera.fov += (this.desiredFov - this.camera.fov) * smooth;
    this.camera.updateProjectionMatrix();
    this.camera.position.copy(this.currentPos);
    this.camera.lookAt(this.currentTarget);
  }
}
