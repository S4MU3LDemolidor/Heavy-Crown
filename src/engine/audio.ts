import type { ThemeId } from '../content/themes';

/**
 * All game audio (spec section 11): synthesized sound effects, ambience beds, and music.
 * Music plays `public/audio/<theme>.mp3` when the file exists; otherwise a generated ambient score
 * in the level's own key fills in. Audio starts on the first key or button press.
 */

type Wave = OscillatorType;

interface MusicSpec {
  /** Root frequency and scale degrees (semitones) for chords and melody. */
  root: number;
  scale: number[];
  /** Chord progression as scale-degree triads. */
  chords: number[][];
  /** Seconds per chord. */
  bar: number;
  bright: number;
}

const MUSIC: Record<ThemeId | 'title', MusicSpec> = {
  title: { root: 110, scale: [0, 2, 3, 5, 7, 8, 10], chords: [[0, 2, 4], [5, 0, 2], [3, 5, 0], [4, 6, 1]], bar: 7, bright: 0.5 },
  overgrown: { root: 130.81, scale: [0, 2, 4, 7, 9, 11, 14], chords: [[0, 2, 4], [3, 5, 0], [5, 0, 2], [4, 6, 1]], bar: 6, bright: 0.7 },
  cistern: { root: 98, scale: [0, 2, 3, 5, 7, 9, 10], chords: [[0, 2, 4], [6, 1, 3], [5, 0, 2], [0, 2, 4]], bar: 8, bright: 0.4 },
  bells: { root: 116.54, scale: [0, 2, 4, 5, 7, 9, 11], chords: [[0, 2, 4], [5, 0, 2], [3, 5, 0], [4, 6, 1]], bar: 6, bright: 0.65 },
  dark: { root: 73.42, scale: [0, 1, 3, 5, 7, 8, 10], chords: [[0, 2, 4], [1, 3, 5], [0, 2, 4], [6, 1, 3]], bar: 10, bright: 0.2 },
  frozen: { root: 87.31, scale: [0, 2, 3, 7, 8, 10, 14], chords: [[0, 2, 4], [5, 0, 2], [3, 5, 0], [6, 1, 3]], bar: 9, bright: 0.55 },
};

const AMBIENCE: Record<ThemeId, { wind: number; drips: boolean; drone: number }> = {
  overgrown: { wind: 0.05, drips: false, drone: 0 },
  cistern: { wind: 0.03, drips: true, drone: 0.02 },
  bells: { wind: 0.06, drips: false, drone: 0 },
  dark: { wind: 0.02, drips: true, drone: 0.05 },
  frozen: { wind: 0.12, drips: false, drone: 0 },
};

const semis = (n: number) => Math.pow(2, n / 12);

export class Audio {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private sfxBus!: GainNode;
  private musicBus!: GainNode;
  private ambBus!: GainNode;
  private reverb!: ConvolverNode;
  private noiseBuf!: AudioBuffer;
  private chargeOsc: { osc: OscillatorNode; gain: GainNode } | null = null;
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private droneGain: GainNode | null = null;
  private theme: ThemeId | 'title' | null = null;
  private music: { stop(at: number): void } | null = null;
  private fileCache = new Map<string, AudioBuffer | null>();
  private dripTimer = 0;
  private ambTheme: ThemeId = 'overgrown';
  musicVolume = 0.7;
  sfxVolume = 0.8;

  /** Creates the audio graph; call from a user gesture. Safe to call repeatedly. */
  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(ctx.destination);
    this.sfxBus = ctx.createGain();
    this.musicBus = ctx.createGain();
    this.ambBus = ctx.createGain();
    this.sfxBus.gain.value = this.sfxVolume;
    this.musicBus.gain.value = this.musicVolume;
    this.ambBus.gain.value = this.sfxVolume;
    this.reverb = ctx.createConvolver();
    this.reverb.buffer = this.impulse(3.2);
    const wet = ctx.createGain();
    wet.gain.value = 0.35;
    this.reverb.connect(wet).connect(this.master);
    for (const bus of [this.sfxBus, this.musicBus, this.ambBus]) bus.connect(this.master);
    this.musicBus.connect(this.reverb);
    this.sfxBus.connect(this.reverb);
    this.noiseBuf = this.makeNoise(2);
    this.startAmbience();
    if (this.theme) {
      const t = this.theme;
      this.theme = null;
      this.setMusic(t);
    }
  }

  get ready(): boolean {
    return !!this.ctx;
  }

  setVolumes(music: number, sfx: number): void {
    this.musicVolume = music;
    this.sfxVolume = sfx;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.musicBus.gain.setTargetAtTime(music, t, 0.1);
    this.sfxBus.gain.setTargetAtTime(sfx, t, 0.1);
    this.ambBus.gain.setTargetAtTime(sfx, t, 0.1);
  }

  private impulse(seconds: number): AudioBuffer {
    const ctx = this.ctx!;
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    return buf;
  }

  private makeNoise(seconds: number): AudioBuffer {
    const ctx = this.ctx!;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  // ---------- building blocks ----------

  private tone(freq: number, dur: number, opts: { wave?: Wave; vol?: number; attack?: number; slide?: number; delay?: number; bus?: GainNode; detune?: number } = {}): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime + (opts.delay ?? 0);
    const osc = ctx.createOscillator();
    osc.type = opts.wave ?? 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (opts.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq * opts.slide), t + dur);
    if (opts.detune) osc.detune.value = opts.detune;
    const g = ctx.createGain();
    const v = opts.vol ?? 0.2;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + (opts.attack ?? 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(opts.bus ?? this.sfxBus);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  private noise(dur: number, opts: { vol?: number; freq?: number; q?: number; type?: BiquadFilterType; sweep?: number; delay?: number; attack?: number; bus?: GainNode } = {}): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime + (opts.delay ?? 0);
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.playbackRate.value = 0.8 + Math.random() * 0.4;
    const f = ctx.createBiquadFilter();
    f.type = opts.type ?? 'lowpass';
    f.frequency.setValueAtTime(opts.freq ?? 1200, t);
    if (opts.sweep) f.frequency.exponentialRampToValueAtTime(Math.max(40, (opts.freq ?? 1200) * opts.sweep), t + dur);
    f.Q.value = opts.q ?? 0.7;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(opts.vol ?? 0.2, t + (opts.attack ?? 0.004));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(opts.bus ?? this.sfxBus);
    src.start(t, Math.random());
    src.stop(t + dur + 0.05);
  }

  /** A bronze bell: inharmonic partials with long decay. */
  private bellTone(freq: number, vol: number, dur = 3): void {
    for (const [ratio, v, d] of [
      [1, 1, 1],
      [2.0, 0.55, 0.7],
      [2.4, 0.35, 0.55],
      [3.0, 0.3, 0.45],
      [4.2, 0.18, 0.3],
      [5.4, 0.12, 0.22],
    ] as const) {
      this.tone(freq * ratio, dur * d, { vol: vol * v, wave: 'sine', attack: 0.002 });
    }
  }

  // ---------- game sounds ----------

  chargeStart(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    this.chargeStop();
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    const g = ctx.createGain();
    const t = ctx.currentTime;
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(330, t + 0.62);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05, t + 0.08);
    osc.connect(g).connect(this.sfxBus);
    osc.start();
    this.chargeOsc = { osc, gain: g };
  }

  chargeStop(): void {
    if (!this.chargeOsc || !this.ctx) return;
    const t = this.ctx.currentTime;
    this.chargeOsc.gain.gain.setTargetAtTime(0.0001, t, 0.02);
    this.chargeOsc.osc.stop(t + 0.1);
    this.chargeOsc = null;
  }

  jump(charge: number): void {
    this.chargeStop();
    this.noise(0.12, { vol: 0.12, freq: 900 + charge * 900, type: 'bandpass', q: 1.2, sweep: 2 });
    this.tone(180 + charge * 160, 0.12, { wave: 'triangle', vol: 0.08, slide: 1.8 });
  }

  land(tier: number, hard: boolean): void {
    const low = 1 - tier * 0.12;
    this.noise(hard ? 0.35 : 0.12, { vol: hard ? 0.4 : 0.14 + tier * 0.04, freq: 500 * low, sweep: 0.4 });
    this.tone(90 * low, hard ? 0.4 : 0.14, { wave: 'sine', vol: hard ? 0.4 : 0.15 + tier * 0.05, slide: 0.5 });
    if (hard) this.noise(0.5, { vol: 0.15, freq: 2400, type: 'highpass', delay: 0.04, sweep: 0.3 });
  }

  step(tier: number): void {
    this.noise(0.05, { vol: 0.04 + tier * 0.025, freq: 700 - tier * 90, sweep: 0.5 });
  }

  bonk(): void {
    this.tone(220, 0.08, { wave: 'square', vol: 0.06, slide: 0.6 });
    this.noise(0.06, { vol: 0.12, freq: 1600, type: 'bandpass', q: 2 });
  }

  pickup(): void {
    [0, 4, 7, 12].forEach((s, i) => this.tone(660 * semis(s), 0.25, { wave: 'triangle', vol: 0.08, delay: i * 0.05 }));
  }

  drop(): void {
    this.noise(0.1, { vol: 0.12, freq: 400, sweep: 0.5 });
    this.tone(140, 0.1, { vol: 0.08, slide: 0.6 });
  }

  keyTurn(): void {
    this.noise(0.08, { vol: 0.2, freq: 3000, type: 'bandpass', q: 3 });
    this.tone(400, 0.2, { wave: 'square', vol: 0.05, delay: 0.06, slide: 0.8 });
    [0, 7, 12].forEach((s, i) => this.tone(523 * semis(s), 0.6, { wave: 'sine', vol: 0.07, delay: 0.15 + i * 0.08 }));
    this.gate();
  }

  locked(): void {
    this.tone(150, 0.12, { wave: 'square', vol: 0.05 });
    this.tone(120, 0.15, { wave: 'square', vol: 0.05, delay: 0.1 });
  }

  gate(): void {
    this.noise(0.9, { vol: 0.1, freq: 250, type: 'bandpass', q: 4, sweep: 1.6, attack: 0.08 });
  }

  breakStone(): void {
    this.noise(0.5, { vol: 0.35, freq: 900, sweep: 0.2 });
    for (let i = 0; i < 5; i++) this.noise(0.08, { vol: 0.12, freq: 1400 + Math.random() * 1200, type: 'bandpass', q: 3, delay: 0.1 + i * 0.07 });
  }

  rope(): void {
    this.noise(0.5, { vol: 0.08, freq: 600, type: 'bandpass', q: 1, sweep: 0.4, attack: 0.05 });
  }

  creak(): void {
    this.tone(260 + Math.random() * 60, 0.09, { wave: 'sawtooth', vol: 0.015, slide: 0.85 });
  }

  splash(): void {
    this.noise(0.45, { vol: 0.25, freq: 2500, type: 'bandpass', q: 0.6, sweep: 0.3 });
    for (let i = 0; i < 4; i++) this.tone(800 + Math.random() * 900, 0.08, { vol: 0.03, delay: 0.05 + i * 0.05, slide: 1.4 });
  }

  bell(big: boolean): void {
    this.bellTone(big ? 196 : 293.66, big ? 0.22 : 0.14, big ? 4 : 2.6);
  }

  plank(down: boolean): void {
    this.noise(0.15, { vol: 0.2, freq: 500, type: 'bandpass', q: 2 });
    this.tone(down ? 180 : 260, 0.2, { wave: 'sawtooth', vol: 0.03, slide: down ? 0.6 : 1.3 });
  }

  plate(pressed: boolean): void {
    this.noise(0.08, { vol: 0.15, freq: pressed ? 700 : 1100, sweep: 0.6 });
    this.tone(pressed ? 220 : 330, 0.1, { wave: 'square', vol: 0.03 });
  }

  paper(): void {
    this.noise(0.25, { vol: 0.08, freq: 4000, type: 'highpass', sweep: 0.6, attack: 0.03 });
  }

  relic(): void {
    [0, 4, 7, 11, 14].forEach((s, i) => this.tone(392 * semis(s), 2.2, { wave: 'sine', vol: 0.06, attack: 0.15, delay: i * 0.12 }));
    this.bellTone(392, 0.08, 3);
  }

  crown(): void {
    [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => {
      this.tone(196 * semis(s), 5, { wave: 'triangle', vol: 0.05, attack: 0.4, delay: i * 0.18 });
      this.tone(196 * semis(s) * 1.004, 5, { wave: 'sine', vol: 0.04, attack: 0.5, delay: i * 0.18 });
    });
    this.bellTone(98, 0.25, 6);
  }

  ui(): void {
    this.tone(880, 0.05, { wave: 'square', vol: 0.03 });
  }

  /** Wind gust warning and gust. */
  gust(strong: boolean): void {
    this.noise(strong ? 2.2 : 0.8, { vol: strong ? 0.12 : 0.05, freq: strong ? 700 : 400, type: 'bandpass', q: 0.8, sweep: strong ? 1.8 : 1.4, attack: strong ? 0.3 : 0.5, bus: this.ambBus });
  }

  // ---------- ambience ----------

  private startAmbience(): void {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    this.windFilter = ctx.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.frequency.value = 400;
    this.windFilter.Q.value = 0.6;
    this.windGain = ctx.createGain();
    this.windGain.gain.value = 0;
    src.connect(this.windFilter).connect(this.windGain).connect(this.ambBus);
    src.start();
    const drone = ctx.createOscillator();
    const drone2 = ctx.createOscillator();
    drone.frequency.value = 55;
    drone2.frequency.value = 55.6;
    this.droneGain = ctx.createGain();
    this.droneGain.gain.value = 0;
    drone.connect(this.droneGain);
    drone2.connect(this.droneGain);
    this.droneGain.connect(this.ambBus);
    drone.start();
    drone2.start();
    this.setAmbience(this.ambTheme);
  }

  setAmbience(theme: ThemeId): void {
    this.ambTheme = theme;
    if (!this.ctx || !this.windGain || !this.droneGain) return;
    const a = AMBIENCE[theme];
    const t = this.ctx.currentTime;
    this.windGain.gain.setTargetAtTime(a.wind, t, 1.2);
    this.droneGain.gain.setTargetAtTime(a.drone, t, 1.5);
  }

  /** Call every frame: slow wind wobble and random drips. */
  tick(): void {
    if (!this.ctx || !this.windFilter) return;
    const t = this.ctx.currentTime;
    this.windFilter.frequency.setTargetAtTime(320 + Math.sin(t * 0.37) * 140 + Math.sin(t * 0.11) * 90, t, 0.5);
    if (AMBIENCE[this.ambTheme].drips && --this.dripTimer <= 0) {
      this.dripTimer = 40 + Math.floor(Math.random() * 160);
      const f = 1200 + Math.random() * 1400;
      this.tone(f, 0.12, { vol: 0.03, slide: 1.6, bus: this.ambBus });
      this.tone(f * 0.5, 0.25, { vol: 0.01, delay: 0.02, bus: this.ambBus });
    }
  }

  // ---------- music ----------

  setMusic(theme: ThemeId | 'title'): void {
    if (theme === this.theme) return;
    this.theme = theme;
    if (!this.ctx) return;
    const ctx = this.ctx;
    const at = ctx.currentTime;
    this.music?.stop(at + 2);
    const key = `audio/${theme}.mp3`;
    const play = (buf: AudioBuffer | null) => {
      if (this.theme !== theme) return;
      this.music = buf ? this.playFile(buf) : this.playGenerated(MUSIC[theme]);
    };
    if (this.fileCache.has(key)) play(this.fileCache.get(key) ?? null);
    else
      fetch(key)
        .then((r) => (r.ok && (r.headers.get('content-type') ?? '').includes('audio') ? r.arrayBuffer() : null))
        .then((ab) => (ab ? ctx.decodeAudioData(ab) : null))
        .catch(() => null)
        .then((buf) => {
          this.fileCache.set(key, buf);
          play(buf);
        });
  }

  private playFile(buf: AudioBuffer): { stop(at: number): void } {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.8, ctx.currentTime + 2);
    src.connect(g).connect(this.musicBus);
    src.start();
    return {
      stop: (at) => {
        g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.6);
        src.stop(at + 1);
      },
    };
  }

  /** A slow generative score: soft pad chords with sparse bell-like melody notes. */
  private playGenerated(spec: MusicSpec): { stop(at: number): void } {
    const ctx = this.ctx!;
    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, ctx.currentTime);
    out.gain.exponentialRampToValueAtTime(1, ctx.currentTime + 3);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 600 + spec.bright * 1400;
    out.connect(lp).connect(this.musicBus);
    let stopped = false;
    let bar = 0;
    const freqOf = (deg: number, oct = 0) => {
      const n = spec.scale.length;
      const d = ((deg % n) + n) % n;
      const o = Math.floor(deg / n) + oct;
      return spec.root * semis(spec.scale[d] + 12 * o);
    };
    const playBar = () => {
      if (stopped) return;
      const t = ctx.currentTime + 0.05;
      const chord = spec.chords[bar % spec.chords.length];
      bar++;
      // pad: each chord tone as two detuned voices with slow swell
      for (const deg of chord) {
        for (const det of [-6, 6]) {
          const o = ctx.createOscillator();
          o.type = 'sawtooth';
          o.frequency.value = freqOf(deg, 1);
          o.detune.value = det;
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(0.018, t + spec.bar * 0.35);
          g.gain.exponentialRampToValueAtTime(0.0001, t + spec.bar * 1.15);
          o.connect(g).connect(out);
          o.start(t);
          o.stop(t + spec.bar * 1.2);
        }
      }
      // bass
      const b = ctx.createOscillator();
      b.type = 'sine';
      b.frequency.value = freqOf(chord[0], 0);
      const bg = ctx.createGain();
      bg.gain.setValueAtTime(0.0001, t);
      bg.gain.exponentialRampToValueAtTime(0.05, t + 1);
      bg.gain.exponentialRampToValueAtTime(0.0001, t + spec.bar);
      b.connect(bg).connect(out);
      b.start(t);
      b.stop(t + spec.bar + 0.1);
      // sparse melody
      const notes = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < notes; i++) {
        if (Math.random() > 0.75) continue;
        const deg = chord[Math.floor(Math.random() * 3)] + (Math.random() > 0.5 ? 7 : 0) + (Math.random() > 0.7 ? 1 : 0);
        const nt = t + (spec.bar / notes) * i + Math.random() * 0.3;
        const m = ctx.createOscillator();
        m.type = 'triangle';
        m.frequency.value = freqOf(deg, 2);
        const mg = ctx.createGain();
        mg.gain.setValueAtTime(0.0001, nt);
        mg.gain.exponentialRampToValueAtTime(0.035 * (0.5 + spec.bright), nt + 0.02);
        mg.gain.exponentialRampToValueAtTime(0.0001, nt + 2.4);
        m.connect(mg).connect(out);
        m.connect(mg).connect(this.reverb);
        m.start(nt);
        m.stop(nt + 2.5);
      }
      timer = window.setTimeout(playBar, spec.bar * 1000);
    };
    let timer = window.setTimeout(playBar, 50);
    return {
      stop: (at) => {
        stopped = true;
        window.clearTimeout(timer);
        out.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.7);
        window.setTimeout(() => out.disconnect(), Math.max(0, (at - ctx.currentTime) * 1000) + 3000);
      },
    };
  }
}
