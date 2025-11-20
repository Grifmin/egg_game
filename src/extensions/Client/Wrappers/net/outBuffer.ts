/**
 * This is more of a prototype for ingame network handling
 * This module only uses some minor logging and the regex templating (because i like it)
 * the OutBufferWrapper does not handle getting the source code of anything on its own.
 * it expects to be provided the source before anything
 * @todo - finish
 * @author Grifmin
 */

import { debugError } from "../../../logging";
import { re } from "../../Utilities";


/**this is only for internal use.  */
let internalOutBuffer!: outBuffer;
// note these *have* to be updated before you can use them
const outBufferMethods: outMethods = {
	send: "send", // needed -- seeing as currently there is no obf of send i wont grab it (yet)
	packInt8: "packInt8",
	packInt16: "packInt16",
	packInt24: "packInt24",
	packInt32: "packInt32",
	packRadU: "packRadU",
	packRad: "packRad",
	packFloat: "packFloat",
	packDouble: "packDouble",
	packString: "packString",
	packLongString: "packLongString", 
};

const MappingReg = new Map([
	[
		/([\w]+)\(([\w$_]+)\){this\.([\w]+)\(1048576\*\2\)}/gm,
		(match: RegExpExecArray) => {
			const [, packDouble, , packInt32] = match;
			Object.assign(outBufferMethods, { packDouble, packInt32 });
		},
	],
	[
		/([\w]+)\(([\w$_]+)\){this\.([\w]+)\(256\*\2\)}/gm,
		(match: RegExpExecArray) => {
			const [, packFloat, , packInt16] = match;
			Object.assign(outBufferMethods, { packFloat, packInt16 });
		},
	],
	[
		/([\w]+)\(([\w$_]+)\){this\.([\w]+)\(2097152\*\2\)}/gm,
		(match: RegExpExecArray) => {
			const [, packRadU, , packInt24] = match;
			Object.assign(outBufferMethods, { packRadU, packInt24 });
		},
	],
	[
		/([\w]+)\(([\w$_]+)\){this\.([\w]+)\(8192\*/gm,
		(match: RegExpExecArray) => {
			const [, packRad, , packInt24] = match;
			Object.assign(outBufferMethods, { packRad, packInt24 });
		},
	],
	[
		/([\w]+)\(([\w$_]+)\){this\.buffer\[this\.idx\]=255&\2,this\.idx\+\+/gm,
		(match: RegExpExecArray) => {
			const [, packInt8] = match;
			Object.assign(outBufferMethods, { packInt8 });
		},
	],
	[
		re.gm`([\\w]+)\\(([\\w$_]+)\\){"string"!=typeof \\2&&\\(\\2=""\\).this.(${outBufferMethods.packInt8})\\(\\2\\.length\\)`,
		(match: RegExpExecArray) => {
			const [, packString] = match;
			Object.assign(outBufferMethods, { packString });
		},
	],
	[
		re.gm`([\\w]+)\\(([\\w$_]+)\\){"string"!=typeof \\2&&\\(\\2=""\\).this.(${outBufferMethods.packInt16})\\(\\2\\.length\\)`,
		(match: RegExpExecArray) => {
			const [, packLongString] = match;
			Object.assign(outBufferMethods, { packLongString });
		},
	],
	// [
	// 	/**@todo Grif - fix this */
	// 	// /([\w]+)\(([\w$_]+)\){"string"!=typeof \2&&\(\2=""\).this.([\w]+)\(\2\.length\);for\(var ([\w$_]+)=0;\4<\2\.length;\4\+\+\)this\.ABlIAEzdo\(/gm, // `ABlIAEzdo` is the packInt16
	// 	re.gm`([\\w]+)\\(([\\w$_]+)\\){"string"!=typeof \\2&&\\(\\2=""\\).this.([\\w]+)\\(\\2\\.length\\);for\\(var ([\\w$_]+)=0;\\4<\\2\\.length;\\4\\+\\+\\)this\\.${outBufferMethods.packInt16}\\(`,
	// 	(match: RegExpExecArray) => {
	// 		// here we grab both packString's at once (hopefully)
	// 		const [, FuncName, , differentialPacker] = match;
	// 		if (differentialPacker == outBufferMethods.packInt16) {
	// 			outBufferMethods.packLongString = FuncName;
	// 		} else {
	// 			outBufferMethods.packString = FuncName;
	// 		}
	// 	},
	// ],
]);
/**
 * This is a wrapper for the `OutBuffer` class / object
 * @note **make sure to intialize this before use**
 */
export const OutBufferWrapper = {
	/** a wrapper for the "packInt8" method on the OutBufferObject */
	packInt8(val: number) {
		const method = outBufferMethods["packInt8"];
		if (!method) return;
		internalOutBuffer[method](val);
	},
	/** a wrapper for the "packInt16" method on the OutBufferObject */
	packInt16(val: number) {
		const method = outBufferMethods["packInt16"];
		if (!method) return;
		internalOutBuffer[method](val);
	},
	/** a wrapper for the "packInt24" method on the OutBufferObject */
	packInt24(val: number) {
		const method = outBufferMethods["packInt24"];
		if (!method) return;
		internalOutBuffer[method](val);
	},
	/** a wrapper for the "packInt32" method on the OutBufferObject */
	packInt32(val: number) {
		const method = outBufferMethods["packInt32"];
		if (!method) return;
		internalOutBuffer[method](val);
	},
	/** a wrapper for the "packRadU" method on the OutBufferObject */
	packRadU(val: number) {
		const method = outBufferMethods["packRadU"];
		if (!method) return;
		internalOutBuffer[method](val);
	},
	/** a wrapper for the "packRad" method on the OutBufferObject */
	packRad(val: number) {
		const method = outBufferMethods["packRad"];
		if (!method) return;
		internalOutBuffer[method](val);
	},
	/** a wrapper for the "packFloat" method on the OutBufferObject */
	packFloat(val: number) {
		const method = outBufferMethods["packFloat"];
		if (!method) return;
		internalOutBuffer[method](val);
	},
	/** a wrapper for the "packDouble" method on the OutBufferObject */
	packDouble(val: number) {
		const method = outBufferMethods["packDouble"];
		if (!method) return;
		internalOutBuffer[method](val);
	},
	/** a wrapper for the "packString" method on the OutBufferObject */
	packString(str: string) {
		const method = outBufferMethods["packString"];
		if (!method) return;
		internalOutBuffer[method](str);
	},
	/** a wrapper for the "packLongString" method on the OutBufferObject */
	packLongString(str: string) {
		const method = outBufferMethods["packLongString"];
		if (!method) return;
		internalOutBuffer[method](str);
	},
	/** a wrapper for the "send" method on the OutBufferObject */
	send(ws: WebSocket) {
		const method = outBufferMethods["send"];
		if (!method) return;
		internalOutBuffer[method](ws);
	},
	/**
	 * This method grabs all the methods and unpareses them to get initiate the wrapper
	 * @param outBufferClassReference - the actual reference to the original object.
	 */
	setOutBufferObject(outBufferClassReference: Object) {
		internalOutBuffer = outBufferClassReference as outBuffer;
	},
	/**
	 * This parses the `OutBufferClassSourceCode` to get all the internal methods to use for the wrapper
	 * @note **`OutBufferClassSourceCode` is expected to *only* be the OutBuffer class string. nothing else**
	 */
	unwrapFromSource(OutBufferClassSourceCode: string) {
		for (const [regex, callback] of MappingReg.entries()) {
			const match = regex.exec(OutBufferClassSourceCode);
			if (!match) return debugError(`OutBufferWrapper failed to grab `, regex);
			callback(match);
		}
	},
};
// OutBufferWrapper.

// #types
type outMethods = { [key: string]: string };

type outBuffer = { [method: string]: (...args: any) => void };
