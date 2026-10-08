/** Small synthesized effects, unlocked only by a user gesture. No external audio files. */
export class GameAudio {
  private context: AudioContext | null = null;
  enabled = true;
  unlock() {
    if (!this.enabled || typeof window === "undefined") return;
    try {
      this.context ??= new AudioContext();
      void this.context.resume().catch(() => {});
    } catch { /* Audio is optional on browsers without Web Audio. */ }
  }
  tone(kind: "cue" | "success" | "failure" | "complete") {
    if (!this.enabled || !this.context || this.context.state !== "running") return;
    const ctx = this.context;
    const notes = kind === "success" ? [440, 660] : kind === "failure" ? [160, 95] : kind === "complete" ? [330, 440, 660, 880] : [520];
    notes.forEach((hz, i) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      const start = ctx.currentTime + i * .11;
      osc.type = kind === "failure" ? "sawtooth" : "sine";
      osc.frequency.value = hz;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(.055, start + .015);
      gain.gain.exponentialRampToValueAtTime(.001, start + .25);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(start); osc.stop(start + .26);
    });
  }
  close() { void this.context?.close().catch(() => {}); this.context = null; }
}
