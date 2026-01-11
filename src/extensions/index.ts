/**
 * This module is my "main" entrypoint for every client extension that i intend on using.
 * Although, I also intend to allow for *several* other ways to extend the client later on :)
 * @author Grifmin
 */
import { Extension as alternativeSearch, Extension } from "./alternativeSearch";
// import { Extension as ModMenu_broken } from "./borken_modmenu"; // this was my first attempted implementation (didnt go well)
import { Extension as SourceExtensions } from "./source";
import { Extension as Protect } from "./Protections";
import { Extension as ModMenu } from "./modmenu";
import { Extension as TabKeyPatch } from "./TabKey";
import { Extension as reNotification } from "./reNotification";
import { Extension as UICommas } from "./vueCommas";
import { Client } from "./Client";
import { storageProxy, settings } from "./settings";
import { css, debugError, debugInfo } from "./logging";
import { setupTemp } from "./TEMPORARY";

const ExtensionList: ExtensionInstance<any, any>[] = [
	// ModMenu_broken,
	Protect, // we will attempt to run this first
	alternativeSearch,
	SourceExtensions,
	ModMenu,
	TabKeyPatch,
	reNotification,
	UICommas,
];
function getSettings<T extends ExtensionInstance<any, any>>(extension: T) {
	const settings = storageProxy(extension.uniqueIdentifier, extension.defaultSettings);
	return settings;
}
/**
 * This is just a psudo attempt at safeguarding the extensions.
 * Just incase one of them *somehow* something fails tragically.
 */
function attemptLoadExtension<T extends settings>(extension: ExtensionInstance<T, any>): boolean | Error {
	try {
		extension.init(); // its not that i dont trust myself, i just dont want to deal with the possibility that their might be an issue
		return true;
	} catch (err) {
		return err as Error;
	}
}

/**This is just a big fancy wrapper for fancy typehints essentially */
/**
 * This is an internal helper function that essentially provides big fancy typehints
 * (it also adds the settings paramater to the extension object)
 */
export function createExtension<T extends Record<string, any>, C extends configOptions[]>(
	data: Omit<ExtensionInstance<T, C>, "settings">
): ExtensionInstance<T, C> {
	const settings = getSettings(data as any) as T;
	return { ...data, settings };
}

/**
 * Loads all current extensions
 * @note (Grif) - Should we also implement some events here?
 * ie: fire off an event before and after extensions load?
 * we could also do them after each event :blobshrug:
 * my only concern is that its *possible* that some extensions might rely off of timing,
 * which then causes a whole list of undue side effects
 *
 * maybe ill just rename this function as setupInternalExtensions?
 * ehh, ill decide later if needed.
 */
export function setupExtensions() {
	const setupStart = performance.now();
	for (const extension of ExtensionList) {
		const start = performance.now();
		const result = attemptLoadExtension(extension);
		const Ext = {
			processed: result == true,
			loadTime: performance.now() - start,
		} as Extension<any>;
		Object.assign(Ext, extension);
		Client.addExtension(Ext);
		// Client.extensions.push(Ext);
		if (!(result instanceof Error)) {
			debugInfo(`Extension Loaded: ${Ext.uniqueIdentifier}`);
			continue;
		}
		debugError(`Loading: %c${Ext.uniqueIdentifier} - ${result.message}`, result);
	}

	const duration = (performance.now() - setupStart).toFixed(2);
	const loadedSuccessfully = Client.extensions.filter((extension) => extension.processed == true);
	const message = `Loaded %c${loadedSuccessfully.length}%c/%c${Client.extensions.length}%c extensions in %c${duration}%cms successfully`;
	debugInfo(message, css.number, "", css.number, "", css.number, "");
	Client.readyState = true;
	setupTemp();
	/**
	 * when we are done, we init the client
	 *
	 * @question (Grif) - should this be an event?
	 * */
}
export interface ExtensionData<
	TSettings extends Record<string, any> = Record<string, any>
	// Self = ExtensionInstance<TSettings>
> {
	/**
	 * You must privde a somewhat uniqueIdentifier so that you can get your own settings
	 * my recomendation is doing something like this
	 * **`myusername-modname`**
	 * */
	uniqueIdentifier: string;
	defaultSettings: TSettings;
	/**
	 * an initialization function.
	 * **Strongly** suggest using functions instead of arrow functions (to beable to access `this` keywords*/
	init(): void;
	iconUrl?: string;
	config(): Array<configOptions>;
	/**this toggles the extension on or off (if applicable) */
	// onsettingsChange(this: Self, )
	onOptionsChange?: (updatedState: any) => boolean;
	isEnabled?(): boolean;
	description?: string;
	name?: string;
	author?: string;
	version?: string;
}

export interface ExtensionInstance<TSettings extends Record<string, any>, TConfig extends configOptions[]> {
	/**
	 * You must privde a somewhat uniqueIdentifier so that you can get your own settings
	 * my recomendation is doing something like this
	 * **`myusername-modname`**
	 * */
	uniqueIdentifier: string;
	defaultSettings: TSettings;
	settings: TSettings;
	/**
	 * an initialization function.
	 * **Strongly** suggest using functions instead of arrow functions (to beable to access `this` keywords*/
	init(this: ExtensionInstance<TSettings, TConfig>): void;
	iconUrl?: string;
	config?(this: ExtensionInstance<TSettings, TConfig>): Array<configOptions>;
	/**this toggles the extension on or off (if applicable) */
	// onsettingsChange(this: ExtensionInstance<TSettings>, )
	onOptionsChange?: (
		this: ExtensionInstance<TSettings, TConfig>,
		updatedState: TConfig[number] & { label?: string }
	) => boolean;
	isEnabled?(this: ExtensionInstance<TSettings, TConfig>): boolean;
	/**If this is true on one (or any) extension, the window request Refresh button will be applied */
	requestRefresh?(this: ExtensionInstance<TSettings, TConfig>): boolean;
	description?: string;
	name?: string;
	author?: string;
	version?: string;
}
type configOptions = (Toggle | Slider | InputType) & { label?: string };
type Toggle = { readonly type: "Toggle"; value: boolean };
type Slider = { readonly type: "Slider"; min: number; max: number; value: number; increment?: number };
type InputType = { readonly type: "Input"; input: string; placeholder?: string };

// export type ExtensionInstance<TSettings extends Record<string, any>> = ExtensionInstance<TSettings> & { settings: TSettings };

export interface Extension<T extends Record<string, any>> extends ExtensionInstance<T, any> {
	/** Internal ID for Vue components */
	id: number;
	processed: boolean;
	/**Time in ms to load the extension (just somewhat useful if you have a bulky extension) */
	loadTime: number;
}
