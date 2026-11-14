#!/usr/bin/env python3
"""
GenhaLipza TTS Adapter (Phase 1)
Checks edge-tts availability and synthesizes Thai multi-speaker voiceovers.
Falls back cleanly with a structured JSON status if offline or edge-tts is unavailable,
allowing the pipeline to switch to Audio-In mode without failing unexpectedly.
"""

import argparse
import asyncio
import importlib.util
import json
import sys
from pathlib import Path

DEFAULT_VOICES = {
    "female": "th-TH-PremwadeeNeural",
    "male": "th-TH-NiwatNeural",
}


def check_availability() -> dict:
    has_edge_tts = importlib.util.find_spec("edge_tts") is not None
    return {
        "provider": "edge-tts",
        "available": has_edge_tts,
        "defaultVoices": DEFAULT_VOICES,
        "fallback": "audio-in",
        "note": (
            "edge-tts is installed; network access required at synthesis time."
            if has_edge_tts
            else "edge-tts Python package not installed; use Audio-In mode or `pip install edge-tts`."
        ),
    }


async def synthesize_line(text: str, voice: str, out_mp3: Path, rate: str = "+0%") -> None:
    import edge_tts

    communicate = edge_tts.Communicate(text=text, voice=voice, rate=rate)
    await communicate.save(str(out_mp3))


def main() -> int:
    parser = argparse.ArgumentParser(description="GenhaLipza Thai TTS Adapter")
    parser.add_argument("--check", action="store_true", help="Check TTS provider availability")
    parser.add_argument("--text", type=str, help="Thai text to synthesize")
    parser.add_argument("--speaker", choices=["female", "male"], default="female")
    parser.add_argument("--rate", type=str, default="+0%")
    parser.add_argument("--out", type=Path, help="Output MP3 path")
    args = parser.parse_args()

    status = check_availability()
    if args.check:
        print(json.dumps(status, ensure_ascii=False, indent=2))
        return 0

    if not status["available"]:
        print(json.dumps({"ok": False, **status}, ensure_ascii=False, indent=2), file=sys.stderr)
        return 2

    if not args.text or not args.out:
        parser.error("--text and --out are required unless --check is specified")

    args.out.parent.mkdir(parents=True, exist_ok=True)
    voice = DEFAULT_VOICES[args.speaker]
    try:
        asyncio.run(synthesize_line(args.text, voice, args.out, args.rate))
        print(json.dumps({"ok": True, "voice": voice, "out": str(args.out)}, ensure_ascii=False))
        return 0
    except Exception as exc:
        print(
            json.dumps(
                {"ok": False, "provider": "edge-tts", "error": str(exc), "fallback": "audio-in"},
                ensure_ascii=False,
            ),
            file=sys.stderr,
        )
        return 3


if __name__ == "__main__":
    raise SystemExit(main())
