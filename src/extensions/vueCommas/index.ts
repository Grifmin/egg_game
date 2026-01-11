/**
 * asdd in commas to the games in stats, current currency, and shop
 * @author Grifmin
 */
import { createExtension } from "../";
import { WaitForCondition } from "../Client/Utilities";

// # variables
let internalcomp_item!: CompItem;

// # Functions
function isReady() {
	return "Vue" in window;
}

/**Alternative setupStat funciton (returns with commas) */
function setupStatAlternative(this: StatTemplateCtx, stat: statVar) {
	if (this.stat.kdr !== undefined && typeof stat != "number" && typeof stat[0] == "number") {
		return this.kdr(stat[0], stat[1]);
	} else if (stat && typeof stat != "number") {
		const [first, second] = stat.map((v) => (typeof v == "number" ? v.toLocaleString() : v));
		return `<div>${first}</div> <div>${second.toLocaleString()}</div>`;
	} else {
		return typeof stat == "number" ? stat.toLocaleString() : stat;
	}
}

function itemPriceAlternative(this: CompItem$this) {
	if (this.hidePrice && this.isItemOwned) {
		return this.loc.eq_owned;
	}
	return !this.isItemOwned ? this.item.price.toLocaleString() : this.loc.eq_owned + "!";
}
/**
 * This adds in commas to the stats (profile) screen. 
 */
async function statTemplateMixin() {
	await WaitForCondition(isReady, 50);
	Vue.mixin({
		created() {
			if ("setupStat" in this) this.setupStat = setupStatAlternative;
		},
	});
}
/**
 * Apparently, they added this in as a default feature semi recently.
 * I was so confused trying to figure how my mixin was running when i disabled it (only to find out its a new default feature lmfao)
 * @deprecated
 */
async function accountPanelMixin() {
	await WaitForCondition(isReady, 50);
	let bal: number | undefined;
	Vue.mixin({
		created() {
			if (!("getEggsLocalStorage" in this)) return;
			Object.defineProperty(this, "eggBalance", {
				set: (v) => (bal = v),
				get: () => (bal ? bal?.toLocaleString() : bal),
			});
		},
	});
}
/**
 * This is the method I use to update teh Vue computed function with my alternative method.
 */
function comp_item$ItemPriceOverwrite() {
	function update(targetComponent: CompItem) {
		targetComponent.computed.itemPrice = itemPriceAlternative;
		internalcomp_item = targetComponent;
	}
	if ("comp_item" in window) update(window.comp_item as CompItem);
	Object.defineProperty(window, "comp_item", {
		set: update,
		get: () => internalcomp_item,
	});
}

let initialLoadCondition!: boolean;
// # extension
export const Extension = createExtension({
	uniqueIdentifier: "Grifmin-ui_commas",
	defaultSettings: { enable: false },
	author: "Grifmin",
	name: "Fancy commas",
	version: "1.0",
	description: "Adds commas to the stats (profile) page, currency, and shop items",
	config() {
		return [{ type: "Toggle", label: "Enabled", value: this.settings.enable }];
	},
	init: function (): void {
		initialLoadCondition = this.settings.enable; // ehh. 
		if (!this.settings.enable) return;
		comp_item$ItemPriceOverwrite();
		statTemplateMixin();
		// accountPanelMixin(); // apparently somewhere along the line they added this in as a default feature??? (guess it was semi recently)
		/**
		 * Other more niche areas to add commas:
		 *
		 * challenges: Challenges.(total | unique) - in stats
		 * Challenges: side panel - (reward amount)
		 * 
		 * ChickenWinner egg reward
		 * Chicken winner "wake up" amount
		 * 
		 * itemCodeRedeem (possible egg currency amount)
		 */
	},
	onOptionsChange(updatedState) {
		if (updatedState.label != "Enabled" || updatedState.type != "Toggle") return false;
		this.settings.enable = updatedState.value;
		return true;
	},
	isEnabled() {
		return true;
	},
	/**
	 * I should actually be able to make this hot togglable.
	 * But that would require a bit of extra effort. Plus im unsure if using mixins could cause conflictions with other mods...
	 * 
	 * @todo (Grif) - re visit this at some point. 
	 */
	requestRefresh() {
		return initialLoadCondition != this.settings.enable;
	}
});

// # types

type statVar = number | [number | string, number];

interface StatTemplateCtx {
	kdr(kills: number, deaths: number): number;
	stat: {
		kdr?(kills: number, deaths: number): number;
	};
}

type CompItem$this = { hidePrice: boolean; isItemOwned: boolean; loc: any; item: { price: number } };

interface CompItem {
	template: string;
	props: unknown;
	data(): unknown;
	mounted(): void;
	beforeDestroy(): void;
	methods: any;
	computed: {
		isItemOwned(): boolean;
		itemPrice(this: CompItem$this): void;
	};
	watch: {
		item(val: unknown): void;
	};
}
