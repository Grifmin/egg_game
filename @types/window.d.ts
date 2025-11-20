/**
 * This is just some useful typehints for the webpage
 * Some of them will be hand written.
 * I just collect random things as i go
 * @author Grifmin
 */
import { VueAppInterface, VueDataInterface } from "./vue";
import { ExternInterface } from "./extern";
import { Vue as V } from "vue/types/vue";
import { BAWKInterface } from "./BAWK";

declare global {
	const Vue: typeof V;
	const vueData: VueDataInterface;
	const vueApp: VueAppInterface;
	const extern: ExternInterface;
	const BAWK: BAWKInterface; // yes i wrote this by hand. it wasnt fun, although it was neat!
}
