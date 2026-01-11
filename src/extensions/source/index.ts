/**
 * This module is where I intend on doing some big fancy source modifications.
 * Not quite sure *exactly* how I intend on making this extendable to other scripts as of yet.
 * But I shall think of a way somehow
 * @author Grifmin
 */

import { attemptDefineModloader, ModLoader } from "./ModLoader";
import { debugWarn } from "../logging";
import { CoreLoader } from "./loader";
import { createExtension } from "../";
import { SourceMods } from "./mods";

/**This is my psudo way to validate if this is actually shell code or not */
function isEggGameSource(source: string): boolean {
	if (source.startsWith("(()=>{")) return true;
	return false;
}

function ApplySourceInterception() {
	const original = HTMLElement.prototype.appendChild;
	// apparently this is the "new method" to intercept ingame source code. big fancy
	HTMLElement.prototype.appendChild = function <T extends Node>(node: T): T {
		if (node instanceof HTMLScriptElement && isEggGameSource(node.innerHTML)) {
			ModLoader.src = node.innerHTML;
			node.innerHTML = CoreLoader(node.innerHTML);
			HTMLElement.prototype.appendChild = original; // restore once we are done
		}
		return original.call(this, node) as T;
	};
	attemptDefineModloader();
}

let initialModSettings!: TODO;
const baseLabel = "Enable Game Modifications (the base setting)";
const description = /**@trim */ `
Modifies the game's internal source code on load in.
Toggling mods not implemented as of yet. (as i cbf)
`.trim();
export const Extension = createExtension({
	uniqueIdentifier: "Grifmin-SourceExtensions",
	iconUrl: "",
	name: "Source Extension Loader",
	author: "Grifmin",
	version: "0.2 alpha", // yea this is alpha until I find a more consistant / stable way to implemnent this
	description,
	defaultSettings: { enabled: false, modStates: {} as Record<string, boolean> }, // decided to disable by default. (forces user choice. plus its a mitigation against softlocks)
	config() {
		const configOptions = [{ type: "Toggle", label: baseLabel, value: this.settings.enabled }];
		for (const { name } of SourceMods) {
			let state = this.settings.modStates[name];
			if (state == undefined) state = true;
			const individualModOptions = { type: "Toggle", label: `${name} - toggle`, value: state};
			configOptions.push(individualModOptions);
		}
		return configOptions as TODO; // ree
	},
	init: function (): void {
		initialModSettings = JSON.parse(JSON.stringify(this.settings)); // update state
		if (this.settings.enabled == false) return;
		for (let [modName, enabled] of Object.entries(this.settings.modStates)) {
			if (enabled == undefined) enabled = true;
			const mod = SourceMods.find((mod) => mod.name == modName);
			if (mod) Object.assign(mod, { disabled: !enabled });
		}
		ApplySourceInterception();
	},
	onOptionsChange(updatedState) {
		if (updatedState.type != "Toggle") return false;
		// debugWarn(`${this.name} - window refresh request. - Grif fix this you lazy bastard.`);

		if (updatedState.label == baseLabel) {
			this.settings.enabled = updatedState.value;
			return updatedState.value;
		}
		const modName = (updatedState.label as string)?.replace(" - toggle", "");
		const targetMod = SourceMods.find((mod) => mod.name == modName);
		if (!targetMod) {
			debugWarn(`Unable to find target mod to toggle the state of with ${updatedState.label}?`);
			return false;
		}
		const newState = this.settings.modStates;
		newState[modName] = !newState[modName];
		this.settings.modStates = newState;
		/**
		 * because my settings proxy isnt recursively proxying each object, it needs to see the top level object update
		 * guess thats just another thing to go back and do.
		 * @todo (Grif) - make settings recursively proxy each object to detect mutations
		 */
		return updatedState.value;
	},
	isEnabled() {
		return this.settings.enabled;
	},
	requestRefresh() {
		const enabledStateMatches = this.settings.enabled == (initialModSettings as typeof this.settings).enabled;
		const initialModStates = (initialModSettings as typeof this.settings).modStates;
		const modStatesMatch = Object.entries(this.settings.modStates).every(([key, value]) => initialModStates[key] == value);
		return !enabledStateMatches || !modStatesMatch;
	},
});
