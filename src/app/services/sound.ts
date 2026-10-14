import { Injectable, signal } from '@angular/core';
import { SoundTheme } from '../interfaces/SoundTheme';

const STORAGE_KEY = 'api-explorer-sound';
const MASTER_VOLUME = 0.2;

@Injectable({ providedIn: 'root' })
export class SoundService {
  readonly enabled = signal<boolean>(readStored());

  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;

  toggle(): void {
    const next = !this.enabled();
    this.enabled.set(next);
    try {
      localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      /* storage unavailable */
    }
    if (next) {
      this.success('neutral');
    }
  }

  click(theme: SoundTheme): void {
    if (!this.active()) return;
    switch (theme) {
      case 'pokemon':
        this.tone({ freq: 523, type: 'square', dur: 0.06, gain: 0.5 });
        break;
      case 'portal':
        this.tone({ freq: 392, dur: 0.1 });
        break;
      case 'ki':
        this.tone({ freq: 587, type: 'triangle', dur: 0.1 });
        break;
      default:
        this.tone({ freq: 660, dur: 0.12 });
    }
  }

  modalOpen(theme: SoundTheme): void {
    if (!this.active()) return;
    switch (theme) {
      case 'pokemon':
        this.tone({ freq: 880, type: 'square', dur: 0.07, gain: 0.45 });
        this.tone({ freq: 1319, type: 'square', dur: 0.09, gain: 0.45, start: 0.08 });
        break;
      case 'portal':
        this.tone({ freq: 200, glideTo: 600, dur: 0.35, gain: 0.8, vibrato: 5 });
        this.noise(0, 0.3);
        break;
      case 'ki': {
        const notes = [523, 659, 784, 1046];
        notes.forEach((freq, i) =>
          this.tone({ freq, type: 'triangle', dur: 0.1, gain: 0.6, start: i * 0.06 }),
        );
        break;
      }
      default:
        this.tone({ freq: 523, dur: 0.1 });
        this.tone({ freq: 784, dur: 0.12, start: 0.08 });
    }
  }

  modalClose(theme: SoundTheme): void {
    if (!this.active()) return;
    switch (theme) {
      case 'pokemon':
        this.tone({ freq: 1319, type: 'square', dur: 0.07, gain: 0.45 });
        this.tone({ freq: 880, type: 'square', dur: 0.09, gain: 0.45, start: 0.07 });
        break;
      case 'portal':
        this.tone({ freq: 600, glideTo: 180, dur: 0.3, gain: 0.8, vibrato: 5 });
        break;
      case 'ki': {
        const notes = [1046, 784, 659];
        notes.forEach((freq, i) =>
          this.tone({ freq, type: 'triangle', dur: 0.1, gain: 0.55, start: i * 0.06 }),
        );
        break;
      }
      default:
        this.tone({ freq: 784, dur: 0.08 });
        this.tone({ freq: 523, dur: 0.1, start: 0.07 });
    }
  }

  pageChange(theme: SoundTheme): void {
    if (!this.active()) return;
    switch (theme) {
      case 'pokemon':
        this.tone({ freq: 1046, type: 'square', dur: 0.06, gain: 0.4 });
        break;
      case 'portal':
        this.tone({ freq: 440, type: 'triangle', dur: 0.08 });
        break;
      case 'ki':
        this.tone({ freq: 698, type: 'triangle', dur: 0.09, gain: 0.6 });
        break;
      default:
        this.tone({ freq: 587, dur: 0.09 });
    }
  }

  chipToggle(theme: SoundTheme): void {
    if (!this.active()) return;
    switch (theme) {
      case 'pokemon':
        this.tone({ freq: 784, type: 'square', dur: 0.06, gain: 0.4 });
        break;
      case 'portal':
        this.tone({ freq: 520, glideTo: 260, dur: 0.15, gain: 0.8 });
        break;
      case 'ki':
        this.tone({ freq: 880, type: 'triangle', dur: 0.08, gain: 0.55 });
        this.tone({ freq: 1175, type: 'triangle', dur: 0.07, gain: 0.4, start: 0.06 });
        break;
      default:
        this.tone({ freq: 494, dur: 0.09 });
    }
  }

  success(theme: SoundTheme): void {
    if (!this.active()) return;
    switch (theme) {
      case 'pokemon': {
        const notes = [523, 659, 784, 1046];
        notes.forEach((freq, i) =>
          this.tone({ freq, type: 'square', dur: 0.09, gain: 0.4, start: i * 0.07 }),
        );
        break;
      }
      case 'portal':
        this.tone({ freq: 400, glideTo: 600, dur: 0.2, gain: 0.8, vibrato: 6 });
        this.tone({ freq: 600, glideTo: 850, dur: 0.22, gain: 0.7, vibrato: 6, start: 0.18 });
        break;
      case 'ki':
        this.tone({ freq: 440, glideTo: 880, dur: 0.18, gain: 0.7 });
        this.tone({ freq: 660, glideTo: 1320, dur: 0.18, gain: 0.55, start: 0.14 });
        break;
      default:
        [523, 659, 784].forEach((freq, i) =>
          this.tone({ freq, type: 'triangle', dur: 0.12, start: i * 0.09 }),
        );
    }
  }

  enter(theme: SoundTheme): void {
    if (!this.active()) return;
    switch (theme) {
      case 'pokemon':
        this.tone({ freq: 523, type: 'square', dur: 0.07, gain: 0.45 });
        this.tone({ freq: 784, type: 'square', dur: 0.1, gain: 0.45, start: 0.08 });
        break;
      case 'portal':
        this.noise(0, 0.25);
        this.tone({ freq: 240, glideTo: 700, dur: 0.3, gain: 0.75, vibrato: 5 });
        break;
      case 'ki':
        this.tone({ freq: 330, glideTo: 660, dur: 0.22, gain: 0.7 });
        this.tone({ freq: 494, glideTo: 988, dur: 0.2, gain: 0.5, start: 0.16 });
        this.noise(0, 0.18);
        break;
      default:
        this.tone({ freq: 523, dur: 0.1 });
        this.tone({ freq: 698, dur: 0.12, start: 0.08 });
    }
  }

  private active(): boolean {
    if (!this.enabled()) {
      return false;
    }
    const g = globalThis as unknown as {
      AudioContext?: typeof AudioContext;
      webkitAudioContext?: typeof AudioContext;
    };
    const Ctor = g.AudioContext ?? g.webkitAudioContext;
    if (!Ctor) {
      return false;
    }
    if (!this.ctx) {
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = MASTER_VOLUME;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return true;
  }

  private tone(opts: {
    freq: number;
    glideTo?: number;
    start?: number;
    dur?: number;
    type?: OscillatorType;
    gain?: number;
    vibrato?: number;
  }): void {
    const ctx = this.ctx!;
    const t0 = ctx.currentTime + (opts.start ?? 0);
    const dur = opts.dur ?? 0.12;

    const osc = ctx.createOscillator();
    osc.type = opts.type ?? 'sine';
    osc.frequency.setValueAtTime(opts.freq, t0);
    if (opts.glideTo) {
      osc.frequency.exponentialRampToValueAtTime(opts.glideTo, t0 + dur);
    }

    if (opts.vibrato) {
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = opts.vibrato;
      lfoGain.gain.value = opts.freq * 0.015;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(t0);
      lfo.stop(t0 + dur);
    }

    const gain = ctx.createGain();
    const peak = opts.gain ?? 1;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    osc.connect(gain);
    gain.connect(this.master!);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  private noise(start = 0, dur = 0.3): void {
    const ctx = this.ctx!;
    const t0 = ctx.currentTime + start;
    const frames = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(300, t0);
    filter.frequency.exponentialRampToValueAtTime(1400, t0 + dur);
    filter.Q.value = 1.2;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.5, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master!);
    src.start(t0);
  }
}

function readStored(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}
