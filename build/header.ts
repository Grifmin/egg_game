const matchUrl = `*://*shellshock.io/*`;
const date = new Date();
// let filename = ''
// const url = `https://raw.githubusercontent.com/Grifmin/egg_game/refs/heads/master/dist/${filename}`
/**
 * since im terrible at versioning, i figure the date is a valid ish way to do it.
 * besides, im probably not going to be pushing multiple versions per day anyways.
 *
 * also as for why i use `@unwrap` is because that forces it to run as a glorified console script
 * when the page starts. which is essentially all i write anyways.
 * (by defualt violentmonkey does this, just not tampermonkey)
 */
export const githubRepoURL = "https://raw.githubusercontent.com/Grifmin/egg_game/refs/heads/master/";
function getHeader(filename?: string) {
	const updateFileURL = `${githubRepoURL}${filename}`;
	const defaultHeader = `
// ==UserScript==
// @name            GTweaks V2
// @namespace       Grifmin-GTweaks-V2
// @match           ${matchUrl}
// @run-at          document-start
// @version         ${date.toLocaleDateString().replaceAll("/", ".")}
// @author          Grifmin
// @description     A work in progress. (if you get this somehow, just know its not complete)
${ filename ? `\
// @updateURL       ${updateFileURL}
// @downloadURL     ${updateFileURL}
` : "" }\
// @unwrap
// ==/UserScript==`;
	return defaultHeader.trim();
}

export { getHeader };
