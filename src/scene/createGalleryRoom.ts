import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import type { Scene } from "@babylonjs/core/scene";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import floorTextureUrl from "../assets/herringbone_parquet_diff_1k.webp";
import wallTextureUrl from "../assets/plastered_wall_05_diff_1k.webp";

export type GalleryRoom = {
	floor: Mesh;
	collisionMeshes: Mesh[];
	shadowReceivers: Mesh[];
};

export type RoomDefinition = {
	id: string;
	name: string;
	center: Vector3;
};

type Opening = {
	center: number;
	width: number;
};

type SegmentSpec = {
	name: string;
	position: Vector3;
	width: number;
	height: number;
	depth: number;
};

export const ROOM_WIDTH = 28;
export const ROOM_DEPTH = 18;
export const ROOM_COUNT = 2;
export const CONNECTED_ROOM_MIN_X = -ROOM_WIDTH / 2;
export const CONNECTED_ROOM_MAX_X = ROOM_WIDTH * (ROOM_COUNT - 0.5);
const WALL_HEIGHT = 7;
const WALL_THICKNESS = 0.35;
export const DOORWAY_WIDTH = 5.2;

export const ROOMS: RoomDefinition[] = [
	{
		id: "room-west-gallery",
		name: "west-gallery",
		center: new Vector3(0, 0, 0),
	},
	{
		id: "room-east-gallery",
		name: "east-gallery",
		center: new Vector3(ROOM_WIDTH, 0, 0),
	},
];

export function getRoomIdAtPosition(position: Vector3): string {
	const room = ROOMS.find(
		(candidate) =>
			Math.abs(position.x - candidate.center.x) <= ROOM_WIDTH / 2 &&
			Math.abs(position.z - candidate.center.z) <= ROOM_DEPTH / 2,
	);
	return room?.id ?? "unknown-room";
}

export function createGalleryRoom(scene: Scene): GalleryRoom {
	const floorMaterial = createFloorMaterial(scene);
	const wallMaterial = createWallMaterial(scene);
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

	const floors = ROOMS.map((room) => createFloor(room, floorMaterial, scene));
	const ceilings = ROOMS.map((room) =>
		createCeiling(room, ceilingMaterial, scene),
	);
	const walls = createRoomWalls(wallMaterial, scene);

	for (const room of ROOMS) {
		createCeilingDetails(room, scene, ceilingDetailMaterial);
		createBaseboards(room, scene, baseboardMaterial);
	}
	createSharedWallBaseboards(scene, baseboardMaterial);

	return {
		floor: floors[0],
		collisionMeshes: [...floors, ...walls, ...ceilings],
		shadowReceivers: [...floors, ...walls, ...ceilings],
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
		"herringbone-parquet-material",
		"#ffffff",
		"#7b5c3f",
		scene,
	);
	const texture = new Texture(floorTextureUrl, scene);
	texture.uScale = ROOM_WIDTH / 3.2;
	texture.vScale = ROOM_DEPTH / 3.2;
	material.diffuseTexture = texture;
	material.specularPower = 56;
	return material;
}

function createWallMaterial(scene: Scene): StandardMaterial {
	const material = createMaterial(
		"plastered-wall-material",
		"#8f877c",
		"#27231f",
		scene,
	);
	const texture = new Texture(wallTextureUrl, scene);
	texture.uScale = 6;
	texture.vScale = 2.2;
	material.diffuseTexture = texture;
	material.specularPower = 14;
	return material;
}

function createFloor(
	room: RoomDefinition,
	material: StandardMaterial,
	scene: Scene,
): Mesh {
	const floor = MeshBuilder.CreateGround(
		`${room.name}-floor`,
		{ width: ROOM_WIDTH, height: ROOM_DEPTH },
		scene,
	);
	floor.position.x = room.center.x;
	floor.position.z = room.center.z;
	floor.material = material;
	floor.checkCollisions = false;
	floor.receiveShadows = true;
	return floor;
}

function createCeiling(
	room: RoomDefinition,
	material: StandardMaterial,
	scene: Scene,
): Mesh {
	const ceiling = MeshBuilder.CreateBox(
		`${room.name}-black-ceiling`,
		{ width: ROOM_WIDTH, height: WALL_THICKNESS, depth: ROOM_DEPTH },
		scene,
	);
	ceiling.position = new Vector3(
		room.center.x,
		WALL_HEIGHT + WALL_THICKNESS / 2,
		room.center.z,
	);
	ceiling.material = material;
	ceiling.receiveShadows = true;
	return ceiling;
}

function createRoomWalls(material: StandardMaterial, scene: Scene): Mesh[] {
	const walls: Mesh[] = [];

	for (const room of ROOMS) {
		walls.push(
			createWall(
				`${room.name}-north-wall`,
				new Vector3(
					room.center.x,
					WALL_HEIGHT / 2,
					room.center.z + ROOM_DEPTH / 2 + WALL_THICKNESS / 2,
				),
				ROOM_WIDTH,
				WALL_HEIGHT,
				WALL_THICKNESS,
				material,
				scene,
			),
			createWall(
				`${room.name}-south-wall`,
				new Vector3(
					room.center.x,
					WALL_HEIGHT / 2,
					room.center.z - ROOM_DEPTH / 2 - WALL_THICKNESS / 2,
				),
				ROOM_WIDTH,
				WALL_HEIGHT,
				WALL_THICKNESS,
				material,
				scene,
			),
		);
	}

	walls.push(
		createWall(
			"west-exterior-wall",
			new Vector3(-ROOM_WIDTH / 2 - WALL_THICKNESS / 2, WALL_HEIGHT / 2, 0),
			WALL_THICKNESS,
			WALL_HEIGHT,
			ROOM_DEPTH + WALL_THICKNESS * 2,
			material,
			scene,
		),
		createWall(
			"east-exterior-wall",
			new Vector3(ROOM_WIDTH * 1.5 + WALL_THICKNESS / 2, WALL_HEIGHT / 2, 0),
			WALL_THICKNESS,
			WALL_HEIGHT,
			ROOM_DEPTH + WALL_THICKNESS * 2,
			material,
			scene,
		),
		...createWallSegments(
			"gallery-connector-wall",
			ROOM_WIDTH / 2,
			ROOM_DEPTH + WALL_THICKNESS * 2,
			[{ center: 0, width: DOORWAY_WIDTH }],
			material,
			scene,
		),
	);

	return walls;
}

function createWallSegments(
	name: string,
	x: number,
	depth: number,
	openings: Opening[],
	material: StandardMaterial,
	scene: Scene,
): Mesh[] {
	return getSolidSegments(depth, openings).map((segment, index) =>
		createWall(
			`${name}-${index + 1}`,
			new Vector3(x, WALL_HEIGHT / 2, segment.center),
			WALL_THICKNESS,
			WALL_HEIGHT,
			segment.width,
			material,
			scene,
		),
	);
}

function getSolidSegments(
	length: number,
	openings: Opening[],
): { center: number; width: number }[] {
	let cursor = -length / 2;
	const segments: { center: number; width: number }[] = [];
	const sortedOpenings = [...openings].sort((a, b) => a.center - b.center);

	for (const opening of sortedOpenings) {
		const openingStart = opening.center - opening.width / 2;
		const openingEnd = opening.center + opening.width / 2;
		if (openingStart > cursor) {
			segments.push({
				center: (cursor + openingStart) / 2,
				width: openingStart - cursor,
			});
		}
		cursor = Math.max(cursor, openingEnd);
	}

	if (cursor < length / 2) {
		segments.push({
			center: (cursor + length / 2) / 2,
			width: length / 2 - cursor,
		});
	}

	return segments.filter((segment) => segment.width > 0.01);
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

function createCeilingDetails(
	room: RoomDefinition,
	scene: Scene,
	material: StandardMaterial,
): void {
	for (let z = -ROOM_DEPTH / 2 + 2.2; z <= ROOM_DEPTH / 2 - 2.2; z += 2.2) {
		const rafter = MeshBuilder.CreateBox(
			`${room.name}-ceiling-rafter-${z.toFixed(1)}`,
			{ width: ROOM_WIDTH - 1.2, height: 0.16, depth: 0.12 },
			scene,
		);
		rafter.position = new Vector3(
			room.center.x,
			WALL_HEIGHT - 0.08,
			room.center.z + z,
		);
		rafter.material = material;
	}

	for (const x of [-5.5, 5.5]) {
		const conduit = MeshBuilder.CreateCylinder(
			`${room.name}-ceiling-conduit-${x}`,
			{ diameter: 0.07, height: ROOM_DEPTH - 1.8, tessellation: 12 },
			scene,
		);
		conduit.position = new Vector3(
			room.center.x + x,
			WALL_HEIGHT - 0.22,
			room.center.z,
		);
		conduit.rotation.x = Math.PI / 2;
		conduit.material = material;
	}
}

function createBaseboards(
	room: RoomDefinition,
	scene: Scene,
	material: StandardMaterial,
): void {
	const height = 0.18;
	const thickness = 0.08;
	const y = height / 2;
	const inset = 0.04;
	const boards: SegmentSpec[] = [
		{
			name: `${room.name}-north-baseboard`,
			position: new Vector3(
				room.center.x,
				y,
				room.center.z + ROOM_DEPTH / 2 - inset,
			),
			width: ROOM_WIDTH,
			height,
			depth: thickness,
		},
		{
			name: `${room.name}-south-baseboard`,
			position: new Vector3(
				room.center.x,
				y,
				room.center.z - ROOM_DEPTH / 2 + inset,
			),
			width: ROOM_WIDTH,
			height,
			depth: thickness,
		},
	];

	if (room.name === "west-gallery") {
		boards.push({
			name: "west-exterior-baseboard",
			position: new Vector3(-ROOM_WIDTH / 2 + inset, y, room.center.z),
			width: thickness,
			height,
			depth: ROOM_DEPTH,
		});
	} else {
		boards.push({
			name: "east-exterior-baseboard",
			position: new Vector3(ROOM_WIDTH * 1.5 - inset, y, room.center.z),
			width: thickness,
			height,
			depth: ROOM_DEPTH,
		});
	}

	for (const board of boards) {
		createBaseboard(board, scene, material);
	}
}

function createSharedWallBaseboards(
	scene: Scene,
	material: StandardMaterial,
): void {
	const height = 0.18;
	const y = height / 2;
	const thickness = 0.08;
	const x = ROOM_WIDTH / 2;

	for (const [index, segment] of getSolidSegments(ROOM_DEPTH, [
		{ center: 0, width: DOORWAY_WIDTH },
	]).entries()) {
		createBaseboard(
			{
				name: `gallery-connector-baseboard-${index + 1}`,
				position: new Vector3(x, y, segment.center),
				width: thickness,
				height,
				depth: segment.width,
			},
			scene,
			material,
		);
	}
}

function createBaseboard(
	spec: SegmentSpec,
	scene: Scene,
	material: StandardMaterial,
): void {
	const board = MeshBuilder.CreateBox(
		spec.name,
		{ width: spec.width, height: spec.height, depth: spec.depth },
		scene,
	);
	board.position = spec.position;
	board.material = material;
	board.receiveShadows = true;
}
