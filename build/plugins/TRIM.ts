import { Plugin } from "esbuild";

/**
 * A simple plugin to allow for placing **`@trim`** inside of a standard jsdoc comment (infront of a string)
 * which then gets compiled to the formmated version of "...".trim()
 */
const trimPlugin: Plugin = {
	name: "trim-plugin",
	setup(build) {
		build.onLoad({ filter: /\.(ts|js)$/ }, async (args) => {
			let contents = await Deno.readTextFile(args.path);
			// a neat little concept, *slightly* reduces indentation
			// const trimPattern = /\/\*\*?(?:\s?)+(@trim|js)(?:\s+)?\*\/`([\s\S]*?)`/gm;
			const trimPattern = /\/\*\*?(?:\s?)+(@trim|js)(?:\s+)?\*\/(?:\s+)?`([\s\S]*?)`/gm
			contents = contents.replace(trimPattern, (_, type ,stringSrc: string) => {
				
				const trimmed: string = stringSrc.trim()
					.replace(/\/\/.*?$/gm, '') // strip js comments
					.replace(type != 'js' ? ' ' :/([\t\n]+)/gm, ' ')
					// .replace(/\n/gm, '\n')
					.replaceAll(/(    )+/gm, ' ')
				let returnVal = JSON.stringify(trimmed)

				if (type != 'js') returnVal = returnVal.replace(/\n/gm, '\\n')
				else returnVal = returnVal.replace(/"(.*)"/gm, '`$1`') // safe JS string literal
				// console.log({stringSrc, trimmed})
				return returnVal
			});
			// console.log({contents})

			return { contents, loader: "ts" };
		});
	},
};

export { trimPlugin };


/**
 * this is just to get vsc to stop redlining my variables. i know it exists.
 * however, if i actually enable proper deno typehints it makes all my files big upsetty
 * (as deno expects exact file imports, and not default imports ie:
 * import { } from "./folder";
 * vs
 * import {} from "./folder/index.ts"
 * )
 */
declare global {
	const Deno: DenoType;
}
interface DenoType {
	readTextFile(path: string): Promise<string>;
}
