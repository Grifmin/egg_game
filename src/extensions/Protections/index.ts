/**
 * This module is intended to implement a few various methods to assist at protecting the client.
 * Fairly simple, and not much needed to go into this.
 * Although it is a *bit* timing related.
 *
 * I could go for a different route and create a virutal Iframe, and steal the original unmodified methods / properties inside.
 * Ehh, this works for now.
 * @author Grifmin
 */
import { createExtension } from "..";
import { debugWarn } from "../logging";

/**
 * This is a list of objects that I *do not* want modified or fucked with.
 */
const Protected = [
	IntersectionObserver,
	BroadcastChannel,
	// String, // we have to make a special edge case for `String` as we are expecting egg game to extend it. ie: String.prototype.(format | f)
	RegExp, // personally, i dont modify js defaults unless i have to. espeically to work around just handling my own errors.
	Object,
	Proxy,
	// Array, // apparently, babylonjs has default functionality that requires overwriting Array.prototype.push :catfall:
	Function,
	Number,
	Boolean,
	Date,
];
/**
 * This is a list of things I dont mind extensions being added to it
 * (more accurately that I know has extensions ingame, but also the game attempts to thwart modding with)
 */
const ProtectAllowExtension = [String];

/**
 * this freezes an object; just about the safest thing that we can do in js
 * [docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze)
 */
function FreezeObject(obj: any) {
	if (obj?.prototype) {
		Object.freeze(obj.prototype);
	}
	Object.freeze(obj);
}

/**
 * This is our special case where we change all property descriptors to dis allow modificaiton
 */
const ProtectInternals = (obj: any) => {
	const hardened = { writable: false, configurable: false };
	for (const [property, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(obj.prototype))) {
		if (!descriptor.configurable) continue;
		// not *exactly* perfect. but will do for now
		Object.defineProperty(obj.prototype, property, hardened);
	}
};
function Protect() {
	try {
		Protected.forEach(FreezeObject); // freeze these
		ProtectAllowExtension.forEach(ProtectInternals);
	} catch (err) {
		if (!(err instanceof TypeError)) throw err; // just pass the error back to the extension loader;
		console.log(err);
		throw err;
	}
}
const description =
/**@trim */`Protects various js Object prototypes. (useful when attempting to mitigate egg games various anti modding approaches)`.trim();
export const Extension = createExtension({
	uniqueIdentifier: `Grifmin-Protec`,
	defaultSettings: { enabled: true },
	author: "Grifmin",
	description,
	version: `1.0`,
	name: "Internal Protections",
	config() {
		return [{ type: "Toggle", label: "Enable", value: this.settings.enabled }];
	},
	init() {
		if (!this.settings.enabled) return;
		Protect();
	},
	onOptionsChange(updatedState) {
		if (updatedState.type != "Toggle") return false; // erm what
		this.settings.enabled = updatedState.value;
		/**@todo (Grif) - now we need a way to request window refresh*/
		debugWarn(`${this.name} - window refresh request. - Grif fix this you lazy bastard.`);
		return updatedState.value;
	},
	isEnabled(): boolean {
		return this.settings.enabled;
	},
});
