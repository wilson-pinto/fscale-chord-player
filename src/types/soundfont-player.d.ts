declare module 'soundfont-player' {
  export interface InstrumentOptions {
    format?: 'mp3' | 'ogg';
    soundfont?: string;
    gain?: number;
    duration?: number;
  }

  export interface PlayOptions {
    gain?: number;
    duration?: number;
    attack?: number;
    decay?: number;
    sustain?: number;
    release?: number;
    adsr?: [number, number, number, number];
    loop?: boolean;
  }

  export interface Player {
    play(note: string, time?: number, options?: PlayOptions): void;
    stop(time?: number): void;
    on(event: string, callback: Function): void;
    disconnect(): void;
  }

  export interface Soundfont {
    instrument(
      ac: AudioContext,
      name: string,
      options?: InstrumentOptions
    ): Promise<Player>;
  }

  const Soundfont: Soundfont;
  export default Soundfont;
}