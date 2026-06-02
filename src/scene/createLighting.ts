import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { SpotLight } from "@babylonjs/core/Lights/spotLight";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import type { Scene } from "@babylonjs/core/scene";
import type { Exhibit } from "../exhibits/exhibitData";
import { EXHIBITS } from "../exhibits/exhibitData";
import { DOORWAY_WIDTH, ROOM_DEPTH, ROOM_WIDTH } from "./createGalleryRoom";

const EXHIBIT_LIGHT_RIG = {
	lightHeight: 6.55,
	spotAngle: Math.PI / 4.4,
	spotExponent: 1.75,
	spotIntensity: 3.15,
	spotRange: 9.5,
	spillAngle: Math.PI / 2.8,
	spillExponent: 1.0,
	spillIntensity: 0.26,
	spillRange: 10.5,
	floorGlowHeight: 0.45,
	floorGlowIntensity: 0.52,
	floorGlowRange: 3.0,
	floorGlowDiameter: 3.9,
	fixtureDiameter: 0.72,
	bulbDiameter: 0.42,
};

const WALL_LIGHT_RIG = {
	lightHeight: 5.9,
	wallTargetHeight: 1.8,
	wallInset: 1.35,
	angle: Math.PI / 5.2,
	exponent: 1.7,
	intensity: 0.92,
	range: 8.0,
	fixtureWidth: 0.42,
	glowWidth: 3.2,
	glowHeight: 1.9,
	glowOffset: 0.055,
};

export function createLighting(scene: Scene, shadowCasters: Mesh[]): void {
	scene.ambientColor = Color3.FromHexString("#535b66");

	const ambient = new HemisphericLight(
		"low-gallery-ambient",
		new Vector3(0, 1, 0),
		scene,
	);
	ambient.intensity = 0.58;
	ambient.diffuse = Color3.FromHexString("#d7dde4");
	ambient.groundColor = Color3.FromHexString("#858b94");

	createCeilingTracks(scene);

	for (const exhibit of EXHIBITS) {
		createExhibitLightRig(exhibit, scene, shadowCasters);
		createWallSpotlight(exhibit, scene);
	}

	createDoorwayRimLight(scene);
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
	light.diffuse = Color3.FromHexString("#ffe2ad");
	light.specular = Color3.FromHexString("#fff3d7");
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
	light.diffuse = Color3.FromHexString("#d99a55");
	light.specular = Color3.Black();
	light.intensity = EXHIBIT_LIGHT_RIG.spillIntensity;
	light.range = EXHIBIT_LIGHT_RIG.spillRange;
}

function createWallSpotlight(exhibit: Exhibit, scene: Scene): void {
	const northWall = exhibit.position.z >= 0;
	const wallZ = northWall ? ROOM_DEPTH / 2 - 0.08 : -ROOM_DEPTH / 2 + 0.08;
	const lightZ = northWall
		? ROOM_DEPTH / 2 - WALL_LIGHT_RIG.wallInset
		: -ROOM_DEPTH / 2 + WALL_LIGHT_RIG.wallInset;
	const position = new Vector3(
		exhibit.position.x,
		WALL_LIGHT_RIG.lightHeight,
		lightZ,
	);
	const target = new Vector3(
		exhibit.position.x,
		WALL_LIGHT_RIG.wallTargetHeight,
		wallZ,
	);
	const direction = target.subtract(position).normalize();
	const light = new SpotLight(
		`wall-spot-${exhibit.id}`,
		position,
		direction,
		WALL_LIGHT_RIG.angle,
		WALL_LIGHT_RIG.exponent,
		scene,
	);
	light.diffuse = Color3.FromHexString("#ffc978");
	light.specular = Color3.FromHexString("#ffe8bd");
	light.intensity = WALL_LIGHT_RIG.intensity * 0.72;
	light.range = WALL_LIGHT_RIG.range;
	createWallSpotFixture(
		`wall-spot-fixture-${exhibit.id}`,
		position,
		northWall,
		scene,
	);
	createWallLightGlow(`wall-spot-glow-${exhibit.id}`, target, northWall, scene);
}

function createWallLightGlow(
	name: string,
	position: Vector3,
	northWall: boolean,
	scene: Scene,
): void {
	const glow = MeshBuilder.CreatePlane(
		name,
		{ width: WALL_LIGHT_RIG.glowWidth, height: WALL_LIGHT_RIG.glowHeight },
		scene,
	);
	glow.position = new Vector3(
		position.x,
		position.y,
		northWall
			? position.z - WALL_LIGHT_RIG.glowOffset
			: position.z + WALL_LIGHT_RIG.glowOffset,
	);
	glow.rotation.y = northWall ? Math.PI : 0;
	glow.material = createWallGlowMaterial(name, scene);
}

function createWallGlowMaterial(name: string, scene: Scene): StandardMaterial {
	const texture = new DynamicTexture(
		`${name}-texture`,
		{ width: 256, height: 160 },
		scene,
		true,
	);
	const context = texture.getContext();
	const gradient = context.createRadialGradient(128, 80, 8, 128, 80, 128);
	gradient.addColorStop(0, "rgba(255, 201, 120, 0.28)");
	gradient.addColorStop(0.42, "rgba(255, 172, 88, 0.12)");
	gradient.addColorStop(1, "rgba(255, 172, 88, 0)");
	context.clearRect(0, 0, 256, 160);
	context.fillStyle = gradient;
	context.fillRect(0, 0, 256, 160);
	texture.hasAlpha = true;
	texture.update();

	const material = new StandardMaterial(`${name}-material`, scene);
	material.diffuseTexture = texture;
	material.emissiveTexture = texture;
	material.useAlphaFromDiffuseTexture = true;
	material.disableLighting = true;
	material.specularColor = Color3.Black();
	return material;
}

function createWallSpotFixture(
	name: string,
	position: Vector3,
	northWall: boolean,
	scene: Scene,
): void {
	const material = new StandardMaterial(`${name}-material`, scene);
	material.diffuseColor = Color3.FromHexString("#101216");
	material.specularColor = Color3.FromHexString("#555b63");

	const fixture = MeshBuilder.CreateBox(
		name,
		{ width: WALL_LIGHT_RIG.fixtureWidth, height: 0.16, depth: 0.24 },
		scene,
	);
	fixture.position = position;
	fixture.rotation.x = northWall ? Math.PI * 0.18 : -Math.PI * 0.18;
	fixture.material = material;
}

function createFloorGlow(name: string, position: Vector3, scene: Scene): void {
	const light = new PointLight(
		`${name}-light`,
		new Vector3(position.x, EXHIBIT_LIGHT_RIG.floorGlowHeight, position.z),
		scene,
	);
	light.diffuse = Color3.FromHexString("#f4b76d");
	light.specular = Color3.FromHexString("#ffdca3");
	light.intensity = EXHIBIT_LIGHT_RIG.floorGlowIntensity;
	light.range = EXHIBIT_LIGHT_RIG.floorGlowRange;

	const glowMaterial = new StandardMaterial(`${name}-material`, scene);
	glowMaterial.maxSimultaneousLights = 16;
	glowMaterial.diffuseColor = Color3.FromHexString("#f0a85b");
	glowMaterial.emissiveColor = Color3.FromHexString("#d78335");
	glowMaterial.alpha = 0.16;

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

function createDoorwayRimLight(scene: Scene): void {
	const x = ROOM_WIDTH / 2;
	const sideOffset = DOORWAY_WIDTH / 2 + 0.18;
	const light = new PointLight(
		"doorway-warm-rim",
		new Vector3(x, 2.4, 0),
		scene,
	);
	light.diffuse = Color3.FromHexString("#ffb45f");
	light.specular = Color3.Black();
	light.intensity = 0.9;
	light.range = 5.2;

	const material = new StandardMaterial("doorway-rim-material", scene);
	material.diffuseColor = Color3.FromHexString("#9d5c24");
	material.emissiveColor = Color3.FromHexString("#d28136");
	material.specularColor = Color3.Black();
	material.alpha = 0.46;

	for (const z of [-sideOffset, sideOffset]) {
		const rim = MeshBuilder.CreateBox(
			`doorway-rim-${z > 0 ? "north" : "south"}`,
			{ width: 0.06, height: 2.6, depth: 0.16 },
			scene,
		);
		rim.position = new Vector3(x, 1.3, z);
		rim.material = material;
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

	const trim = MeshBuilder.CreateCylinder(
		name,
		{
			diameter: EXHIBIT_LIGHT_RIG.fixtureDiameter,
			height: 0.045,
			tessellation: 40,
		},
		scene,
	);
	trim.position = new Vector3(position.x, position.y + 0.04, position.z);
	trim.material = fixtureMaterial;

	const diffuser = MeshBuilder.CreateCylinder(
		`${name}-diffuser`,
		{
			diameter: EXHIBIT_LIGHT_RIG.bulbDiameter,
			height: 0.018,
			tessellation: 40,
		},
		scene,
	);
	diffuser.position = new Vector3(position.x, position.y + 0.012, position.z);
	diffuser.material = glowMaterial;
}
