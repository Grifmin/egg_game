/**
 * This module is to build and handle the UI components of the `Mod Menu`
 * This is all probably subject to change at any point
 * @author Grifmin
 */
import { ExtensionInstance, createExtension } from "../";
import { Client } from "../Client";
import { WaitForCondition } from "../Client/Utilities";
import { debugDebug, debugError, debugInfo } from "../logging";
import CSS from "./modmenu.css";
// import modmenu_item_template from "./modmenu_item_template.html";
import modmenu_screen_template from "./modmenu_screen_template.html";

const modMenuScreenIndex = 5; // the screen index
const ModMenuName = "Mod Menu";

/**This is to be injected into the main vueApp of egg game.  */
function switchToModMenuUi(this: vueAppContext) {
	this.showScreen = this.screens.modmenu;
	this.$refs.equipScreen.removeKeyboardStampPositionHandlers();
	this.equip.displayAdHeaderRefresh = true;
	this.hideGameMenu();
	BAWK.play("ui_toggletab");
	this.gameUiRemoveClassForNoScroll();
	extern.resetPaperDoll();
}

/**This function conditionally updates the vueApp if needed */
function updateVueApp() {
	// this is where i update the vueData to insert my own screen.
	if (vueData.screens.modmenu) return;

	Object.assign(vueApp, { switchToModMenuUi });
	vueData.screens.modmenu = modMenuScreenIndex; // add an extra menu ui to this
	Object.assign(vueData.loc, { modmenu_title_screen: "mod menu" });
	vueData.ui.mainMenu.push({
		locKey: "modmenu_title_screen",
		icon: "ico-settings",
		screen: 5,
		mode: [],
		hideOn: [],
	});
}

async function WaitUntilSetup() {
	function isReady(): boolean {
		if (!("vueApp" in window) || !("Vue" in window)) return false;
		return [Vue, Client.readyState, vueApp].every((value) => value);
	}
	await WaitForCondition(isReady).catch((reason) => debugError(`ModMenu isReady - ${reason}`));
	if (Client.vue) return debugInfo(`It seems the Mod Menu Vue instance is already mounted. `);
	// const cssDiv = document.createElement(`style`);
	// cssDiv.id = `modmenu-css`;
	// cssDiv.innerHTML = CSS;
	Client.thememanager.addStyle(CSS, "modmenu-css");
	// document.body.append(cssDiv);
	// debugInfo(`Starting modmenu v2 setup`);

	// const ModMenuItem = Vue.extend({
	// 	template: modmenu_item_template,
	// 	props: {
	// 		mod: { type: Object as () => Extension<any>, required: true },
	// 	},
	// 	data() {
	// 		let isEnabled = this.mod.processed;
	// 		// debugInfo(`${this.mod.name}: loaded`, {isEnabled})
	// 		if ("isEnabled" in this.mod) {
	// 			isEnabled = (this.mod as { isEnabled: Function }).isEnabled();
	// 			// debugInfo(`${this.mod.name}: isEnabled() after:`, {isEnabled})
	// 		}
	// 		return { isEnabled };
	// 		// return { isEnabled: !!this.mod.loaded };
	// 	},
	// 	methods: {
	// 		onToggleChange() {
	// 			if (typeof this.mod.toggle == "function") {
	// 				try {
	// 					// this.mod.toggle(th)
	// 					(this.mod as { toggle: Function }).toggle(this.isEnabled);
	// 					this.$emit("toggle", this.isEnabled);
	// 				} catch (e) {
	// 					debugError(`Error on toggle of ${this.mod.uniqueIdentifier}`, e);
	// 				}
	// 			}
	// 		},
	// 	},
	// });

	const ModMenuScreen = Vue.extend({
		template: modmenu_screen_template,
		// components: { "mod-item": ModMenuItem },
		data() {
			const extensions = (window as any)?.Client.extensions as ExtensionInstance<any, any>[] | [];
			return {
				backupURL: `url('https://www.svgrepo.com/show/454209/gear-player-multimedia.svg')`,
				search: "",
				selectedMod: extensions.find((ext) => ext.name == ModMenuName),
				refreshWanted: false,
				configuration: false,
				mods: extensions,
				refreshDetected: () => {
					function ModRequestedRefresh(mod: ExtensionInstance<any, any>): boolean {
						if (mod.requestRefresh && mod.requestRefresh()) {
							return true;
						}
						return false;
					}
					return extensions.some(ModRequestedRefresh);
				},
			};
		},
		/**
		 * For those who are just like me, and have legitimately never used Vuejs before (or seen it)
		 * the `computed` functions act like attributes.
		 * unsure exactly how it works but ehh. guess they are closer to getter functions than actual functions
		 */
		computed: {
			/**@todo */
			refreshRequested(): boolean {
				return this.refreshWanted;
			},
			/**this is to let it know when it should be displayed */
			shouldDisplay(): boolean {
				return vueApp.showScreen == modMenuScreenIndex;
			},
			/**This lets it know if it should show the description or configuration screen */
			desciptionScreen(): boolean {
				return !this.configuration;
			},
			/**This computes what the configButton text is */
			configButtonText(): "Description" | "Configuration" {
				return this.configuration ? "Description" : "Configuration";
			},
			/**This gives back the Extensions (filtered by search input) */
			filteredMods(): ExtensionInstance<any, any>[] {
				const input = this.search.toLowerCase() ?? "";
				// if (!input) return this.mods;
				return this.mods.filter((mod) => mod.name?.toLowerCase().includes(input));
			},
		},
		/**
		 * Methods allow for the configuration and mutation of the internal components
		 */
		methods: {
			selectMod(mod: ExtensionInstance<any, any>): void {
				this.selectedMod = mod;
				mod.description = mod.description?.trim(); // i keep forgetting to trim some of my descriptions.
				this.configuration = false; // reset back to desciption screen.
			},
			configurationSelected(): void {
				this.configuration = !this.configuration;
			},
			onSlider(slider: TODO, idx: number): void {
				debugInfo(`onToggle`, { slider, idx });
			},
			onOptionsChange(option: TODO, idx: number): void {
				if (!(this.selectedMod && this.selectedMod.onOptionsChange)) return;
				this.selectedMod.onOptionsChange(option);
				this.refreshWanted = this.refreshDetected(); 
				// ^ so i noticed that some of the options get cached and dont get computed correctly.
				// this just forces the vuejs to recompute more often. (probably not efficient, but ehh)
			},
		},
	});
	const mainScreens = document.getElementById("mainScreens");
	const modmenu = document.createElement("modmenu-root");
	modmenu.id = "#modmenu-root";
	if (mainScreens) mainScreens.appendChild(modmenu);

	updateVueApp();
	// mount it
	const ModMenuVue = new Vue({ render: (h) => h(ModMenuScreen) }).$mount(modmenu);
	Vue.mixin({
		created() {
			if (!("onMenuItemClick" in this && typeof this.onMenuItemClick == "function")) return;
			const original = this.onMenuItemClick.bind(this);
			this.onMenuItemClick = (item: TODO, ...args: TODO) => {
				const screen = (this as TODO)?.item?.screen;
				const modmenuScreen = (this as TODO)?.screens?.modmenu;
				if (screen && modmenuScreen && screen == modmenuScreen) {
					(vueApp as TODO)?.switchToModMenuUi(); // my lil interception function
				}
				return original(item, ...args);
			};
		},
	});
	Client.vue = ModMenuVue;
	// debugInfo("Mounted", { ModMenuVue });
}

const ModMenuExtension = createExtension({
	uniqueIdentifier: "Grifmin-modmenu-v2",
	name: ModMenuName,
	author: "Grifmin",
	version: "0.3a",
	description: /**@trim */ `
	mod menu v2 implementation
	Work in progress`.trim(),
	iconUrl: "url('https://media1.tenor.com/m/77rqMj3uomoAAAAd/gritito.gif)", // this is how i felt making this btw.
	defaultSettings: { enabled: true }, // made this togglable via a manual entry. (incase some other mod comes up with a better mod menu or has some reason to hide this idk)
	init() {
		if (!this.settings.enabled) return;
		WaitUntilSetup();
	},
	onOptionsChange(updateState) {
		debugDebug(`${this.name} - ${this.onOptionsChange?.name}: `, updateState);
		return false;
	},
});

export { ModMenuExtension as Extension };

/**this is just to shut ts up, i know its there */
interface vueAppContext {
	showScreen: TODO;
	$refs: TODO;
	equip: TODO;
	hideGameMenu(): unknown;
	gameUiRemoveClassForNoScroll(): unknown;
	screens: TODO;
}
