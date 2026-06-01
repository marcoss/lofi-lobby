import type { Exhibit } from "../exhibits/exhibitData";

export class ExhibitPanel {
	private readonly panel: HTMLDivElement;
	private readonly title: HTMLHeadingElement;
	private readonly author: HTMLParagraphElement;
	private currentId: string | null = null;

	constructor(root: HTMLElement) {
		this.panel = document.createElement("div");
		this.panel.className = "exhibit-panel";

		const eyebrow = document.createElement("p");
		eyebrow.className = "exhibit-panel__eyebrow";
		eyebrow.textContent = "Nearby exhibit";

		this.title = document.createElement("h2");
		this.title.className = "exhibit-panel__title";

		this.author = document.createElement("p");
		this.author.className = "exhibit-panel__author";

		this.panel.append(eyebrow, this.title, this.author);
		root.appendChild(this.panel);
	}

	show(exhibit: Exhibit): void {
		if (this.currentId !== exhibit.id) {
			this.title.textContent = exhibit.title;
			this.author.textContent = `Author: ${exhibit.author}`;
			this.currentId = exhibit.id;
		}

		this.panel.classList.add("visible");
	}

	hide(): void {
		this.currentId = null;
		this.panel.classList.remove("visible");
	}
}
