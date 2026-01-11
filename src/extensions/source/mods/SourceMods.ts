/**
 * This is just a module with some of my source mods ported from the original G-Tweaks (js version)
 * @todo (Grif) - finish porting the rest of the source mods
 * @author Grifmin
 *
 * Notes:
 * I use the term `Rewrite` when ive fully re implemented the function from scratch.
 * the term `patch` for slight modification. to an original function.
 * there are also exceptions for these aswell. as some cut and paste sections of code around
 * while modifying / adding conditions
 */

import { WaitForCondition, re, execOrThrow } from "../../Client/Utilities";
import { createSourceMod } from "../loader";
import { addMappings } from "../ModLoader";
import { debugDebug } from "../../logging";

export const AdblockMod = createSourceMod({
	name: "Anti Adblock",
	description: "Has multiple little patches to assist with getting around adblocking measures.",
	version: "10.12.25", // unsure when i originally wrote this, as this is just the ported version from my pure js version of GTweaks. so ill just write when i ported it
	modify: function (source: string): string {
		re.gm`testing`;
		const match = execOrThrow(
			/get productBlockAds\(\)\s?{return ([\.A-z0-9_$]+)}/gm,
			source,
			"Failed to grab productBlockAds"
		);
		const [, productBlockAds] = match;
		const productBlockAdsAssignment = re.gm`(${productBlockAds}=)`;
		const MouseLogging =
			/(console\.log\(`Mouse button \$\{\w\.button\} (?:up|down), Pointer Lock: \$\{!!document\.pointerLockElement\}`\))/gm;
		// const adInPlayPatch = regexTemplate`(${productBlockAds})(\\)return this\\.adInPlayActive=)`;
		source = source
			.replace(productBlockAdsAssignment, "$1true||$2")
			.replace(MouseLogging, "void 69 /*$1*/") // i dont need to see this
			// .replace(adInPlayPatch, '$1||true$2') // this patches out a fairly decent portion of the adInPlay js that runs
			.replace(/(hideAds=)([A-z0-9_!]+)/gm, "$1true||$2")
			.replace(/adBlockerDetected\(\){.*?}/gm, "adBlockerDetected(){}"); // :trollface:
		return source;
	},
});

export const ChallengesReRoll = createSourceMod({
	name: "Challenges Re-Roll bypass",
	description: "Bypasses the challenges re-roll from checking the vip (isUpgraded) status of the user.",
	version: "8.30.25", // apparently I dated this one for some reason.
	modify: function (source: string): string {
		const pattern = /(isUpgraded\(\))(\?[\w_$]+\([\w_$]+,this\.rerollVipSuccess\.bind\(this)/gm;
		// I simply dont consent. Thank you for understanding.
		return source.replace(pattern, "$1||true$2");
	},
});

export const ChickenWinnerTryPlay = createSourceMod({
	name: "Chicken Winner Play bypass",
	description:
		"Bypasses the chicken winner `chwTryPlay` function from checking the vip (isUpgraded) status of the user.",
	version: "10.12.25", // this is the date of my port (it was made before i started dating source mods)
	modify: function (source: string): string {
		const pattern = /[\.A-z0-0_$]+\.isUpgraded\(\)(\?\([A-z09-9_$]+\("chwTryPlay\(\) VIP\. No ads for you!)/gm;
		return source.replace(pattern, "true$1");
	},
});

export const StripObfuscatedCode = createSourceMod({
	name: "Strip Obfuscated Code",
	description: "This strips out the randomly obfuscated code that is in the game files",
	version: "10.12.25", // the ported date
	modify: function (source: string): string {
		// const firstPattern = /function ([\w_$]+)\([\w_$]\){.*?}var ([\w_$]+),([\w_$]+),([\w_$]+)=\[(?:"[\w=]+",){5}"[\w]+"\].*?};/gm;
		const firstPattern = /(var ([\w_$]+),([\w_$]+),([\w_$]+)=\[(?:"[\w=]+",){5}"[\w]+"\].*?};)/gm;
		// const [ObfuscationSetup,] = firstPattern.exec(src)
		source = source.replace(firstPattern, "/*$1*/");
		/**this will break the games source as the egg game with its infinite wisdom put two other functions *after this*
		 * to seperate where they actually add in the window[  obfuscated observer ] shit
		 * */
		const SecondPattern = /(new\(window\[.*?\].*?}\);)/gm;
		source = source.replace(SecondPattern, "/*$1*/");
		return source;
	},
});

export const ExcessiveLogsPatch = createSourceMod({
	name: "Excessive Logs Patch",
	description: "Reduces some of the (in my opinion) excessive and annoyingh logging",
	version: "10.12.25", // ported date
	modify: function (source: string): string {
		source = source
			// .replace(/(console\.log\("%cSTOP!.*?\))/gm, "void 0/*$1*/")
			.replace(/(setTimeout)(\(\(\(\)=>\([\w$_]+=null,console\.log\("%cSTOP!)/gm, "void/*$1*/ $2")
			.replace(/(console\.log\("ACTIVE ZONE IS NOW.*?\))/gm, `void 0/*$1*/`)
			.replace(/(console\.log\("action",[\w$_]+\.name\|\|[\w$_]+\),)/gm, "/*$1*/");
		return source;
	},
});

export const addChatRewrite = createSourceMod({
	name: "addChat rewrite",
	description: /**@trim */`
	a re written version of the addChat function.
	Display filtered messages, patches potential RCE bug (yes i reported it back in 1.15.2024)
	`,
	version: "10.31.25",
	modify: function (source: string): string {
		`function ([\\w$_]+)\\((?:(?:[\\w$_]+),?){5}\\){const [\\w$_]+=[\\w$_]+\\.querySelectorAll\\("\\.chat-item`;
		const funcNameRe =
			/function ([\w$_]+)\(((?:[\w$_]+),?){5}\){const [\w$_]+=[\w$_]+\.querySelectorAll\("\.chat-item/gm;
		const [, addChatName] = execOrThrow(funcNameRe, source);
		const funcSrcRe = re.gm`(function ${addChatName}\\(([\\w_$]+),([\\w_$]+),([\\w_$]+),([\\w_$]+),([\\w_$]+)\\){.*?})function`;
		const funcsrcMatch = execOrThrow(funcSrcRe, source, `Unable to grab addChat function name`);
		const [, funcsrc, msg, flags, playerId, callback_or_closure, formatter] = funcsrcMatch;

		const [, player, playerList] = execOrThrow(
			re.gm`([A-z0-9_$]+)=([A-z0-9_$]+)\\[${playerId}]`,
			funcsrc,
			"unable to get player, playerlist"
		);
		// const [, chatOutEl] = /([A-z0-9_$]+)\.querySelectorAll\("\.chat-item"\)/.exec(funcsrc);
		const [, chatOutEl] = execOrThrow(/([A-z0-9_$]+)\.querySelectorAll\("\.chat-item"\)/, funcsrc);
		const [, , isBadWord] = execOrThrow(/([A-z0-9_$]+)\.length>0&&!([A-z0-9_$]+)\(\1\)/, funcsrc);
		const [, parseSocial] = execOrThrow(re.gm`([A-z0-9_$]+)\\(${player}\.social\\)`, funcsrc); // find better name? (dont have an updated source file)
		const [, teamColors] = execOrThrow(re.gm`([A-z0-9_$]+)\\.text\\[${player}\\.team\\]`, funcsrc);
		const [, meId] = execOrThrow(re.gm`${playerId}===([A-z0-9_$]+)\\|\\|`, funcsrc);
		// const [, chatFlags] = execOrThrow(/([\w_$]+)\.pinned/gm, funcsrc);
		const [, pinned] = execOrThrow(
			/[\w$_]+&([\w$_\.]+|)&&\([\w$_]+\.classList\.add\(/gm,
			funcsrc,
			"Chatflags.pinned"
		);
		// const [, team] = /[\w$_]+&(\w$_+)&&\(.\.style\.color=[\w$_]+\.text\[\w+\.team\],/gm.exec(funcsrc)
		const [, team] = execOrThrow(
			/[\w$_]+&([\w$_\.]+)&&\(.\.style\.color=[\w$_]+\.text/gm,
			funcsrc,
			"Chatflags.team"
		);
		const [, ChatContainer] = execOrThrow(/([A-z0-9_$]+)\.scrollTop=\1\.scrollHeight/, funcsrc);
		/**@todo: (Grif) - figure out what this is */
		const [, askClosure] = execOrThrow(
			/"clickme"\),([A-z0-9_$]+)\(([A-z0-9_$]+),([A-z0-9_$]+),([A-z0-9_$]+)\)/,
			funcsrc
		);
		/**@todo: (Grif) - is this a good name?*/
		const [, safediv] = execOrThrow(re.gm`([A-z0-9_$]+)\\.innerHTML=${msg},${msg}=`, funcsrc);
		const [, uniqueId] = execOrThrow(re.gm`=${player}\\.([\\w_$]+)`, funcsrc);
		const [, myPlayer] = execOrThrow(re.gm`[\\w$_]+!=([\\w$_]+)\.${uniqueId}`, funcsrc);
		// const [, myPlayer] = /[A-z0-9]+!=([A-z0-9_$]+)\.uniqueId/.exec(funcsrc);
		//update mappings
		addMappings({
			addChat: addChatName,
			me: myPlayer,
			isBadWord,
			teamColors,
			chatOutEl,
			players: playerList,
			meId,
		});
		/**@todo: (Grif) - re implement default (but readable) addChat function. then rewrite*/
		const newFunc = /*js*/ `function ${addChatName} (message, flags, playerId, custom_click_callback, formatter) {
        let chatItems = ${chatOutEl}.querySelectorAll(".chat-item");
        if (!message) {
            /* this is scuffed, but this is accurate to the vanilla function...*/
            if (!flags & ${pinned}) return;
            for (let chat of chatItems) {
                if (!chat.classList.contains("chat-pinned-item")) return;
                chat.remove();
            }
        }

        let chatItem        = document.createElement("div");
        let playerMsgSpan   = document.createElement("span");
        let playerInfoDiv   = document.createElement("div");
        let playerNameSpan  = document.createElement("span");
        let socialIcon      = document.createElement("i");

        let hasUpgrade      = false;
        let SocialBadge     = false;
        let uniqueId        = false;

        chatItem.classList.add("chat-item");
        playerInfoDiv.style.display = "inline-block";

        /* i dont like this if statement tbh, but i guess its fine for now. (replicate first, before modification)*/
        if (playerId > 253) {
            if (playerId == 255) {
                playerNameSpan.textContent = "SERVER: ";
                playerInfoDiv.style.color = "#ff0";
            } else if (playerId == 254) {
                playerNameSpan.textContent = "MOD: ";
                playerInfoDiv.style.color = "#0f0";
            }
            playerNameSpan.classList.add("chat-player-name", "ss_marginright_xs");
            playerInfoDiv.appendChild(playerNameSpan);
        } else {
            let player = ${playerList}[playerId];
            
            /* here they are "purifying" the text to remove any <asdf>. but why innerHTML */
            ${safediv}.innerHTML = message;
            message = ${safediv}.textContent.trim();

            const condition = ( playerId === ${meId} || ((!(player?.muted ?? true) && message.length)) );
			/* updated (better) condition*/
            /*const condition = ( playerId === ${meId} ||
                (
                    playerId !== null && 
                    player && // (sometimes it gives a incorrect Idx and player var is null)
                    !player.muted && // you can just do !player?.muted instead of this ^ (rewrite later)
                    message.length > 0 &&
                    // !${isBadWord}(message) && // no chat filter please :eyes:
                    message.indexOf("<") // btw. wtf is this for??
                )
            )*/
            /* rewrite "condition" var as its not an actual declared variable? */
            if (condition) {
                /* hasUpgrade = !!(player.upgradeProductId && player.upgradeProductId > 0)  bruh */
                hasUpgrade = (player?.upgradeProductId > 1);
                SocialBadge = ${parseSocial}(player.social);

                if (SocialBadge && !player.hideBadge) {
                    socialIcon.classList.add("fab", SOCIALMEDIA[SocialBadge.id]);
                    /*  should SOCIALMEDIA be dynamic? ^ it is a const in index.html*/
                    socialIcon.classList.add("ss_marginright_xs");
                } else if (hasUpgrade && !player.hideBadge) {
                    socialIcon.classList.add("fas", "fa-egg", "hidden", "text_gold", "vip-egg");
                    socialIcon.classList.add("ss_marginright_xs");
                }
                uniqueId = player.${uniqueId};
                playerNameSpan.classList.add("chat-player-name", "ss_marginright_xs");
                playerNameSpan.textContent = player.name + ": ";
                /* console.log(player.name, message); stawp it console logging :(*/
                if (flags & ${team}) {
                    playerMsgSpan.style.color = ${teamColors}.text[player.team];
                    playerMsgSpan.classList.add("chat-team");
                }
                playerInfoDiv.style.color = ${teamColors}.text[player.team];
                playerInfoDiv.appendChild(socialIcon);
                playerInfoDiv.appendChild(playerNameSpan);

            } else if (playerId !== null) {
                return; /* this *should* never happen.*/
            }
        }
        // if (chatItems.length > 4) {
        //     if (chatItems[0].classList.contains("chat-pinned-item")) {
        //         if (flags & ${pinned}) {
        //             chatItems[0].remove();
        //         } else {
        //             chatItems[1].remove();
        //         }
        //     } else {
        //         chatItems[0].remove();
        //     }
        // }
        /* playerMsgSpan.innerHTML = message; - disabling due to html injection concerns*/
        playerMsgSpan.textContent = message; // add text content
        if (playerId < 253 && ${isBadWord}(message)) {
            // playerMsgSpan.style.color = 'RED'; 
			playerMsgSpan.classList.add('addChatfiltered')
            // just showing that its chat filtered for now :blobshrug:
        }

        if (formatter) {
            playerMsgSpan.innerHTML = playerMsgSpan.innerHTML.format(formatter) 
            /** this *does* re introduce the html injection concerns. however this should only ever be called internally (ie: share link popup)
             * ^ this is neat. could be used for custom elements in html :eyes: maybe even :emoji:
             */
        }
        if (flags & ${pinned}) {
            playerMsgSpan.classList.add("chat-pinned");
            chatItem.classList.add("chat-pinned-item");
        }
        chatItem.appendChild(playerInfoDiv);
        chatItem.appendChild(playerMsgSpan);

        chatItem.classList.add("clickme");
        chatItem.onclick = () => {
            if (!uniqueId && custom_click_callback) {
                custom_click_callback();
            /*} else if (playerId != ${myPlayer}.id) {*/ 
			// no thanks. i would like to click myself
            } else {
                playerNameSpan.classList.add("clickme");
                ${askClosure}(uniqueId, SocialBadge, hasUpgrade)();
            }
        };
        ${chatOutEl}.appendChild(chatItem);
        // if (${ChatContainer}) {
			// ${ChatContainer}.scrollTop = ${ChatContainer}.scrollHeight;
		if (${chatOutEl}) {
			// auto scrolling down (how nice)
			// ${chatOutEl}.parentElement.scroll({top: ${chatOutEl}.parentElement.scrollHeight});
			${chatOutEl}.scroll({top: ${chatOutEl}.scrollHeight}); // doesnt work
			
        }

    }`;
		return source.replace(funcsrc, newFunc);
	},
});

export const onChatKeyDownRewrite = createSourceMod({
	name: "onChatKeyDown rewrite",
	description: "re writes the onChatKeyDown function to show when you are typing in a filtered message (hopefully)",
	version: "11.9.25",
	requiredMappings: ["isBadWord", "addChat"] as const, // i dont technically need all of these. its just nice to have
	modify: function (source: string, requestedMappings): string {
		// throw new Error("Function not implemented.");
		const { isBadWord, addChat } = requestedMappings;
		const srcmatch = /onChatKeyDown:(function\([\w$_]+\){.*?}),startChat:/gm;
		const [, funcSrc] = execOrThrow(srcmatch, source, "onChatKeyDown.toString()");
		const [, chatInEl, fixStringWidth] = execOrThrow(/([\w$_]+)\.value=([\w$_]+)\(\1\.value,280/gm, funcSrc);
		/**
		 * so once again, bwd has randomly decided to unpack the chatFlags variable.
		 * somtimes its declared like this in the game source:
		 * ```js
		 * chatFlags = {
		 * 		none: 0,
		 * 		teams: number
		 * 		ctf: number
		 * 		... 
		 * }
		 * ```
		 * im guessing with their build process they have an option to unpack / destructure objects at runtime which hard code the variables to:
		 * chatFlags$none	-> obfuscated name
		 * chatFlags$teams	-> obfuscated name
		 * chatFlags$ctf	-> obfuscated name
		 * 
		 * so we have to build a patch condition to allow for each case for more reliablity... yay
		 */
		// const [, chatFlags, isGameOwner] = execOrThrow(/case"pin":return ([\w$_]+)\?([\w$_]+)\.pinned/gm, funcSrc);
		const chatFlagsAndGameOwnerRE = /case"pin":return ([\w$_]+)\?([\w$_]+\.pinned|[\w$_]+):([\w$_]+(?:\.none)?)/gm;
		const [, chatFlags$pinned, isGameOwner, chatFlags$none] = execOrThrow(chatFlagsAndGameOwnerRE, funcSrc, 'onChatKeyDown$chatFlags.pinned')
		// const teamRe = re.gm`\\?([\\w$_]+)\\?${chatFlags}\\.team/`;
		const teamRe = /\?([\w$_]+)\?([\w_$]+(?:\.team)?)/gm;
		// console.log(teamRe)
		const [, isTeamsMode, chatFlags$teams] = execOrThrow(teamRe, funcSrc, "onChatKeyDown.isTeamsMode");
		// const [, stopChat] = execOrThrow(/\.stopPropagation\(\),([\w$_]+)\(\)}}/gm, funcSrc, 'onChatKeyDown.stopChat')
		const [, stopChat] = execOrThrow(/([\w$_]+)\(\)}}/gm, funcSrc, "onChatKeyDown.stopChat");
		const [, chatEvents] = execOrThrow(/"chat",([\w$_]+)\)\}/gm, funcSrc, "onChatKeyDown.chatEvents");
		const [, clientPerms] = execOrThrow(/([\w$_]+)\.adminRoles/gm, funcSrc, "onChatKeyDown.clientPerms");
		const observeAndmeIdRe = re.gm`([\\w$_]+)\\|\\|${addChat}\\([\\w$_]+,[\\w$_]+,([\\w$_]+)\\)`;
		// const [,observingGame, meId] = execOrThrow(/([\w$_]+)\|\|addChat\([\w$_]+,[\w$_]+,([\w$_]+)\)/gm, funcSrc);
		const [, observingGame, meId] = execOrThrow(observeAndmeIdRe, funcSrc);
		const [, sendMessageWS] = execOrThrow(/indexOf\("<"\)<0\){([\w$_]+)/gm, funcSrc, "sendMessageWS");
		// @todo (Grif) - add in chat completions someday, maybe
		/*
		(async () => {
			// wacky i know. but if i make it this far, its probably fine
			// concept. add in commandSuggestions to chatinput?
			const chatIn = document.getElementById('chatIn') as HTMLInputElement;
			chatIn.setAttribute('list', 'commandSuggetions');
		})()*/
		const replacementFunctionSource = /*js*/ `function(event) {
			const { key } = (event || window.event);
			${chatInEl}.value = ${fixStringWidth}(${chatInEl}.value, 280); // more filtering of course. 
			let text = ${chatInEl}.value.trim(); // message (before anything is done)
			// as to why we are using a switch instead of a if (['Enter', 'Tab'].includes(key)) ... im unsure
			switch (key) {
				case "Enter":
					if ('' != text && text.indexOf('<') < 0) {
						${sendMessageWS}(text);
						let addChatFlags = ((text) => {
							if (!text.startsWith('/')) return ${chatFlags$none};
							const textArg1 = text.slice(1).split(' ');
							switch (key) {
								case 't':
								case 'team':
									return textArg1[1] ? ${isTeamsMode} ? ${chatFlags$teams} : ${chatFlags$none} : null;
								case "p":
								case "pin":
									return ${isGameOwner} ? ${chatFlags$pinned} : ${chatFlags$none};
								default:
									return ${chatFlags$none};
							}
						})(text); // yea they actually did this.
						if (addChatFlags != ${chatFlags$none}) {
							text = ((text) => {
								let textSplit = text.split(' ');
								return text.slice(textSplit[0].length + 1);
							})(text); // this strips the command from the text for the addChat func
							// as to why exactly the made this a function :blobshrug:
						}
						if (!${observingGame}) {
							${addChat}(text, addChatFlags, ${meId});
						}
						if (${clientPerms}.adminRoles && !${isGameOwner}) {
							player.chatLines++;
							if (player.chatLines > 2) {
								${chatInEl}.style.visibility = 'hidden';
							}
						};
						${chatEvents}++;
						if (${chatEvents} === 1) {
							/*ga('send', 'event', 'game', 'stats', 'chat', ${chatEvents});*/
						}
					}
				case "Tab":
					event.preventDefault();
					event.stopPropagation();
					if (key != 'Tab') {
						${stopChat}();
					};
			}
			/*this is all my additions (fancy right) */
			if (key.length == 1) {
				text += key;
			} else if (key == 'Backspace') {
				text = text.slice(0, text.length -1);
			}
			/*we defer a function to run nearly instantly after the function just incase we hit "enter" or something else happens idk */
			setTimeout(() => {
				/*${chatInEl}.style.color = ${isBadWord}(${chatInEl}.value) ? 'red' : '';*/
				${chatInEl}.classList[ ${isBadWord}(${chatInEl}) ? 'add' : 'remove' ]('addChatfiltered');
				// i decided i'd use the classList so that others can intercept / overwrite my theme stuff. idk
			}, 1);
			${chatInEl}.style.color = ${isBadWord}(text) ? 'red' : '';
		}`.trim();
		// Object.assign(window, {onChatKeyDownRewrite: replacementFunctionSource}); // for debug
		return source.replace(funcSrc, replacementFunctionSource);
	},
});

export const setRespawnTimerMod = createSourceMod({
	name: "Respawn Timer mod",
	description: "Modifies the setRespawnTime() function to have some decimal places",
	version: "10.12.25", // ported
	/**
	 * yea... so porting a js mod that embeds a js function into a js file to ts...
	 * not exactly the cleanest, especially since ts has an actual stroke when you just blindly
	 * ignore the fact that RegExp.exec(...) doesnt always return an ArrayLike object.
	 * (which is fine as intend on handling the errors to begin with).
	 * this might be one of the valid cases for using js instead of ts.
	 * @todo (Grif) - clean this up.
	 */
	modify: function (source: string): string {
		const firstMatch = execOrThrow(
			/function ([A-z0-9_$]+)\(([A-z0-9_$]+)\){([\w|$]+)=Math\.max\(\2,\3\).*?1200\)}/gm,
			source
		);
		const [funcsrc, setRespawnTime, , respawnTime] = firstMatch;
		addMappings({ setRespawnTime });

		// const {0: source, 1: setRespawnTime, 3: respawnTime} = /function ([A-z0-9_$]+)\(([A-z0-9_$]+)\){([\w|$]+)=Math\.max\(\2,\3\).*?1200\)}/gm.exec(src);
		const secondMatch = execOrThrow(/([\w_$]+)\.clear\(([\w_$]+)\),([\w_$]+)\(\),([\w_$]+)\(\)/gm, funcsrc);
		const [, interval, respawnInterval, PrepRespawnAd, doMapOverviewCamera] = secondMatch;
		// const [, inGame] = new RegExp(`${respawnTime}<=0&&([A-z0-9_$]+)`).exec(funcsrc);
		const third = execOrThrow(re.gm`${respawnTime}<=0&&([A-z0-9_$]+)`, funcsrc); // definitely like the regextemplate funciton lol
		const [, inGame] = third;
		//update mappings (useful)
		const vars = {
			setRespawnTime,
			respawnTime,
			respawnInterval,
			doMapOverviewCamera,
			interval,
			inGame,
		};
		// if (Object.values(vars).includes(null)) throw new Error(`Unable to get a variable ${vars}`); // this was the "js way"
		// Object.assign(mappings, vars); // update mappings
		addMappings(vars);

		const newFunc = /*js*/ `function ${setRespawnTime} (sec, decimals = 1, FATSec = 1200) {
        ${respawnTime} = Math.max(sec, ${respawnTime}); 
		/* ^ set the new respawntime (if needed)*/
        if (${respawnInterval}) clearInterval(${respawnInterval});
        /* vueApp.game.respawnTime = ${respawnTime}.toFixed(decimals); */
		
        ${respawnInterval} = setInterval(() => {
            ${respawnTime} = Number((${respawnTime} - (1 / (decimals * 10))).toFixed(decimals));
            /* vueApp.game.respawnTime = Math.min(${respawnTime}, 5); */
            vueApp.game.respawnTime = ${respawnTime}.toFixed(decimals); 
			/* ^ shitty work around. for some reason it gets turned into a string?*/
            if (${respawnTime} <= 0 && ${inGame}) {
                ${respawnTime} = -1;
                clearInterval(${respawnInterval});
                ${PrepRespawnAd}(); // is this really needed
				/* ^is this really needed? */
                ${doMapOverviewCamera}();
            }
        }, Math.floor(FATSec / (decimals * 10))); /* why is this 1.2sec instead of 1sec? */
    	}`;
		/**@todo (Grif) - extract this out and not make this ghetto */
		(async () => {
			await WaitForCondition(() => vueApp?.$refs?.gameScreen);
			const dis = vueApp.$refs.gameScreen;
			// yes, i just made a local reference then mapped all references of `this` to `dis` flawless (dont judge)
			const playBtnText = () => {
				if (!dis.delayTheCracking && !dis.isRespawning) {
					return dis.loc.ui_game_get_ready;
				} else if (dis.delayTheCracking && dis.isRespawning) {
					return dis.game.respawnTime; // imagine if we just handle it properly from the gitgo :shockedcat:
					/*if (dis.game.respawnTime > 5) {
						return dis.game.respawnTime - 5;
					} else {
						return dis.game.respawnTime
					}*/
				} //else {
				return dis.loc.p_pause_play;
				// }
			};

			Object.defineProperty(vueApp.$refs.gameScreen, "playBtnText", {
				get: playBtnText,
			});
		})();
		// i bet comments are probably nice. but im not going to add many.
		return source.replace(funcsrc, newFunc);
	},
});
// /*
export const exitSpectateModePatch = createSourceMod({
	name: "exit SpectateMode patch",
	description:
		"This is my psudo attempt to patch out the exit spectator mode from setting the respawn time to 5 seconds",
	version: "9.1.25", // description + date - from original GTweaks.js
	requiredMappings: ["me", "setRespawnTime"] as const, // the mappings this function actual requries... yay i get to finally implement that
	modify: function (source, mappings): string {
		const { me, setRespawnTime } = mappings;
		// debugDebug(`HERE IN ${this.name}`, {me, setRespawnTime});
		// by the way, this was the last function that i implemeneted in the original GTweaks.js.
		// it is also *by far* one of the most poorly written mods ive ever done. dont judge

		// throw new Error("Function not implemented."); // my god this looks bad. ill just leave this disabled for now
		const firstMatch = execOrThrow(
			re.gm`respawn:function\\(\\)\\{return [\\w_$]+\\?\\(${me}\\.([\\w_$]+)=!0`,
			source,
			"Failed to grab playingState"
		);
		const [, playingState] = firstMatch;

		const funcNamePattern = re.gm`document\\.onpointerlockchange=function\\(\\){!document\\.pointerLockElement&&${me}&&([\\w_$]+)\\(\\)},`;
		const funcNameMatch = execOrThrow(funcNamePattern, source, "Failed to grab func name");
		const [, functionName] = funcNameMatch;
		// const funcPattern = /}\(\)}function ([\w_$]+)\(\)\{.*?console\.log\("pausing game via pointerlock exit"\),[\w_$]+\(\),crazySdk\.gameplayStop\(\)}/gm;
		const funcPattern = re.gm`}\\(\\)}(function ${functionName}\\(\\)\\{.*?console\\.log\\("pausing game via pointerlock exit"\\),[\\w_$]+\\(\\),crazySdk\\.gameplayStop\\(\\)})`;
		const funcsrcMatch = execOrThrow(funcPattern, source, `Failed to grab func src`);
		const [, funcsrc] = funcsrcMatch;
		let newFunc = funcsrc.replace(
			`${functionName}(){`,
			`${functionName}(){let wasIngame = ${me}.${playingState};/*console.log({wasIngame});*/`
		);
		newFunc = newFunc.replace(setRespawnTime, `!wasIngame ? ${setRespawnTime}(0) : ${setRespawnTime}`);
		// const pattern = new RegExp(`(${me}\\.resetCountdowns\\(\\),)(${setRespawnTime}\\(![\\w_$]+\\|\\|[\\w_$]+\\.productBlockAds\\|\\|pokiActive)`,'gm');
		return source.replace(funcsrc, newFunc); // this is mingled as fuck, and probably one of the worse source mods ive ever written
	},
});

export const AntiAFKKick = createSourceMod({
	name: "Anti afk kick",
	description: "Prevents you from being kicked for being afk while ingame",
	version: "11.10.25", // 
	/**
	 * technically a new mod, although ive had this implemented before with a different mod that i used 
	 * (it was packet based rather than modifying the source code. it also had to take into account when i was in spectate mode
	 * as i didnt disable it in the source code as ive done here. )
	 */
	modify: function (source: string): string {
		// monster regex pattern. what a pain to setup. i wonder when it will break....
		const patt =
			/(([\w$_]+)=([\w$_]+)\.set\(\((function\(\){var ([\w$_]+)=[\w$_]+\.getBuffer\(\);\5\.[\w$_]+\([\w$_\.]+\),\5\.send.*?)\),(?:15e3|15000)\))/gm;
		const [, keepAlivePoint, , , keepAliveCallback] = execOrThrow(patt, source, "");
		source = source.replace(keepAlivePoint, `void 69420/*${keepAlivePoint}*/`); // i need a valid statement as a replacement
		/**
		 * its the niche things that irritate me.
		 * i dont even run into this issue that often, yet it bothered me enough to do this...
		 */
		const EmbedFunctionLogic = /*js*/`(()=>{
			setInterval(() => {
				const ingameCondition = (vueApp?.ui?.game?.spectate || vueApp?.game?.isPaused) && vueApp?.game?.on;
				if (!ingameCondition) return; // my condition sofar
				// todo: add in a second condition to check if the player is ingame ie: check playingState (need wrappres / more advanced mappings)
				(${keepAliveCallback})(); // call the keepAliveFunction (wrapper)
			}, 15_000)
		})()`;
		const embedPattern = /(window\.extern)/gm;

		return source.replace(embedPattern, `${EmbedFunctionLogic};$1`);
	},
});
// # concept / disabled mods
/*
export const renderForCameraRewrite = createSourceMod({
	name: "_renderForCamera Re-write",
	description: "a rewrite to the babylonjs's _renderForCamera functon",
	modify: function (source: string): string {
		const pattern = /(_renderForCamera\((?:[\w$_,]+){3}=!\d\).*?)removeMaterial/gm.exec(source);
		if (!pattern) throw new PatternMatchFailed(`Failed to grab function source for ${this.name}`);
		const [, functionSource] = pattern; // finish implementing

		let replacementFunctionSource;

		throw new Error("Function not implemented.");
		return source.replace(functionSource, replacementFunctionSource);
	}
})
*/
