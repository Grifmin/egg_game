/**
 * This module is where I intend on doing some big fancy source modifications.
 * Not quite sure *exactly* how I intend on making this extendable to other scripts as of yet.
 * But I shall think of a way somehow
 * @author Grifmin
 */

import { attemptDefineModloader, ModLoader } from "./ModLoader";
import { debugWarn } from "../logging";
import { CoreLoader } from "./loader";
import { createExtension } from "..";
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

const description = /**@trim */`
Modifies the game's internal source code on load in.
Toggling mods not implemented as of yet. (as i cbf)
`.trim();
export const Extension = createExtension({
	uniqueIdentifier: "Grifmin-SourceExtensions",
	iconUrl: "",
	name: "Source Extension Loader",
	author: "Grifmin",
	version: "0.1 alpha", // yea this is alpha until I find a more consistant / stable way to implemnent this
	description,
	defaultSettings: { enabled: true, modStates: {} as Record<string, boolean> }, // yes, by default I intend on extending the source
	config() {
		const configOptions = [
			{ type: "Toggle", label: "Enable Game Modification", value: this.settings.enabled }
		];
		for (const mod of SourceMods) {
			const individualModOptions = {type: "Toggle", label: `${mod.name} - toggle`, value: this.settings.modStates[mod.name] ?? true}
			configOptions.push(individualModOptions)
		}
		return configOptions as TODO; // ree
	},
	init: function (): void {
		/**@TODO - (Grif): implement window refresh request. */
		if (this.settings.enabled == false) return;
		ApplySourceInterception();
	},
	onOptionsChange(updatedState) {
		if (updatedState.type != "Toggle") return false;
		debugWarn(`${this.name} - window refresh request. - Grif fix this you lazy bastard.`);

		if (updatedState.label == 'Enable Game Modification') {
			this.settings.enabled = updatedState.value;
			return updatedState.value
		} 
		const targetMod = SourceMods.find(mod => updatedState.label?.includes(mod.name));
		if (!targetMod) return false && debugWarn(`Unable to find target mod to toggle the state of with ${updatedState.label}?`)
		this.settings.modStates[targetMod.name] = false; //@todo (Grif) - finish implementing in CoreLoader
		return updatedState.value;
	},
	isEnabled() {
		return this.settings.enabled;
	},
});
