import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Exhibit } from "./exhibitData";

export class ExhibitSystem {
	private activeExhibit: Exhibit | null = null;

	constructor(private readonly exhibits: Exhibit[]) {}

	update(playerPosition: Vector3): Exhibit | null {
		let nearest: Exhibit | null = null;
		let nearestDistance = Number.POSITIVE_INFINITY;

		for (const exhibit of this.exhibits) {
			const distance = Math.hypot(
				playerPosition.x - exhibit.position.x,
				playerPosition.z - exhibit.position.z,
			);
			if (distance <= exhibit.radius && distance < nearestDistance) {
				nearest = exhibit;
				nearestDistance = distance;
			}
		}

		this.activeExhibit = nearest;
		return this.activeExhibit;
	}
}
