// @deno-types="deno.ns"
import esbuild from "esbuild";

// const args = process.argv.slice(2);
// const watch = args.includes("--watch");

const matchUrl = `*://*shellshock.io/*`;
const githubRepoURL = "TBD.min.js";
const date = new Date();
const header = `
// ==UserScript==
// @name            Mod Menu - G
// @namespace       Grifmins-ModMenu-GTweaks
// @match           ${matchUrl}
// @run-at          document-start
// @version         ${date.toLocaleDateString().replaceAll("/", ".")}
// @author          Grifmin
// @description     A work in progress. (if you get this somehow, just know its not complete)
// @unwrap
// ==/UserScript==
`.trim();
/**
 * since im terrible at versioning, i figure the date is a valid ish way to do it.
 * besides, im probably not going to be pushing multiple versions per day anyways.
 *
 * also as for why i use `@unwrap` is because that forces it to run as a glorified console script
 * when the page starts. which is essentially all i write anyways.
 * (by defualt violentmonkey does this, just not tampermonkey)
 */
const cssPlugin: esbuild.Plugin = {
	name: "css-plugin",
	setup(build) {
		const minify = !!build.initialOptions.minify;
		build.onResolve({ filter: /\.css$/ }, (args) => {
			const filePath = args.resolveDir + "/" + args.path.replace("./", "");
			return { path: filePath, namespace: "css" };
		});
		build.onLoad({ filter: /.*/, namespace: "css" }, async (args) => {
			let css = await Deno.readTextFile(args.path);
			css = css.replace(/`/gm, "\\`");

			if (minify) {
				css = css
					.replace(/\/\*[\s\S]*?\*\//g, "")
					.trim() // remove comments
					.replace(/\r?\n/g, " ")
					.replace(/(\s+)/gm, " ");
				return {
					// contents: `export default \`${css}\`;`, // <-- backticks
					contents: `export default ${JSON.stringify(css)}`,
					loader: "ts",
				};
			}
			return {
				contents: `export default \`${css}\`;`, // backticks preserve formatting
				loader: "ts",
			};
		});
	},
};
// i need to set some time aside to mess with this to get it working semi properly. but for now im not dealing with it.
const htmlPlugin: esbuild.Plugin = {
	name: "html-plugin",
	setup(build) {
		const minify = !!build.initialOptions.minify;
		build.onResolve({ filter: /\.html$/ }, (args) => {
			const filePath = args.resolveDir + "/" + args.path.replace("./", "");
			return { path: filePath, namespace: "html" };
		});
		build.onLoad({ filter: /.*/, namespace: "html" }, async (args) => {
			let rawHTML = await Deno.readTextFile(args.path);
			// rawHTML = rawHTML.replace(/\r?\n/g, "\\n").replace(`\t`)

			// console.log({ rawHTML });
			let html = `export default ${JSON.stringify(rawHTML)}`;
			return { contents: html, loader: "ts" };
		});
	},
};

const trimPlugin: esbuild.Plugin = {
	name: "trim-plugin",
	setup(build) {
		build.onLoad({ filter: /\.(ts|js)$/ }, async (args) => {
			let contents = await Deno.readTextFile(args.path);
			// a neat little concept
			const trimPattern = /\/\*\*?(?:\s?)+@trim(?:\s+)?\*\/`([\s\S]*?)`/gm;
			contents = contents.replace(trimPattern, (_, tpl) => {
				const trimmed = tpl.trim(); // trim leading/trailing whitespace
				// console.log({_, tpl, trimmed})
				return JSON.stringify(trimmed); // safe JS string literal
			});

			return { contents, loader: "ts" };
		});
	},
};

// const minify = true;
const minify = false;
const ctx = await esbuild.context({
	entryPoints: ["src/index.ts"],
	bundle: true, // we want this enabled always
	packages: "external",
	outfile: "dist/userscript.js",
	format: "iife", // this lets the compilier know that we intend to *immediately* execute this function (thus it will wrap it for us :)
	target: ["es2022"],
	sourcemap: 'inline',
	// sourcemap: true, // this might be useful if i ever decide to publish (as ill probably publish a source.min.js)
	minify: minify,
	banner: { js: minify ? `${header}\n//# sourceURL=${githubRepoURL}` : header },
	// footer: { js: `})()` }, // yea... not an *overly* large fan of this, but it works. and allows for top level await in everything
	loader: {
		".css": "text",
		".html": "text",
		".json": "json",
	},
	plugins: minify ? [trimPlugin, cssPlugin /*htmlPlugin*/] : [cssPlugin, trimPlugin], // i was going to attempt at doing slightly more advanced stuff but ehh, later
});
ctx.rebuild();
ctx.dispose();
console.log(`esbuild build complete.`);
