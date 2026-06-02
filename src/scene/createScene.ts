import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Scene } from "@babylonjs/core/scene";
import type { Engine } from "@babylonjs/core/Engines/engine";
import { ExhibitSystem } from "../exhibits/ExhibitSystem";
import { EXHIBITS } from "../exhibits/exhibitData";
import { PlayerController } from "../player/PlayerController";
import { DebugStats } from "../ui/DebugStats";
import { ExhibitPanel } from "../ui/ExhibitPanel";
import { createGalleryRoom, getRoomIdAtPosition } from "./createGalleryRoom";
import { createLighting } from "./createLighting";
import { createPedestals } from "./createPedestals";
import { createWallPlaques } from "./createWallPlaques";
import { YouTubeFrame } from "./createYouTubeFrame";

export function createScene(
	engine: Engine,
	canvas: HTMLCanvasElement,
	hudRoot: HTMLElement,
): Scene {
	const scene = new Scene(engine);
	scene.clearColor = new Color4(0.02, 0.022, 0.026, 1);
	scene.collisionsEnabled = true;
	scene.fogMode = Scene.FOGMODE_EXP2;
	scene.fogDensity = 0.011;
	scene.fogColor = Color3.FromHexString("#15181d");

	const player = new PlayerController(scene, canvas, hudRoot);
	const room = createGalleryRoom(scene);
	const pedestals = createPedestals(scene);
	createWallPlaques(scene);
	const youtubeFrame = new YouTubeFrame(scene, hudRoot, () =>
		getRoomIdAtPosition(player.position),
	);
	createLighting(scene, [...room.collisionMeshes, ...pedestals.shadowCasters]);

	const exhibitSystem = new ExhibitSystem(EXHIBITS);
	const exhibitPanel = new ExhibitPanel(hudRoot);
	const debugStats = new DebugStats(hudRoot, {
		getRoomId: () => getRoomIdAtPosition(player.position),
		getPlayerPosition: () => player.position,
		getMediaFrameDebug: () => youtubeFrame.getDebugInfo(),
	});

	scene.onBeforeRenderObservable.add(() => {
		debugStats.update(performance.now());
		const activeExhibit = exhibitSystem.update(player.position);
		pedestals.updateFloating(activeExhibit?.id ?? null);
		if (activeExhibit) {
			exhibitPanel.show(activeExhibit);
		} else {
			exhibitPanel.hide();
		}
	});

	return scene;
}
