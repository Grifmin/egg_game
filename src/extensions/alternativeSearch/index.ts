/**
 * Main entry point for modification
 * @author Grifmin
 */
import { createExtension } from "../";
import { debugDebug, debugInfo } from "../logging";
import AliasesFile from "./aliases.json" with { type: "json" };

const { aliases } = AliasesFile;

// # Functions
function searchByNameIncludes(input: string, items: ItemData[], options: Options) {
	return items.filter((item) => (options.isCaseSensitive ? item.name : item.name.toLowerCase()).includes(input));
}
function searchByItemId(input: string, items: ItemData[], options: Options) {
	const itemId = Number(input);
	return items.filter((item) => item.id == itemId);
}
function searchByMeshNameIncludes(input: string, items: ItemData[], options: Options) {
	return items.filter((item) =>
		(options.isCaseSensitive ? item.item_data.meshName : item.item_data.meshName?.toLowerCase())?.includes(input),
	);
}
function searchByAliasesHelper(items: ItemData[], searchFormat: SearchFormat) {
	let returnList: ItemData[] = [];
	if (searchFormat.tags) {
		const { tags } = searchFormat;
		const result = items.filter((item) => item.item_data.tags?.some((tag) => tags.includes(tag)));
		returnList = returnList.concat(result);
	} else if (searchFormat.ids) {
		const { ids } = searchFormat;
		const result = items.filter((item) => ids.includes(item.id));
		returnList = returnList.concat(result);
	} else if (searchFormat.names) {
		const { names } = searchFormat;
		const result = names.map((name) => searchByNameIncludes(name, items, { isCaseSensitive: true } as Options)).flat();
		returnList = returnList.concat(result);
	}
	// we want this last
	if (searchFormat.negate) {
		const { negate } = searchFormat;
		returnList = returnList.filter((item) => !negate.includes(item.id));
	}
	return returnList;
}

function searchByAliases(input: string, items: ItemData[], options: Options): ItemData[] {
	let returnList: ItemData[] = [];
	const itemSearchTermPatch = (term: string) => term.replace(/\s/g, ""); // so the input they pass to us, they do this to it first...
	const keys = Object.keys(aliases).map(itemSearchTermPatch);
	// this patch is because egg game big stoopid ^
	if (!keys.some((key) => key.includes(input))) return (debugInfo(`${input} not in`, keys), []);
	const entiresPatch = ([alias, keyword]: [string, object]) => [itemSearchTermPatch(alias), keyword];
	const aliasEntries = Object.entries(aliases).map(entiresPatch) as Array<
		[keyof typeof aliases, (typeof aliases)[keyof typeof aliases]]
	>;

	for (const [alias, searchFormat] of aliasEntries) {
		if (!alias.includes(input)) continue;
		const Items = searchByAliasesHelper(items, searchFormat);
		returnList = returnList.concat(Items);
	}
	return returnList;
}
// i should probably improve this function a little bit, but ehh
function searchByTags_tagIncludes(input: string, items: ItemData[], options: Options) {
	return items.filter((item) =>
		item.item_data.tags?.some((tag) => (options.isCaseSensitive ? tag : tag.toLowerCase()).includes(input)),
	);
}

const searchFunctions = [
	searchByMeshNameIncludes,
	searchByNameIncludes,
	searchByAliases,
	searchByItemId,
	searchByTags_tagIncludes,
];

class Foose {
	items!: ItemData[];
	options!: Options;
	constructor(items: ItemData[], options: Options) {
		Object.assign(this, { items, options });
	}
	/** This is the main interface that the Fuse class uses to search with */
	search(input: string) {
		input = this.options.isCaseSensitive ? input : input.toLowerCase();
		// ^ this is to reduce the shorthand if statements in every one of the functions
		const ItemsFlattened = searchFunctions.map((searchFunc) => searchFunc(input, this.items, this.options)).flat();
		const items = [...new Set(ItemsFlattened)];
		return Object.entries(items).map(([key, item]) => ({ item }));
	}
}

const description = /**@trim */ `
This extension provides an alternative searching method for the inventory. 
Completely optional though. 
Feel free to request improvements for the alternative search extension!
`.trim();
let originalFuse: unknown;
let state: boolean;
function redefine() {
	Object.defineProperty(window, "Fuse", {
		get() {
			if (state) return Foose;
			return originalFuse;
		},
		set(value) {
			originalFuse = value;
		},
		configurable: true, // sure why not allow it to be configurable.
	});
}
export const Extension = createExtension({
	uniqueIdentifier: `Grifmin-AlternativeSearch`,
	defaultSettings: { enabled: false },
	author: "Grifmin",
	description,
	version: `1.0`, // :blobshrug:
	name: "Alternative Search",
	init() {
		originalFuse = (window as any).Fuse;
		state = this.settings.enabled;
		redefine(); 
		// ^ we always redefine reguardless. (just as a backup precaution. I've had instances where jsdelivr was blocked / didn't load)
	},
	config() {
		return [{ type: "Toggle", label: "Enable", value: this.settings.enabled }];
	},
	onOptionsChange(updatedstate) {
		debugDebug(`${this.name} - `, updatedstate, this.settings);
		if (updatedstate.label == "Enable" && updatedstate.type == "Toggle") {
			const newstate = updatedstate.value;
			debugDebug(`${this.name} - updating state from ${this.settings.enabled} to ${updatedstate.value}`);
			this.settings.enabled = newstate;
			state = newstate; // update current state (thank you)
		}
		return state;
	},
	isEnabled() {
		return this.settings.enabled;
	},
});

// #types
// type shit (mainly i just want it out of my screens view ngl)
type SearchFormat = {
	tags?: string[];
	ids?: number[];
	names?: string[];
	// price?: number;
	/**
	 * i kind of thought it would be cool to beable to sort all items where price is less than x or say greater than x
	 * but that seems like it would require a bit extra effort i cant be bothered to do at the moment.
	 *  */
	negate?: number[];
	/**
	 * its just easeier to negate by itemId.
	 * if you come up with a better solution or whatever, feel absolutely free to update and submit a pull request
	 *  */
};

type Options = {
	isCaseSensitive: boolean;
	includeScore: boolean;
	shouldSort: boolean;
	includeMatches: boolean;
	findAllMatches: boolean;
	minMatchCharLength: number;
	location: number;
	threshold: number;
	distance: number;
	useExtendedSearch: boolean;
	keys: string[];
	// keys: ["name", "unlock", "item_data.tags","item_data.meshName"]
};
type Item = TODO;
type ItemData = {
	category_name: CategoryNames;
	exclusive_for_class: ClassTypes;
	id: number;
	// instantiateNew: Function; // we dont actually care about this as it turns out
	is_available: boolean;
	item_data: {
		meshName?: string;
		tags?: string[];
	};
	item_type_id: number;
	item_type_name: ItemTypeName;
	name: string;
	price: number;
	unlock: boolean;
};
type ClassTypes = null | 0 | 1 | 2 | 3 | 4 | 5 | 6;
type CategoryNames =
	| "Hats"
	| "Stamps"
	| "Soldier Primary Weapons"
	| "Ranger Primary Weapons"
	| "Scrambler Primary Weapons"
	| "Shared Secondary Weapons"
	| "Eggsploder Primary Weapons"
	| "Whipper Primary Weapons"
	| "Crackshot Primary Weapons"
	| "Grenades"
	| "TriHard Primary Weapons"
	| "Melee";
type ItemTypeName = "Hat" | "Stamp" | "Primary" | "Secondary" | "Grenade" | "Melee";
