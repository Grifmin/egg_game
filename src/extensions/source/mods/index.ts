/**
 * This is where I handle all my source mods and such.
 * @author Grifmin
 */

import { SourceMod, createSourceMod } from "../loader";
import * as asdf from "./SourceMods";

const otherSourceMods = Object.values(asdf);

/**
 * Generalized mappings variable
 * @todo (Grif) - think of a better way to implement this.
 */

const Basis = createSourceMod({
	name: "Basis Injection",
	description: "This is the kind of base line function that allows for all sorts of nifty things",
	modify: function (source: string): string {
		const EmbedPattern = /(window\.extern)/gm;
		// const inlineFunc = () => ModLoader.Getter = (str) => eval(str)
		// return source.replace(EmbedPattern, `(${inlineFunc.toString()})();$1`)
		// esbuld gets big upset seeing `eval`. so ill just make it a string to begin with :blobshrug:
		return source.replace(EmbedPattern, `((/*GTweaks V2*/)=>ModLoader.Getter=(str)=>eval(str))();$1`);
	},
});

const Unsafe = createSourceMod({
	name: "Unsafe",
	description: "This just tests that the loader properly catches unsafe modifications to the source code",
	modify: function (source: string): string {
		return source.replace('"', ""); // this should cause some issues
	},
});

/** List of all the mods I have loaded */
export const SourceMods = [Unsafe, Basis, ...otherSourceMods];

/** Adds a source mod to the ModList */
export function addMod(sourceMod: SourceMod<any, any>) {
	SourceMods.push(sourceMod);
}
