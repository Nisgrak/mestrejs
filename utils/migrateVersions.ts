import type { DirectusUser } from "nuxt-directus/dist/runtime/types";
import { createMigration, createMigrator } from "yuppee";
import type { Partiture } from "./partiture";
import type { Section } from "../stores/songStore";
import { uid } from "quasar";

export const LAST_VERSION = 4

type StateV1 = {
	version: 1,

	bpm: number,
	beat: string;

	instruments: {
		type: number;
		alias: string;
		lines: number;
		vol: number;
		notes: number[];
	}[];
}
type StateV2 = {
	version: 2,

	bpm: number,
	sections: {
		id: number;
		name: string;
		instruments: {
			type: number;
			alias: string;
			lines: number;
			vol: number;
			notes: number[];
		}[];
		beat: {
			name: string;
			beatsPerBar: number;
			numOfGroups: number;
		};
		hide: boolean;
	}[]
}

type StateV3 = {
	version: 3,
	id: string;
	user_created?: DirectusUser | string
	user_updated?: DirectusUser | string
	date_updated?: string
	date_created?: string
	song: {
		id: number;
		name: string;
		instruments: {
			type: number;
			alias: string;
			lines: number;
			vol: number;
			notes: number[];
		}[];
		beat: {
			name: string;
			beatsPerBar: number;
			numOfGroups: number;
		};
		hide: boolean;
	}[]
	bpm: number
	name: string
	fingerprint?: string
}

export type StateV4 = {
	version: 4,
	id: string;
	user_created?: DirectusUser | string
	user_updated?: DirectusUser | string
	date_updated?: string
	date_created?: string
	song: Section[]
	bpm: number
	name: string
	fingerprint?: string
}


export function migratePartiture(oldFormat: any) {

	const store = useSongStore()

	const migrate = createMigrator<Partiture, StateV1 | StateV2 | StateV3>({
		init: () => ({ bpm: 20, beat: "4/4", instruments: [] }),
		migrations: [
			createMigration<StateV1, StateV2>({
				from: 1,
				to: 2,
				migrate: (state) => ({
					bpm: state.bpm,
					sections: [
						{
							beat: store.beats.find((beat) => beat.name === state.beat)!,
							hide: false,
							id: 1,
							instruments: state.instruments,
							name: "Sección 1"
						}
					]
				})
			}),
			createMigration<StateV2, StateV3>({
				from: 2,
				to: 3,
				migrate: (state) => ({
					bpm: state.bpm,
					name: "Partitura sin nombre",
					id: uid(),
					song: state.sections.map((section) => ({
						beat: section.beat,
						id: section.id,
						instruments: section.instruments.map((instrument) => ({
							type: instrument.type,
							alias: instrument.alias,
							lines: instrument.lines,
							vol: instrument.vol,
							notes: instrument.notes,
						})),
						name: section.name,
						hide: section.hide,
					}))
				})
			}),
			createMigration<StateV3, StateV4>({
				from: 3,
				to: 4,
				migrate: (state) => ({
					bpm: state.bpm,
					name: "Partitura sin nombre",
					id: uid(),
					song: state.song.map((section) => ({
						beat: section.beat,
						id: uid(),
						instruments: section.instruments.map((instrument) => ({
							id: uid(),
							type: instrument.type,
							alias: instrument.alias,
							lines: instrument.lines,
							vol: instrument.vol,
							noteLines: instrument.notes.reduce((acc, note, index) => {
								console.log(instrument.notes);
								if (acc.length === 0) {
									acc.push([[]]);
								}

								if (acc.at(-1)?.at(-1)?.length === section.beat.beatsPerBar) {
									acc.at(-1)?.push([]);

								}

								if (acc.at(-1)?.length === section.beat.numOfGroups + 1) {
									acc?.push([[]]);

								}

								acc.at(-1)?.at(-1)?.push(note)

								return acc;
							}, [] as Note[][][])
						})),
						name: section.name
					}))
				})
			})
		]
	});

	return migrate(oldFormat)
}




