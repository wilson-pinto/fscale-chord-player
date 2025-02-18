export const chordTypes = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  diminished: [0, 3, 6],
  augmented: [0, 4, 8],
  major7: [0, 4, 7, 11],
  minor7: [0, 3, 7, 10],
  dominant7: [0, 4, 7, 10]
};

export const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const createChord = (rootNote, type = 'major', octave = 2) => {
  const rootIndex = notes.indexOf(rootNote);
  return chordTypes[type].map(interval => {
    const noteIndex = (rootIndex + interval) % 12;
    const octaveShift = Math.floor((rootIndex + interval) / 12);
    return `${notes[noteIndex]}${octave + octaveShift}`;
  });
};

export const createArpeggio = (chord, pattern = 'up') => {
  switch (pattern) {
    case 'up':
      return [...chord];
    case 'down':
      return [...chord].reverse();
    case 'upDown':
      return [...chord, ...chord.slice(0, -1).reverse()];
    case 'random':
      return chord.sort(() => Math.random() - 0.5);
    default:
      return chord;
  }
};