/**
 * This module is intended to allow for other mods / extensions to easily hook into and add their own themes / css stuff dynamically.
 * I intend on doing this event based so that other extensions can simply write their own css and do something easy like this
 * ```js
 * addEventListener('event name to be determined', (event) => {
 * 		event.detail.addCSS(`//css goes here`, "optional unique id (for toggling / updating purposes)");
 * })
 * ```
 * @todo (Grif) - finish this if i ever get the time / nerve
 * @author Grifmin
 */
// import { createExtension } from "..";

const styleDivIdentifier = "ThemeManager-div";
let ThemeDiv!: HTMLDivElement;

function getDiv() {
	if (ThemeDiv) return ThemeDiv;
	const div = document.createElement("div");
	div.id = styleDivIdentifier;
	document.body.append(div);
	ThemeDiv = div;
	return ThemeDiv;
}

/**
 * This is just to assist with managing internal css / styles
 * Also makes it quite easy to disable the styles via external extensions (if anyone actually cared to do so)
 * 
 * Not exactly my best work, but it will do for now
 */
export const ThemeManager: ThemeManagerInterface = {
	themes: {},
	addStyle: function (styleElement: HTMLStyleElement | string, identifier?: string): HTMLStyleElement {
		// styleElement.id = identifier; // just incase some someone decides to do some shenanigans
		if (typeof styleElement == 'string' ) {
			const css = styleElement;
			styleElement = document.createElement('style');
			styleElement.innerHTML = css;
			if (identifier) styleElement.id = identifier;
		} 

		if (!identifier) identifier = styleElement.id;
		if (document.body) {
			const ThemeDiv = getDiv();
			ThemeDiv.append(styleElement);
			this.themes[identifier] = styleElement;
			return styleElement;
		}
		document.addEventListener(
			"DOMContentLoaded",
			() => {
				const ThemeDiv = getDiv();
				ThemeDiv.append(styleElement);
				this.themes[identifier] = styleElement;
			},
			{ once: true }
		);
		return styleElement;
	},
};

// /**
//  * This function is not implemented as of yet
//  */
// function addCSS(css: string, uniqueId?: string) {
// 	throw new Error("Function not implemented");
// }

// const customEvent = new CustomEvent("[G-Tweaks ThemeManager]", { detail: { addCSS } as const });

// addEventListener("custom", (event: typeof customEvent) => {
// 	const { detail } = event;
// 	const exampleCss = /*css*/ `
// 	.testing123 {
// 		color:rgb(255, 0, 0);
// 	}
// 	`.trim();
// 	detail.addCSS(exampleCss, "testing 123");
// 	return;
// });

// dispatchEvent(customEvent);

// export const Extension = createExtension({
// 	uniqueIdentifier: `ThemeManager`,
// 	name: "Theme Manager",
// 	author: "tbd (hopefully not Grif)",
// 	defaultSettings: {},
// 	init() {
// 		throw new Error("Function not implemented.");
// 	},
// });

/**This is to extend the Client instance */
export interface ThemeManagerInterface {
	/**A list of all style / css */
	themes: Record<string, HTMLStyleElement>;
	addStyle(styleElement: HTMLStyleElement | string, identifier?: string): HTMLStyleElement;
}
