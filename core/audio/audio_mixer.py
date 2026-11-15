#!/usr/bin/env python3
"""
GenhaLipza Clean-Room Procedural SFX & BGM Bed Mixer
- Synthesizes clean, pleasant SFX (whoosh, pop, ding, boom) and musical BGM beds
  (calm, warm, playful, dark) using NumPy — zero external copyrighted samples.
- Mixes voice + scene-transition SFX + ducked BGM into a clean 48kHz WAV ready
  for final 2-pass -16 LUFS loudnorm.
"""

import argparse
import json
import math
import subprocess
from pathlib import Path
import wave
import numpy as np

SR = 48000


def _write_wav(path: Path, samples: np.ndarray):
    s = np.clip(samples, -0.98, 0.98)
    pcm = (s * 32767.0).astype(np.int16)
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes(pcm.tobytes())


def _read_wav(path: Path) -> np.ndarray:
    with wave.open(str(path), "rb") as wf:
        frames = wf.readframes(wf.getnframes())
        arr = np.frombuffer(frames, dtype=np.int16).astype(np.float32) / 32768.0
        if wf.getnchannels() > 1:
            arr = arr.reshape(-1, wf.getnchannels()).mean(axis=1)
        return arr


def synth_sfx(kind: str) -> np.ndarray:
    rng = np.random.default_rng(42)
    if kind == "whoosh":
        dur = 0.34
        t = np.linspace(0, dur, int(SR * dur), endpoint=False)
        noise = rng.normal(0, 1, len(t)).astype(np.float32)
        # Moving bandpass-like sweep via sinusoidal modulation + gentle lowpass smoothing
        sweep = np.sin(2 * np.pi * (180 + 950 * (t / dur) ** 1.3) * t)
        env = np.sin(np.pi * (t / dur)) ** 1.6
        # Simple 1-pole smoothing for warm air whoosh
        y = np.zeros_like(t)
        acc = 0.0
        for i in range(len(t)):
            acc = 0.88 * acc + 0.12 * noise[i]
            y[i] = (0.65 * acc + 0.12 * sweep[i]) * env[i]
        return (y * 0.28).astype(np.float32)

    if kind == "pop":
        dur = 0.09
        t = np.linspace(0, dur, int(SR * dur), endpoint=False)
        freq = 320.0 + 480.0 * np.exp(-t * 45.0)
        env = np.exp(-t * 38.0) * np.minimum(1.0, t / 0.005)
        return (np.sin(2 * np.pi * freq * t) * env * 0.24).astype(np.float32)

    if kind == "ding":
        dur = 0.55
        t = np.linspace(0, dur, int(SR * dur), endpoint=False)
        env = np.exp(-t * 7.5) * np.minimum(1.0, t / 0.006)
        tone = 0.7 * np.sin(2 * np.pi * 880 * t) + 0.3 * np.sin(2 * np.pi * 1320 * t)
        return (tone * env * 0.18).astype(np.float32)

    # boom / accent
    dur = 0.45
    t = np.linspace(0, dur, int(SR * dur), endpoint=False)
    freq = 95.0 - 45.0 * (t / dur)
    env = np.exp(-t * 8.0) * np.minimum(1.0, t / 0.01)
    return (np.sin(2 * np.pi * freq * t) * env * 0.30).astype(np.float32)


def synth_bgm_bed(duration: float, mood: str = "calm") -> np.ndarray:
    n = int(round(duration * SR))
    if mood == "none" or n <= 0:
        return np.zeros(n, dtype=np.float32)
    t = np.linspace(0, duration, n, endpoint=False, dtype=np.float32)

    chords_by_mood = {
        "calm":    [(220.0, 261.63, 329.63), (174.61, 220.0, 261.63), (196.0, 246.94, 293.66), (164.81, 196.0, 246.94)],
        "warm":    [(261.63, 329.63, 392.0), (220.0, 261.63, 329.63), (174.61, 220.0, 261.63), (196.0, 246.94, 392.0)],
        "playful": [(261.63, 329.63, 392.0), (293.66, 349.23, 440.0), (220.0, 261.63, 329.63), (196.0, 293.66, 392.0)],
        "dark":    [(146.83, 174.61, 220.0), (130.81, 155.56, 196.0), (116.54, 146.83, 174.61), (110.0, 130.81, 164.81)],
    }
    chords = chords_by_mood.get(mood, chords_by_mood["calm"])
    beat_sec = 2.0 if mood in ("calm", "dark") else 1.5
    bed = np.zeros(n, dtype=np.float32)

    bar_idx = 0
    cur_t = 0.0
    while cur_t < duration:
        c = chords[bar_idx % len(chords)]
        i0 = int(round(cur_t * SR))
        i1 = min(n, int(round((cur_t + beat_sec) * SR)))
        seg_t = t[i0:i1] - cur_t
        if len(seg_t) > 0:
            env = np.minimum(1.0, seg_t / 0.18) * np.minimum(1.0, (beat_sec - seg_t) / 0.25 + 0.25)
            pad = sum(np.sin(2 * np.pi * f * seg_t) * (0.45 / len(c)) for f in c)
            # Soft marimba/pluck pulse on upbeat for playful/warm
            if mood in ("playful", "warm"):
                pluck_env = np.exp(-seg_t * 5.0)
                pad += 0.16 * np.sin(2 * np.pi * (c[2] * 2) * seg_t) * pluck_env
            bed[i0:i1] += pad * env
        cur_t += beat_sec
        bar_idx += 1

    # Gentle fade in/out
    fade_in = min(n, int(0.4 * SR))
    fade_out = min(n, int(0.8 * SR))
    if fade_in > 0:
        bed[:fade_in] *= np.linspace(0.0, 1.0, fade_in, dtype=np.float32)
    if fade_out > 0:
        bed[-fade_out:] *= np.linspace(1.0, 0.0, fade_out, dtype=np.float32)
    return (bed * 0.32).astype(np.float32)


def mix_audio(voice_wav: Path, cues_json: Path, out_wav: Path, mood: str = "calm", bgm_gain: float = 0.14):
    voice = _read_wav(voice_wav)
    n = len(voice)
    duration = n / SR
    cues = json.loads(cues_json.read_text(encoding="utf-8"))

    # Duck BGM underneath active speech
    bed = synth_bgm_bed(duration, mood=mood) * float(bgm_gain)
    abs_v = np.abs(voice)
    win = int(0.08 * SR)
    # Envelope follower via block downsample/upsample for fast ducking
    step = max(1, win // 4)
    env_blocks = np.maximum.reduceat(abs_v, np.arange(0, n, step))
    smooth_env = np.repeat(env_blocks, step)[:n]
    duck = np.where(smooth_env > 0.02, 0.45, 1.0).astype(np.float32)
    mix = voice + bed * duck

    # Place transition SFX on scene cuts (after scene 0)
    whoosh = synth_sfx("whoosh")
    pop = synth_sfx("pop")
    for idx, sc in enumerate(cues.get("scenes", [])):
        if idx > 0:
            pos = int(round(max(0.0, sc["startSec"] - 0.12) * SR))
            end = min(n, pos + len(whoosh))
            if end > pos:
                mix[pos:end] += whoosh[:end - pos] * 0.85

    # Gentle pop on first caption of each scene in pop-chips / mascot style
    for idx, cap in enumerate(cues.get("captions", [])):
        if idx % 2 == 0:
            pos = int(round(cap["startSec"] * SR))
            end = min(n, pos + len(pop))
            if end > pos:
                mix[pos:end] += pop[:end - pos] * 0.45

    _write_wav(out_wav, mix)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--voice-wav", type=Path, required=True)
    p.add_argument("--cues", type=Path, required=True)
    p.add_argument("--out-wav", type=Path, required=True)
    p.add_argument("--mood", default="calm")
    p.add_argument("--bgm-gain", type=float, default=0.14)
    args = p.parse_args()
    args.out_wav.parent.mkdir(parents=True, exist_ok=True)
    mix_audio(args.voice_wav, args.cues, args.out_wav, mood=args.mood, bgm_gain=args.bgm_gain)
    print(json.dumps({"ok": True, "outWav": str(args.out_wav), "mood": args.mood}))


if __name__ == "__main__":
    main()
