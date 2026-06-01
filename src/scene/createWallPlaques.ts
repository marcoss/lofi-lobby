import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import type { Scene } from "@babylonjs/core/scene";
import { EXHIBITS } from "../exhibits/exhibitData";
import { ROOM_DEPTH, ROOM_WIDTH } from "./createGalleryRoom";

const PLAQUE_WIDTH = 1.34;
const PLAQUE_HEIGHT = 0.58;
const PLAQUE_Y = 1.65;
const WALL_OFFSET = 0.065;

export function createWallPlaques(scene: Scene): void {
	for (const exhibit of EXHIBITS) {
		const northWall = exhibit.position.z >= 0;
		const x = Math.max(
			-ROOM_WIDTH / 2 + PLAQUE_WIDTH,
			Math.min(ROOM_WIDTH / 2 - PLAQUE_WIDTH, exhibit.position.x),
		);
		const z = northWall
			? ROOM_DEPTH / 2 - WALL_OFFSET
			: -ROOM_DEPTH / 2 + WALL_OFFSET;

		const plaque = MeshBuilder.CreatePlane(
			`${exhibit.id}-wall-plaque`,
			{ width: PLAQUE_WIDTH, height: PLAQUE_HEIGHT },
			scene,
		);
		plaque.position = new Vector3(x, PLAQUE_Y, z);
		plaque.rotation.y = northWall ? Math.PI : 0;
		plaque.material = createPlaqueMaterial(
			exhibit.id,
			exhibit.title,
			exhibit.author,
			scene,
		);

		const frame = MeshBuilder.CreateBox(
			`${exhibit.id}-plaque-frame`,
			{
				width: PLAQUE_WIDTH + 0.08,
				height: PLAQUE_HEIGHT + 0.08,
				depth: 0.025,
			},
			scene,
		);
		frame.position = new Vector3(
			x,
			PLAQUE_Y,
			northWall ? z + 0.018 : z - 0.018,
		);
		frame.rotation.y = plaque.rotation.y;
		frame.material = createFrameMaterial(
			`${exhibit.id}-plaque-frame-material`,
			scene,
		);
	}
}

function createPlaqueMaterial(
	id: string,
	title: string,
	author: string,
	scene: Scene,
): StandardMaterial {
	const texture = new DynamicTexture(
		`${id}-plaque-texture`,
		{ width: 512, height: 224 },
		scene,
		true,
	);
	const context = texture.getContext();
	context.fillStyle = "#e7dfcf";
	context.fillRect(0, 0, 512, 224);
	context.strokeStyle = "#8b755c";
	context.lineWidth = 10;
	context.strokeRect(12, 12, 488, 200);
	context.fillStyle = "#2b241e";
	context.font = "bold 34px Georgia, serif";
	context.fillText(title, 38, 82);
	context.font = "24px Georgia, serif";
	context.fillText(author, 38, 124);
	context.font = "18px Georgia, serif";
	context.fillStyle = "#65584a";
	context.fillText("Collection study", 38, 166);
	texture.update();

	const material = new StandardMaterial(`${id}-plaque-material`, scene);
	material.diffuseTexture = texture;
	material.emissiveColor = Color3.FromHexString("#16120d");
	material.specularColor = Color3.FromHexString("#4a3a2b");
	return material;
}

function createFrameMaterial(name: string, scene: Scene): StandardMaterial {
	const material = new StandardMaterial(name, scene);
	material.diffuseColor = Color3.FromHexString("#3a2a1c");
	material.specularColor = Color3.FromHexString("#9f7d52");
	return material;
}
