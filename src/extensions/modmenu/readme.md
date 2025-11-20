## Mod Menu

This extension allows multiple mods to be displayed, and *hopefully* assist in managing settings

Extension interface:
```ts
interface ExtensionData<settings extends Record<string, any>> {
	/**
	 * You must privde a somewhat uniqueIdentifier so that you can get your own settings
	 * my recomendation is doing something like this
	 * **`myusername-modname`**
	 * */
	uniqueIdentifier: string;
	defaultSettings: settings;
	/**an initialization function */
	init(settings: settings): void;
	iconUrl?: string;
	/**this toggles the extension on or off (if applicable) */
	toggle?: (state: boolean) => boolean;
	description?: string;
	name?: string;
	author?: string;
	version?: string;
}
```
To add your own extension / mod (s) to the Mod Menu. Simply do something similiar to this

```js
Client.extensions.push(Extension)
```