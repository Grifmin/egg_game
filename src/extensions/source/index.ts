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
			const individualModOptions = { type: "Toggle", label: `${name} - toggle`, value: state };
			configOptions.push(individualModOptions);
		}
		return configOptions as TODO; // ree
	},
	init: function (): void {
		const { modStates } = this.settings;
		SourceMods.forEach((mod) => {
			if (modStates[mod.name]) return;
			modStates[mod.name] = true; // if no entry, we make one. (default enabled)
		});
		for (let [modName, enabled] of Object.entries(modStates)) {
			if (enabled == undefined) enabled = true; // probably dont need this. but i'll leave it in.
			const mod = SourceMods.find((mod) => mod.name == modName);
			modStates[modName] = enabled;
			if (mod) Object.assign(mod, { disabled: !enabled });
		}
		this.settings.modStates = modStates; // have to force update (until my settingsProxy is updated)
		initialModSettings = JSON.parse(JSON.stringify(this.settings)); // update initial state
		if (this.settings.enabled == false) return;
		ApplySourceInterception();
	},
	onOptionsChange(updatedState) {
		if (updatedState.type != "Toggle") return; // we only have toggles in this ext.

		if (updatedState.label == baseLabel) {
			this.settings.enabled = updatedState.value;
			return;
		}
		const modName = (updatedState.label as string)?.replace(" - toggle", "");
		const targetMod = SourceMods.find((mod) => mod.name == modName);
		if (!targetMod) {
			return debugWarn(`Unable to find target mod to toggle the state of with ${updatedState.label}?`);
		}
		const newState = this.settings.modStates;
		if (newState[modName] == undefined) {
			newState[modName] = true;
			(initialModSettings as typeof this.settings).modStates[modName] = true;
			/**
			 * by default if its entered (or undefined) it should be enabled. (so we force the entry into it)
			 * i added this exception as i noticed other extensions that load there own source mods dont seem
			 * to always load at the same time as this extension. therefore, my init settings dont get to load
			 * in time to put in a manual entry.
			 *
			 * yes, this is gheto. but ehh
			 *  */
		}
		newState[modName] = !newState[modName];
		this.settings.modStates = newState;
		/**
		 * because my settings proxy isnt recursively proxying each object, it needs to see the top level object update
		 * guess thats just another thing to go back and do.
		 * @todo (Grif) - make settings recursively proxy each object to detect mutations
		 */
		return; // returning a value is no longer relevent.
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
