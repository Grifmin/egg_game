type BluePrint<T> = {
	[K in keyof T]: T[K];
};
type settings = Record<string, any>
/**
 * An attempt at a persistant object (semi persistant. must be JSON serializable)
 */
function storageProxy<T extends settings>(key: string, blueprint: BluePrint<T>): T {
	const load = (): T => {
		const saved = localStorage.getItem(key);
		return saved ? { ...blueprint, ...JSON.parse(saved) } : { ...blueprint };
	};
	let data = load();
	return new Proxy(data, {
		get(_, prop: string) {
			// console.log(`get ${prop}`)
			return data[prop as keyof T];
		},
		set(_, prop: string, value) {
			// console.log(`set ${prop}`)
			data[prop as keyof T] = value;
			localStorage.setItem(key, JSON.stringify(data));
			return true;
		},
		deleteProperty(_, prop: string) {
			delete data[prop as keyof T];
			localStorage.setItem(key, JSON.stringify(data));
			return true;
		},
	}) as T;
}

export { storageProxy, settings };
