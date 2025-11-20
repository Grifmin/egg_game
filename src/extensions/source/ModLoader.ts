import { css, debugError } from "../logging";
import { SourceMod } from "./loader";
import { SourceMods } from "./mods";

// export let mappings: {[x: string]: string} = {};
export let mappings: MappingType = {};
/**
 * This is just my internal ModLoader.
 * although I do intend on exposing it as a global variable for convenience
 * @author Grifmin
 */
export const ModLoader: ModLoaderInterface = {
	get sourcemappings() {
		return mappings
	},
	src: ``,
	Getter: () => {
		throw new Error("Getter not defined yet."); // this will get overwritten by one of our source mods during runtime
	},
	getMappings(requestedMappings: MappingType = mappings) {
		function safeGetter(value: string): any {
			try {
				return ModLoader.Getter(value)
			} catch (err) {
				return undefined;
			}
		}
		const map = Object.entries(requestedMappings).map(([key, value]) => [key, safeGetter(value)]);
		const Obj = Object.fromEntries(map);
		return Obj;
	},
};

/**
 * A little helper function (ment for internal use for the moment)
 * @todo (Grif) - add proper checking to see if their are possible conflictions.
 */
export function addMappings(data: { [key: string]: string }) {
	Object.assign(mappings, data);
}


function attemptDefineModloaderInternal(ModLoader: ModLoaderInterface) {
	try {
		Object.defineProperty(window, "ModLoader", {
			get: () => ModLoader,
			configurable: true,
			// allow others to extend (and hopefully not overwrite)
		});
	} catch (err) {
		debugError(`Error when attempting to define ModLoader on window`, err);
	}
}

/**
 * This is where we attempt to define ModLoader on the global window
 * (this is very if not damn near the same as how we define window.Client)
 */
export function attemptDefineModloader() {
	if ("ModLoader" in window) {
		const defined = window.ModLoader as any;
		const filteredEntries = Object.entries(ModLoader).filter(([key, value]) => !defined[key]);
		const newInstance = Object.fromEntries(filteredEntries);
		const extendedModLoader = Object.assign(newInstance, window.ModLoader as any) as ModLoaderInterface;
		const err = new Error(`ModLoader already defined on window object`, { cause: window.ModLoader });
		attemptDefineModloaderInternal(extendedModLoader);
		return debugError(`%cWarning: `, css.warn, err);
	}
	attemptDefineModloaderInternal(ModLoader);
}

// # type / interfaces stuff

interface ModLoaderInterface {
	sourcemappings: MappingType;
	/**Convenient to have a copy of the original source code (for debug / dev purposes) */
	src: string;
	getMappings<T extends {[key: string]: string} >(requestedMappings: T): {[K in T[number]]: any };
	Getter: (str: string) => TODO;
}

type MappingType = {[key: string]: string};
