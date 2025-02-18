type ChordType = 'major' | 'minor' | 'diminished';
type NoteName = 'F' | 'G' | 'A' | 'B♭' | 'C' | 'D' | 'E';

interface ChordTypes {
  [key: string]: number[];
}

// Each number represents semitones above the root note
export const chordTypes: ChordTypes = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  diminished: [0, 3, 6]
};

// F major scale note positions (in semitones from F)
const NOTE_POSITIONS = {
  'F': 0,   // F
  'G': 2,   // G
  'A': 4,   // A
  'B♭': 5,  // B♭
  'C': 7,   // C
  'D': 9,   // D
  'E': 11   // E
};

// Notes in order for the F scale
const F_SCALE_NOTES = ['F', 'G', 'A', 'B♭', 'C', 'D', 'E'];

export const createChord = (rootNote: NoteName, type: ChordType = 'major', octave: number = 3): string[] => {
  console.log(rootNote);
  
  const rootPosition = NOTE_POSITIONS[rootNote];
  
  if (rootPosition === undefined) {
    throw new Error(`Invalid root note: ${rootNote}`);
  }

  return chordTypes[type].map(interval => {
    const semitones = (rootPosition + interval) % 12;
    const octaveShift = Math.floor((rootPosition + interval) / 12);
    
    // Find the correct note name based on the F scale
    const noteIndex = F_SCALE_NOTES.findIndex(note => 
      NOTE_POSITIONS[note as NoteName] === semitones
    );
    
    if (noteIndex === -1) {
      // If we need a note that's in the next octave
      const nextOctaveNote = F_SCALE_NOTES.find(note => 
        NOTE_POSITIONS[note as NoteName] === semitones % 12
      );
      return `${nextOctaveNote}${octave + octaveShift + 1}`;
    }

    return `${F_SCALE_NOTES[noteIndex]}${octave + octaveShift}`;
  });
};

type ArpeggioPattern = 'up' | 'down' | 'upDown' | 'random';

export const createArpeggio = (chord: string[], pattern: ArpeggioPattern = 'up'): string[] => {
  switch (pattern) {
    case 'up':
      return [...chord];
    case 'down':
      return [...chord].reverse();
    case 'upDown':
      return [...chord, ...chord.slice(0, -1).reverse()];
    case 'random':
      return [...chord].sort(() => Math.random() - 0.5);
    default:
      return chord;
  }
};

// Export types for use in other files
export type { ChordType, NoteName, ArpeggioPattern };

// Export notes array for other components
export const notes: NoteName[] = F_SCALE_NOTES as NoteName[];