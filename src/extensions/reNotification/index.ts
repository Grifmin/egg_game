/**
 * @author Grifmin
 */
import { createExtension, ExtensionInstance } from "../";
import { Client } from "../Client";
import { WaitForCondition } from "../Client/Utilities";
import cssStr from "./notification.css";
import htmlStr from "./notification.html";

// # vars

let enabledState: boolean = false;


// #functions

/**
 * Re-implementation of the dismissNotification (required for notify)
 */
function dismissNotification(callback?: Function) {
	const notifyDiv = document.getElementById("re-notification");
	if (!notifyDiv) return;
	let anim = 8;
	let animIn = setInterval(() => {
		notifyDiv.style.opacity = `${anim / 8}`;
		notifyDiv.style.top = anim / 2 - 3.5 + "em";
		if (0 != --anim) return;
		clearInterval(animIn);
		notifyDiv.style.display = "none";
		if (callback) callback();
	}, 32);
}
/**
 * Re-implementation of the ole notify function that was for some reason deprecated / lost to time in shell.
 */
function notify(msg: string, timeout?: number) {
	if (!enabledState) return; // no notifications 
	const notifyDiv = document.getElementById("re-notification");
	if (!notifyDiv) return;
	// const notifyDivMessage =  document.getElementById("re-notificationMessage")
	notifyDiv.style.opacity = "0";
	notifyDiv.style.top = "-3.5em";
	notifyDiv.style.display = "flex";
	// notifyDivMessage.textContent = msg;
	notifyDiv.textContent = msg;
	let anim = 0;
	const animIn = setInterval(() => {
		// wait for it to be visible before doing anything.
		if (document.visibilityState == "hidden") return;
		anim++;
		notifyDiv.style.opacity = `${anim / 8}`;
		notifyDiv.style.top = anim / 2 - 3.5 + "em";
		if (8 != anim) return;
		clearInterval(animIn);
		if (timeout) {
			setTimeout(dismissNotification, timeout);
		}
	}, 32);
}

async function addHtml() {
	await WaitForCondition(() => Client.readyState);
	// add css
	Client.thememanager.addStyle(cssStr, "re-notificaiton-css");
	// add html
	const div = document.createElement("div");
	div.id = 'G-tweaks-html'
	div.innerHTML = htmlStr;
	document.body.appendChild(div);
	Object.defineProperty(window, "notify", {
		get: () => notify,
		configurable: true, // why not
	});
}

// # init

export const Extension = createExtension({
	uniqueIdentifier: "Grifmin-reNotification",
	defaultSettings: { enabled: false },
	name: "Lobby Close Notifications",
	author: "Grifmin",
	version: "1.0", // ported date: 11.2.25
	description: "adds back the original notifications for when a lobby is closing",
	config() {
		return [{ type: "Toggle", label: "Enable", value: this.settings.enabled }];
	},
	init: function (): void {
		enabledState = this.settings.enabled; // set the state 
		addHtml();
	},
	onOptionsChange(updatedState) {
		if (updatedState.type != "Toggle" || updatedState.label != "Enable") return false;
		this.settings.enabled = updatedState.value;
		enabledState = this.settings.enabled;
		return true;
	},
	isEnabled() {
		return this.settings.enabled;
	}
});
