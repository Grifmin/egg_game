/**
 * ill just add these as i go for now.
 * although i should definitely attempt to write a script to automate typecompletions.
 *  */
export interface ExternInterface {
	account: AccountInterface;
	version: string;
	catalog: catalogInterface;
	resetPaperDoll(): void;
	api_buy(item: TODO, successCallback: Function, failureCallback: Function): void;
	api_checkBalance(): void;
	api_redeem(code: string, successCallback: Function, failureCallback: Function): void;
	api_inGameReward(successCallback: Function, errorCallback: Function, reachedDailyLimitCallback: Function): void;
	api_incentivizedVideoRewardRequest(successCallback: Function, errorCallback: Function, firstPlay: boolean): void;
}

interface AccountInterface {
	_cgUserStatus: Object;
	_challenges: Object;
	_challengesClaimed: Object;
	_currentBalance: string;
	_dateCreated: string;
	_deaths: string;
	_eggsEarnedBalance: string;
	_eggsSpent: string;
	_eggsSpentMonthly: string;
	_firebaseId: string;
	_id: string;
	_isAnonymous: boolean;
	_isEmailVerified: boolean;
	_isSubscriber: boolean;
	_kdr: string;
	_kdrLifetime: string;
	_kills: string;
	_maskedEmail: string;
	_statsCurrent: Object;
	_statsLifetime: Object;
	_streak: string;
	_twitchLinked: boolean;
	_twitchName: string;
	_upgradeName: string;
	accountAge: string;
	cgUserStatus: Object;
	challenges: Object;
	challengesClaimedUnique: Object;
	challengesDailyEnd: string;
	challengesHasAutoClaim: boolean;
	classIdx: string;
	colorIdx: string;
	contentCreator: undefined;
	currentBalance: string;
	dateCreated: string;
	deaths: string;
	eggsEarnedBalance: string;
	eggsSpent: string;
	eggsSpentMonthly: string;
	faction: Object;
	factionActivated: boolean;
	firebaseId: string;
	grenadeItem: Object;
	hatItem: Object;
	hideAds: undefined;
	inventory: Object;
	isSubscriber: boolean;
	killMultiplier: string;
	kills: string;
	maskedEmail: string;
	maybeSchoolEmail: boolean;
	meleeItem: Object;
	multiplier: string;
	notification: Object;
	passEnded: undefined;
	pickedWeapons: Object;
	session: string;
	sessionId: string;
	stampItem: Object;
	stampPositionX: string;
	stampPositionY: string;
	statsCurrent: Object;
	statsLifetime: Object;
	streak: string;
	subscriptionEnded: boolean;
	twitchLinked: string;
	twitchName: string;
	upgradeExpiryDate: string;
	upgradeIsExpired: string;
	upgradeName: string;
	upgradePlanId: undefined;
	upgradeProductId: string;
}

type cgUserStatus = {
	hasAccount: boolean;
	hasLinked: boolean;
	isAnnony;
};

interface catalogInterface {
	addGrenadeFunctions(e: any): unknown;
	addMeleeFunctions(e: unknown): unknown;
	addWeaponFunctions(e: unknown): unknown;
	premiumSoundValid(e: unknown): unknown;
	defaultItemIds: number[];
	isSetup: boolean;
}
