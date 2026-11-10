import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import type { Move, Square } from "chess.js";
import { ChessEngine } from "../game/ChessEngine";
import { pickAIMove } from "../game/AI";
import { buildCathedral, updateTorches, type TorchHandle } from "../scene/cathedral";
import { buildChessBoard, highlightSquare } from "../scene/board";
import { PieceLayer } from "../scene/PieceLayer";
import { CaptureEffects } from "../effects/captureBurst";
import { CameraRig, type CameraMode } from "../camera/CameraRig";
import { squareToWorld, worldToSquare } from "../board/coords";
import { Soundscape } from "../audio/Soundscape";

export class GameApp {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private rig: CameraRig;
  private engine = new ChessEngine();
  private pieces: PieceLayer;
  private effects: CaptureEffects;
  private torches: TorchHandle[] = [];
  private stainLights: THREE.PointLight[] = [];
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private selected: Square | null = null;
  private highlights: THREE.Mesh[] = [];
  private boardGroup: THREE.Group;
  private inputLocked = false;
  private clock = new THREE.Clock();
  private sounds = new Soundscape();
  private animId = 0;
  private composer: EffectComposer;

  constructor(private canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.38;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120);
    this.rig = new CameraRig(this.camera, canvas);

    const cathedral = buildCathedral(this.scene);
    this.torches = cathedral.torches;
    this.stainLights = cathedral.stainLights;

    this.boardGroup = buildChessBoard();
    this.scene.add(this.boardGroup);

    this.pieces = new PieceLayer(this.engine);
    this.scene.add(this.pieces.group);
    this.effects = new CaptureEffects(this.scene);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.55, 0.35, 0.88);
    this.composer.addPass(bloom);

    this.pieces.syncFromEngine();
    this.bindInput();
    this.resize();
    window.addEventListener("resize", () => this.resize());
    this.updateHUD();
  }

  async start(): Promise<void> {
    const unlock = () => {
      void this.sounds.resume();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("touchstart", unlock);
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("touchstart", unlock, { once: true });

    const loop = () => {
      this.animId = requestAnimationFrame(loop);
      const dt = Math.min(this.clock.getDelta(), 0.05);
      const t = this.clock.elapsedTime;
      updateTorches(this.torches, t);
      for (const l of this.stainLights) {
        l.intensity = 1.6 + Math.sin(t * 0.7 + l.position.x) * 0.25;
      }
      this.effects.update(dt);
      this.rig.update(dt);
      this.composer.render();
    };
    loop();
  }

  newGame(): void {
    this.engine.reset();
    this.clearSelection();
    this.pieces.syncFromEngine();
    this.updateHUD();
  }

  setCameraMode(mode: CameraMode): void {
    this.rig.setMode(mode);
  }

  async tryUndo(): Promise<void> {
    if (this.inputLocked || this.engine.turn === "b") return;
    const undone = this.engine.undo();
    if (undone) this.engine.undo();
    if (undone) {
      this.clearSelection();
      this.pieces.syncFromEngine();
      this.updateHUD();
    }
  }

  private resize(): void {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    this.rig.resize();
  }

  private bindInput(): void {
    const pick = (clientX: number, clientY: number) => {
      if (this.inputLocked) return;
      const rect = this.canvas.getBoundingClientRect();
      this.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.pointer, this.camera);

      const pieceHits = this.raycaster.intersectObjects(this.pieces.group.children, true);
      if (pieceHits.length > 0) {
        let obj: THREE.Object3D = pieceHits[0]!.object;
        while (obj.parent && obj.parent !== this.pieces.group) obj = obj.parent;
        const sq = this.pieces.meshSquare(obj as THREE.Mesh);
        if (sq) void this.onSquareTap(sq);
        return;
      }

      const boardHits = this.raycaster.intersectObjects(this.boardGroup.children, false);
      if (boardHits.length > 0) {
        const sq = boardHits[0]!.object.userData.square as Square | undefined;
        if (sq) void this.onSquareTap(sq);
        return;
      }

      const world = new THREE.Vector3();
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.32);
      if (this.raycaster.ray.intersectPlane(plane, world)) {
        const sq = worldToSquare(world.x, world.z);
        if (sq) void this.onSquareTap(sq);
      }
    };

    this.canvas.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      pick(e.clientX, e.clientY);
    });
  }

  private async onSquareTap(square: Square): Promise<void> {
    if (this.engine.turn !== "w" || this.engine.snapshot().isGameOver) return;

    const piece = this.engine.get(square);
    if (!this.selected) {
      if (piece && piece.color === "w") {
        this.selected = square;
        void this.sounds.playSelect();
        this.showMoves(square);
      }
      return;
    }

    if (square === this.selected) {
      this.clearSelection();
      return;
    }

    if (piece && piece.color === "w") {
      this.selected = square;
      void this.sounds.playSelect();
      this.showMoves(square);
      return;
    }

    const moves = this.engine.legalMovesFrom(this.selected);
    const match = moves.find((m) => m.to === square);
    if (!match) {
      this.clearSelection();
      return;
    }

    await this.applyMove(match);
  }

  private showMoves(from: Square): void {
    this.clearHighlights();
    const moves = this.engine.legalMovesFrom(from);
    for (const m of moves) {
      const hl = highlightSquare(m.captured ? 0xff6644 : 0x66cc88, m.captured ? 0.45 : 0.35);
      const { x, z } = squareToWorld(m.to);
      hl.position.x = x;
      hl.position.z = z;
      this.boardGroup.add(hl);
      this.highlights.push(hl);
    }
    const sel = highlightSquare(0xffdd88, 0.55);
    const { x, z } = squareToWorld(from);
    sel.position.set(x, 0.34, z);
    this.boardGroup.add(sel);
    this.highlights.push(sel);
  }

  private clearHighlights(): void {
    for (const h of this.highlights) this.boardGroup.remove(h);
    this.highlights = [];
  }

  private clearSelection(): void {
    this.selected = null;
    this.clearHighlights();
  }

  private async applyMove(move: Move): Promise<void> {
    this.inputLocked = true;
    this.clearSelection();

    const captured = move.captured;
    const victimSq = move.to;
    const victimMesh = captured ? this.pieces.getMeshAt(victimSq) : undefined;

    await this.pieces.animateMove(move.from, move.to, captured ? 0.55 : 0.4);

    const applied = this.engine.move({
      from: move.from,
      to: move.to,
      promotion: move.promotion as "q" | undefined,
    });
    if (!applied) {
      this.pieces.syncFromEngine();
      this.inputLocked = false;
      return;
    }

    if (applied.promotion) {
      this.pieces.syncFromEngine();
    } else {
      this.pieces.rekey(move.from, move.to);
    }

    if (captured && victimMesh) {
      this.pieces.removeAt(victimSq);
      victimMesh.geometry.dispose();
      (victimMesh.material as THREE.Material).dispose();
      this.rig.focusCapture(victimSq);
      const victimWasBlack = move.color === "w";
      this.effects.shatterAt(victimSq, victimWasBlack);
      void this.sounds.playCapture();
      await this.wait(900);
    } else {
      void this.sounds.playMove();
    }

    this.pieces.syncFromEngine();

    const snap = this.engine.snapshot();
    if (snap.inCheck) void this.sounds.playCheck();
    this.updateHUD();

    if (snap.isGameOver) {
      this.showOverlay(snap.outcome ?? "Partie terminée");
      this.inputLocked = false;
      return;
    }

    if (move.color === "w" && this.engine.turn === "b") {
      await this.wait(450);
      await this.aiTurn();
    }

    this.inputLocked = false;
  }

  private async aiTurn(): Promise<void> {
    const move = pickAIMove(this.engine);
    if (!move) return;
    await this.applyMove(move);
  }

  private wait(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }

  private updateHUD(): void {
    const turn = document.getElementById("turn-label");
    const status = document.getElementById("status");
    const undo = document.getElementById("btn-undo") as HTMLButtonElement | null;
    const snap = this.engine.snapshot();
    if (turn) {
      turn.textContent =
        snap.isGameOver
          ? "Partie terminée"
          : snap.turn === "w"
            ? "Tour : Blanc (vous)"
            : "Tour : Noir (IA)";
    }
    if (status) {
      status.textContent = snap.inCheck ? "Échec !" : snap.outcome ?? "";
    }
    if (undo) undo.disabled = this.inputLocked || snap.turn !== "w";
  }

  private showOverlay(text: string): void {
    const overlay = document.getElementById("overlay");
    const title = document.getElementById("overlay-title");
    const body = document.getElementById("overlay-text");
    if (title) title.textContent = "Fin de partie";
    if (body) body.textContent = text;
    overlay?.classList.remove("hidden");
  }

  dispose(): void {
    cancelAnimationFrame(this.animId);
    this.pieces.dispose();
  }
}
