export function generateNewLine(numberOfGroups: number, beatsPerBar: number) {
	return (new Array(numberOfGroups)).fill(0).map(() => new Array(beatsPerBar).fill(0));

}
