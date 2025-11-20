/**
 * This is just to assist with syntax issues (this shouldnt be taken as a legitimate thing)
 * @author Grifmin
 */

/**A CSS file */
declare module "*.css" {
	// this allows for me to import `.css` files and it will import and show as string
	const css: string;
	export default css;
}

/**A HTML file */
declare module "*.html" {
	// this allows for me to import `.html` files and it will import and show as string
	const html: string;
	export default html;
}

/**Need to go back and fix this */
type TODO = any;

