import React, { useEffect, useState, useCallback, useRef } from 'react';
import Soundfont, { Player } from 'soundfont-player';
import { createChord, ChordType, NoteName } from '../utils/chords';
import styles from './Piano.module.css';

interface ChordMapping {
  note: NoteName;
  type: ChordType;
  label: string;
  scale: string;  // Added to show scale degree
}

interface ChordMappings {
  [key: string]: ChordMapping;
}

interface ActiveChord {
  root: NoteName;
  type: ChordType;
}

interface ArpeggioPatterns {
  [key: string]: (notes: string[]) => string[];
}

interface BeatPatterns {
  [key: string]: number[];
}

// F major scale chords:
// F (I) - Gm (ii) - Am (iii) - B♭ (IV) - C (V) - Dm (vi) - E° (vii°)
const KEYBOARD_MAPPINGS: ChordMappings = {
  'f': { note: 'F', type: 'major', label: 'F Major', scale: 'I' },
  'g': { note: 'G', type: 'minor', label: 'G Minor', scale: 'ii' },
  'a': { note: 'A', type: 'minor', label: 'A Minor', scale: 'iii' },
  'b': { note: 'Bb', type: 'major', label: 'B♭ Major', scale: 'IV' },
  'c': { note: 'C', type: 'major', label: 'C Major', scale: 'V' },
  'd': { note: 'D', type: 'minor', label: 'D Minor', scale: 'vi' },
  'u': { note: 'E', type: 'diminished', label: 'E Dim', scale: 'vii°' }
};

const ARPEGGIO_PATTERNS: ArpeggioPatterns = {
  'up': (notes) => notes,
  'down': (notes) => [...notes].reverse(),
  'upDown': (notes) => [...notes, ...notes.slice(1, -1).reverse()],
  'random': (notes) => [...notes].sort(() => Math.random() - 0.5),
};

const BEAT_PATTERNS: BeatPatterns = {
  'straight': [1, 1, 1, 1],
  'dotted': [1.5, 0.5, 1.5, 0.5],
  'swing': [1.2, 0.8, 1.2, 0.8],
  'triplet': [0.33, 0.33, 0.33, 1]
};

const Piano: React.FC = () => {
  const [piano, setPiano] = useState<Player | null>(null);
  const [activeChord, setActiveChord] = useState<ActiveChord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isArpeggioPlaying, setIsArpeggioPlaying] = useState<boolean>(false);
  const [arpeggioPattern, setArpeggioPattern] = useState<keyof typeof ARPEGGIO_PATTERNS>('up');
  const [beatPattern, setBeatPattern] = useState<keyof typeof BEAT_PATTERNS>('straight');
  const [tempo, setTempo] = useState<number>(120);
  const [transpose, setTranspose] = useState<number>(0);
  
  const arpeggioTimeoutRef = useRef<number | null>(null);
  const currentChordRef = useRef<string[] | null>(null);
  const nextChordRef = useRef<string[] | null>(null);
  const noteTimeoutsRef = useRef<number[]>([]);

  const clearAllTimeouts = useCallback(() => {
    if (arpeggioTimeoutRef.current) {
      window.clearTimeout(arpeggioTimeoutRef.current);
    }
    noteTimeoutsRef.current.forEach(timeout => window.clearTimeout(timeout));
    noteTimeoutsRef.current = [];
  }, []);

  const initAudio = useCallback(async () => {
    try {
      const ac = new AudioContext();
      const instrument = await Soundfont.instrument(ac, 'acoustic_grand_piano', {
        format: 'mp3',
        soundfont: 'MusyngKite',
        gain: 2
      });
      setPiano(instrument);
      setLoading(false);
    } catch (error) {
      console.error('Audio initialization failed:', error);
      setLoading(false);
    }
  }, []);

  const transposeNote = useCallback((note: string): string => {
    if (!transpose) return note;
    const noteWithoutOctave = note.replace(/\d+$/, '');
    const octave = parseInt(note.match(/\d+$/)?.[0] || '4');
    const noteIndex = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B']
      .indexOf(noteWithoutOctave.replace('♭', '#'));
    
    let newIndex = noteIndex + transpose;
    let newOctave = octave + Math.floor(newIndex / 12);
    newIndex = ((newIndex % 12) + 12) % 12;
    
    return ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'][newIndex] + newOctave;
  }, [transpose]);

  const playArpeggio = useCallback((notes: string[], isNewChord = false) => {
    if (!piano || !isArpeggioPlaying) return;

    clearAllTimeouts();

    const transposedNotes = notes.map(transposeNote);
    const pattern = ARPEGGIO_PATTERNS[arpeggioPattern](transposedNotes);
    const beats = BEAT_PATTERNS[beatPattern];
    const baseDelay = (60 / tempo) * 1000;

    let currentTime = 0;
    pattern.forEach((note, index) => {
      const beatIndex = index % beats.length;
      const delay = baseDelay * beats[beatIndex];
      
      const timeout = window.setTimeout(() => {
        piano.play(note, 0, {
          duration: 2,
          gain: isNewChord ? 1.5 : 1.2
        });
      }, currentTime);
      
      noteTimeoutsRef.current.push(timeout);
      currentTime += delay;
    });

    arpeggioTimeoutRef.current = window.setTimeout(() => {
      if (nextChordRef.current) {
        const nextChord = nextChordRef.current;
        nextChordRef.current = null;
        playArpeggio(nextChord, true);
      } else {
        playArpeggio(notes);
      }
    }, currentTime);
  }, [piano, isArpeggioPlaying, arpeggioPattern, beatPattern, tempo, transposeNote, clearAllTimeouts]);

  const playChord = useCallback((root: NoteName, type: ChordType) => {
    if (!piano) {
      initAudio();
      return;
    }

    const chord = createChord(root, type);
    setActiveChord({ root, type });

    if (isArpeggioPlaying) {
      nextChordRef.current = chord;
    } else {
      chord.map(transposeNote).forEach(note => {
        piano.play(note, 0, {
          duration: 4,
          gain: 2
        });
      });
    }
  }, [piano, initAudio, isArpeggioPlaying, transposeNote]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const mapping = KEYBOARD_MAPPINGS[e.key.toLowerCase()];
      if (mapping) {
        e.preventDefault();
        playChord(mapping.note, mapping.type);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    if (loading) initAudio();

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      clearAllTimeouts();
    };
  }, [playChord, initAudio, loading, clearAllTimeouts]);

  useEffect(() => {
    if (isArpeggioPlaying && currentChordRef.current) {
      playArpeggio(currentChordRef.current, true);
    } else {
      clearAllTimeouts();
    }
  }, [isArpeggioPlaying, playArpeggio, clearAllTimeouts]);

  useEffect(() => {
    if (activeChord) {
      currentChordRef.current = createChord(activeChord.root, activeChord.type);
    }
  }, [activeChord]);

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label>Arpeggio:</label>
          <button 
            className={`${styles.controlButton} ${isArpeggioPlaying ? styles.active : ''}`}
            onClick={() => setIsArpeggioPlaying(!isArpeggioPlaying)}
          >
            {isArpeggioPlaying ? 'Stop' : 'Start'} Arpeggio
          </button>
          <select 
            value={arpeggioPattern}
            onChange={(e) => setArpeggioPattern(e.target.value as keyof typeof ARPEGGIO_PATTERNS)}
            className={styles.select}
          >
            <option value="up">Up</option>
            <option value="down">Down</option>
            <option value="upDown">Up & Down</option>
            <option value="random">Random</option>
          </select>
        </div>

        <div className={styles.controlGroup}>
          <label>Beat Pattern:</label>
          <select 
            value={beatPattern}
            onChange={(e) => setBeatPattern(e.target.value as keyof typeof BEAT_PATTERNS)}
            className={styles.select}
          >
            <option value="straight">Straight</option>
            <option value="dotted">Dotted</option>
            <option value="swing">Swing</option>
            <option value="triplet">Triplet</option>
          </select>
        </div>

        <div className={styles.controlGroup}>
          <label>Tempo: {tempo} BPM</label>
          <input
            type="range"
            min="60"
            max="200"
            value={tempo}
            onChange={(e) => setTempo(Number(e.target.value))}
            className={styles.slider}
          />
        </div>

        <div className={styles.controlGroup}>
          <label>Transpose: {transpose} semitones</label>
          <div className={styles.transposeButtons}>
            <button
              className={styles.transposeButton}
              onClick={() => setTranspose(Math.max(-12, transpose - 1))}
            >
              -
            </button>
            <button
              className={styles.transposeButton}
              onClick={() => setTranspose(Math.min(12, transpose + 1))}
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className={styles.grandPiano}>
        <div className={styles.chordGrid}>
          {Object.entries(KEYBOARD_MAPPINGS).map(([key, { note, type, label, scale }]) => (
            <button
              key={key}
              className={`${styles.chordButton} ${
                activeChord?.root === note && activeChord?.type === type ? styles.active : ''
              }`}
              onClick={() => playChord(note, type)}
            >
              <span className={styles.keyLabel}>{key.toUpperCase()}</span>
              <span className={styles.chordName}>{label}</span>
              <span className={styles.scaleLabel}>{scale}</span>
            </button>
          ))}
        </div>
      </div>
      
      <div className={styles.instructions}>
        {loading ? (
          <p>Initializing piano sounds...</p>
        ) : !piano ? (
          <p>Click any chord to start playing</p>
        ) : (
          <p>Press keys Q-U to play F scale chords</p>
        )}
      </div>
    </div>
  );
};

export default Piano;