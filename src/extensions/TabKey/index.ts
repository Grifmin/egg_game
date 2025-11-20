/**
 * This extension essentially just allows for the use of the `Tab` key inside of the game as a full on keybind (if wanted)
 * @author Grifmin
 */

import { PatternMatchFailed } from "../Client/Utilities";
import { createSourceMod } from "../source/loader";
import { addMod } from "../source/mods";
import { createExtension } from "..";

// # variables
let internal_SCB: settings_control_binder;
const targetVar = "comp_settings_control_binder";
const targetMethod = "onKeyUp";
const Label = "Enable";

// source modification location
const SourceMod = createSourceMod({
	name: "Stop Tab-Key from pausing",
	description: "The source mod thatgets rid of the the annoying tab key thing in egg game",
	modify(source: string): string {
		const regexPattern = /"Tab"==[\w$]+&&\(?[\w$]+="ESCAPE",[\w$]+\.preventDefault\(\)(,([\w$]+)\("down"\))/gm;
		const match = regexPattern.exec(source);
		if (!match) throw new PatternMatchFailed(`Failed to grab`);
		const [, annoyance] = match;
		source = source.replace(annoyance, "/*$1*/");
		const ChatRe =
			/case(?:"|'|`)Tab(?:"|'|`):([\w$_]+)\.preventDefault\(\),\1\.stopPropagation\(\),((?:[\w$_]+)\(\))}/gm;
		const inChatMatch = ChatRe.exec(source);
		if (inChatMatch) {
			// since this isnt "strictly" necessary, i wont require it for this (its more of a just nice to have)
			let [targetSrc, event, exitChatCall] = inChatMatch;
			const newCall = `/*${exitChatCall}// we need to exit, but i dont want to exit on 'tab' key */${event}.key != 'Tab' && ${exitChatCall}`
			const newsource = targetSrc.replace(exitChatCall, newCall);
			source = source.replace(targetSrc, newsource);
		}
		return source;
		// this just comments out the `,pauseGame('down')`. because no
	},
});

/**The updated function that we want to use as an alternative to the original games `onKeyUp` */
function alternative(this: targetVueContext, event: KeyboardEvent) {
	event.stopPropagation();
	let { key } = event;
	if (key == "Escape" /*|| key == 'Tab'*/ || key == "Enter") {
		return; // ^ this was the original condition. ive just commented it out
	}
	if (key == " ") {
		key = "space";
		event.preventDefault();
	}
	this.capture(key);
}

/**
 * This prevents the `Tab` key from changing focus off of the current focused element (causing you to tab out of the game)
 * see [mdn addEventListener#options](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#options)
 */
function applyEventIntercept() {
	function keydown(event: KeyboardEvent) {
		if (event.key == "Tab") event.preventDefault();
	}
	document.addEventListener("keydown", keydown, true);
}

/**
 * This is the ported version of my UI intermingling.
 */
function updateVueComp() {
	function updateMethod() {
		internal_SCB.methods[targetMethod] = alternative;
	}
	if (targetVar in window) {
		internal_SCB = window[targetVar] as settings_control_binder;
		updateMethod();
	}
	Object.defineProperty(window, targetVar, {
		set: (v: settings_control_binder) => {
			internal_SCB = v;
			updateMethod();
		},
		get: () => internal_SCB,
	});
}

// extension part
export const Extension = createExtension({
	uniqueIdentifier: "Grifmin-Tabkeyremap",
	name: "Tab Key Remap",
	author: "Grifmin",
	version: "1.0", // (11.2.25) date of port / refactor.
	description: "Allows the use of the `Tab` key as any keybind, and prevents it from tabbing you out ingame",
	defaultSettings: { enabled: false }, // my default settings shit
	config() {
		return [{ type: "Toggle", label: Label, value: this.settings.enabled }];
	},
	init() {
		if (!this.settings.enabled) return;
		addMod(SourceMod);
		updateVueComp();
		applyEventIntercept();
	}, // yea, we really don't do much here..
	onOptionsChange(updatedState) {
		if (updatedState.type != "Toggle" || updatedState.label != Label) return false;
		this.settings.enabled = updatedState.value;
		// we need to request window refresh for this aswell, because i dont feel like using global variables to communicate with variables inside of egg game.
		return true;
	},
	isEnabled() {
		return this.settings.enabled;
	},
});

/**
 * this is just the minimal ctx for the component we are injecting into
 * but as this is all im using, i dont see a reason to add more.
 * */
interface targetVueContext {
	onKeyUp(event: KeyboardEvent): void;
	capture(key: string): void;
}

/**
 * a quick / breif layout / view of the settings binder stuff
 */
interface settings_control_binder {
	template: string;
	props: string[];
	data(): { currentValue: boolean; isCapturing: false };
	methods: {
		playSound(sound: string): void; // straight up a wrapper to BAWK.play(sound) idk why this exists tbh
		reset(): void;
		capture(value: string): void;
		onMouseDown(event: MouseEvent): void;
		onKeyDown(event: KeyboardEvent): void;
		onKeyUp(event: KeyboardEvent): void;
		onWheel(event: unknown): void;
		onFocusOut(event: unknown): void;
	};
}
