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
import type { Exhibit } from "../exhibits/exhibitData";
import { EXHIBITS } from "../exhibits/exhibitData";
import { ROOM_DEPTH, ROOM_WIDTH } from "./createGalleryRoom";

const EXHIBIT_LIGHT_RIG = {
	lightHeight: 6.55,
	spotAngle: Math.PI / 3.9,
	spotExponent: 1.45,
	spotIntensity: 2.65,
	spotRange: 11.0,
	spillAngle: Math.PI / 2.55,
	spillExponent: 0.85,
	spillIntensity: 0.42,
	spillRange: 12.5,
	floorGlowHeight: 0.55,
	floorGlowIntensity: 0.84,
	floorGlowRange: 3.4,
	floorGlowDiameter: 3.2,
	fixtureDiameter: 0.72,
	bulbDiameter: 0.32,
};

export function createLighting(scene: Scene, shadowCasters: Mesh[]): void {
	scene.ambientColor = Color3.FromHexString("#3b414a");

	const ambient = new HemisphericLight(
		"low-gallery-ambient",
		new Vector3(0, 1, 0),
		scene,
	);
	ambient.intensity = 0.43;
	ambient.diffuse = Color3.FromHexString("#c2c9d0");
	ambient.groundColor = Color3.FromHexString("#6a7078");

	createCeilingTracks(scene);

	for (const exhibit of EXHIBITS) {
		createExhibitLightRig(exhibit, scene, shadowCasters);
	}

	createCornerFillLights(scene);
	createWarmWallBounceLights(scene);
}

function createExhibitLightRig(
	exhibit: Exhibit,
	scene: Scene,
	shadowCasters: Mesh[],
): void {
	const ceilingPosition = new Vector3(
		exhibit.position.x,
		EXHIBIT_LIGHT_RIG.lightHeight,
		exhibit.position.z,
	);

	createLightFixture(`exhibit-fixture-${exhibit.id}`, ceilingPosition, scene);
	createPrimaryDownlight(
		`exhibit-downlight-${exhibit.id}`,
		ceilingPosition,
		shadowCasters,
		scene,
	);
	createSoftSpillDownlight(
		`exhibit-spill-${exhibit.id}`,
		ceilingPosition,
		scene,
	);
	createFloorGlow(`floor-glow-${exhibit.id}`, exhibit.position, scene);
}

function createPrimaryDownlight(
	name: string,
	position: Vector3,
	shadowCasters: Mesh[],
	scene: Scene,
): void {
	const light = new SpotLight(
		name,
		position,
		new Vector3(0, -1, 0),
		EXHIBIT_LIGHT_RIG.spotAngle,
		EXHIBIT_LIGHT_RIG.spotExponent,
		scene,
	);
	light.diffuse = Color3.FromHexString("#f5f6f2");
	light.specular = Color3.White();
	light.intensity = EXHIBIT_LIGHT_RIG.spotIntensity;
	light.range = EXHIBIT_LIGHT_RIG.spotRange;

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

function createSoftSpillDownlight(
	name: string,
	position: Vector3,
	scene: Scene,
): void {
	const light = new SpotLight(
		name,
		position,
		new Vector3(0, -1, 0),
		EXHIBIT_LIGHT_RIG.spillAngle,
		EXHIBIT_LIGHT_RIG.spillExponent,
		scene,
	);
	light.diffuse = Color3.FromHexString("#ece7dc");
	light.specular = Color3.Black();
	light.intensity = EXHIBIT_LIGHT_RIG.spillIntensity;
	light.range = EXHIBIT_LIGHT_RIG.spillRange;
}

function createFloorGlow(name: string, position: Vector3, scene: Scene): void {
	const light = new PointLight(
		`${name}-light`,
		new Vector3(position.x, EXHIBIT_LIGHT_RIG.floorGlowHeight, position.z),
		scene,
	);
	light.diffuse = Color3.FromHexString("#dfe4e7");
	light.specular = Color3.FromHexString("#ffffff");
	light.intensity = EXHIBIT_LIGHT_RIG.floorGlowIntensity;
	light.range = EXHIBIT_LIGHT_RIG.floorGlowRange;

	const glowMaterial = new StandardMaterial(`${name}-material`, scene);
	glowMaterial.maxSimultaneousLights = 16;
	glowMaterial.diffuseColor = Color3.FromHexString("#dfe4e7");
	glowMaterial.emissiveColor = Color3.FromHexString("#dfe4e7");
	glowMaterial.alpha = 0.2;

	const glow = MeshBuilder.CreateCylinder(
		name,
		{
			diameter: EXHIBIT_LIGHT_RIG.floorGlowDiameter,
			height: 0.01,
			tessellation: 48,
		},
		scene,
	);
	glow.position = new Vector3(position.x, 0.012, position.z);
	glow.material = glowMaterial;
}

function createCeilingTracks(scene: Scene): void {
	const material = new StandardMaterial("ceiling-track-material", scene);
	material.diffuseColor = Color3.FromHexString("#08090a");
	material.specularColor = Color3.FromHexString("#3a3d42");

	const tracks = [
		["north-track", new Vector3(0, 6.82, -5.65)],
		["center-track", new Vector3(0, 6.82, 0)],
		["south-track", new Vector3(0, 6.82, 5.65)],
	] as const;

	for (const [name, position] of tracks) {
		const track = MeshBuilder.CreateBox(
			name,
			{ width: ROOM_WIDTH - 3, height: 0.08, depth: 0.12 },
			scene,
		);
		track.position = position;
		track.material = material;
	}
}

function createCornerFillLights(scene: Scene): void {
	const cornerInset = 2.5;
	const y = 2.2;
	const positions = [
		new Vector3(
			-ROOM_WIDTH / 2 + cornerInset,
			y,
			-ROOM_DEPTH / 2 + cornerInset,
		),
		new Vector3(ROOM_WIDTH / 2 - cornerInset, y, -ROOM_DEPTH / 2 + cornerInset),
		new Vector3(-ROOM_WIDTH / 2 + cornerInset, y, ROOM_DEPTH / 2 - cornerInset),
		new Vector3(ROOM_WIDTH / 2 - cornerInset, y, ROOM_DEPTH / 2 - cornerInset),
	];

	for (const [index, position] of positions.entries()) {
		const light = new PointLight(`corner-fill-${index + 1}`, position, scene);
		light.diffuse = Color3.FromHexString("#6f7680");
		light.specular = Color3.Black();
		light.intensity = 0.14;
		light.range = 6.5;
	}
}

function createWarmWallBounceLights(scene: Scene): void {
	const lights = [
		new Vector3(-ROOM_WIDTH / 2 + 1.8, 1.4, 0),
		new Vector3(ROOM_WIDTH / 2 - 1.8, 1.4, 0),
		new Vector3(0, 1.4, -ROOM_DEPTH / 2 + 1.8),
		new Vector3(0, 1.4, ROOM_DEPTH / 2 - 1.8),
	];

	for (const [index, position] of lights.entries()) {
		const light = new PointLight(
			`warm-wall-bounce-${index + 1}`,
			position,
			scene,
		);
		light.diffuse = Color3.FromHexString("#c8945f");
		light.specular = Color3.Black();
		light.intensity = 0.18;
		light.range = 7.5;
	}
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

	const cable = MeshBuilder.CreateCylinder(
		`${name}-cable`,
		{ diameter: 0.035, height: 0.36, tessellation: 12 },
		scene,
	);
	cable.position = new Vector3(position.x, position.y + 0.23, position.z);
	cable.material = fixtureMaterial;

	const fixture = MeshBuilder.CreateCylinder(
		name,
		{
			diameter: EXHIBIT_LIGHT_RIG.fixtureDiameter,
			height: 0.18,
			tessellation: 32,
		},
		scene,
	);
	fixture.position = position;
	fixture.material = fixtureMaterial;

	const bulb = MeshBuilder.CreateSphere(
		`${name}-bulb`,
		{ diameter: EXHIBIT_LIGHT_RIG.bulbDiameter, segments: 16 },
		scene,
	);
	bulb.position = new Vector3(position.x, position.y - 0.14, position.z);
	bulb.material = glowMaterial;
}
