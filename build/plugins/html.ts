import { Plugin } from "esbuild";
// i need to set some time aside to mess with this to get it working semi properly. but for now im not dealing with it.
const htmlPlugin: Plugin = {
	name: "html-plugin",
	setup(build) {
		const minify = !!build.initialOptions.minify;
		build.onResolve({ filter: /\.html$/ }, (args) => {
			const filePath = args.resolveDir + "/" + args.path.replace("./", "");
			return { path: filePath, namespace: "html" };
		});
		build.onLoad({ filter: /.*/, namespace: "html" }, async (args) => {
			let rawHTML = await Deno.readTextFile(args.path);
			if (minify) {
				rawHTML = rawHTML.replace(/\\t|\n/gm, '').replace(/([\t\n]+)/gm, '');
				// console.log({ minify, rawHTML });
	
				// console.log({ rawHTML });
				// let html = `export default ${JSON.stringify(rawHTML)}`;
				return { contents: `export default \`${rawHTML}\``, loader: "ts" };
			}
			return { contents: rawHTML, loader: "text" };

		});
	},
};

export { htmlPlugin };
