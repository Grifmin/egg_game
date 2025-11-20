import { Plugin } from "esbuild";

const cssPlugin: Plugin = {
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

export { cssPlugin };
