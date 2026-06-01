import { Color4 } from "@babylonjs/core/Maths/math.color";
import { Scene } from "@babylonjs/core/scene";
import type { Engine } from "@babylonjs/core/Engines/engine";
import { ExhibitSystem } from "../exhibits/ExhibitSystem";
import { EXHIBITS } from "../exhibits/exhibitData";
import { PlayerController } from "../player/PlayerController";
import { ExhibitPanel } from "../ui/ExhibitPanel";
import { createGalleryRoom } from "./createGalleryRoom";
import { createLighting } from "./createLighting";
import { createPedestals } from "./createPedestals";
import { YouTubeFrame } from "./createYouTubeFrame";

export function createScene(
	engine: Engine,
	canvas: HTMLCanvasElement,
	hudRoot: HTMLElement,
): Scene {
	const scene = new Scene(engine);
	scene.clearColor = new Color4(0.02, 0.022, 0.026, 1);
	scene.collisionsEnabled = true;

	const player = new PlayerController(scene, canvas, hudRoot);
	const room = createGalleryRoom(scene);
	const pedestals = createPedestals(scene);
	new YouTubeFrame(scene, hudRoot);
	createLighting(scene, [...room.collisionMeshes, ...pedestals.shadowCasters]);

	const exhibitSystem = new ExhibitSystem(EXHIBITS);
	const exhibitPanel = new ExhibitPanel(hudRoot);

	scene.onBeforeRenderObservable.add(() => {
		const activeExhibit = exhibitSystem.update(player.position);
		if (activeExhibit) {
			exhibitPanel.show(activeExhibit);
		} else {
			exhibitPanel.hide();
		}
	});

	return scene;
}
