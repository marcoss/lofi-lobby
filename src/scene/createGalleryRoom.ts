import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import type { Scene } from "@babylonjs/core/scene";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import floorTextureUrl from "../assets/laminate_floor_02_diff_1k.webp";

export type GalleryRoom = {
	floor: Mesh;
	collisionMeshes: Mesh[];
	shadowReceivers: Mesh[];
};

export const ROOM_WIDTH = 28;
export const ROOM_DEPTH = 18;
const WALL_HEIGHT = 7;
const WALL_THICKNESS = 0.35;

export function createGalleryRoom(scene: Scene): GalleryRoom {
	const floorMaterial = createFloorMaterial(scene);
	const northWallMaterial = createMaterial(
		"north-charcoal-wall",
		"#33383e",
		"#272b30",
		scene,
	);
	const southWallMaterial = createMaterial(
		"south-slate-wall",
		"#303b45",
		"#272f36",
		scene,
	);
	const eastWallMaterial = createMaterial(
		"east-graphite-wall",
		"#3d4041",
		"#2c2f30",
		scene,
	);
	const westWallMaterial = createMaterial(
		"west-blueblack-wall",
		"#29353f",
		"#222b33",
		scene,
	);
	const ceilingMaterial = createMaterial(
		"black-ceiling-material",
		"#050506",
		"#202024",
		scene,
	);
	const baseboardMaterial = createMaterial(
		"warm-wood-baseboard-material",
		"#2d2118",
		"#5f4530",
		scene,
	);
	const ceilingDetailMaterial = createMaterial(
		"ceiling-detail-material",
		"#111316",
		"#555b62",
		scene,
	);
	const floor = MeshBuilder.CreateGround(
		"floor",
		{ width: ROOM_WIDTH, height: ROOM_DEPTH },
		scene,
	);
	floor.material = floorMaterial;
	floor.checkCollisions = false;
	floor.receiveShadows = true;

	createBaseboards(scene, baseboardMaterial);

	const ceiling = MeshBuilder.CreateBox(
		"black-ceiling",
		{ width: ROOM_WIDTH, height: WALL_THICKNESS, depth: ROOM_DEPTH },
		scene,
	);
	ceiling.position = new Vector3(0, WALL_HEIGHT + WALL_THICKNESS / 2, 0);
	ceiling.material = ceilingMaterial;
	ceiling.receiveShadows = true;
	createCeilingDetails(scene, ceilingDetailMaterial);

	const walls = [
		createWall(
			"north-wall",
			new Vector3(0, WALL_HEIGHT / 2, ROOM_DEPTH / 2 + WALL_THICKNESS / 2),
			ROOM_WIDTH,
			WALL_HEIGHT,
			WALL_THICKNESS,
			northWallMaterial,
			scene,
		),
		createWall(
			"south-wall",
			new Vector3(0, WALL_HEIGHT / 2, -ROOM_DEPTH / 2 - WALL_THICKNESS / 2),
			ROOM_WIDTH,
			WALL_HEIGHT,
			WALL_THICKNESS,
			southWallMaterial,
			scene,
		),
		createWall(
			"east-wall",
			new Vector3(ROOM_WIDTH / 2 + WALL_THICKNESS / 2, WALL_HEIGHT / 2, 0),
			WALL_THICKNESS,
			WALL_HEIGHT,
			ROOM_DEPTH + WALL_THICKNESS * 2,
			eastWallMaterial,
			scene,
		),
		createWall(
			"west-wall",
			new Vector3(-ROOM_WIDTH / 2 - WALL_THICKNESS / 2, WALL_HEIGHT / 2, 0),
			WALL_THICKNESS,
			WALL_HEIGHT,
			ROOM_DEPTH + WALL_THICKNESS * 2,
			westWallMaterial,
			scene,
		),
	];

	return {
		floor,
		collisionMeshes: [floor, ...walls, ceiling],
		shadowReceivers: [floor, ...walls, ceiling],
	};
}

function createMaterial(
	name: string,
	diffuse: string,
	specular: string,
	scene: Scene,
): StandardMaterial {
	const material = new StandardMaterial(name, scene);
	material.maxSimultaneousLights = 16;
	material.diffuseColor = Color3.FromHexString(diffuse);
	material.specularColor = Color3.FromHexString(specular);
	return material;
}

function createFloorMaterial(scene: Scene): StandardMaterial {
	const material = createMaterial(
		"laminate-floor-material",
		"#ffffff",
		"#6c5540",
		scene,
	);
	const texture = new Texture(floorTextureUrl, scene);
	texture.uScale = ROOM_WIDTH / 2.4;
	texture.vScale = ROOM_DEPTH / 2.4;
	material.diffuseTexture = texture;
	material.specularPower = 48;
	return material;
}

function createWall(
	name: string,
	position: Vector3,
	width: number,
	height: number,
	depth: number,
	material: StandardMaterial,
	scene: Scene,
): Mesh {
	const wall = MeshBuilder.CreateBox(name, { width, height, depth }, scene);
	wall.position = position;
	wall.material = material;
	wall.checkCollisions = false;
	wall.receiveShadows = true;
	return wall;
}

function createCeilingDetails(scene: Scene, material: StandardMaterial): void {
	for (let z = -ROOM_DEPTH / 2 + 2.2; z <= ROOM_DEPTH / 2 - 2.2; z += 2.2) {
		const rafter = MeshBuilder.CreateBox(
			`ceiling-rafter-${z.toFixed(1)}`,
			{ width: ROOM_WIDTH - 1.2, height: 0.16, depth: 0.12 },
			scene,
		);
		rafter.position = new Vector3(0, WALL_HEIGHT - 0.08, z);
		rafter.material = material;
	}

	for (const x of [-5.5, 5.5]) {
		const conduit = MeshBuilder.CreateCylinder(
			`ceiling-conduit-${x}`,
			{ diameter: 0.07, height: ROOM_DEPTH - 1.8, tessellation: 12 },
			scene,
		);
		conduit.position = new Vector3(x, WALL_HEIGHT - 0.22, 0);
		conduit.rotation.x = Math.PI / 2;
		conduit.material = material;
	}
}

function createBaseboards(scene: Scene, material: StandardMaterial): void {
	const height = 0.18;
	const thickness = 0.08;
	const y = height / 2;
	const inset = 0.04;
	const boards = [
		[
			"north-baseboard",
			new Vector3(0, y, ROOM_DEPTH / 2 - inset),
			{ width: ROOM_WIDTH, height, depth: thickness },
		],
		[
			"south-baseboard",
			new Vector3(0, y, -ROOM_DEPTH / 2 + inset),
			{ width: ROOM_WIDTH, height, depth: thickness },
		],
		[
			"east-baseboard",
			new Vector3(ROOM_WIDTH / 2 - inset, y, 0),
			{ width: thickness, height, depth: ROOM_DEPTH },
		],
		[
			"west-baseboard",
			new Vector3(-ROOM_WIDTH / 2 + inset, y, 0),
			{ width: thickness, height, depth: ROOM_DEPTH },
		],
	] as const;

	for (const [name, position, size] of boards) {
		const board = MeshBuilder.CreateBox(name, size, scene);
		board.position = position;
		board.material = material;
		board.receiveShadows = true;
	}
}
