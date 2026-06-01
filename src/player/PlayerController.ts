import { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import { EXHIBITS } from "../exhibits/exhibitData";
import { ROOM_DEPTH, ROOM_WIDTH } from "../scene/createGalleryRoom";

const MOVE_SPEED_PER_FRAME = 0.075;
const CAMERA_ROTATION_PER_FRAME = 0.032;
const EYE_HEIGHT_METERS = 1.6;
const MIN_PITCH = -Math.PI / 2 + 0.08;
const MAX_PITCH = Math.PI / 2 - 0.08;
const ROOM_MARGIN = 0.45;
const PEDESTAL_BLOCK_RADIUS = 0.72;
const LOCAL_FORWARD = new Vector3(0, 0, 1);
const LOCAL_RIGHT = new Vector3(1, 0, 0);

const CONTROL_KEYS = new Set([
	"KeyW",
	"KeyA",
	"KeyS",
	"KeyD",
	"ArrowUp",
	"ArrowLeft",
	"ArrowDown",
	"ArrowRight",
]);

export class PlayerController {
	readonly camera: UniversalCamera;

	private readonly pressedKeys = new Set<string>();
	private readonly forward = new Vector3();
	private readonly right = new Vector3();
	private readonly movement = new Vector3();
	private readonly nextPosition = new Vector3();

	constructor(
		private readonly scene: Scene,
		private readonly canvas: HTMLCanvasElement,
		hudRoot: HTMLElement,
	) {
		this.camera = new UniversalCamera(
			"player-camera",
			new Vector3(0, EYE_HEIGHT_METERS, -3),
			scene,
		);
		this.camera.setTarget(new Vector3(0, EYE_HEIGHT_METERS, 0));
		this.camera.checkCollisions = false;
		this.camera.applyGravity = false;
		this.camera.inertia = 0;
		this.camera.minZ = 0.05;
		this.scene.activeCamera = this.camera;

		this.createControlsHint(hudRoot);
		this.bindInputs();
		this.scene.onBeforeRenderObservable.add(() => this.update());
	}

	get position(): Vector3 {
		return this.camera.position;
	}

	private createControlsHint(root: HTMLElement): void {
		const hint = document.createElement("div");
		hint.className = "controls-hint";
		hint.textContent = "WASD move · Arrow keys look";
		root.appendChild(hint);
	}

	private bindInputs(): void {
		window.addEventListener("keydown", (event) => {
			if (!CONTROL_KEYS.has(event.code)) {
				return;
			}

			event.preventDefault();
			this.pressedKeys.add(event.code);
		});

		window.addEventListener("keyup", (event) => {
			this.pressedKeys.delete(event.code);
		});

		window.addEventListener("blur", () => {
			this.pressedKeys.clear();
		});

		this.canvas.focus();
	}

	private update(): void {
		const frameScale = this.scene.getEngine().getDeltaTime() / 16.667;
		this.updateCameraRotation(frameScale);
		this.camera.position.y = EYE_HEIGHT_METERS;
		this.camera.getDirectionToRef(LOCAL_FORWARD, this.forward);
		this.camera.getDirectionToRef(LOCAL_RIGHT, this.right);

		this.forward.y = 0;
		this.right.y = 0;
		this.forward.normalize();
		this.right.normalize();
		this.movement.setAll(0);

		if (this.pressedKeys.has("KeyW")) {
			this.movement.addInPlace(this.forward);
		}
		if (this.pressedKeys.has("KeyS")) {
			this.movement.subtractInPlace(this.forward);
		}
		if (this.pressedKeys.has("KeyD")) {
			this.movement.addInPlace(this.right);
		}
		if (this.pressedKeys.has("KeyA")) {
			this.movement.subtractInPlace(this.right);
		}

		if (this.movement.lengthSquared() === 0) {
			return;
		}

		this.movement.normalize().scaleInPlace(MOVE_SPEED_PER_FRAME * frameScale);
		this.nextPosition.copyFrom(this.camera.position).addInPlace(this.movement);
		this.constrainToRoom(this.nextPosition);
		this.constrainAgainstPedestals(this.nextPosition);
		this.nextPosition.y = EYE_HEIGHT_METERS;
		this.camera.position.copyFrom(this.nextPosition);
	}

	private updateCameraRotation(frameScale: number): void {
		if (this.pressedKeys.has("ArrowLeft")) {
			this.camera.rotation.y -= CAMERA_ROTATION_PER_FRAME * frameScale;
		}
		if (this.pressedKeys.has("ArrowRight")) {
			this.camera.rotation.y += CAMERA_ROTATION_PER_FRAME * frameScale;
		}
		if (this.pressedKeys.has("ArrowUp")) {
			this.camera.rotation.x = Math.max(
				MIN_PITCH,
				this.camera.rotation.x - CAMERA_ROTATION_PER_FRAME * frameScale,
			);
		}
		if (this.pressedKeys.has("ArrowDown")) {
			this.camera.rotation.x = Math.min(
				MAX_PITCH,
				this.camera.rotation.x + CAMERA_ROTATION_PER_FRAME * frameScale,
			);
		}
	}

	private constrainToRoom(position: Vector3): void {
		const maxX = ROOM_WIDTH / 2 - ROOM_MARGIN;
		const maxZ = ROOM_DEPTH / 2 - ROOM_MARGIN;
		position.x = Math.max(-maxX, Math.min(maxX, position.x));
		position.z = Math.max(-maxZ, Math.min(maxZ, position.z));
	}

	private constrainAgainstPedestals(position: Vector3): void {
		for (const exhibit of EXHIBITS) {
			let dx = position.x - exhibit.position.x;
			let dz = position.z - exhibit.position.z;
			let distance = Math.hypot(dx, dz);

			if (distance >= PEDESTAL_BLOCK_RADIUS) {
				continue;
			}

			if (distance === 0) {
				dx = 1;
				dz = 0;
				distance = 1;
			}

			const scale = PEDESTAL_BLOCK_RADIUS / distance;
			position.x = exhibit.position.x + dx * scale;
			position.z = exhibit.position.z + dz * scale;
		}
	}
}
