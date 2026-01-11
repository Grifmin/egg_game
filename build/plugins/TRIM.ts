import { Plugin } from "esbuild";

/**
 * A simple plugin to allow for placing **`@trim`** inside of a standard jsdoc comment (infront of a string)
 * which then gets compiled to the formmated version of "...".trim()
 */

/**
 * This attempts to trim js string literals that i use in my extension
 */
function filterJs(str: string): string {
	// console.log(encodeURIComponent(str))
	str = str
		.replace(/\/\/.*?$/gm, "") // strip js comments
		.replaceAll(/(\s{4})+/gm, "\t")
		.replace(/\t/gm, '\t')
		.trim();
	str = JSON.stringify(str);
	str = str.replace(/"(.*)"/gm, "`$1`"); // safe JS string literal;
	// str = str.replaceAll("\\n", "\n");
	// console.log({ str });
	return str;
}
/**
 * This attempts to slightly trim strings (to slightly reduce indentation)
 */
function trimString(str: string): string {
	str = JSON.stringify(str);
	str = str
		.replace(/"(.*)"/gm, "$1") // unsafe JS string literal;
		.replace(/^(?:\\n)(.*?)(?:\\n)$/gm, "$1") // slight reduction in new line characters
		// .replaceAll("\\n", "\\\\n") // inlines variables slightly better.
		.replaceAll("\\n", "\n")
		// ^ this does make the strings `inline` but at the cost of them literally being `\n` in the string...
		.trim();
	// console.log({ str });
	return `\`${str}\``; // convert unsafe string back to safe (ish) one
}

const trimPlugin: Plugin = {
	name: "trim-plugin",
	setup(build) {
		build.onLoad({ filter: /\.(ts|js)$/ }, async (args) => {
			let contents = await Deno.readTextFile(args.path);
			// a neat little concept, *slightly* reduces indentation
			// const trimPattern = /\/\*\*?(?:\s?)+(@trim|js)(?:\s+)?\*\/`([\s\S]*?)`/gm;
			const trimPattern = /\/\*\*?(?:\s?)+(@trim|js)(?:\s+)?\*\/(?:\s+)?`([\s\S]*?)`/gm;
			contents = contents.replace(trimPattern, (_, type: "js" | "@trim", stringSrc: string) => {
				const filter = type == "js" ? filterJs : trimString;
				const trimmed = filter(stringSrc);
				return trimmed;
			});
			return { contents, loader: "ts" };
		});
	},
};

export { trimPlugin };
