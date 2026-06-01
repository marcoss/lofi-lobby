import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import type { Scene } from "@babylonjs/core/scene";
import { ROOM_DEPTH } from "./createGalleryRoom";

const YOUTUBE_VIDEO_ID = "6bPN0JyGfA4";
const EMBED_URL = `https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&loop=1&playlist=${YOUTUBE_VIDEO_ID}&mute=1&controls=0&playsinline=1&rel=0`;
const FRAME_POSITION = new Vector3(0, 3.35, ROOM_DEPTH / 2 - 0.04);
const FRAME_WIDTH = 4.8;
const FRAME_HEIGHT = 2.7;
const IFRAME_WIDTH = 480;
const IFRAME_HEIGHT = 270;

type Point = { x: number; y: number };

export class YouTubeFrame {
	private readonly iframe: HTMLIFrameElement;
	private readonly corners = [
		new Vector3(),
		new Vector3(),
		new Vector3(),
		new Vector3(),
	];

	constructor(
		private readonly scene: Scene,
		hudRoot: HTMLElement,
	) {
		this.createMeshes(scene);
		this.iframe = this.createAutoplayFrame(hudRoot);
		scene.onBeforeRenderObservable.add(() => this.updateFramePlacement());
	}

	private createMeshes(scene: Scene): void {
		const screenMaterial = new StandardMaterial(
			"youtube-screen-material",
			scene,
		);
		screenMaterial.diffuseColor = Color3.FromHexString("#050505");
		screenMaterial.emissiveColor = new Color3(0.02, 0.02, 0.02);
		screenMaterial.backFaceCulling = false;

		const frameMaterial = new StandardMaterial("youtube-frame-material", scene);
		frameMaterial.diffuseColor = Color3.FromHexString("#15110d");
		frameMaterial.specularColor = Color3.FromHexString("#d8b16b");

		const screen = MeshBuilder.CreatePlane(
			"youtube-video-backing",
			{ width: FRAME_WIDTH, height: FRAME_HEIGHT },
			scene,
		);
		screen.position = FRAME_POSITION.clone();
		screen.material = screenMaterial;

		this.createFrameBars(scene, frameMaterial);
	}

	private createFrameBars(scene: Scene, material: StandardMaterial): void {
		const bars: Array<
			[string, Vector3, { width: number; height: number; depth: number }]
		> = [
			[
				"youtube-frame-top",
				new Vector3(0, 1.48, -0.02),
				{ width: 5.15, height: 0.18, depth: 0.12 },
			],
			[
				"youtube-frame-bottom",
				new Vector3(0, -1.48, -0.02),
				{ width: 5.15, height: 0.18, depth: 0.12 },
			],
			[
				"youtube-frame-left",
				new Vector3(-2.57, 0, -0.02),
				{ width: 0.18, height: 2.95, depth: 0.12 },
			],
			[
				"youtube-frame-right",
				new Vector3(2.57, 0, -0.02),
				{ width: 0.18, height: 2.95, depth: 0.12 },
			],
		];

		for (const [name, offset, size] of bars) {
			const bar = MeshBuilder.CreateBox(name, size, scene);
			bar.position = FRAME_POSITION.add(offset);
			bar.material = material;
		}
	}

	private createAutoplayFrame(root: HTMLElement): HTMLIFrameElement {
		const iframe = document.createElement("iframe");
		iframe.className = "wall-youtube-frame";
		iframe.title = "Museum wall YouTube video";
		iframe.src = EMBED_URL;
		iframe.allow = "autoplay; encrypted-media; picture-in-picture";
		iframe.allowFullscreen = true;
		iframe.width = String(IFRAME_WIDTH);
		iframe.height = String(IFRAME_HEIGHT);
		root.appendChild(iframe);
		return iframe;
	}

	private updateFramePlacement(): void {
		const camera = this.scene.activeCamera;
		if (!camera) {
			return;
		}

		const transform = this.scene.getTransformMatrix();
		const canvas = this.scene.getEngine().getRenderingCanvas();
		if (!canvas) {
			return;
		}

		const bounds = canvas.getBoundingClientRect();
		const viewport = camera.viewport.toGlobal(bounds.width, bounds.height);
		const world = Matrix.IdentityReadOnly;
		const halfWidth = FRAME_WIDTH / 2;
		const halfHeight = FRAME_HEIGHT / 2;
		const worldCorners = [
			FRAME_POSITION.add(new Vector3(-halfWidth, halfHeight, 0)),
			FRAME_POSITION.add(new Vector3(halfWidth, halfHeight, 0)),
			FRAME_POSITION.add(new Vector3(halfWidth, -halfHeight, 0)),
			FRAME_POSITION.add(new Vector3(-halfWidth, -halfHeight, 0)),
		];

		for (let i = 0; i < worldCorners.length; i += 1) {
			Vector3.ProjectToRef(
				worldCorners[i],
				world,
				transform,
				viewport,
				this.corners[i],
			);
		}

		const visible = this.corners.every(
			(corner) => corner.z > 0 && corner.z < 1,
		);
		const points = this.corners.map((corner) => ({
			x: bounds.left + corner.x,
			y: bounds.top + corner.y,
		}));
		const matrix = toCssMatrix3d(
			[
				{ x: 0, y: 0 },
				{ x: IFRAME_WIDTH, y: 0 },
				{ x: IFRAME_WIDTH, y: IFRAME_HEIGHT },
				{ x: 0, y: IFRAME_HEIGHT },
			],
			points,
		);

		this.iframe.style.opacity = visible ? "1" : "0";
		this.iframe.style.pointerEvents = visible ? "auto" : "none";
		this.iframe.style.transform = matrix;
	}
}

function toCssMatrix3d(from: Point[], to: Point[]): string {
	const h = solveHomography(from, to);
	return `matrix3d(${h[0]}, ${h[3]}, 0, ${h[6]}, ${h[1]}, ${h[4]}, 0, ${h[7]}, 0, 0, 1, 0, ${h[2]}, ${h[5]}, 0, 1)`;
}

function solveHomography(from: Point[], to: Point[]): number[] {
	const rows: number[][] = [];

	for (let i = 0; i < 4; i += 1) {
		const { x, y } = from[i];
		const u = to[i].x;
		const v = to[i].y;
		rows.push([x, y, 1, 0, 0, 0, -u * x, -u * y, u]);
		rows.push([0, 0, 0, x, y, 1, -v * x, -v * y, v]);
	}

	for (let column = 0; column < 8; column += 1) {
		let pivot = column;
		for (let row = column + 1; row < 8; row += 1) {
			if (Math.abs(rows[row][column]) > Math.abs(rows[pivot][column])) {
				pivot = row;
			}
		}
		[rows[column], rows[pivot]] = [rows[pivot], rows[column]];

		const divisor = rows[column][column];
		if (Math.abs(divisor) < 1e-8) {
			return [1, 0, 0, 0, 1, 0, 0, 0];
		}

		for (let cell = column; cell < 9; cell += 1) {
			rows[column][cell] /= divisor;
		}
		for (let row = 0; row < 8; row += 1) {
			if (row === column) {
				continue;
			}
			const factor = rows[row][column];
			for (let cell = column; cell < 9; cell += 1) {
				rows[row][cell] -= factor * rows[column][cell];
			}
		}
	}

	return rows.map((row) => row[8]);
}
