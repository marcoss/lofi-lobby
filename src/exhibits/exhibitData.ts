import { Vector3 } from "@babylonjs/core/Maths/math.vector";

export type Exhibit = {
	id: string;
	title: string;
	author: string;
	position: Vector3;
	radius: number;
	color: string;
};

export const EXHIBITS: Exhibit[] = [
	{
		id: "banana",
		title: "Banana",
		author: "Jim Dean",
		position: new Vector3(-10, 0, -5.5),
		radius: 1.5,
		color: "#f1c84b",
	},
	{
		id: "apple",
		title: "Apple Study",
		author: "Mira Stone",
		position: new Vector3(-4.8, 0, 5.8),
		radius: 1.5,
		color: "#c94335",
	},
	{
		id: "pear",
		title: "Pear in Warm Light",
		author: "Owen Vale",
		position: new Vector3(4.8, 0, -5.8),
		radius: 1.5,
		color: "#9dbf58",
	},
	{
		id: "orange",
		title: "Small Orange",
		author: "Nia Cross",
		position: new Vector3(10, 0, 5.5),
		radius: 1.5,
		color: "#e68b2d",
	},
];
