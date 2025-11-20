
// # interfaces
export interface VueDataInterface {
	/**The players name! who would have guessed */
	playerName: string;
	changelog: {
		version: string;
		current: Array<{ date: string; version: string; content: string[] }>;
		history: Array<any>;
		showHistoryBtn: boolean;
	};
	loc: any; // erm. i saw 1718 of these defined by default. im not adding this in
	screens: TODO;
	ui: TODO;
}
export interface VueAppInterface extends VueDataInterface {
	showScreen: number;
	$refs: any;
}
