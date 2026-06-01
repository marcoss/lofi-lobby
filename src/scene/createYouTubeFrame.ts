import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import type { Scene } from "@babylonjs/core/scene";
import { ROOM_DEPTH } from "./createGalleryRoom";

const YOUTUBE_VIDEO_ID = "jNQXAC9IVRw";
const THUMBNAIL_URL = `https://img.youtube.com/vi/${YOUTUBE_VIDEO_ID}/hqdefault.jpg`;
const EMBED_URL = `https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&rel=0`;
const FRAME_POSITION = new Vector3(0, 3.35, ROOM_DEPTH / 2 - 0.04);
const ACTIVATION_DISTANCE = 4;

export class YouTubeFrame {
	private readonly prompt: HTMLDivElement;
	private readonly modal: HTMLDivElement;
	private isNearby = false;

	constructor(
		scene: Scene,
		hudRoot: HTMLElement,
		private readonly playerPosition: Vector3,
	) {
		this.createMeshes(scene);
		this.prompt = this.createPrompt(hudRoot);
		this.modal = this.createModal(hudRoot);
		this.bindInput();
		scene.onBeforeRenderObservable.add(() => this.updatePrompt());
	}

	private createMeshes(scene: Scene): void {
		const screenMaterial = new StandardMaterial("youtube-screen-material", scene);
		screenMaterial.diffuseTexture = new Texture(THUMBNAIL_URL, scene, true, false);
		screenMaterial.emissiveColor = new Color3(0.22, 0.2, 0.18);
		screenMaterial.backFaceCulling = false;

		const frameMaterial = new StandardMaterial("youtube-frame-material", scene);
		frameMaterial.diffuseColor = Color3.FromHexString("#15110d");
		frameMaterial.specularColor = Color3.FromHexString("#d8b16b");

		const screen = MeshBuilder.CreatePlane(
			"youtube-video-thumbnail",
			{ width: 4.8, height: 2.7 },
			scene,
		);
		screen.position = FRAME_POSITION.clone();
		screen.material = screenMaterial;

		const playButton = MeshBuilder.CreateDisc(
			"youtube-play-button",
			{ radius: 0.45, tessellation: 48 },
			scene,
		);
		playButton.position = FRAME_POSITION.add(new Vector3(0, 0, -0.015));
		playButton.material = this.createPlayMaterial(scene);

		this.createFrameBars(scene, frameMaterial);
	}

	private createPlayMaterial(scene: Scene): StandardMaterial {
		const material = new StandardMaterial("youtube-play-material", scene);
		material.diffuseColor = Color3.FromHexString("#f2efe8");
		material.emissiveColor = Color3.FromHexString("#a83232");
		material.alpha = 0.86;
		material.backFaceCulling = false;
		return material;
	}

	private createFrameBars(scene: Scene, material: StandardMaterial): void {
		const bars: Array<[string, Vector3, { width: number; height: number; depth: number }]> = [
			["youtube-frame-top", new Vector3(0, 1.48, -0.02), { width: 5.15, height: 0.18, depth: 0.12 }],
			["youtube-frame-bottom", new Vector3(0, -1.48, -0.02), { width: 5.15, height: 0.18, depth: 0.12 }],
			["youtube-frame-left", new Vector3(-2.57, 0, -0.02), { width: 0.18, height: 2.95, depth: 0.12 }],
			["youtube-frame-right", new Vector3(2.57, 0, -0.02), { width: 0.18, height: 2.95, depth: 0.12 }],
		];

		for (const [name, offset, size] of bars) {
			const bar = MeshBuilder.CreateBox(name, size, scene);
			bar.position = FRAME_POSITION.add(offset);
			bar.material = material;
		}
	}

	private createPrompt(root: HTMLElement): HTMLDivElement {
		const prompt = document.createElement("div");
		prompt.className = "video-frame-prompt";
		prompt.textContent = "Press E to watch video";
		root.appendChild(prompt);
		return prompt;
	}

	private createModal(root: HTMLElement): HTMLDivElement {
		const modal = document.createElement("div");
		modal.className = "video-modal";

		const card = document.createElement("div");
		card.className = "video-modal__card";

		const closeButton = document.createElement("button");
		closeButton.className = "video-modal__close";
		closeButton.type = "button";
		closeButton.setAttribute("aria-label", "Close video");
		closeButton.textContent = "×";
		closeButton.addEventListener("click", () => this.close());

		const iframe = document.createElement("iframe");
		iframe.title = "Museum wall YouTube video";
		iframe.allow = "autoplay; encrypted-media; picture-in-picture";
		iframe.allowFullscreen = true;

		card.append(closeButton, iframe);
		modal.appendChild(card);
		root.appendChild(modal);
		return modal;
	}

	private bindInput(): void {
		window.addEventListener("keydown", (event) => {
			if (event.code === "KeyE" && this.isNearby) {
				event.preventDefault();
				this.open();
			}
			if (event.code === "Escape") {
				this.close();
			}
		});
	}

	private updatePrompt(): void {
		this.isNearby = Vector3.Distance(this.playerPosition, FRAME_POSITION) <= ACTIVATION_DISTANCE;
		this.prompt.classList.toggle("visible", this.isNearby && !this.modal.classList.contains("visible"));
	}

	private open(): void {
		this.modal.classList.add("visible");
		this.prompt.classList.remove("visible");
		const iframe = this.modal.querySelector("iframe");
		if (iframe) {
			iframe.src = EMBED_URL;
		}
	}

	private close(): void {
		this.modal.classList.remove("visible");
		const iframe = this.modal.querySelector("iframe");
		if (iframe) {
			iframe.src = "";
		}
	}
}
