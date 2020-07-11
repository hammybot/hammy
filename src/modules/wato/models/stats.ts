import { User } from 'discord.js';

export interface Stats {
	User?: User;
	Wins: number;
	Losses: number;
}
