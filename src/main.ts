import "./style.css";
import { GameApp } from "./app/GameApp";
import type { CameraMode } from "./camera/CameraRig";

const canvas = document.getElementById("game") as HTMLCanvasElement;
const app = new GameApp(canvas);
void app.start();

document.querySelectorAll<HTMLButtonElement>("[data-camera]").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("[data-camera]").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    app.setCameraMode(btn.dataset.camera as CameraMode);
  });
});

document.getElementById("btn-new")?.addEventListener("click", () => {
  document.getElementById("overlay")?.classList.add("hidden");
  app.newGame();
});

document.getElementById("btn-undo")?.addEventListener("click", () => {
  void app.tryUndo();
});

document.getElementById("overlay-close")?.addEventListener("click", () => {
  document.getElementById("overlay")?.classList.add("hidden");
});
