#!/usr/bin/env python3
"""
GenhaLipza Thai TTS & Alignment Adapter (Sprint 1 Overhaul)
LOCKED 2026-11-15 (Philip): production voice is ALWAYS Philip's own clone
voice (VoxCPM2, generated on Colab) fed in via Audio-In. Free TTS below is
a DEV-ONLY fallback for timing/layout tests — it must never be the voice of
a clip sent to Philip.
- Dev fallback: Edge-TTS Thai (th-TH-NiwatNeural / th-TH-PremwadeeNeural) with WordBoundary timings
- Dev fallback 2: gTTS Thai (free HTTPS) when Edge-TTS WebSocket is throttled/blocked
- Fallback 3: Clean JSON status for Audio-In mode if offline
- Synthesizes line-by-line, measures real audio durations via ffprobe,
  assembles 48kHz mono WAV with natural pacing, and emits updated scene/caption/word timings.
"""

import argparse
import asyncio
import importlib.util
import json
import os
import shutil
import ssl
import subprocess
import sys
from pathlib import Path

DEFAULT_VOICES = {
    "female": "th-TH-PremwadeeNeural",
    "male": "th-TH-NiwatNeural",
}


def check_availability() -> dict:
    has_edge_tts = importlib.util.find_spec("edge_tts") is not None
    has_gtts = importlib.util.find_spec("gtts") is not None
    return {
        "provider": "edge-tts" if has_edge_tts else ("gtts" if has_gtts else "audio-in"),
        "available": has_edge_tts or has_gtts,
        "edgeTtsAvailable": has_edge_tts,
        "gttsAvailable": has_gtts,
        "defaultVoices": DEFAULT_VOICES,
        "fallback": "audio-in",
    }


def _configure_edge_ssl():
    try:
        import edge_tts.communicate as comm
        ca = os.environ.get("SSL_CERT_FILE")
        if ca and os.path.exists(ca):
            comm._SSL_CTX = ssl.create_default_context(cafile=ca)
    except Exception:
        pass


async def _synth_edge_line(text: str, voice: str, out_mp3: Path, rate: str = "+0%") -> list:
    import edge_tts

    _configure_edge_ssl()
    proxy = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")
    communicate = edge_tts.Communicate(
        text=text, voice=voice, rate=rate, boundary="WordBoundary", proxy=proxy
    )
    boundaries = []
    with open(out_mp3, "wb") as f:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                boundaries.append({
                    "text": chunk.get("text", ""),
                    "startSec": chunk.get("offset", 0) / 10_000_000.0,
                    "endSec": (chunk.get("offset", 0) + chunk.get("duration", 0)) / 10_000_000.0,
                })
    if not out_mp3.exists() or out_mp3.stat().st_size < 256:
        raise RuntimeError("edge-tts produced empty audio")
    return boundaries


def _synth_gtts_line(text: str, out_mp3: Path, tempo: float = 1.12) -> list:
    from gtts import gTTS

    raw_mp3 = out_mp3.with_suffix(".raw.mp3")
    gTTS(text=text, lang="th").save(str(raw_mp3))
    subprocess.run(
        [
            "ffmpeg", "-y", "-i", str(raw_mp3),
            "-filter:a", f"atempo={tempo:.2f},silenceremove=start_periods=1:start_silence=0.05:start_threshold=-45dB",
            "-ar", "48000", "-ac", "1",
            str(out_mp3),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    raw_mp3.unlink(missing_ok=True)
    return []


def probe_duration(path: Path) -> float:
    out = subprocess.check_output(
        [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            str(path),
        ],
        text=True,
    ).strip()
    return float(out)


def _segment_thai_words(text: str) -> list[str]:
    """Use Node Intl.Segmenter('th') or simple fallback to keep Thai words intact."""
    try:
        res = subprocess.check_output(
            [
                "node", "-e",
                "const seg=new Intl.Segmenter('th',{granularity:'word'});"
                "const t=process.argv[1];"
                "console.log(JSON.stringify(Array.from(seg.segment(t),s=>s.segment).filter(s=>s.trim().length>0)));",
                text,
            ],
            text=True,
        )
        words = json.loads(res)
        if isinstance(words, list) and words:
            return words
    except Exception:
        pass
    return [w for w in text.split(" ") if w.strip()] or [text]


def _build_word_timings(text: str, start_sec: float, end_sec: float, boundaries: list) -> list:
    dur = max(0.3, end_sec - start_sec)
    if boundaries and len(boundaries) >= 2:
        words = []
        for b in boundaries:
            wt = b["text"]
            if not wt.strip():
                continue
            ws = start_sec + b["startSec"]
            we = min(end_sec, max(ws + 0.08, start_sec + b["endSec"]))
            words.append({"text": wt, "startSec": round(ws, 3), "endSec": round(we, 3)})
        if words:
            return words

    tokens = _segment_thai_words(text)
    total_chars = sum(max(1, len(tok.strip())) for tok in tokens)
    cur = start_sec
    words = []
    for i, tok in enumerate(tokens):
        share = max(1, len(tok.strip())) / total_chars
        w_dur = max(0.08, dur * share)
        nxt = end_sec if i == len(tokens) - 1 else min(end_sec, cur + w_dur)
        words.append({"text": tok, "startSec": round(cur, 3), "endSec": round(nxt, 3)})
        cur = nxt
    return words


def synthesize_cues(cues_path: Path, out_wav: Path, out_cues: Path, default_speaker: str = "male", rate: str = "+4%") -> dict:
    cues = json.loads(cues_path.read_text(encoding="utf-8"))
    work_dir = out_wav.parent / "_tts_lines"
    work_dir.mkdir(parents=True, exist_ok=True)

    captions = cues.get("captions", [])
    scenes = cues.get("scenes", [])
    providers_used = set()

    # Map each caption to its original scene index so scenes scale cleanly to real voice length
    cap_scene_idx = []
    for cap in captions:
        mid = (cap["startSec"] + cap["endSec"]) / 2.0
        s_idx = 0
        for idx, sc in enumerate(scenes):
            if sc["startSec"] <= mid <= sc["endSec"]:
                s_idx = idx
                break
        cap_scene_idx.append(s_idx)

    line_files = []
    new_captions = []
    cursor = 0.25  # gentle 0.25s lead-in

    for idx, cap in enumerate(captions):
        spk = cap.get("speaker")
        voice_key = "female" if spk == "B" else ("male" if spk == "A" else default_speaker)
        voice_name = DEFAULT_VOICES.get(voice_key, DEFAULT_VOICES["male"])
        spoken_text = cap.get("say") or cap["text"]
        line_mp3 = work_dir / f"line_{idx:03d}.mp3"
        line_wav = work_dir / f"line_{idx:03d}.wav"

        boundaries = []
        used = "edge-tts"
        try:
            if importlib.util.find_spec("edge_tts") is not None:
                boundaries = asyncio.run(_synth_edge_line(spoken_text, voice_name, line_mp3, rate=rate))
            else:
                raise RuntimeError("edge-tts missing")
        except Exception:
            if importlib.util.find_spec("gtts") is not None:
                used = "gtts"
                boundaries = _synth_gtts_line(spoken_text, line_mp3, tempo=1.14 if voice_key == "male" else 1.12)
            else:
                raise

        providers_used.add(used)
        # Convert to 48kHz mono PCM + trim trailing silence cleanly
        subprocess.run(
            [
                "ffmpeg", "-y", "-i", str(line_mp3),
                "-af", "aresample=48000,silenceremove=stop_periods=-1:stop_duration=0.12:stop_threshold=-45dB",
                "-ac", "1", "-c:a", "pcm_s16le",
                str(line_wav),
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        dur = probe_duration(line_wav)
        gap = 0.22 if idx < len(captions) - 1 and cap_scene_idx[idx] != cap_scene_idx[idx + 1] else 0.12
        start_s = round(cursor, 3)
        end_s = round(cursor + dur, 3)
        line_files.append((line_wav, start_s, dur))

        new_cap = dict(cap)
        new_cap["startSec"] = start_s
        new_cap["endSec"] = end_s
        new_cap["words"] = _build_word_timings(cap["text"], start_s, end_s, boundaries)
        new_captions.append(new_cap)
        cursor = end_s + gap

    total_dur = round(cursor + 0.45, 3)

    # Assemble all spoken lines onto a clean 48kHz timeline via FFmpeg adelay
    inputs = ["-f", "lavfi", "-t", str(total_dur), "-i", "anullsrc=r=48000:cl=mono"]
    filter_parts = []
    mix_labels = ["[0:a]"]
    for i, (lw, st, _) in enumerate(line_files, start=1):
        inputs.extend(["-i", str(lw)])
        delay_ms = int(round(st * 1000))
        lbl = f"[a{i}]"
        filter_parts.append(f"[{i}:a]adelay={delay_ms}|{delay_ms}{lbl}")
        mix_labels.append(lbl)

    filter_parts.append(f"{''.join(mix_labels)}amix=inputs={len(mix_labels)}:normalize=0,volume=1.0[out]")
    subprocess.run(
        ["ffmpeg", "-y", *inputs, "-filter_complex", ";".join(filter_parts), "-map", "[out]", "-c:a", "pcm_s16le", str(out_wav)],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    # Re-time scenes tightly around their captions
    new_scenes = []
    for s_idx, sc in enumerate(scenes):
        sc_copy = dict(sc)
        sc_caps = [c for c, ci in zip(new_captions, cap_scene_idx) if ci == s_idx]
        if s_idx == 0:
            sc_copy["startSec"] = 0.0
        else:
            sc_copy["startSec"] = new_scenes[-1]["endSec"]

        if s_idx == len(scenes) - 1:
            sc_copy["endSec"] = total_dur
        elif sc_caps:
            nxt_caps = [c for c, ci in zip(new_captions, cap_scene_idx) if ci == s_idx + 1]
            if nxt_caps:
                mid_cut = round((sc_caps[-1]["endSec"] + nxt_caps[0]["startSec"]) / 2.0, 3)
                sc_copy["endSec"] = max(sc_copy["startSec"] + 1.0, mid_cut)
            else:
                sc_copy["endSec"] = round(sc_caps[-1]["endSec"] + 0.25, 3)
        else:
            sc_copy["endSec"] = round(sc_copy["startSec"] + (sc["endSec"] - sc["startSec"]), 3)
        new_scenes.append(sc_copy)

    out_data = dict(cues)
    out_data["totalDurationSec"] = total_dur
    out_data["scenes"] = new_scenes
    out_data["captions"] = new_captions
    out_data["ttsProviders"] = sorted(providers_used)
    out_cues.write_text(json.dumps(out_data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    return {
        "ok": True,
        "providers": sorted(providers_used),
        "totalDurationSec": total_dur,
        "lines": len(new_captions),
        "wav": str(out_wav),
        "cues": str(out_cues),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="GenhaLipza Thai TTS Adapter")
    parser.add_argument("--check", action="store_true", help="Check TTS provider availability")
    parser.add_argument("--cues-in", type=Path, help="Input cues.json to synthesize")
    parser.add_argument("--out-wav", type=Path, help="Output assembled 48kHz voice WAV")
    parser.add_argument("--out-cues", type=Path, help="Output re-timed cues.json")
    parser.add_argument("--speaker", choices=["female", "male"], default="male")
    parser.add_argument("--rate", type=str, default="+4%")
    args = parser.parse_args()

    status = check_availability()
    if args.check:
        print(json.dumps(status, ensure_ascii=False, indent=2))
        return 0

    if not args.cues_in or not args.out_wav or not args.out_cues:
        parser.error("--cues-in, --out-wav, and --out-cues are required unless --check is set")

    if not status["available"]:
        print(json.dumps({"ok": False, **status}, ensure_ascii=False, indent=2), file=sys.stderr)
        return 2

    args.out_wav.parent.mkdir(parents=True, exist_ok=True)
    args.out_cues.parent.mkdir(parents=True, exist_ok=True)
    try:
        res = synthesize_cues(args.cues_in, args.out_wav, args.out_cues, args.speaker, args.rate)
        print(json.dumps(res, ensure_ascii=False, indent=2))
        return 0
    except Exception as exc:
        print(json.dumps({"ok": False, "error": str(exc), "fallback": "audio-in"}, ensure_ascii=False), file=sys.stderr)
        return 3


if __name__ == "__main__":
    raise SystemExit(main())
