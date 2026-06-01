import { Engine } from "@babylonjs/core/Engines/engine";
import "./style.css";
import { createScene } from "./scene/createScene";

const canvas = document.querySelector<HTMLCanvasElement>("#render-canvas");
const hudRoot = document.querySelector<HTMLElement>("#hud-root");

if (!canvas || !hudRoot) {
	throw new Error("Museum app root elements missing");
}

canvas.tabIndex = 0;

try {
	const engine = new Engine(canvas, true, {
		adaptToDeviceRatio: true,
		antialias: true,
		stencil: true,
	});
	const scene = createScene(engine, canvas, hudRoot);

	engine.runRenderLoop(() => {
		scene.render();
	});

	window.addEventListener("resize", () => engine.resize());
} catch (error) {
	showFatalError(hudRoot, error);
}

function showFatalError(root: HTMLElement, error: unknown): void {
	const panel = document.createElement("pre");
	panel.className = "fatal-error";
	panel.textContent =
		error instanceof Error ? error.stack || error.message : String(error);
	root.appendChild(panel);
}
