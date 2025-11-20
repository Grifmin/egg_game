/**
 * This module is mainly just ment for logging purposes.
 * Since I want to *somewhat* keep my logging seperated from the games logging, ive created these wrappers around console log.
 * Plus, this also allows me to filter by `Erros`, `Warnings`, `Info`, `Logs` (which I will avoid), and `Debug`
 * The game just uses `console.log` 90% of the time, so I can simply ingore it, *mostly*.
 * @author Grifmin
 */

/**CSS for logging purposes*/
const css = {
	success: `background: #006700 ;padding:.125em .375em;border-radius:.1875em;margin-right:.3125em;`,
	warn: `background: #ff6d00 ;padding:.125em .375em;border-radius:.1875em;margin-right:.3125em;`,
	fail: `background: #FF0000 ;padding:.125em .375em;border-radius:.1875em;margin-right:.3125em;`,
	info: `background: #413C26 ;padding:.125em .375em;border-radius:.1875em;margin-right:.3125em;`,
	number: `color: #7E64FF ; padding:.125em .375em;border-radius:.1875em;margin-right:.3125em;`,
} as const;

// this is so that i can update the logging in the future (maybe)
const { log, warn, error, info, debug } = console;

/**
 * This is just a small wrapper so that i can easily log data when doing debugging
 */
/**@__PURE__ */
function debugInfo(message: string, ...other: any) {
	info(`%cG-Tweaks: %c${message}`, css.success, "", ...other);
}
/**@__PURE__ */
function debugError(message: string, ...other: any) {
	error(`%cG-Tweaks Error: %c${message}`, css.fail, "", ...other);
}
/**@__PURE__ */
function debugWarn(message: string, ...other: any) {
	warn(`%cG-Tweaks Warn: %c${message}`, css.warn, "", ...other);
}
/**@__PURE__ */
function debugDebug(message: string, ...other: any) {
	debug(`%cG-Tweaks Debug: %c${message}`, css.warn, "", ...other);
}

// export { log, warn, error, info, css, debugLogging , debugError, debugWarn, debugDebug};
export { css, debugInfo, debugError, debugWarn, debugDebug };
