import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import type { Scene } from "@babylonjs/core/scene";
import { EXHIBITS } from "../exhibits/exhibitData";

export type PedestalSetup = {
	collisionMeshes: Mesh[];
	shadowCasters: Mesh[];
};

export function createPedestals(scene: Scene): PedestalSetup {
	const contactShadowMaterial = createContactShadowMaterial(scene);
	const collisionMeshes: Mesh[] = [];
	const shadowCasters: Mesh[] = [];

	for (const [index, exhibit] of EXHIBITS.entries()) {
		const pedestalMaterial = createPedestalMaterial(index, scene);
		const pedestal = MeshBuilder.CreateCylinder(
			`${exhibit.id}-pedestal`,
			{ diameter: 0.82, height: 0.9, tessellation: 32 },
			scene,
		);
		pedestal.position = new Vector3(
			exhibit.position.x,
			0.45,
			exhibit.position.z,
		);
		pedestal.material = pedestalMaterial;
		pedestal.checkCollisions = true;
		pedestal.receiveShadows = true;
		createContactShadow(
			exhibit.id,
			exhibit.position,
			contactShadowMaterial,
			scene,
		);
		collisionMeshes.push(pedestal);
		shadowCasters.push(pedestal);

		const fruit = createFruit(exhibit.id, exhibit.color, scene);
		fruit.position = new Vector3(exhibit.position.x, 1.24, exhibit.position.z);
		shadowCasters.push(fruit);
	}

	return { collisionMeshes, shadowCasters };
}

function createPedestalMaterial(index: number, scene: Scene): StandardMaterial {
	const palette = ["#f4f1ea", "#eee9df", "#f7f2e7", "#ebe6dc", "#f1ede4"];
	const material = new StandardMaterial(
		`pedestal-material-${index + 1}`,
		scene,
	);
	material.maxSimultaneousLights = 16;
	material.diffuseColor = Color3.FromHexString(palette[index % palette.length]);
	material.specularColor = Color3.FromHexString("#8c887f");
	return material;
}

function createContactShadowMaterial(scene: Scene): StandardMaterial {
	const material = new StandardMaterial("soft-contact-shadow-material", scene);
	material.diffuseColor = Color3.Black();
	material.emissiveColor = Color3.Black();
	material.specularColor = Color3.Black();
	material.alpha = 0.26;
	return material;
}

function createContactShadow(
	id: string,
	position: Vector3,
	material: StandardMaterial,
	scene: Scene,
): void {
	const shadow = MeshBuilder.CreateCylinder(
		`${id}-soft-contact-shadow`,
		{ diameter: 1.35, height: 0.006, tessellation: 48 },
		scene,
	);
	shadow.position = new Vector3(position.x, 0.018, position.z);
	shadow.scaling = new Vector3(1, 0.02, 0.72);
	shadow.material = material;
}

function createFruit(id: string, color: string, scene: Scene): Mesh {
	const material = new StandardMaterial(`${id}-material`, scene);
	material.maxSimultaneousLights = 16;
	material.diffuseColor = Color3.FromHexString(color);
	material.specularColor = Color3.FromHexString("#2a2118");

	const fruit = MeshBuilder.CreateSphere(
		`${id}-fruit`,
		{ diameter: 0.48, segments: 24 },
		scene,
	);
	fruit.material = material;

	if (id === "banana") {
		fruit.scaling = new Vector3(1.45, 0.32, 0.38);
		fruit.rotation.z = Math.PI * 0.12;
	} else if (id === "pear") {
		fruit.scaling = new Vector3(0.82, 1.25, 0.82);
	} else if (id === "plum") {
		fruit.scaling = new Vector3(1.05, 0.86, 0.9);
	}

	return fruit;
}
