// ==UserScript==
// @name            GTweaks V2
// @namespace       Grifmin-GTweaks-V2
// @match           *://*shellshock.io/*
// @run-at          document-start
// @version         1.10.2026
// @author          Grifmin
// @description     A work in progress. (if you get this somehow, just know its not complete)
// @updateURL       https://raw.githubusercontent.com/Grifmin/egg_game/refs/heads/master/dist/userscript.js
// @downloadURL     https://raw.githubusercontent.com/Grifmin/egg_game/refs/heads/master/dist/userscript.js
// @unwrap
// ==/UserScript==
"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // src/extensions/logging.ts
  var css = {
    success: `background: #006700 ;padding:.125em .375em;border-radius:.1875em;margin-right:.3125em;`,
    warn: `background: #ff6d00 ;padding:.125em .375em;border-radius:.1875em;margin-right:.3125em;`,
    fail: `background: #FF0000 ;padding:.125em .375em;border-radius:.1875em;margin-right:.3125em;`,
    info: `background: #413C26 ;padding:.125em .375em;border-radius:.1875em;margin-right:.3125em;`,
    number: `color: #7E64FF ; padding:.125em .375em;border-radius:.1875em;margin-right:.3125em;`
  };
  var { log, warn, error, info, debug } = console;
  function debugInfo(message, ...other) {
    info(`%cG-Tweaks: %c${message}`, css.success, "", ...other);
  }
  function debugError(message, ...other) {
    error(`%cG-Tweaks Error: %c${message}`, css.fail, "", ...other);
  }
  function debugWarn(message, ...other) {
    warn(`%cG-Tweaks Warn: %c${message}`, css.warn, "", ...other);
  }
  function debugDebug(message, ...other) {
    debug(`%cG-Tweaks Debug: %c${message}`, css.warn, "", ...other);
  }

  // src/extensions/alternativeSearch/aliases.json
  var aliases_default = {
    aliases: {
      "star wars": {
        tags: ["Eggwalker", "Eggwalker2"],
        negate: [1127, 1135, 1319]
      },
      mario: {
        tags: ["Kart"]
      },
      "among us": {
        tags: ["AmongEgg"]
      }
    }
  };

  // src/extensions/alternativeSearch/index.ts
  var { aliases } = aliases_default;
  function searchByNameIncludes(input, items, options) {
    return items.filter((item) => (options.isCaseSensitive ? item.name : item.name.toLowerCase()).includes(input));
  }
  function searchByItemId(input, items, options) {
    const itemId = Number(input);
    return items.filter((item) => item.id == itemId);
  }
  function searchByMeshNameIncludes(input, items, options) {
    return items.filter(
      (item) => (options.isCaseSensitive ? item.item_data.meshName : item.item_data.meshName?.toLowerCase())?.includes(input)
    );
  }
  function searchByAliasesHelper(items, searchFormat) {
    let returnList = [];
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
      const result = names.map((name) => searchByNameIncludes(name, items, { isCaseSensitive: true })).flat();
      returnList = returnList.concat(result);
    }
    if (searchFormat.negate) {
      const { negate } = searchFormat;
      returnList = returnList.filter((item) => !negate.includes(item.id));
    }
    return returnList;
  }
  function searchByAliases(input, items, options) {
    let returnList = [];
    const itemSearchTermPatch = (term) => term.replace(/\s/g, "");
    const keys = Object.keys(aliases).map(itemSearchTermPatch);
    if (!keys.some((key) => key.includes(input))) return debugInfo(`${input} not in`, keys), [];
    const entiresPatch = ([alias, keyword]) => [itemSearchTermPatch(alias), keyword];
    const aliasEntries = Object.entries(aliases).map(entiresPatch);
    for (const [alias, searchFormat] of aliasEntries) {
      if (!alias.includes(input)) continue;
      const Items = searchByAliasesHelper(items, searchFormat);
      returnList = returnList.concat(Items);
    }
    return returnList;
  }
  function searchByTags_tagIncludes(input, items, options) {
    return items.filter(
      (item) => item.item_data.tags?.some((tag) => (options.isCaseSensitive ? tag : tag.toLowerCase()).includes(input))
    );
  }
  var searchFunctions = [
    searchByMeshNameIncludes,
    searchByNameIncludes,
    searchByAliases,
    searchByItemId,
    searchByTags_tagIncludes
  ];
  var Foose = class {
    items;
    options;
    constructor(items, options) {
      Object.assign(this, { items, options });
    }
    /** This is the main interface that the Fuse class uses to search with */
    search(input) {
      input = this.options.isCaseSensitive ? input : input.toLowerCase();
      const ItemsFlattened = searchFunctions.map((searchFunc) => searchFunc(input, this.items, this.options)).flat();
      const items = [...new Set(ItemsFlattened)];
      return Object.entries(items).map(([key, item]) => ({ item }));
    }
  };
  var description = (
    /**@trim */
    `
This extension provides an alternative searching method for the inventory. 
Completely optional though. 
Feel free to request improvements for the alternative search extension!
`.trim()
  );
  var originalFuse;
  var state;
  function redefine() {
    Object.defineProperty(window, "Fuse", {
      get() {
        if (state) return Foose;
        return originalFuse;
      },
      set(value) {
        originalFuse = value;
      },
      configurable: true
      // sure why not allow it to be configurable.
    });
  }
  var Extension = createExtension({
    uniqueIdentifier: `Grifmin-AlternativeSearch`,
    defaultSettings: { enabled: false },
    author: "Grifmin",
    description,
    version: `1.0`,
    // :blobshrug:
    name: "Alternative Search",
    init() {
      originalFuse = window.Fuse;
      state = this.settings.enabled;
      redefine();
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
        state = newstate;
      }
      return state;
    },
    isEnabled() {
      return this.settings.enabled;
    }
  });

  // src/extensions/source/ModLoader.ts
  var mappings = {};
  var ModLoader = {
    get sourcemappings() {
      return mappings;
    },
    src: ``,
    Getter: () => {
      throw new Error("Getter not defined yet.");
    },
    getMappings(requestedMappings = mappings) {
      function safeGetter(value) {
        try {
          return ModLoader.Getter(value);
        } catch (err) {
          return void 0;
        }
      }
      const map = Object.entries(requestedMappings).map(([key, value]) => [key, safeGetter(value)]);
      const Obj = Object.fromEntries(map);
      return Obj;
    }
  };
  function addMappings(data) {
    Object.assign(mappings, data);
  }
  function attemptDefineModloaderInternal(ModLoader2) {
    try {
      Object.defineProperty(window, "ModLoader", {
        get: () => ModLoader2,
        configurable: true
        // allow others to extend (and hopefully not overwrite)
      });
    } catch (err) {
      debugError(`Error when attempting to define ModLoader on window`, err);
    }
  }
  function attemptDefineModloader() {
    if ("ModLoader" in window) {
      const defined = window.ModLoader;
      const filteredEntries = Object.entries(ModLoader).filter(([key, value]) => !defined[key]);
      const newInstance = Object.fromEntries(filteredEntries);
      const extendedModLoader = Object.assign(newInstance, window.ModLoader);
      const err = new Error(`ModLoader already defined on window object`, { cause: window.ModLoader });
      attemptDefineModloaderInternal(extendedModLoader);
      return debugError(`%cWarning: `, css.warn, err);
    }
    attemptDefineModloaderInternal(ModLoader);
  }

  // src/extensions/source/mods/SourceMods.ts
  var SourceMods_exports = {};
  __export(SourceMods_exports, {
    AdblockMod: () => AdblockMod,
    AntiAFKKick: () => AntiAFKKick,
    ChallengesReRoll: () => ChallengesReRoll,
    ChickenWinnerTryPlay: () => ChickenWinnerTryPlay,
    ExcessiveLogsPatch: () => ExcessiveLogsPatch,
    StripObfuscatedCode: () => StripObfuscatedCode,
    addChatRewrite: () => addChatRewrite,
    exitSpectateModePatch: () => exitSpectateModePatch,
    onChatKeyDownRewrite: () => onChatKeyDownRewrite,
    setRespawnTimerMod: () => setRespawnTimerMod
  });

  // src/extensions/Client/Utilities.ts
  async function WaitForCondition(condition, pollingRate = 250, maxTimeout = 45e3) {
    const StartTime = Date.now();
    let interval;
    return new Promise((resolve, reject) => {
      interval = setInterval(() => {
        if (Date.now() - StartTime >= maxTimeout) {
          clearInterval(interval);
          return reject(`Timed out, waited for - ${maxTimeout}ms`);
        }
        if (!condition()) return;
        clearInterval(interval);
        resolve();
      }, pollingRate);
    });
  }
  var PatternMatchFailed = class extends Error {
  };
  function regexTemplate(flag, strings, ...values) {
    function LITERAL(str) {
      return str == void 0 ? "" : str.replace(/\$/gm, "\\$").replace(".", "\\.");
    }
    const transformed = strings.map((str, idx) => str + LITERAL(values[idx])).join("");
    return new RegExp(transformed, flag);
  }
  var defaultRegexTemplate = (strings, ...values) => regexTemplate("", strings, ...values);
  var validCharacters = "gmidusvy";
  var re = new Proxy(defaultRegexTemplate, {
    get(target, flags) {
      if (flags == "name") return target;
      const charsValid = flags.split("").every((char) => validCharacters.includes(char));
      if (!charsValid)
        throw new PatternMatchFailed(`"${flags}" includes invalid characters. valid characters: ${validCharacters}`);
      return (strings, ...values) => {
        return regexTemplate(flags, strings, ...values);
      };
    }
  });
  function execOrThrow(pattern, source, reason) {
    const result = pattern.exec(source);
    if (!result) {
      throw new PatternMatchFailed(reason ?? `Error pattern matching with ${pattern}`, { cause: pattern });
    }
    return result;
  }

  // src/extensions/source/mods/SourceMods.ts
  var AdblockMod = createSourceMod({
    name: "Anti Adblock",
    description: "Has multiple little patches to assist with getting around adblocking measures.",
    version: "10.12.25",
    // unsure when i originally wrote this, as this is just the ported version from my pure js version of GTweaks. so ill just write when i ported it
    modify: function(source) {
      re.gm`testing`;
      const match = execOrThrow(
        /get productBlockAds\(\)\s?{return ([\.A-z0-9_$]+)}/gm,
        source,
        "Failed to grab productBlockAds"
      );
      const [, productBlockAds] = match;
      const productBlockAdsAssignment = re.gm`(${productBlockAds}=)`;
      const MouseLogging = /(console\.log\(`Mouse button \$\{\w\.button\} (?:up|down), Pointer Lock: \$\{!!document\.pointerLockElement\}`\))/gm;
      source = source.replace(productBlockAdsAssignment, "$1true||$2").replace(MouseLogging, "void 69 /*$1*/").replace(/(hideAds=)([A-z0-9_!]+)/gm, "$1true||$2").replace(/adBlockerDetected\(\){.*?}/gm, "adBlockerDetected(){}");
      return source;
    }
  });
  var ChallengesReRoll = createSourceMod({
    name: "Challenges Re-Roll bypass",
    description: "Bypasses the challenges re-roll from checking the vip (isUpgraded) status of the user.",
    version: "8.30.25",
    // apparently I dated this one for some reason.
    modify: function(source) {
      const pattern = /(isUpgraded\(\))(\?[\w_$]+\([\w_$]+,this\.rerollVipSuccess\.bind\(this)/gm;
      return source.replace(pattern, "$1||true$2");
    }
  });
  var ChickenWinnerTryPlay = createSourceMod({
    name: "Chicken Winner Play bypass",
    description: "Bypasses the chicken winner `chwTryPlay` function from checking the vip (isUpgraded) status of the user.",
    version: "10.12.25",
    // this is the date of my port (it was made before i started dating source mods)
    modify: function(source) {
      const pattern = /[\.A-z0-0_$]+\.isUpgraded\(\)(\?\([A-z09-9_$]+\("chwTryPlay\(\) VIP\. No ads for you!)/gm;
      return source.replace(pattern, "true$1");
    }
  });
  var StripObfuscatedCode = createSourceMod({
    name: "Strip Obfuscated Code",
    description: "This strips out the randomly obfuscated code that is in the game files",
    version: "10.12.25",
    // the ported date
    modify: function(source) {
      const firstPattern = /(var ([\w_$]+),([\w_$]+),([\w_$]+)=\[(?:"[\w=]+",){5}"[\w]+"\].*?};)/gm;
      source = source.replace(firstPattern, "/*$1*/");
      const SecondPattern = /(new\(window\[.*?\].*?}\);)/gm;
      source = source.replace(SecondPattern, "/*$1*/");
      return source;
    }
  });
  var ExcessiveLogsPatch = createSourceMod({
    name: "Excessive Logs Patch",
    description: "Reduces some of the (in my opinion) excessive and annoyingh logging",
    version: "10.12.25",
    // ported date
    modify: function(source) {
      source = source.replace(/(setTimeout)(\(\(\(\)=>\([\w$_]+=null,console\.log\("%cSTOP!)/gm, "void/*$1*/ $2").replace(/(console\.log\("ACTIVE ZONE IS NOW.*?\))/gm, `void 0/*$1*/`).replace(/(console\.log\("action",[\w$_]+\.name\|\|[\w$_]+\),)/gm, "/*$1*/");
      return source;
    }
  });
  var addChatRewrite = createSourceMod({
    name: "addChat rewrite",
    description: (
      /**@trim */
      `
	a re written version of the addChat function.
	Display filtered messages, patches potential RCE bug (yes i reported it back in 1.15.2024)
	`
    ),
    version: "10.31.25",
    modify: function(source) {
      `function ([\\w$_]+)\\((?:(?:[\\w$_]+),?){5}\\){const [\\w$_]+=[\\w$_]+\\.querySelectorAll\\("\\.chat-item`;
      const funcNameRe = /function ([\w$_]+)\(((?:[\w$_]+),?){5}\){const [\w$_]+=[\w$_]+\.querySelectorAll\("\.chat-item/gm;
      const [, addChatName] = execOrThrow(funcNameRe, source);
      const funcSrcRe = re.gm`(function ${addChatName}\\(([\\w_$]+),([\\w_$]+),([\\w_$]+),([\\w_$]+),([\\w_$]+)\\){.*?})function`;
      const funcsrcMatch = execOrThrow(funcSrcRe, source, `Unable to grab addChat function name`);
      const [, funcsrc, msg, flags, playerId, callback_or_closure, formatter] = funcsrcMatch;
      const [, player, playerList] = execOrThrow(
        re.gm`([A-z0-9_$]+)=([A-z0-9_$]+)\\[${playerId}]`,
        funcsrc,
        "unable to get player, playerlist"
      );
      const [, chatOutEl] = execOrThrow(/([A-z0-9_$]+)\.querySelectorAll\("\.chat-item"\)/, funcsrc);
      const [, , isBadWord] = execOrThrow(/([A-z0-9_$]+)\.length>0&&!([A-z0-9_$]+)\(\1\)/, funcsrc);
      const [, parseSocial] = execOrThrow(re.gm`([A-z0-9_$]+)\\(${player}\.social\\)`, funcsrc);
      const [, teamColors] = execOrThrow(re.gm`([A-z0-9_$]+)\\.text\\[${player}\\.team\\]`, funcsrc);
      const [, meId] = execOrThrow(re.gm`${playerId}===([A-z0-9_$]+)\\|\\|`, funcsrc);
      const [, pinned] = execOrThrow(
        /[\w$_]+&([\w$_\.]+|)&&\([\w$_]+\.classList\.add\(/gm,
        funcsrc,
        "Chatflags.pinned"
      );
      const [, team] = execOrThrow(
        /[\w$_]+&([\w$_\.]+)&&\(.\.style\.color=[\w$_]+\.text/gm,
        funcsrc,
        "Chatflags.team"
      );
      const [, ChatContainer] = execOrThrow(/([A-z0-9_$]+)\.scrollTop=\1\.scrollHeight/, funcsrc);
      const [, askClosure] = execOrThrow(
        /"clickme"\),([A-z0-9_$]+)\(([A-z0-9_$]+),([A-z0-9_$]+),([A-z0-9_$]+)\)/,
        funcsrc
      );
      const [, safediv] = execOrThrow(re.gm`([A-z0-9_$]+)\\.innerHTML=${msg},${msg}=`, funcsrc);
      const [, uniqueId] = execOrThrow(re.gm`=${player}\\.([\\w_$]+)`, funcsrc);
      const [, myPlayer] = execOrThrow(re.gm`[\\w$_]+!=([\\w$_]+)\.${uniqueId}`, funcsrc);
      addMappings({
        addChat: addChatName,
        me: myPlayer,
        isBadWord,
        teamColors,
        chatOutEl,
        players: playerList,
        meId
      });
      const newFunc = (
        /*js*/
        `function ${addChatName} (message, flags, playerId, custom_click_callback, formatter) {
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

    }`
      );
      return source.replace(funcsrc, newFunc);
    }
  });
  var onChatKeyDownRewrite = createSourceMod({
    name: "onChatKeyDown rewrite",
    description: "re writes the onChatKeyDown function to show when you are typing in a filtered message (hopefully)",
    version: "11.9.25",
    requiredMappings: ["isBadWord", "addChat"],
    // i dont technically need all of these. its just nice to have
    modify: function(source, requestedMappings) {
      const { isBadWord, addChat } = requestedMappings;
      const srcmatch = /onChatKeyDown:(function\([\w$_]+\){.*?}),startChat:/gm;
      const [, funcSrc] = execOrThrow(srcmatch, source, "onChatKeyDown.toString()");
      const [, chatInEl, fixStringWidth] = execOrThrow(/([\w$_]+)\.value=([\w$_]+)\(\1\.value,280/gm, funcSrc);
      const chatFlagsAndGameOwnerRE = /case"pin":return ([\w$_]+)\?([\w$_]+\.pinned|[\w$_]+):([\w$_]+(?:\.none)?)/gm;
      const [, chatFlags$pinned, isGameOwner, chatFlags$none] = execOrThrow(chatFlagsAndGameOwnerRE, funcSrc, "onChatKeyDown$chatFlags.pinned");
      const teamRe = /\?([\w$_]+)\?([\w_$]+(?:\.team)?)/gm;
      const [, isTeamsMode, chatFlags$teams] = execOrThrow(teamRe, funcSrc, "onChatKeyDown.isTeamsMode");
      const [, stopChat] = execOrThrow(/([\w$_]+)\(\)}}/gm, funcSrc, "onChatKeyDown.stopChat");
      const [, chatEvents] = execOrThrow(/"chat",([\w$_]+)\)\}/gm, funcSrc, "onChatKeyDown.chatEvents");
      const [, clientPerms] = execOrThrow(/([\w$_]+)\.adminRoles/gm, funcSrc, "onChatKeyDown.clientPerms");
      const observeAndmeIdRe = re.gm`([\\w$_]+)\\|\\|${addChat}\\([\\w$_]+,[\\w$_]+,([\\w$_]+)\\)`;
      const [, observingGame, meId] = execOrThrow(observeAndmeIdRe, funcSrc);
      const [, sendMessageWS] = execOrThrow(/indexOf\("<"\)<0\){([\w$_]+)/gm, funcSrc, "sendMessageWS");
      const replacementFunctionSource = (
        /*js*/
        `function(event) {
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
		}`.trim()
      );
      return source.replace(funcSrc, replacementFunctionSource);
    }
  });
  var setRespawnTimerMod = createSourceMod({
    name: "Respawn Timer mod",
    description: "Modifies the setRespawnTime() function to have some decimal places",
    version: "10.12.25",
    // ported
    /**
     * yea... so porting a js mod that embeds a js function into a js file to ts...
     * not exactly the cleanest, especially since ts has an actual stroke when you just blindly
     * ignore the fact that RegExp.exec(...) doesnt always return an ArrayLike object.
     * (which is fine as intend on handling the errors to begin with).
     * this might be one of the valid cases for using js instead of ts.
     * @todo (Grif) - clean this up.
     */
    modify: function(source) {
      const firstMatch = execOrThrow(
        /function ([A-z0-9_$]+)\(([A-z0-9_$]+)\){([\w|$]+)=Math\.max\(\2,\3\).*?1200\)}/gm,
        source
      );
      const [funcsrc, setRespawnTime, , respawnTime] = firstMatch;
      addMappings({ setRespawnTime });
      const secondMatch = execOrThrow(/([\w_$]+)\.clear\(([\w_$]+)\),([\w_$]+)\(\),([\w_$]+)\(\)/gm, funcsrc);
      const [, interval, respawnInterval, PrepRespawnAd, doMapOverviewCamera] = secondMatch;
      const third = execOrThrow(re.gm`${respawnTime}<=0&&([A-z0-9_$]+)`, funcsrc);
      const [, inGame] = third;
      const vars = {
        setRespawnTime,
        respawnTime,
        respawnInterval,
        doMapOverviewCamera,
        interval,
        inGame
      };
      addMappings(vars);
      const newFunc = (
        /*js*/
        `function ${setRespawnTime} (sec, decimals = 1, FATSec = 1200) {
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
    	}`
      );
      (async () => {
        await WaitForCondition(() => vueApp?.$refs?.gameScreen);
        const dis = vueApp.$refs.gameScreen;
        const playBtnText = () => {
          if (!dis.delayTheCracking && !dis.isRespawning) {
            return dis.loc.ui_game_get_ready;
          } else if (dis.delayTheCracking && dis.isRespawning) {
            return dis.game.respawnTime;
          }
          return dis.loc.p_pause_play;
        };
        Object.defineProperty(vueApp.$refs.gameScreen, "playBtnText", {
          get: playBtnText
        });
      })();
      return source.replace(funcsrc, newFunc);
    }
  });
  var exitSpectateModePatch = createSourceMod({
    name: "exit SpectateMode patch",
    description: "This is my psudo attempt to patch out the exit spectator mode from setting the respawn time to 5 seconds",
    version: "9.1.25",
    // description + date - from original GTweaks.js
    requiredMappings: ["me", "setRespawnTime"],
    // the mappings this function actual requries... yay i get to finally implement that
    modify: function(source, mappings2) {
      const { me, setRespawnTime } = mappings2;
      const firstMatch = execOrThrow(
        re.gm`respawn:function\\(\\)\\{return [\\w_$]+\\?\\(${me}\\.([\\w_$]+)=!0`,
        source,
        "Failed to grab playingState"
      );
      const [, playingState] = firstMatch;
      const funcNamePattern = re.gm`document\\.onpointerlockchange=function\\(\\){!document\\.pointerLockElement&&${me}&&([\\w_$]+)\\(\\)},`;
      const funcNameMatch = execOrThrow(funcNamePattern, source, "Failed to grab func name");
      const [, functionName] = funcNameMatch;
      const funcPattern = re.gm`}\\(\\)}(function ${functionName}\\(\\)\\{.*?console\\.log\\("pausing game via pointerlock exit"\\),[\\w_$]+\\(\\),crazySdk\\.gameplayStop\\(\\)})`;
      const funcsrcMatch = execOrThrow(funcPattern, source, `Failed to grab func src`);
      const [, funcsrc] = funcsrcMatch;
      let newFunc = funcsrc.replace(
        `${functionName}(){`,
        `${functionName}(){let wasIngame = ${me}.${playingState};/*console.log({wasIngame});*/`
      );
      newFunc = newFunc.replace(setRespawnTime, `!wasIngame ? ${setRespawnTime}(0) : ${setRespawnTime}`);
      return source.replace(funcsrc, newFunc);
    }
  });
  var AntiAFKKick = createSourceMod({
    name: "Anti afk kick",
    description: "Prevents you from being kicked for being afk while ingame",
    version: "11.10.25",
    // 
    /**
     * technically a new mod, although ive had this implemented before with a different mod that i used 
     * (it was packet based rather than modifying the source code. it also had to take into account when i was in spectate mode
     * as i didnt disable it in the source code as ive done here. )
     */
    modify: function(source) {
      const patt = /(([\w$_]+)=([\w$_]+)\.set\(\((function\(\){var ([\w$_]+)=[\w$_]+\.getBuffer\(\);\5\.[\w$_]+\([\w$_\.]+\),\5\.send.*?)\),(?:15e3|15000)\))/gm;
      const [, keepAlivePoint, , , keepAliveCallback] = execOrThrow(patt, source, "");
      source = source.replace(keepAlivePoint, `void 69420/*${keepAlivePoint}*/`);
      const EmbedFunctionLogic = (
        /*js*/
        `(()=>{
			setInterval(() => {
				const ingameCondition = (vueApp?.ui?.game?.spectate || vueApp?.game?.isPaused) && vueApp?.game?.on;
				if (!ingameCondition) return; // my condition sofar
				// todo: add in a second condition to check if the player is ingame ie: check playingState (need wrappres / more advanced mappings)
				(${keepAliveCallback})(); // call the keepAliveFunction (wrapper)
			}, 15_000)
		})()`
      );
      const embedPattern = /(window\.extern)/gm;
      return source.replace(embedPattern, `${EmbedFunctionLogic};$1`);
    }
  });

  // src/extensions/source/mods/index.ts
  var otherSourceMods = Object.values(SourceMods_exports);
  var Basis = createSourceMod({
    name: "Basis Injection",
    description: "This is the kind of base line function that allows for all sorts of nifty things",
    modify: function(source) {
      const EmbedPattern = /(window\.extern)/gm;
      return source.replace(EmbedPattern, `((/*GTweaks V2*/)=>ModLoader.Getter=(str)=>eval(str))();$1`);
    }
  });
  var Unsafe = createSourceMod({
    name: "Unsafe",
    description: "This just tests that the loader properly catches unsafe modifications to the source code",
    modify: function(source) {
      return source.replace('"', "");
    }
  });
  var SourceMods = [Unsafe, Basis, ...otherSourceMods];
  function addMod(sourceMod) {
    SourceMods.push(sourceMod);
  }

  // src/extensions/source/loader.ts
  function createSourceMod(data) {
    return data;
  }
  function AcceptableMods(mod) {
    if (!mod.requiredMappings) return true;
    const map = getFullSourceMappings(mod);
    return map != void 0;
  }
  function validateSourceCode(source) {
    try {
      return new Function(source);
    } catch (err) {
      return err;
    }
  }
  function getFullSourceMappings(sourceMod) {
    const { requiredMappings } = sourceMod;
    const { sourcemappings } = ModLoader;
    const entriesSrcMap = Object.entries(sourcemappings);
    const condition = !requiredMappings || entriesSrcMap.length == 0 || !requiredMappings.every((key) => sourcemappings[key]);
    if (condition) return;
    const entries = Object.entries(sourcemappings).filter(([key, value]) => requiredMappings.includes(key));
    const specifiedMappings = Object.fromEntries(entries);
    return specifiedMappings;
  }
  function attemptSourceMod(sourceMod, currentSource) {
    const specifiedMappings = getFullSourceMappings(sourceMod);
    const LoadState = { disabled: !!sourceMod.disabled };
    if (LoadState.disabled) return LoadState;
    try {
      const newSource = LoadState.source = sourceMod.modify(currentSource, specifiedMappings);
      const result = validateSourceCode(newSource);
      if (result instanceof Error) throw result;
    } catch (err) {
      LoadState.error = err;
    }
    return LoadState;
  }
  function CoreLoader(originalSource, sourceMods = SourceMods, iteration = 0, maxIteration = sourceMods.length) {
    let modifiedSource = originalSource;
    const sourceModsModificationStart = performance.now();
    const [SourceModsToLoad, skippedMods] = [sourceMods.filter(AcceptableMods), sourceMods.filter((m) => !AcceptableMods(m))];
    for (const sourceMod of SourceModsToLoad) {
      const sourceModStart = performance.now();
      const result = attemptSourceMod(sourceMod, modifiedSource);
      const sourceModDuration = (performance.now() - sourceModStart).toFixed(2);
      if (result.error) {
        const errormessage = `Loading sourcemod ${sourceMod.name} %c${sourceModDuration}%cms - `;
        debugError(errormessage, css.number, "", result.error.message);
        continue;
      } else if (result.disabled) {
        debugWarn(`Source Modification ${sourceMod.name} disabled.`);
        continue;
      } else if (!result.source) {
        debugWarn(`Source Modification ${sourceMod.name} didnt return type string`, { result });
        continue;
      }
      modifiedSource = result.source;
      debugInfo(`Source Modification ${sourceMod.name} %c${sourceModDuration}%cms`, css.number, "");
    }
    if (skippedMods.length || iteration > 0) {
      if (iteration >= maxIteration || SourceModsToLoad.length == 0) {
        const msg = `Unable to load ${skippedMods.length} Source mod${skippedMods.length == 1 ? "" : "s"}: `;
        if (skippedMods.length != 0) debugWarn(msg, skippedMods.map((mod) => mod.name).join(", "));
        return modifiedSource;
      }
      modifiedSource = CoreLoader(modifiedSource, skippedMods, iteration + 1, maxIteration);
    }
    if (iteration > 0) return modifiedSource;
    const totalDuration = (performance.now() - sourceModsModificationStart).toFixed(2);
    debugInfo(`All Source Modifications completed in %c${totalDuration}%cms`, css.number, "");
    return modifiedSource;
  }

  // src/extensions/source/index.ts
  function isEggGameSource(source) {
    if (source.startsWith("(()=>{")) return true;
    return false;
  }
  function ApplySourceInterception() {
    const original = HTMLElement.prototype.appendChild;
    HTMLElement.prototype.appendChild = function(node) {
      if (node instanceof HTMLScriptElement && isEggGameSource(node.innerHTML)) {
        ModLoader.src = node.innerHTML;
        node.innerHTML = CoreLoader(node.innerHTML);
        HTMLElement.prototype.appendChild = original;
      }
      return original.call(this, node);
    };
    attemptDefineModloader();
  }
  var initialModSettings;
  var baseLabel = "Enable Game Modifications (the base setting)";
  var description2 = (
    /**@trim */
    `
Modifies the game's internal source code on load in.
Toggling mods not implemented as of yet. (as i cbf)
`.trim()
  );
  var Extension2 = createExtension({
    uniqueIdentifier: "Grifmin-SourceExtensions",
    iconUrl: "",
    name: "Source Extension Loader",
    author: "Grifmin",
    version: "0.2 alpha",
    // yea this is alpha until I find a more consistant / stable way to implemnent this
    description: description2,
    defaultSettings: { enabled: false, modStates: {} },
    // decided to disable by default. (forces user choice. plus its a mitigation against softlocks)
    config() {
      const configOptions = [{ type: "Toggle", label: baseLabel, value: this.settings.enabled }];
      for (const { name } of SourceMods) {
        let state2 = this.settings.modStates[name];
        if (state2 == void 0) state2 = true;
        const individualModOptions = { type: "Toggle", label: `${name} - toggle`, value: state2 };
        configOptions.push(individualModOptions);
      }
      return configOptions;
    },
    init: function() {
      initialModSettings = JSON.parse(JSON.stringify(this.settings));
      if (this.settings.enabled == false) return;
      for (let [modName, enabled] of Object.entries(this.settings.modStates)) {
        if (enabled == void 0) enabled = true;
        const mod = SourceMods.find((mod2) => mod2.name == modName);
        if (mod) Object.assign(mod, { disabled: !enabled });
      }
      ApplySourceInterception();
    },
    onOptionsChange(updatedState) {
      if (updatedState.type != "Toggle") return false;
      if (updatedState.label == baseLabel) {
        this.settings.enabled = updatedState.value;
        return updatedState.value;
      }
      const modName = updatedState.label?.replace(" - toggle", "");
      const targetMod = SourceMods.find((mod) => mod.name == modName);
      if (!targetMod) {
        debugWarn(`Unable to find target mod to toggle the state of with ${updatedState.label}?`);
        return false;
      }
      const newState = this.settings.modStates;
      newState[modName] = !newState[modName];
      this.settings.modStates = newState;
      return updatedState.value;
    },
    isEnabled() {
      return this.settings.enabled;
    },
    requestRefresh() {
      const enabledStateMatches = this.settings.enabled == initialModSettings.enabled;
      const initialModStates = initialModSettings.modStates;
      const modStatesMatch = Object.entries(this.settings.modStates).every(([key, value]) => initialModStates[key] == value);
      return !enabledStateMatches || !modStatesMatch;
    }
  });

  // src/extensions/Protections/index.ts
  var Protected = [
    IntersectionObserver,
    BroadcastChannel,
    // String, // we have to make a special edge case for `String` as we are expecting egg game to extend it. ie: String.prototype.(format | f)
    RegExp,
    // personally, i dont modify js defaults unless i have to. espeically to work around just handling my own errors.
    Object,
    Proxy,
    // Array, // apparently, babylonjs has default functionality that requires overwriting Array.prototype.push :catfall:
    Function,
    Number,
    Boolean,
    Date
  ];
  var ProtectAllowExtension = [String];
  function FreezeObject(obj) {
    if (obj?.prototype) {
      Object.freeze(obj.prototype);
    }
    Object.freeze(obj);
  }
  var ProtectInternals = (obj) => {
    const hardened = { writable: false, configurable: false };
    for (const [property, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(obj.prototype))) {
      if (!descriptor.configurable) continue;
      Object.defineProperty(obj.prototype, property, hardened);
    }
  };
  function Protect() {
    try {
      Protected.forEach(FreezeObject);
      ProtectAllowExtension.forEach(ProtectInternals);
    } catch (err) {
      if (!(err instanceof TypeError)) throw err;
      console.log(err);
      throw err;
    }
  }
  var initialLoadCondition;
  var description3 = (
    /**@trim */
    `
Protects various js Object prototypes. (useful when attempting to mitigate egg games various anti modding approaches)
This could cause some incompatibility with other mods. (as it attempts to protect internal variables)
`.trim()
  );
  var Extension3 = createExtension({
    uniqueIdentifier: `Grifmin-Protec`,
    defaultSettings: { enabled: true },
    author: "Grifmin",
    description: description3,
    version: `1.0`,
    name: "Internal Protections",
    config() {
      return [{ type: "Toggle", label: "Enable", value: this.settings.enabled }];
    },
    init() {
      initialLoadCondition = this.settings.enabled;
      if (!this.settings.enabled) return;
      Protect();
    },
    onOptionsChange(updatedState) {
      if (updatedState.type != "Toggle") return false;
      this.settings.enabled = updatedState.value;
      return updatedState.value;
    },
    isEnabled() {
      return this.settings.enabled;
    },
    requestRefresh() {
      return initialLoadCondition != this.settings.enabled;
    }
  });

  // src/extensions/Client/theme.ts
  var styleDivIdentifier = "ThemeManager-div";
  var ThemeDiv;
  async function getDiv() {
    if (ThemeDiv) return ThemeDiv;
    await WaitForCondition(() => document.readyState == "complete");
    const div = document.createElement("div");
    div.id = styleDivIdentifier;
    document.body.append(div);
    ThemeDiv = div;
    return ThemeDiv;
  }
  var ThemeManager = {
    themes: {},
    addStyle: async function(styleElement, identifier) {
      if (typeof styleElement == "string") {
        const css2 = styleElement;
        styleElement = document.createElement("style");
        styleElement.innerHTML = css2;
        if (identifier) styleElement.id = identifier;
      }
      if (!identifier) identifier = styleElement.id;
      if (document.body) {
        const ThemeDiv2 = await getDiv();
        ThemeDiv2.append(styleElement);
        this.themes[identifier] = styleElement;
        return styleElement;
      }
      document.addEventListener(
        "DOMContentLoaded",
        () => {
          getDiv().then((ThemeDiv2) => {
            ThemeDiv2.append(styleElement);
            this.themes[identifier] = styleElement;
          });
        },
        { once: true }
      );
      return styleElement;
    }
  };

  // src/extensions/Client/default.css
  var default_default = "/* this is just a safety precaution. it shouldnt ever be visible, but just incase im going to ensure it is */\n.firebaseID {\n	visibility: hidden !important;\n	display: none !important;\n	opacity: 0 !important; /* these 3 should be enough for it to never be accidentally revealed */\n}\n";

  // src/extensions/Client/index.ts
  var startTime = Date.now();
  var Client;
  function getNewClientInstance() {
    const ClientInstance = {
      thememanager: ThemeManager,
      readyState: false,
      // false until we are done.
      extensions: [],
      addExtension(newExtension) {
        if (this.extensions.some(
          (existingExtension) => existingExtension.uniqueIdentifier == newExtension.uniqueIdentifier
        ))
          return debugWarn(`duplicate Extension - ${newExtension.uniqueIdentifier}`);
        if (!newExtension.id) newExtension.id = this.extensions.length;
        this.extensions.push(newExtension);
      },
      get startTime() {
        return startTime;
      }
    };
    return ClientInstance;
  }
  function attemptClientDefinition() {
    try {
      Object.defineProperty(window, "Client", {
        get: () => Client,
        configurable: true
        // ^ ill probably disable this at somepoint. but ill leave enabled for debugging
      });
    } catch (err) {
      debugError(`Error when attempting to update Client definitions`, err);
    }
  }
  function addDefaultCss() {
    ThemeManager.addStyle(default_default, "default-css");
  }
  function startClient() {
    if ("Client" in window) {
      const defined = window.Client;
      const filteredEntries = Object.entries(getNewClientInstance()).filter(([key, value]) => !defined[key]);
      const newInstance = Object.fromEntries(filteredEntries);
      Client = Object.assign(newInstance, window.Client);
      const err = new Error(`Client already exists on window object `, { cause: window.Client });
      attemptClientDefinition();
      return debugWarn(`%cError:`, css.warn, err);
    }
    Client = getNewClientInstance();
    const TimeStampString = new Date(Client.startTime).toLocaleString();
    debugInfo(`Startup time: ${TimeStampString}`);
    attemptClientDefinition();
    addDefaultCss();
  }

  // src/extensions/modmenu/modmenu.css
  var modmenu_default = "/*\nneat notes i found: \n1em = 1.375em (roughly) \nAlso i'd like to say, i pretty much got chatgpt to generate all of this css (because i hate dealing with css).\nso at somepoint, I will need to go back through all of this with a fine comb and work out the kinks\nusing `px` I know is very bad (especially for consistancy)\n*/\n\n.modmenu-screen {\n	display: flex;\n	justify-content: center;\n	align-items: center;\n	min-height: 100vh;\n}\n\n.mod-menu-refreshBtn {\n	background-color: orange;\n}\n\n.modmenu-page-content {\n	height: calc(100vh - 10em);\n	width: 100%;\n	border: var(--ss-common-border-width) solid var(--ss-blue5);\n	background-color: var(--ss-blue6) !important;\n	border-radius: .9375em;\n	box-shadow: 0 .5em 1.5em rgba(0, 0, 0, 0.4);\n	position: relative;\n	/* padding: 1.25em; */\n	overflow: hidden; /* no escaping my box please */\n}\n.modmenu-title {\n	position: absolute;\n	right: 50%;\n}\n\n.modmenu-header {\n    padding: .5em;\n    width: 100%;\n	height: 20%;\n    box-sizing: border-box;\n}\n\n.mod-screen-content {\n	display: flex;\n	height: 100%;\n	overflow: hidden;\n}\n\n/* mod menu list */\n.mod-list {\n    display: flex;\n	flex: 0 0 30%;\n    flex-direction: column;\n	max-width: 30%;\n	overflow-y: auto;\n	overflow-x: hidden;\n	max-height: 85%;\n	border-radius: .5em;\n	box-shadow: inset 0 -.5em .625em -.375em rgba(0, 0, 0, 0.4);\n    gap: .25em;\n    height: 80%;\n    padding: .5em;\n}\n\n.mod-item {\n	border-radius: .625em;\n	border: var(--ss-common-border-width) solid var(--ss-blue5);\n	display: flex;\n	padding: .3125em;\n	/* transition: background 0.3s ease; */\n}\n.mod-item .mod-icon {\n    flex-shrink: 0;\n}\n\n.mod-item:nth-child(odd) {\n	background-color: var(--ss-blue3);\n}\n\n.mod-item:nth-child(even) {\n	background-color: #77cbe6;\n}\n\n.mod-icon {\n	width: 6em;\n	height: 6em;\n	margin-right: .5em;\n	border-radius: .5em;\n}\n\n.mod-info .name {\n    font-weight: bold;\n    font-size: 1.2em;\n    color: white;\n}\n\n.mod-info .author {\n    font-weight: bold;\n    font-size: 1em;\n    margin-bottom: .3125em;\n    color: #924eff;\n}\n\n.mod-info {\n    white-space: nowrap;\n    overflow: hidden;\n    text-overflow: ellipsis;\n    max-width: 100%;\n}\n\n.mod-details {\n	display: flex;\n	flex: 1;\n	flex-direction: column;\n	padding: .5em;\n    padding-bottom: 1.5em; /* this is to prevent the description from overflowing */\n	max-height: 85%;\n    height: 85%;\n	overflow: hidden;\n}\n\n.mod-select-header {\n	display: flex;\n	align-items: center;\n	gap: .625em;\n	position: relative;\n}\n\n.mod-desc {\n	font-size: 1em;\n	line-height: 1.4;\n	white-space: pre-line;\n}\n\n.mod-config {\n	margin-bottom: 1em;\n}\n\n/* this is shared between the two */\n.mod-config, .mod-desc {\n	/* border: red solid; */\n	border: var(--ss-common-border-width) solid var(--ss-blue5);\n	background-color: var(--ss-blue2);\n	border-radius: .25em;\n	margin-top: .625em;\n	padding: .625em;\n	overflow-y: auto;\n	flex: 1;\n}\n/* this fixes the labels being difficult to read on the config page */\n.mod-config label {\n	font-weight: 600;\n	display: flex;\n	flex-direction: row-reverse;\n	justify-content: left;\n}\n\n.mod-config-button {\n	height: 2.125em;\n	width: 9em;\n	text-align: center;\n	position: absolute;\n	right: 0em;\n	bottom: 0em;\n}\n\n.controls label {\n	display: block;\n	margin: .3125em 0;\n}\n\n/* Responsive adjustments */\n@media (max-width: 37.5em) {\n	.modmenu-page-content {\n		max-width: 95%;\n		padding: .625em;\n	}\n\n	.mod-item {\n		flex-direction: column;\n		align-items: stretch;\n	}\n\n	.mod-icon {\n		align-self: center;\n		margin-bottom: .625em;\n		margin-right: 0;\n	}\n}\n";

  // src/extensions/modmenu/modmenu_screen_template.html
  var modmenu_screen_template_default = `<div v-if="shouldDisplay" class="modmenu-screen">
	<div class="sidebar modmenu-page-content roundme_sm ss_marginright bg_blue6 common-box-shadow">
		<div class="modmenu-header bg_blue3">
			<header class="f_row align-items-center modmenu-title">
				<section>
					<h1 class="text-shadow-black-40 text_white nospace">Mods</h1>
					<h2 v-show="refreshRequested" class="mod-menu-refreshBtn ss_button" @click="location.reload()">Refresh Request</h2>
				</section>
			</header>
			<aside class="'justify-self-end text-right">{{ mods.length }} mods</aside>
			<input v-model="search" placeholder="Search Mods..." class="mod-menusearch ss_field" />
		</div>
		<div class="mod-screen-content">
			<div  class="mod-list">
				<div class="mod-item" v-for="(mod, i) in filteredMods" :key="i" @click="selectMod(mod)">
					<div class="mod-icon"
						:style="{ backgroundImage: mod.iconUrl ? mod.iconUrl : backupURL, backgroundSize: 'cover' }"
						aria-hidden="true"
					></div>
					<div class="mod-info">
						<div class="name">{{ mod.name }}</div>
						<div class="author">{{ mod.author }}</div>
					</div>
				</div>
			</div>
			<div class="mod-details" v-if="selectedMod">
				<div class="mod-meta">
					<header class="mod-select-header">
						<div class="mod-icon" 
							:style="{ backgroundImage: selectedMod.iconUrl ? selectedMod.iconUrl : backupURL , backgroundSize: 'cover' }"
							aria-hidden="true"
						></div>
						<div>
							<h3> {{ selectedMod.name }}</h3>
							<p>
								<span class="author-text">Author: </span>
								<span class="author">{{selectedMod.author}}</span>
							</p>
							<p v-if="selectedMod.version">Version: {{ selectedMod.version}}</p>
						</div>
						<aside>
							<button v-if="selectedMod.config" class="mod-config-button ss_button" @click="configurationSelected()" > {{ configButtonText }} </button>
						</aside>
					</header>
				</div>
				<p v-if="desciptionScreen" class="mod-desc">{{ selectedMod.description }}</p>
				<div v-if="!desciptionScreen" class="mod-config">
					<div v-for="(option, idx) in selectedMod.config()" :key="idx">
						<label>
							{{option.label ?? "Default Option(s)"}}
							<input type="checkbox" v-if="option.type == 'Toggle'" v-model="option.value" @change="onOptionsChange(option, idx)">
							<input type="range" v-if="option.type == 'Slider'" v-model.number="option.value" :min="option.min" :max="option.max" @change="onOptionsChange(option, idx)">
							<!-- <input type="text" v-if="option.type == 'Input'" ...> -->
							<!-- todo: implement input box + add in slider increment -->
						</label>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
`;

  // src/extensions/modmenu/index.ts
  var modMenuScreenIndex = 5;
  var ModMenuName = "Mod Menu";
  function switchToModMenuUi() {
    this.showScreen = this.screens.modmenu;
    this.$refs.equipScreen.removeKeyboardStampPositionHandlers();
    this.equip.displayAdHeaderRefresh = true;
    this.hideGameMenu();
    BAWK.play("ui_toggletab");
    this.gameUiRemoveClassForNoScroll();
    extern.resetPaperDoll();
  }
  function updateVueApp() {
    if (vueData.screens.modmenu) return;
    Object.assign(vueApp, { switchToModMenuUi });
    vueData.screens.modmenu = modMenuScreenIndex;
    Object.assign(vueData.loc, { modmenu_title_screen: "mod menu" });
    vueData.ui.mainMenu.push({
      locKey: "modmenu_title_screen",
      icon: "ico-settings",
      screen: 5,
      mode: [],
      hideOn: []
    });
  }
  async function WaitUntilSetup() {
    function isReady2() {
      if (!("vueApp" in window) || !("Vue" in window)) return false;
      return [Vue, Client.readyState, vueApp].every((value) => value);
    }
    await WaitForCondition(isReady2).catch((reason) => debugError(`ModMenu isReady - ${reason}`));
    if (Client.vue) return debugInfo(`It seems the Mod Menu Vue instance is already mounted. `);
    Client.thememanager.addStyle(modmenu_default, "modmenu-css");
    const ModMenuScreen = Vue.extend({
      template: modmenu_screen_template_default,
      // components: { "mod-item": ModMenuItem },
      data() {
        const extensions = window?.Client.extensions;
        return {
          backupURL: `url('https://www.svgrepo.com/show/454209/gear-player-multimedia.svg')`,
          search: "",
          selectedMod: extensions.find((ext) => ext.name == ModMenuName),
          configuration: false,
          mods: extensions,
          refreshDetected: () => {
            function ModRequestedRefresh(mod) {
              if (mod.requestRefresh && mod.requestRefresh()) {
                return true;
              }
              return false;
            }
            return extensions.some(ModRequestedRefresh);
          }
        };
      },
      /**
       * For those who are just like me, and have legitimately never used Vuejs before (or seen it)
       * the `computed` functions act like attributes.
       * unsure exactly how it works but ehh. guess they are closer to getter functions than actual functions
       */
      computed: {
        /**@todo */
        refreshRequested() {
          return this.refreshDetected();
        },
        /**this is to let it know when it should be displayed */
        shouldDisplay() {
          return vueApp.showScreen == modMenuScreenIndex;
        },
        /**This lets it know if it should show the description or configuration screen */
        desciptionScreen() {
          return !this.configuration;
        },
        /**This computes what the configButton text is */
        configButtonText() {
          return this.configuration ? "Description" : "Configuration";
        },
        /**This gives back the Extensions (filtered by search input) */
        filteredMods() {
          const input = this.search.toLowerCase() ?? "";
          return this.mods.filter((mod) => mod.name?.toLowerCase().includes(input));
        }
      },
      /**
       * Methods allow for the configuration and mutation of the internal components
       */
      methods: {
        selectMod(mod) {
          this.selectedMod = mod;
          mod.description = mod.description?.trim();
          this.configuration = false;
        },
        configurationSelected() {
          this.configuration = !this.configuration;
        },
        onSlider(slider, idx) {
          debugInfo(`onToggle`, { slider, idx });
        },
        onOptionsChange(option, idx) {
          if (!(this.selectedMod && this.selectedMod.onOptionsChange)) return;
          this.selectedMod.onOptionsChange(option);
        }
      }
    });
    const mainScreens = document.getElementById("mainScreens");
    const modmenu = document.createElement("modmenu-root");
    modmenu.id = "#modmenu-root";
    if (mainScreens) mainScreens.appendChild(modmenu);
    updateVueApp();
    const ModMenuVue = new Vue({ render: (h) => h(ModMenuScreen) }).$mount(modmenu);
    Vue.mixin({
      created() {
        if (!("onMenuItemClick" in this && typeof this.onMenuItemClick == "function")) return;
        const original = this.onMenuItemClick.bind(this);
        this.onMenuItemClick = (item, ...args) => {
          const screen = this?.item?.screen;
          const modmenuScreen = this?.screens?.modmenu;
          if (screen && modmenuScreen && screen == modmenuScreen) {
            vueApp?.switchToModMenuUi();
          }
          return original(item, ...args);
        };
      }
    });
    Client.vue = ModMenuVue;
  }
  var ModMenuExtension = createExtension({
    uniqueIdentifier: "Grifmin-modmenu-v2",
    name: ModMenuName,
    author: "Grifmin",
    version: "0.3a",
    description: (
      /**@trim */
      `
	mod menu v2 implementation
	Work in progress`.trim()
    ),
    iconUrl: "url('https://media1.tenor.com/m/77rqMj3uomoAAAAd/gritito.gif)",
    // this is how i felt making this btw.
    defaultSettings: { enabled: true },
    // made this togglable via a manual entry. (incase some other mod comes up with a better mod menu or has some reason to hide this idk)
    init() {
      if (!this.settings.enabled) return;
      WaitUntilSetup();
    },
    // config() {
    // 	return [
    // 		{ type: "Toggle", label: "Test 1", value: true },
    // 		{ type: "Toggle", label: "Test 2", value: false },
    // 		{ type: "Slider", label: "Test slider", max: 100, min: 0, value: 50 },
    // 	];
    // },
    onOptionsChange(updateState) {
      debugDebug(`${this.name} - ${this.onOptionsChange?.name}: `, updateState);
      return false;
    }
  });

  // src/extensions/TabKey/index.ts
  var internal_SCB;
  var targetVar = "comp_settings_control_binder";
  var targetMethod = "onKeyUp";
  var Label = "Enable";
  var SourceMod2 = createSourceMod({
    name: "Stop Tab-Key from pausing",
    description: "The source mod thatgets rid of the the annoying tab key thing in egg game",
    modify(source) {
      const regexPattern = /"Tab"==[\w$]+&&\(?[\w$]+="ESCAPE",[\w$]+\.preventDefault\(\)(,([\w$]+)\("down"\))/gm;
      const match = regexPattern.exec(source);
      if (!match) throw new PatternMatchFailed(`Failed to grab`);
      const [, annoyance] = match;
      source = source.replace(annoyance, "/*$1*/");
      const ChatRe = /case(?:"|'|`)Tab(?:"|'|`):([\w$_]+)\.preventDefault\(\),\1\.stopPropagation\(\),((?:[\w$_]+)\(\))}/gm;
      const inChatMatch = ChatRe.exec(source);
      if (inChatMatch) {
        let [targetSrc, event, exitChatCall] = inChatMatch;
        const newCall = `/*${exitChatCall}// we need to exit, but i dont want to exit on 'tab' key */${event}.key != 'Tab' && ${exitChatCall}`;
        const newsource = targetSrc.replace(exitChatCall, newCall);
        source = source.replace(targetSrc, newsource);
      }
      return source;
    }
  });
  function alternative(event) {
    event.stopPropagation();
    let { key } = event;
    if (key == "Escape" || key == "Enter") {
      return;
    }
    if (key == " ") {
      key = "space";
      event.preventDefault();
    }
    this.capture(key);
  }
  function applyEventIntercept() {
    function keydown(event) {
      if (event.key == "Tab") event.preventDefault();
    }
    document.addEventListener("keydown", keydown, true);
  }
  function updateVueComp() {
    function updateMethod() {
      internal_SCB.methods[targetMethod] = alternative;
    }
    if (targetVar in window) {
      internal_SCB = window[targetVar];
      updateMethod();
    }
    Object.defineProperty(window, targetVar, {
      set: (v) => {
        internal_SCB = v;
        updateMethod();
      },
      get: () => internal_SCB
    });
  }
  var originalSettings;
  var Extension4 = createExtension({
    uniqueIdentifier: "Grifmin-Tabkeyremap",
    name: "Tab Key Remap",
    author: "Grifmin",
    version: "1.0",
    // (11.2.25) date of port / refactor.
    description: "Allows the use of the `Tab` key as any keybind, and prevents it from tabbing you out ingame",
    defaultSettings: { enabled: false },
    // my default settings shit
    config() {
      return [{ type: "Toggle", label: Label, value: this.settings.enabled }];
    },
    init() {
      originalSettings = JSON.parse(JSON.stringify(this.settings));
      if (!this.settings.enabled) return;
      addMod(SourceMod2);
      updateVueComp();
      applyEventIntercept();
    },
    // yea, we really don't do much here..
    onOptionsChange(updatedState) {
      if (updatedState.type != "Toggle" || updatedState.label != Label) return false;
      this.settings.enabled = updatedState.value;
      return true;
    },
    isEnabled() {
      return this.settings.enabled;
    },
    requestRefresh() {
      const condition = originalSettings.enabled != this.settings.enabled;
      return condition;
    }
  });

  // src/extensions/reNotification/notification.css
  var notification_default = "/* notifications stuff */\n#re-notification {\n	/* background: rgba(0, 0, 0, 0.25);\n	box-shadow: 0.1em 0.1em 0.4em rgba(0, 0, 0, 0.5);\n	padding: 0.75em; */\n	background-color: rgba(0, 0, 0, 0.15) !important;\n	border: 0.0625em solid rgba(0, 0, 0, 0.2) !important;\n	box-shadow: 0 .25em .5em rgba(0, 0, 0, 0.2) !important;\n	border-radius: 0.9375em !important;\n	padding: 0.9375em !important;\n\n	position: absolute;\n	color: white;\n	font-weight: bold;\n	/* color: var(--egg-brown); */\n	left: 75%;\n	top: 1em;\n	transform: translateX(-50%);\n	display: none;\n	text-align: left;\n}\n\n#re-notification img {\n	width: 2em;\n	height: 2em;\n	margin-right: 0.75em;\n}";

  // src/extensions/reNotification/notification.html
  var notification_default2 = '<div id="re-notification" class="roundedBorder"></div>\n    <!--<img src="/img/notificationIcon.png"> -->\n    <!-- <img src="/favicon192.png"> -->\n    <!-- \n    ^ this is the closest image to the original\n    although, im not really a fan of it, so im going to remove it\n    -->\n    <div id="re-notificationMessage"></div>\n</div>';

  // src/extensions/reNotification/index.ts
  var enabledState = false;
  function dismissNotification(callback) {
    const notifyDiv = document.getElementById("re-notification");
    if (!notifyDiv) return;
    let anim = 8;
    let animIn = setInterval(() => {
      notifyDiv.style.opacity = `${anim / 8}`;
      notifyDiv.style.top = anim / 2 - 3.5 + "em";
      if (0 != --anim) return;
      clearInterval(animIn);
      notifyDiv.style.display = "none";
      if (callback) callback();
    }, 32);
  }
  function notify(msg, timeout) {
    if (!enabledState) return;
    const notifyDiv = document.getElementById("re-notification");
    if (!notifyDiv) return;
    notifyDiv.style.opacity = "0";
    notifyDiv.style.top = "-3.5em";
    notifyDiv.style.display = "flex";
    notifyDiv.textContent = msg;
    let anim = 0;
    const animIn = setInterval(() => {
      if (document.visibilityState == "hidden") return;
      anim++;
      notifyDiv.style.opacity = `${anim / 8}`;
      notifyDiv.style.top = anim / 2 - 3.5 + "em";
      if (8 != anim) return;
      clearInterval(animIn);
      if (timeout) {
        setTimeout(dismissNotification, timeout);
      }
    }, 32);
  }
  async function addHtml() {
    await WaitForCondition(() => Client.readyState);
    Client.thememanager.addStyle(notification_default, "re-notificaiton-css");
    const div = document.createElement("div");
    div.id = "G-tweaks-html";
    div.innerHTML = notification_default2;
    document.body.appendChild(div);
    Object.defineProperty(window, "notify", {
      get: () => notify,
      configurable: true
      // why not
    });
  }
  var Extension5 = createExtension({
    uniqueIdentifier: "Grifmin-reNotification",
    defaultSettings: { enabled: false },
    name: "Lobby Close Notifications",
    author: "Grifmin",
    version: "1.0",
    // ported date: 11.2.25
    description: "adds back the original notifications for when a lobby is closing",
    config() {
      return [{ type: "Toggle", label: "Enable", value: this.settings.enabled }];
    },
    init: function() {
      enabledState = this.settings.enabled;
      addHtml();
    },
    onOptionsChange(updatedState) {
      if (updatedState.type != "Toggle" || updatedState.label != "Enable") return false;
      this.settings.enabled = updatedState.value;
      enabledState = this.settings.enabled;
      return true;
    },
    isEnabled() {
      return this.settings.enabled;
    }
  });

  // src/extensions/vueCommas/index.ts
  var internalcomp_item;
  function isReady() {
    return "Vue" in window;
  }
  function setupStatAlternative(stat) {
    if (this.stat.kdr !== void 0 && typeof stat != "number" && typeof stat[0] == "number") {
      return this.kdr(stat[0], stat[1]);
    } else if (stat && typeof stat != "number") {
      const [first, second] = stat.map((v) => typeof v == "number" ? v.toLocaleString() : v);
      return `<div>${first}</div> <div>${second.toLocaleString()}</div>`;
    } else {
      return typeof stat == "number" ? stat.toLocaleString() : stat;
    }
  }
  function itemPriceAlternative() {
    if (this.hidePrice && this.isItemOwned) {
      return this.loc.eq_owned;
    }
    return !this.isItemOwned ? this.item.price.toLocaleString() : this.loc.eq_owned + "!";
  }
  async function statTemplateMixin() {
    await WaitForCondition(isReady, 50);
    Vue.mixin({
      created() {
        if ("setupStat" in this) this.setupStat = setupStatAlternative;
      }
    });
  }
  function comp_item$ItemPriceOverwrite() {
    function update(targetComponent) {
      targetComponent.computed.itemPrice = itemPriceAlternative;
      internalcomp_item = targetComponent;
    }
    if ("comp_item" in window) update(window.comp_item);
    Object.defineProperty(window, "comp_item", {
      set: update,
      get: () => internalcomp_item
    });
  }
  var initialLoadCondition2;
  var Extension6 = createExtension({
    uniqueIdentifier: "Grifmin-ui_commas",
    defaultSettings: { enable: false },
    author: "Grifmin",
    name: "Fancy commas",
    version: "1.0",
    description: "Adds commas to the stats (profile) page, currency, and shop items",
    config() {
      return [{ type: "Toggle", label: "Enabled", value: this.settings.enable }];
    },
    init: function() {
      initialLoadCondition2 = this.settings.enable;
      if (!this.settings.enable) return;
      comp_item$ItemPriceOverwrite();
      statTemplateMixin();
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
      return initialLoadCondition2 != this.settings.enable;
    }
  });

  // src/extensions/settings.ts
  function storageProxy(key, blueprint) {
    const load = () => {
      const saved = localStorage.getItem(key);
      return saved ? { ...blueprint, ...JSON.parse(saved) } : { ...blueprint };
    };
    let data = load();
    return new Proxy(data, {
      get(_, prop) {
        return data[prop];
      },
      set(_, prop, value) {
        data[prop] = value;
        localStorage.setItem(key, JSON.stringify(data));
        return true;
      },
      deleteProperty(_, prop) {
        delete data[prop];
        localStorage.setItem(key, JSON.stringify(data));
        return true;
      }
    });
  }

  // src/extensions/TEMPORARY/legacy_gtweaks.css
  var legacy_gtweaks_default = '/* Ads / Junk they attempt to stuff down our throat */\n.house-ad-wrapper, #respawn-ad-two, #respawn-ad-two, #welcome-bundle-ui, .welcome-bundle-ui {\n	display: none !important;\n}\nimg[src="img/eggstra-value-pack.webp"] {\n	/* fuck off */\n	display: none !important;\n}\n/* vip club annoyances */\n.free-games-logo, .vip-club-cta, .free-games-title #chickenBadge {\n	display: none !important;\n}\n/* playerList stuff */\n.playerSlot--nam-score {\n	border-radius: 0.5em;\n}\n.is-paused .pause-ui-element {\n	left: 1em;\n}\n.is-paused .chat-item:first-child.chat-pinned-item {\n	background-color: transparent !important; /* for some reason i have to add this as it sets the background color on the pinned div to blue... */\n}\n\n.chat-container {\n	display: grid;\n	grid-template-rows: 1fr auto;\n	background-color: rgba(0, 0, 0, 0.15) !important;\n	border: 0.0625em solid rgba(0, 0, 0, 0.2) !important;\n	box-shadow: 0 0.25em 0.5em rgba(0, 0, 0, 0.2) !important;\n	border-radius: 0.9375em !important;\n	padding: 0.9375em !important;\n	scroll-behavior: smooth;\n	max-height: 12.25em;\n	/* ^ this allows for a (decent in my opinion) size window (for max size)*/\n}\n#chatOut {\n	scrollbar-color: transparent transparent; \n	overflow-y: auto;\n	scroll-behavior: smooth;\n	overflow: scroll;\n	mask-image: linear-gradient(\n		to bottom,\n		transparent 0%,\n		black 10%,\n		black 15%,\n		black 25%,\n		black 85%,\n		black 100%\n	);\n	hyphens: auto;\n	overflow-wrap: break-word;\n	/* mask-image: linear-gradient(to bottom, \n        transparent 0%, \n        transparent 10%, \n        black 25%, \n        black 75%, \n        transparent 90%, \n        transparent 100%\n    );\n    -webkit-mask-image: linear-gradient(to bottom, \n        transparent 0%, \n        transparent 10%, \n        black 25%, \n        black 75%, \n        transparent 90%, \n        transparent 100%\n    ); */\n}\n#chatIn {\n	position: sticky;\n	overflow-y: auto;\n	scroll-behavior: smooth;\n	bottom: 0;\n}\n.is-paused #chatIn {\n	width: 100%;\n	left: 1em;\n}\n\n.is-paused .chat-container {\n	display: grid !important; /*stop changing when pausing please*/\n	margin-left: unset;\n	height: auto;\n}\n.is-paused #chatIn {\n	position: sticky;\n}\n/* this places the chat element back inside the div */\n/* Overwritting the defaults */\n.chat-wrapper .pause-ui-element {\n	bottom: var(--ss-space-lg) !important ;\n	background-color: transparent !important;\n	border: none !important;\n	width: 30% !important;\n	height: auto !important;\n}\n.is-paused .pause-ui-element {\n	bottom: var(--ss-space-lg);\n	background-color: transparent;\n	border: none;\n	width: 30%;\n	height: auto !important;\n}\n/*addChat fitled message color*/\n.addChatfiltered {\n	color: red;\n}\n';

  // src/extensions/TEMPORARY/index.ts
  async function setupTemp() {
    await WaitForCondition(() => Client.readyState);
    Client.thememanager.addStyle(legacy_gtweaks_default, "legacy-gtweaks-css");
  }

  // src/extensions/index.ts
  var ExtensionList = [
    // ModMenu_broken,
    Extension3,
    // we will attempt to run this first
    Extension,
    Extension2,
    ModMenuExtension,
    Extension4,
    Extension5,
    Extension6
  ];
  function getSettings(extension) {
    const settings3 = storageProxy(extension.uniqueIdentifier, extension.defaultSettings);
    return settings3;
  }
  function attemptLoadExtension(extension) {
    try {
      extension.init();
      return true;
    } catch (err) {
      return err;
    }
  }
  function createExtension(data) {
    const settings3 = getSettings(data);
    return { ...data, settings: settings3 };
  }
  function setupExtensions() {
    const setupStart = performance.now();
    for (const extension of ExtensionList) {
      const start = performance.now();
      const result = attemptLoadExtension(extension);
      const Ext = {
        processed: result == true,
        loadTime: performance.now() - start
      };
      Object.assign(Ext, extension);
      Client.addExtension(Ext);
      if (!(result instanceof Error)) {
        debugInfo(`Extension Loaded: ${Ext.uniqueIdentifier}`);
        continue;
      }
      debugError(`Loading: %c${Ext.uniqueIdentifier} - ${result.message}`, result);
    }
    const duration = (performance.now() - setupStart).toFixed(2);
    const loadedSuccessfully = Client.extensions.filter((extension) => extension.processed == true);
    const message = `Loaded %c${loadedSuccessfully.length}%c/%c${Client.extensions.length}%c extensions in %c${duration}%cms successfully`;
    debugInfo(message, css.number, "", css.number, "", css.number, "");
    Client.readyState = true;
    setupTemp();
  }

  // src/index.ts
  startClient();
  setupExtensions();
})();
//# sourceURL=https://raw.githubusercontent.com/Grifmin/egg_game/refs/heads/master/dist/userscript.js.map
