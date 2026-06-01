import { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import { EXHIBITS } from "../exhibits/exhibitData";
import { ROOM_DEPTH, ROOM_WIDTH } from "../scene/createGalleryRoom";

const MOVE_SPEED_METERS_PER_SECOND = 4.5;
const MOVEMENT_ACCELERATION = 8;
const MOVEMENT_DECELERATION = 10;
const CROUCH_EASE_SPEED = 7;
const CAMERA_ROTATION_PER_FRAME = 0.032;
const CAMERA_PITCH_EASE_SPEED = 9;
const CAMERA_PITCH_DECELERATION = 12;
const EYE_HEIGHT_METERS = 1.6;
const CROUCH_EYE_HEIGHT_METERS = 1.25;
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
	"ShiftLeft",
	"ShiftRight",
]);

export class PlayerController {
	readonly camera: UniversalCamera;

	private readonly pressedKeys = new Set<string>();
	private readonly forward = new Vector3();
	private readonly right = new Vector3();
	private readonly movement = new Vector3();
	private readonly velocity = new Vector3();
	private readonly nextPosition = new Vector3();
	private currentEyeHeight = EYE_HEIGHT_METERS;
	private pitchVelocity = 0;

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
		hint.textContent = "WASD move · Arrow keys look · Shift crouch";
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
		const deltaSeconds = this.scene.getEngine().getDeltaTime() / 1000;
		const frameScale = deltaSeconds * 60;
		this.updateCameraRotation(deltaSeconds, frameScale);
		this.updateEyeHeight(deltaSeconds);
		this.camera.position.y = this.currentEyeHeight;
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

		this.updateVelocity(deltaSeconds);

		if (this.velocity.lengthSquared() < 0.000001) {
			this.velocity.setAll(0);
			return;
		}

		this.nextPosition
			.copyFrom(this.camera.position)
			.addInPlace(this.velocity.scale(deltaSeconds));
		this.constrainToRoom(this.nextPosition);
		this.constrainAgainstPedestals(this.nextPosition);
		this.nextPosition.y = this.currentEyeHeight;
		this.camera.position.copyFrom(this.nextPosition);
	}

	private updateEyeHeight(deltaSeconds: number): void {
		const targetEyeHeight = this.getTargetEyeHeight();
		const crouchAlpha = this.getEaseAlpha(CROUCH_EASE_SPEED, deltaSeconds);
		this.currentEyeHeight +=
			(targetEyeHeight - this.currentEyeHeight) * crouchAlpha;
	}

	private updateVelocity(deltaSeconds: number): void {
		const hasMovementInput = this.movement.lengthSquared() > 0;

		if (hasMovementInput) {
			this.movement.normalize().scaleInPlace(MOVE_SPEED_METERS_PER_SECOND);
		}

		const easeSpeed = hasMovementInput
			? MOVEMENT_ACCELERATION
			: MOVEMENT_DECELERATION;
		const movementAlpha = this.getEaseAlpha(easeSpeed, deltaSeconds);
		this.velocity.x += (this.movement.x - this.velocity.x) * movementAlpha;
		this.velocity.z += (this.movement.z - this.velocity.z) * movementAlpha;
	}

	private getEaseAlpha(speed: number, deltaSeconds: number): number {
		return 1 - Math.exp(-speed * deltaSeconds);
	}

	private getTargetEyeHeight(): number {
		return this.pressedKeys.has("ShiftLeft") ||
			this.pressedKeys.has("ShiftRight")
			? CROUCH_EYE_HEIGHT_METERS
			: EYE_HEIGHT_METERS;
	}

	private updateCameraRotation(deltaSeconds: number, frameScale: number): void {
		if (this.pressedKeys.has("ArrowLeft")) {
			this.camera.rotation.y -= CAMERA_ROTATION_PER_FRAME * frameScale;
		}
		if (this.pressedKeys.has("ArrowRight")) {
			this.camera.rotation.y += CAMERA_ROTATION_PER_FRAME * frameScale;
		}

		let targetPitchVelocity = 0;
		if (this.pressedKeys.has("ArrowUp")) {
			targetPitchVelocity -= CAMERA_ROTATION_PER_FRAME * 60;
		}
		if (this.pressedKeys.has("ArrowDown")) {
			targetPitchVelocity += CAMERA_ROTATION_PER_FRAME * 60;
		}

		const hasPitchInput = targetPitchVelocity !== 0;
		const easeSpeed = hasPitchInput
			? CAMERA_PITCH_EASE_SPEED
			: CAMERA_PITCH_DECELERATION;
		const pitchAlpha = this.getEaseAlpha(easeSpeed, deltaSeconds);
		this.pitchVelocity +=
			(targetPitchVelocity - this.pitchVelocity) * pitchAlpha;

		if (Math.abs(this.pitchVelocity) < 0.0001) {
			this.pitchVelocity = 0;
			return;
		}

		this.camera.rotation.x = Math.max(
			MIN_PITCH,
			Math.min(
				MAX_PITCH,
				this.camera.rotation.x + this.pitchVelocity * deltaSeconds,
			),
		);
		if (
			this.camera.rotation.x === MIN_PITCH ||
			this.camera.rotation.x === MAX_PITCH
		) {
			this.pitchVelocity = 0;
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
