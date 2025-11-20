/**
 * Wrappers for the `Player` instance.
 * @author Grifmin
 */

interface PlayerWrapped {
	id: number;
	uniqueId: string;
	name: string;
	team: 0 | 1 | 2;
	hp: number;
	shield: number;
	yaw: number;
	pitch: number;
	x: number;
	y: number;
	z: number;
	dx: number;
	dy: number;
	dz: number;
	playing: boolean;
	hideBadge: boolean;
}

interface PlayerTeam {
	none: 0;
	blue: 1;
	red: 2;
}
