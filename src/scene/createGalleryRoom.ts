import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import type { Scene } from "@babylonjs/core/scene";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";

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
	const floorMaterial = createMaterial(
		"polished-concrete-material",
		"#7b7b76",
		"#aaa9a3",
		scene,
	);
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
	const seamMaterial = createMaterial(
		"concrete-seam-material",
		"#4f4f4b",
		"#202020",
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

	createFloorSeams(scene, seamMaterial);

	const ceiling = MeshBuilder.CreateBox(
		"black-ceiling",
		{ width: ROOM_WIDTH, height: WALL_THICKNESS, depth: ROOM_DEPTH },
		scene,
	);
	ceiling.position = new Vector3(0, WALL_HEIGHT + WALL_THICKNESS / 2, 0);
	ceiling.material = ceilingMaterial;
	ceiling.receiveShadows = true;

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

function createFloorSeams(scene: Scene, material: StandardMaterial): void {
	for (let x = -ROOM_WIDTH / 2 + 2; x < ROOM_WIDTH / 2; x += 2) {
		const seam = MeshBuilder.CreateBox(
			`floor-seam-${x.toFixed(1)}`,
			{ width: 0.018, height: 0.006, depth: ROOM_DEPTH },
			scene,
		);
		seam.position = new Vector3(x, 0.004, 0);
		seam.material = material;
	}

	for (let z = -ROOM_DEPTH / 2 + 2; z < ROOM_DEPTH / 2; z += 2) {
		const seam = MeshBuilder.CreateBox(
			`floor-cross-seam-${z.toFixed(1)}`,
			{ width: ROOM_WIDTH, height: 0.005, depth: 0.014 },
			scene,
		);
		seam.position = new Vector3(0, 0.005, z);
		seam.material = material;
	}
}
