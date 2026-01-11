import { githubRepoURL, getHeader } from "./header";
import { htmlPlugin } from "./plugins/html";
import { trimPlugin } from "./plugins/TRIM";
import { cssPlugin } from "./plugins/css";
import esbuild from "esbuild";

async function buildWithInlineSourcemap(minify: boolean = true, inline: boolean = true) {
	const filepath = `dist/userscript.${ inline ? 'inlinemap' : 'inline'}.js`
	// const header = getHeader(filepath);
	const header = getHeader(inline ? undefined : filepath) // while debugging i dont want this
	const ctx = await esbuild.context({
		entryPoints: ["src/index.ts"],
		bundle: true, // we want this enabled always
		outfile: filepath,
		format: "iife", // this lets the compilier know that we intend to *immediately* execute this function (thus it will wrap it for us :)
		external: [],
		target: ["es2022"],
		sourcemap: inline ? 'inline' : false,
		platform: "browser",
		minify: minify,
		supported: { 'template-literal': false },
		banner: { js: header },
		loader: {
			".css": "text",
			".html": "text",
			".json": "json",
		},
		// plugins: [cssPlugin, trimPlugin, htmlPlugin], // i was going to attempt at doing slightly more advanced stuff but ehh, later
	});
	ctx.rebuild();
	ctx.dispose();
}

async function buildDefault(minify: boolean = false) {
	// const minify = false;
	const filepath = `dist/userscript${minify ? ".min" : ""}.js`
	const header = getHeader(filepath)

	const sourceMapURL = githubRepoURL + filepath + '.map'
	// console.log({minify, sourceMapURL})
	const ctx = await esbuild.context({
		entryPoints: ["src/index.ts"],
		bundle: true, // we want this enabled always
		outfile: filepath,
		format: "iife", // this lets the compilier know that we intend to *immediately* execute this function (thus it will wrap it for us :)
		external: [],
		target: ["es2022"],
		sourcemap: false,
		platform: "browser",
		minify: minify,
		supported: { 'template-literal': minify ? false : true },
		// banner: { js: minify ? `${header}\n//# sourceURL=${sourceMapURL}` : header },
		banner: { js: `${header}`},
		footer: {js: `//# sourceURL=${sourceMapURL}`},
		loader: {
			".css": "text",
			".html": "text",
			".json": "json",
		},
		// plugins: [cssPlugin, htmlPlugin, trimPlugin], // i was going to attempt at doing slightly more advanced stuff but ehh, later
	});
	ctx.rebuild();
	ctx.dispose();
}

/**
 * This will generated a bookmarklet for those who dont want to install a userscript.
 * Just kind of a neat but definitely niche thing.
 * @todo (Grif) - complete */
async function buildBookmarklet() {
	return; // work in progress (doesnt quite work. and i cbf to deal with this atm)
	const bookmarklet = `javascript:window.location.href.includes("https://shellshock.io/")?window.location.reload():window.location.href="https://shellshock.io/";`;
	const ctx = await esbuild.context({
		entryPoints: ["src/index.ts"],
		bundle: true,
		outfile: `dist/bookmarklet.js`,
		format: "iife", // this lets the compilier know that we intend to *immediately* execute this function (thus it will wrap it for us :)
		external: [],
		target: ["es2022"],
		sourcemap: false,
		platform: "browser",
		minify: true,
		banner: { js: bookmarklet },
		loader: {
			".css": "text",
			".html": "text",
			".json": "json",
		},
		plugins: [trimPlugin, cssPlugin], // i was going to attempt at doing slightly more advanced stuff but ehh, later
	});
	ctx.rebuild();
	ctx.dispose();
}

await buildWithInlineSourcemap();
// while im debugging, im not going to be building and writing source to disk every time.
await buildWithInlineSourcemap(true, false)
await buildDefault();
await buildDefault(true);
await buildBookmarklet();

console.log(`esbuild(s) build complete.`);
