/**
 * @todo (Grif) - remove this
 */

import { Client } from "../Client";
import { WaitForCondition } from "../Client/Utilities";
import defaultcss from "./legacy_gtweaks.css";

async function setupTemp() {
	await WaitForCondition(() => Client.readyState);
	Client.thememanager.addStyle(defaultcss, 'legacy-gtweaks-css')
}

export { setupTemp };
