import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { SpotLight } from "@babylonjs/core/Lights/spotLight";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import type { Scene } from "@babylonjs/core/scene";
import { EXHIBITS } from "../exhibits/exhibitData";

const LIGHT_HEIGHT = 6.55;

export function createLighting(scene: Scene, shadowCasters: Mesh[]): void {
	scene.ambientColor = Color3.FromHexString("#1b1d21");

	const ambient = new HemisphericLight(
		"low-gallery-ambient",
		new Vector3(0, 1, 0),
		scene,
	);
	ambient.intensity = 0.18;
	ambient.diffuse = Color3.FromHexString("#8f969d");
	ambient.groundColor = Color3.FromHexString("#151719");

	for (const [index, exhibit] of EXHIBITS.entries()) {
		const position = new Vector3(
			exhibit.position.x,
			LIGHT_HEIGHT,
			exhibit.position.z,
		);
		createLightFixture(`exhibit-fixture-${exhibit.id}`, position, scene);
		createCeilingSpot(
			`exhibit-spot-${exhibit.id}`,
			position,
			index < 2 ? shadowCasters : [],
			scene,
		);
		createFloorGlow(`floor-glow-${exhibit.id}`, exhibit.position, scene);
	}
}

function createCeilingSpot(
	name: string,
	position: Vector3,
	shadowCasters: Mesh[],
	scene: Scene,
): void {
	const light = new SpotLight(
		name,
		position,
		new Vector3(0, -1, 0),
		Math.PI / 5.2,
		2.6,
		scene,
	);
	light.diffuse = Color3.FromHexString("#f5f6f2");
	light.specular = Color3.White();
	light.intensity = 2.6;
	light.range = 8.0;

	if (shadowCasters.length === 0) {
		return;
	}

	const shadows = new ShadowGenerator(1024, light);
	shadows.bias = 0.0008;
	shadows.usePoissonSampling = true;

	for (const mesh of shadowCasters) {
		shadows.addShadowCaster(mesh);
	}
}

function createFloorGlow(name: string, position: Vector3, scene: Scene): void {
	const light = new PointLight(
		`${name}-light`,
		new Vector3(position.x, 0.55, position.z),
		scene,
	);
	light.diffuse = Color3.FromHexString("#dfe4e7");
	light.specular = Color3.FromHexString("#ffffff");
	light.intensity = 0.72;
	light.range = 3.0;

	const glowMaterial = new StandardMaterial(`${name}-material`, scene);
	glowMaterial.diffuseColor = Color3.FromHexString("#dfe4e7");
	glowMaterial.emissiveColor = Color3.FromHexString("#dfe4e7");
	glowMaterial.alpha = 0.16;

	const glow = MeshBuilder.CreateCylinder(
		name,
		{ diameter: 2.8, height: 0.01, tessellation: 48 },
		scene,
	);
	glow.position = new Vector3(position.x, 0.012, position.z);
	glow.material = glowMaterial;
}

function createLightFixture(
	name: string,
	position: Vector3,
	scene: Scene,
): void {
	const fixtureMaterial = new StandardMaterial(
		`${name}-fixture-material`,
		scene,
	);
	fixtureMaterial.diffuseColor = Color3.FromHexString("#0a0b0d");
	fixtureMaterial.specularColor = Color3.FromHexString("#4f545a");

	const glowMaterial = new StandardMaterial(`${name}-glow-material`, scene);
	glowMaterial.diffuseColor = Color3.FromHexString("#f5f6f2");
	glowMaterial.emissiveColor = Color3.FromHexString("#f5f6f2");

	const fixture = MeshBuilder.CreateCylinder(
		name,
		{ diameter: 0.72, height: 0.18, tessellation: 32 },
		scene,
	);
	fixture.position = position;
	fixture.material = fixtureMaterial;

	const bulb = MeshBuilder.CreateSphere(
		`${name}-bulb`,
		{ diameter: 0.32, segments: 16 },
		scene,
	);
	bulb.position = new Vector3(position.x, position.y - 0.14, position.z);
	bulb.material = glowMaterial;
}
