import type { Vector3 } from "@babylonjs/core/Maths/math.vector";

type DebugStatsSource = {
	getRoomId: () => string;
	getPlayerPosition: () => Vector3;
	getMediaFrameDebug: () => { id: string; videoId: string; isPlaying: boolean };
};

export class DebugStats {
	private readonly element: HTMLDivElement;
	private lastUpdate = 0;

	constructor(
		root: HTMLElement,
		private readonly source: DebugStatsSource,
	) {
		this.element = document.createElement("div");
		this.element.className = "debug-stats";
		root.appendChild(this.element);
	}

	update(now: number): void {
		if (now - this.lastUpdate < 100) {
			return;
		}

		this.lastUpdate = now;
		const position = this.source.getPlayerPosition();
		const media = this.source.getMediaFrameDebug();
		this.element.textContent = [
			`room: ${this.source.getRoomId()}`,
			`pos: ${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)}`,
			`tv: ${media.id}`,
			`yt: ${media.videoId}`,
			`playing: ${media.isPlaying ? "yes" : "no"}`,
		].join("\n");
	}
}
