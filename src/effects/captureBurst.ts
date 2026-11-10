import * as THREE from "three";
import { squareToWorld } from "../board/coords";

type Burst = {
  points: THREE.Points;
  velocities: Float32Array;
  life: number;
};

type ShardBurst = {
  meshes: THREE.Mesh[];
  velocities: THREE.Vector3[];
  life: number;
};

export class CaptureEffects {
  private sparks: Burst[] = [];
  private shards: ShardBurst[] = [];

  constructor(private scene: THREE.Scene) {}

  shatterAt(square: string, dark: boolean): void {
    const { x, z } = squareToWorld(square as import("chess.js").Square);
    const y = 0.5;
    const baseColor = dark ? 0x1a1028 : 0xe8e0d0;

    const shardCount = 28;
    const meshes: THREE.Mesh[] = [];
    const velocities: THREE.Vector3[] = [];
    const mat = new THREE.MeshStandardMaterial({
      color: baseColor,
      metalness: dark ? 0.9 : 0.1,
      roughness: dark ? 0.2 : 0.5,
    });

    for (let i = 0; i < shardCount; i++) {
      const geo = new THREE.TetrahedronGeometry(0.06 + Math.random() * 0.08, 0);
      const mesh = new THREE.Mesh(geo, mat.clone());
      mesh.position.set(x + (Math.random() - 0.5) * 0.3, y + Math.random() * 0.6, z + (Math.random() - 0.5) * 0.3);
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      this.scene.add(mesh);
      meshes.push(mesh);
      velocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 4,
          2 + Math.random() * 5,
          (Math.random() - 0.5) * 4,
        ),
      );
    }
    this.shards.push({ meshes, velocities, life: 1.2 });

    const sparkCount = 120;
    const positions = new Float32Array(sparkCount * 3);
    const velocitiesSp = new Float32Array(sparkCount * 3);
    for (let i = 0; i < sparkCount; i++) {
      positions[i * 3] = x;
      positions[i * 3 + 1] = y + 0.3;
      positions[i * 3 + 2] = z;
      velocitiesSp[i * 3] = (Math.random() - 0.5) * 6;
      velocitiesSp[i * 3 + 1] = Math.random() * 8;
      velocitiesSp[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const matPts = new THREE.PointsMaterial({
      color: 0xffcc55,
      size: 0.08,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const points = new THREE.Points(geo, matPts);
    this.scene.add(points);
    this.sparks.push({ points, velocities: velocitiesSp, life: 0.9 });
  }

  update(dt: number): void {
    for (let i = this.shards.length - 1; i >= 0; i--) {
      const s = this.shards[i]!;
      s.life -= dt;
      for (let j = 0; j < s.meshes.length; j++) {
        const mesh = s.meshes[j]!;
        const v = s.velocities[j]!;
        v.y -= 12 * dt;
        mesh.position.addScaledVector(v, dt);
        mesh.rotation.x += dt * 4;
        mesh.rotation.z += dt * 3;
        const scale = Math.max(0, s.life / 1.2);
        mesh.scale.setScalar(scale);
      }
      if (s.life <= 0) {
        for (const m of s.meshes) {
          this.scene.remove(m);
          m.geometry.dispose();
          (m.material as THREE.Material).dispose();
        }
        this.shards.splice(i, 1);
      }
    }

    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i]!;
      s.life -= dt;
      const pos = s.points.geometry.getAttribute("position") as THREE.BufferAttribute;
      for (let j = 0; j < pos.count; j++) {
        pos.setX(j, pos.getX(j) + s.velocities[j * 3]! * dt);
        pos.setY(j, pos.getY(j) + s.velocities[j * 3 + 1]! * dt);
        pos.setZ(j, pos.getZ(j) + s.velocities[j * 3 + 2]! * dt);
        s.velocities[j * 3 + 1]! -= 15 * dt;
      }
      pos.needsUpdate = true;
      (s.points.material as THREE.PointsMaterial).opacity = Math.max(0, s.life / 0.9);
      if (s.life <= 0) {
        this.scene.remove(s.points);
        s.points.geometry.dispose();
        (s.points.material as THREE.Material).dispose();
        this.sparks.splice(i, 1);
      }
    }
  }
}
