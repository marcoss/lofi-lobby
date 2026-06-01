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
	const pedestalMaterial = new StandardMaterial("pedestal-material", scene);
	pedestalMaterial.diffuseColor = Color3.FromHexString("#f4f1ea");
	pedestalMaterial.specularColor = Color3.FromHexString("#8c887f");

	const collisionMeshes: Mesh[] = [];
	const shadowCasters: Mesh[] = [];

	for (const exhibit of EXHIBITS) {
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
		collisionMeshes.push(pedestal);
		shadowCasters.push(pedestal);

		const fruit = createFruit(exhibit.id, exhibit.color, scene);
		fruit.position = new Vector3(exhibit.position.x, 1.14, exhibit.position.z);
		shadowCasters.push(fruit);
	}

	return { collisionMeshes, shadowCasters };
}

function createFruit(id: string, color: string, scene: Scene): Mesh {
	const material = new StandardMaterial(`${id}-material`, scene);
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
