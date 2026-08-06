// Always-on ambient soundtrack.
// Two synthesised layers (a soft evolving pad + an energetic pulse/arpeggio)
// generated with the Web Audio API — no assets, loops forever, tiny footprint.
// Browsers block audio before a user gesture, so playback arms on the first
// interaction and then persists for the whole visit.

import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, Music } from "lucide-react";
import { safeStorage } from "@/lib/safeStorage";

const KEY = "nive-ambient-sound";
const SCALE = [0, 3, 5, 7, 10, 12, 15]; // minor pentatonic-ish, always consonant
const ROOT = 138.59; // C#3

type Engine = {
  ctx: AudioContext;
  master: GainNode;
  stop: () => void;
};

function midiRatio(semitones: number) {
  return Math.pow(2, semitones / 12);
}

function createEngine(): Engine | null {
  const Ctor: typeof AudioContext | undefined =
    (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
      .AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;

  const ctx = new Ctor();
  const master = ctx.createGain();
  master.gain.value = 0;

  // Gentle master shaping so it never gets harsh.
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 4200;
  lp.Q.value = 0.4;

  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -22;
  comp.ratio.value = 6;

  master.connect(lp);
  lp.connect(comp);
  comp.connect(ctx.destination);

  // ---- Layer 1: soft pad (detuned triangle stack + slow filter drift) ----
  const padGain = ctx.createGain();
  padGain.gain.value = 0.5;
  const padFilter = ctx.createBiquadFilter();
  padFilter.type = "lowpass";
  padFilter.frequency.value = 900;
  padFilter.Q.value = 1.2;
  padGain.connect(padFilter);
  padFilter.connect(master);

  const padOscs: OscillatorNode[] = [];
  [0, 7, 12, 15].forEach((semi, i) => {
    const osc = ctx.createOscillator();
    osc.type = i % 2 === 0 ? "triangle" : "sine";
    osc.frequency.value = ROOT * midiRatio(semi) * (i === 1 ? 1.003 : 1);
    const g = ctx.createGain();
    g.gain.value = 0.16 / (i + 1);
    osc.connect(g);
    g.connect(padGain);
    osc.start();
    padOscs.push(osc);
  });

  // slow breathing movement on the pad filter
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.045;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 380;
  lfo.connect(lfoGain);
  lfoGain.connect(padFilter.frequency);
  lfo.start();

  // ---- Layer 2: energetic pulse / arpeggio ----
  const pulseBus = ctx.createGain();
  pulseBus.gain.value = 0.34;
  const delay = ctx.createDelay(1);
  delay.delayTime.value = 0.28;
  const fb = ctx.createGain();
  fb.gain.value = 0.3;
  delay.connect(fb);
  fb.connect(delay);
  pulseBus.connect(master);
  pulseBus.connect(delay);
  delay.connect(master);

  let step = 0;
  const bpm = 96;
  const stepDur = 60 / bpm / 2; // eighth notes

  const pluck = (time: number, semi: number, vel: number) => {
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = ROOT * 2 * midiRatio(semi);
    const bp = ctx.createBiquadFilter();
    bp.type = "lowpass";
    bp.frequency.setValueAtTime(2600, time);
    bp.frequency.exponentialRampToValueAtTime(700, time + 0.3);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(vel, time + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.34);
    osc.connect(bp);
    bp.connect(g);
    g.connect(pulseBus);
    osc.start(time);
    osc.stop(time + 0.4);
  };

  const kick = (time: number) => {
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(120, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.12);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.22, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.2);
    osc.connect(g);
    g.connect(master);
    osc.start(time);
    osc.stop(time + 0.24);
  };

  let nextNote = ctx.currentTime + 0.15;
  const scheduler = window.setInterval(() => {
    while (nextNote < ctx.currentTime + 0.4) {
      const s = step % 16;
      const semi = SCALE[(step * 3) % SCALE.length] + (s >= 8 ? 12 : 0);
      if (s % 2 === 0 || s === 7 || s === 13) pluck(nextNote, semi, s % 4 === 0 ? 0.14 : 0.09);
      if (s === 0 || s === 6 || s === 10) kick(nextNote);
      nextNote += stepDur;
      step++;
    }
  }, 120);

  const stop = () => {
    window.clearInterval(scheduler);
    padOscs.forEach((o) => {
      try {
        o.stop();
      } catch {
        /* already stopped */
      }
    });
    try {
      lfo.stop();
    } catch {
      /* already stopped */
    }
    void ctx.close();
  };

  return { ctx, master, stop };
}

export function AmbientAudio() {
  const engineRef = useRef<Engine | null>(null);
  const [on, setOn] = useState(false);
  const [ready, setReady] = useState(false);
  const [hint, setHint] = useState(false);

  const fade = useCallback((to: number) => {
    const e = engineRef.current;
    if (!e) return;
    const now = e.ctx.currentTime;
    e.master.gain.cancelScheduledValues(now);
    e.master.gain.setValueAtTime(Math.max(e.master.gain.value, 0.0001), now);
    e.master.gain.linearRampToValueAtTime(to, now + 1.6);
  }, []);

  const start = useCallback(() => {
    if (engineRef.current) {
      void engineRef.current.ctx.resume();
      fade(0.3);
      setOn(true);
      return;
    }
    const engine = createEngine();
    if (!engine) return;
    engineRef.current = engine;
    void engine.ctx.resume();
    fade(0.3);
    setOn(true);
    setHint(false);
  }, [fade]);

  const stop = useCallback(() => {
    fade(0);
    setOn(false);
    const e = engineRef.current;
    if (e) window.setTimeout(() => void e.ctx.suspend(), 1700);
  }, [fade]);

  // Arm on the first user gesture (autoplay policy), unless muted previously.
  useEffect(() => {
    setReady(true);
    const muted = safeStorage.getItem(KEY) === "off";
    if (muted) return;
    setHint(true);

    const arm = () => {
      start();
      window.removeEventListener("pointerdown", arm);
      window.removeEventListener("keydown", arm);
      window.removeEventListener("touchstart", arm);
      window.removeEventListener("scroll", arm);
    };
    window.addEventListener("pointerdown", arm, { once: true });
    window.addEventListener("keydown", arm, { once: true });
    window.addEventListener("touchstart", arm, { once: true });
    window.addEventListener("scroll", arm, { once: true });
    return () => {
      window.removeEventListener("pointerdown", arm);
      window.removeEventListener("keydown", arm);
      window.removeEventListener("touchstart", arm);
      window.removeEventListener("scroll", arm);
    };
  }, [start]);

  // Keep it alive across tab switches / route changes; tear down on unload.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && on) void engineRef.current?.ctx.resume();
    };
    document.addEventListener("visibilitychange", onVisible);
    const onUnload = () => engineRef.current?.stop();
    window.addEventListener("pagehide", onUnload);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pagehide", onUnload);
    };
  }, [on]);

  const toggle = () => {
    if (on) {
      safeStorage.setItem(KEY, "off");
      stop();
    } else {
      safeStorage.setItem(KEY, "on");
      start();
    }
  };

  if (!ready) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={on ? "Mute background music" : "Play background music"}
      title={on ? "Mute background music" : "Play background music"}
      className="fixed bottom-4 right-4 z-[60] inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/80 px-3 py-2 text-xs text-muted-foreground shadow-lg backdrop-blur-xl transition-colors hover:border-primary/50 hover:text-foreground"
    >
      {on ? <Volume2 className="h-4 w-4 text-primary" /> : <VolumeX className="h-4 w-4" />}
      <span className="hidden sm:inline">{on ? "Sound on" : hint ? "Tap for sound" : "Sound off"}</span>
      {on && <Music className="h-3 w-3 animate-pulse text-primary" />}
    </button>
  );
}
