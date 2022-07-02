import { Directus, UserItem } from '@directus/sdk';
import { Section } from 'src/stores/songStore';

export type Partiture = {
	id: string;
	user_created: UserItem | string
	user_updated: UserItem | string
	date_updated: string
	date_created: string
	song: Section[]
	bpm: number
	name: string
	fingerprint?: string
};

export type Collections = {
	partiture: Partiture;
};

export function getAssetRoute(id: string ): string {

	return `${process.env.VITE_API_URL}/assets/${id}`;
}

const directus = new Directus<Collections>(process.env.VITE_API_URL);

export default directus;
