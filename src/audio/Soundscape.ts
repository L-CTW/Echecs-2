export class Soundscape {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambientOsc: OscillatorNode | null = null;
  private started = false;

  async init(): Promise<void> {
    if (this.started) return;
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.35;
    this.master.connect(this.ctx.destination);
    this.started = true;
  }

  async resume(): Promise<void> {
    await this.init();
    await this.ctx?.resume();
    if (!this.ambientOsc && this.ctx && this.master) {
      this.startAmbient();
    }
  }

  private startAmbient(): void {
    if (!this.ctx || !this.master) return;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 280;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.04;
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 55;
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    osc.start();
    this.ambientOsc = osc;

    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 15;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();
  }

  playMove(): void {
    this.tone(180, 0.08, "triangle", 0.12);
    this.tone(240, 0.06, "sine", 0.08, 0.03);
  }

  playCapture(): void {
    this.noiseBurst(0.25, 800);
    this.tone(90, 0.2, "sawtooth", 0.18);
    this.tone(420, 0.05, "square", 0.1, 0.02);
    this.tone(880, 0.04, "sine", 0.15, 0.05);
  }

  playSelect(): void {
    this.tone(320, 0.04, "sine", 0.06);
  }

  playCheck(): void {
    this.tone(140, 0.15, "sawtooth", 0.14);
    this.tone(100, 0.2, "triangle", 0.1, 0.05);
  }

  private tone(freq: number, dur: number, type: OscillatorType, vol: number, delay = 0): void {
    if (!this.ctx || !this.master) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    const t = this.ctx.currentTime + delay;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  private noiseBurst(dur: number, filterFreq: number): void {
    if (!this.ctx || !this.master) return;
    const bufferSize = this.ctx.sampleRate * dur;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = filterFreq;
    const g = this.ctx.createGain();
    g.gain.value = 0.2;
    src.connect(filter);
    filter.connect(g);
    g.connect(this.master);
    src.start();
  }
}
