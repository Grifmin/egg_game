/**
 * This module is kind of ment to be the primary way everything *can* communicate together ish. idk
 * Hopefully this *mostly* stays the same if not *somewhat* stable?
 * @author Grifmin
 */
import { Extension } from "../";
import { ThemeManager, ThemeManagerInterface } from "./theme.js";
import { css, debugError, debugInfo, debugWarn } from "../logging";
import defaultcss from "./default.css";

const startTime = Date.now();
export let Client!: ClientInterfaceBase;

function getNewClientInstance() {
	const ClientInstance: ClientInterfaceBase = {
		thememanager: ThemeManager,
		readyState: false, // false until we are done.
		extensions: [],
		addExtension(newExtension) {
			if (
				this.extensions.some(
					(existingExtension) => existingExtension.uniqueIdentifier == newExtension.uniqueIdentifier
				)
			)
				return debugWarn(`duplicate Extension - ${newExtension.uniqueIdentifier}`); // erm. we dont want duplicates
			if (!newExtension.id) newExtension.id = this.extensions.length;
			this.extensions.push(newExtension);
		},
		get startTime() {
			return startTime;
		},
	};
	return ClientInstance;
}

function attemptClientDefinition() {
	try {
		Object.defineProperty(window, "Client", {
			get: () => Client,
			configurable: true,
			// ^ ill probably disable this at somepoint. but ill leave enabled for debugging
		});
	} catch (err) {
		debugError(`Error when attempting to update Client definitions`, err);
	}
}
/**adds some default css that is probably never a bad thing to add */
function addDefaultCss() {
	ThemeManager.addStyle(defaultcss, 'default-css');

}


export function startClient() {
	if ("Client" in window) {
		const defined = window.Client as TODO; // grab and update the existing one if one exits.
		const filteredEntries = Object.entries(getNewClientInstance()).filter(([key, value]) => !defined[key]);
		const newInstance = Object.fromEntries(filteredEntries);
		Client = Object.assign(newInstance, window.Client as any) as ClientInterfaceBase;
		/**
		 * This way *somewhat* insures that our `Client` instance will have the proper fields.
		 * Now actually knowing if the fields are the correct type and values... :blobshrug:
		 * But this way *at least* it provides (hopefully some) insurance incase some other
		 * mod developer wants to have their own `Client` definition(s)
		 */
		const err = new Error(`Client already exists on window object `, { cause: window.Client });
		attemptClientDefinition();
		return debugWarn(`%cError:`, css.warn, err);
	}
	Client = getNewClientInstance();
	const TimeStampString = new Date(Client.startTime).toLocaleString();
	debugInfo(`Startup time: ${TimeStampString}`);
	attemptClientDefinition();
	addDefaultCss()
}

interface ClientInterfaceBase {
	vue?: TODO; //CombinedVueInstance<any, object, object, object, Record<never, any>>
	/**All currently loaded extensions */
	extensions: Extension<any>[];
	addExtension<T extends Extension<any>>(Ext: T): void;
	/**The time the client started (maybe) */
	startTime: number;
	// this lets other extensions know when the client is fully ready
	readyState: boolean;
	thememanager: ThemeManagerInterface;
}
