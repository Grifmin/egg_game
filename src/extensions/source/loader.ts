/**
 * This is the module that is *mainly* responsable for source code modification
 * @author Grifmin
 * */

import { css, debugError, debugInfo, debugWarn } from "../logging";
import { ModLoader } from "./ModLoader";
import { SourceMods } from "./mods";

export function createSourceMod<T extends PseudoSettings, M extends readonly string[]>(
	data: SourceMod<T, M>
): SourceMod<T, M> {
	return data;
}
/**
 * Helper function that filters all mods that we currently have mappings for.
 */
function AcceptableMods(mod: SourceMod<any, readonly string[]>): boolean {
	if (!mod.requiredMappings) return true;
	const map = getFullSourceMappings(mod);
	return map != undefined;
}

/**
 * just a helper function that is the *closest* way to validate js syntax i could manage (with minimal effort)
 * This just validates that this is
 * */
function validateSourceCode(source: string) {
	try {
		return new Function(source);
	} catch (err) {
		return err as SyntaxError;
	}
}
/**
 * A little helper funciton that returns all the mappings for a source mod (if they exist)
 * Or it returned undefined which we check for in our condition
 */
function getFullSourceMappings(sourceMod: SourceMod<any, readonly string[]>): { [key: string]: string } | undefined {
	const { requiredMappings } = sourceMod;
	const { sourcemappings } = ModLoader;
	const entriesSrcMap = Object.entries(sourcemappings)
	// const condition = !requiredMappings || entriesSrcMap.length == 0  || !entriesSrcMap.every(([key]) => requiredMappings.includes(key));
	const condition = !requiredMappings || entriesSrcMap.length == 0  || !requiredMappings.every(key => sourcemappings[key] );
	if (condition) return;
	const entries = Object.entries(sourcemappings).filter(([key, value]) => requiredMappings.includes(key));
	const specifiedMappings = Object.fromEntries(entries);
	return specifiedMappings;
}

/**
 * this attempts to safely execute the modification of the game source while handling my own errors
 * Assumes that we will have the mappings. (need to handle that condition externally)
 * */
function attemptSourceMod(
	sourceMod: SourceMod<any, readonly string[]>,
	currentSource: string
): string | undefined | Error {
	const specifiedMappings = getFullSourceMappings(sourceMod);
	try {
		const newSource = sourceMod.modify(currentSource, specifiedMappings as TODO);
		const result = validateSourceCode(newSource);
		if (result instanceof Error) throw result; // we will just throw it and pass to the catch clause.
		return newSource;
	} catch (err) {
		return err as Error;
	}
}

/**
 * This handles the internal modification of egg game source code.
 *
 * This is just a "get it up and working" state of the loader
 * @todo (Grif) - finish final implementation
 * - todo: implement requestedMappings handling.
 * needs to beable to be able to "skip" mods without the requested mappings, then after the fact attempt to handle them
 * recursive?
 */
export function CoreLoader(
	originalSource: string,
	sourceMods = SourceMods as SourceMod[],
	iteration: number = 0,
	maxIteration: number = sourceMods.length
): string {
	let modifiedSource = originalSource;
	const sourceModsModificationStart = performance.now(); // this is the starttimer
	const [SourceModsToLoad, skippedMods] = [sourceMods.filter(AcceptableMods), sourceMods.filter((m) => !AcceptableMods(m))];
	// debugDebug(`SourceModification DBG: `, {SourceModsToLoad, skippedMods})
	for (const sourceMod of SourceModsToLoad) {
		const sourceModStart = performance.now();
		const result = attemptSourceMod(sourceMod, modifiedSource);
		const sourceModDuration = performance.now() - sourceModStart;
		if (result instanceof Error) {
			const errormessage = `Loading sourcemod ${sourceMod.name} %c${sourceModDuration}%cms - `;
			debugError(errormessage, css.number, "", result.message);
			continue;
		} else if (!result) {
			debugWarn(`Source Modification ${sourceMod.name} didnt return type string`, { result });
			continue;
		}
		modifiedSource = result;
		debugInfo(`Source Modification ${sourceMod.name} %c${sourceModDuration}%cms`, css.number, "");
	}
	if (skippedMods.length || iteration > 0) {
		if (iteration >= maxIteration || SourceModsToLoad.length == 0) {
			const msg = `Unable to load ${skippedMods.length} Source mod${skippedMods.length == 1 ? "" : "s"}: `;
			if (skippedMods.length != 0) debugWarn(msg, skippedMods.map((mod) => mod.name).join(", "));
			return modifiedSource;
		}
		modifiedSource = CoreLoader(modifiedSource, skippedMods, iteration + 1, maxIteration); // and we hope things dont get *too* broken :kekw:
	}
	if (iteration > 0) return modifiedSource; // i apparently have a logic error somewhere. this will be a temp patch as i cbf atm
	const totalDuration = performance.now() - sourceModsModificationStart;
	debugInfo(`All Source Modifications completed in %c${totalDuration}%cms`, css.number, "");
	return modifiedSource;
}

// # types / interfaces
type PseudoSettings = Record<string, any>;

export interface SourceMod<T extends PseudoSettings = PseudoSettings, M extends readonly string[] = readonly []> {
	name: string;
	description: string;
	options?: T;
	version?: any;
	/**A specifier to only load if the requested mappings are available. */
	readonly requiredMappings?: M;
	// modify(source: string): string;
	modify(
		source: string,
		requestedMappings: M extends never ? never : M["length"] extends 0 ? never : { [K in M[number]]: string }
	): string;
	/**
	 * @todo (Grif) - think of a better system for this
	 */
}
