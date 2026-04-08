class AudioEngine {
  ctx: AudioContext | null = null;
  muted = false;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  playTone(freq: number, type: OscillatorType, duration: number, vol = 0.1) {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  hitPaddle() { this.playTone(440, 'square', 0.1); }
  hitBrick() { this.playTone(880, 'square', 0.1); }
  hitIndestructible() { this.playTone(220, 'triangle', 0.1); }
  destroyBrick() { this.playTone(1200, 'square', 0.15); }
  powerUp() { this.playTone(600, 'sine', 0.3); }
  powerDown() { this.playTone(300, 'sawtooth', 0.3); }
  lifeLost() { this.playTone(150, 'sawtooth', 0.5); }
  levelClear() { this.playTone(800, 'sine', 0.5); }
  laser() { this.playTone(1500, 'square', 0.05, 0.05); }
  explosion() { this.playTone(100, 'square', 0.4, 0.2); }
}

export const audio = new AudioEngine();
