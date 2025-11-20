/**
 * This is just testing to make sure that i would get proper typehints in here.
 */

import { createSourceMod } from "../loader";


export const Extension = createSourceMod({
	name: "ew js ",
	description: "just a demo js mod",
	modify(source) { }, // we wont actually do anything
})