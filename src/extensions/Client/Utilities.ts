/**
 * A collection of semi useful functions
 * @question - should this be under the `Client` directory? 
 * @author Grifmin
 */

/**
 * A useful utility funciton that waits for a condition
 * @param condition - the condition you are waiting for
 * @param pollingRate - (ms) the interval rate in which you want to check
 * @param maxTimeout - (ms) the amount of time you want to wait until it stops
 */
async function WaitForCondition(condition: () => boolean, pollingRate: number = 250, maxTimeout: number = 45_000): Promise<void> {
	const StartTime = Date.now(); // when we started
	let interval!: number;
	return new Promise((resolve, reject) => {
		interval = setInterval(() => {
			if ((Date.now() - StartTime) >= maxTimeout) {
				clearInterval(interval);
				return reject(`Timed out, waited for - ${maxTimeout}ms`);
			};
			if (!condition()) return
			clearInterval(interval);
			resolve();
		}, pollingRate);
	});
}

export { WaitForCondition };

/**its just an error */
export class PatternMatchFailed extends Error { }

/**A templating function for regex patterns (thought it was kind of a neat concept idk) */
function regexTemplate(flag: ''  |regexFlags, strings: TemplateStringsArray, ...values: string[]): RegExp {
	/**
	 * A little helper function to escape special characters from being interpreted in a regex pattern
	 * @param str - the string to escape (to prevent wacky things like them placing a fking `$` in a symbol which gets interped as a end of line in regex)
	 */
	function LITERAL(str: string | undefined): string {
		// return str.replace(/\$/gm, "\\$"); // so originally, i handled the error outisde of my helper funciton. but why not inside
		return str == undefined ? "" : str.replace(/\$/gm, "\\$").replace(".", "\\.");
	}
	// const transformed = strings.reduce((acc, str, idx) => {
	// 	const val = values[idx] == undefined ? "" : LITERAL(values[idx]);
	// 	return acc + str + val;
	// }, ""); // never was a fan of Array.reduce, just looks bad
	const transformed = strings.map((str, idx) => str + LITERAL(values[idx])).join("");

	return new RegExp(transformed, flag);
}

const defaultRegexTemplate = (strings: TemplateStringsArray, ...values: string[]) => regexTemplate('', strings, ...values);
const validCharacters = 'gmidusvy';
export const re = new Proxy(defaultRegexTemplate, {
  get(target, flags: "name" | string) {
    if (flags == 'name') return target;
    const charsValid = flags.split('').every(char => validCharacters.includes(char));
    if (!charsValid) throw new PatternMatchFailed(`"${flags}" includes invalid characters. valid characters: ${validCharacters}`);
    return (strings: TemplateStringsArray, ...values: string[]) => {
      return regexTemplate(flags as regexFlags, strings, ...values);
    };
  }
}) as reProxy;

/**
 * a little helper function to aid with conditional regex shit (because ts is a bit annoying)
 * @param pattern regex obviously
 * @param source source code to call the pattern with
 * @param reason reason to throw if it doesnt find the pattern
 */
export function execOrThrow(pattern: RegExp, source: string, reason?: string) {
	const result = pattern.exec(source);
	if (!result) {
		throw new PatternMatchFailed(reason ?? `Error pattern matching with ${pattern}`, { cause: pattern });
	}
	return result;
}

// # types

//valid characters (that i know of)
type reChars = 'g' | 'm' | 's' | 'd' | 'i' | 'u' | 'y' | 's' | 'v'
// good enough, could probably do more. but ehh
type regexFlags = `${reChars}` | `${reChars}${reChars}` | `${reChars}${reChars}${reChars}`
type reTemplateFunc = (strings: TemplateStringsArray, ...values: string[]) => RegExp;
type reProxy = reTemplateFunc & {[K in regexFlags ]: reTemplateFunc}
