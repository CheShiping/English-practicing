#!/usr/bin/env python3
"""Build a compact offline EN->ZH dictionary from ECDICT.

Usage:
  python scripts/build-dict.py /path/to/ecdict.csv

The generated file is committed to public/dict/ecdict.json so the site works
offline and needs no server at runtime.
"""
import csv
import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "dict" / "ecdict.json"
ARTICLE_DIR = ROOT / "article"

MAX_WORDS = 26000
MAX_TRANS_CHARS = 260


def article_vocab():
    words = set()
    if not ARTICLE_DIR.exists():
        return words
    for p in ARTICLE_DIR.glob("*.md"):
        text = p.read_text(encoding="utf-8", errors="ignore")
        for w in re.findall(r"[A-Za-z][A-Za-z'’\-]*", text):
            w = w.lower().replace("’", "'").strip("'-")
            if len(w) >= 2:
                words.add(w)
    return words


def clean_translation(raw: str) -> str:
    s = (raw or "").replace("\\r\\n", "\n").replace("\\n", "\n").strip()
    lines = []
    for line in s.split("\n"):
        line = line.strip()
        if not line:
            continue
        if line.startswith("[网络]") or line.startswith("[计]") or line.startswith("[医]"):
            continue
        lines.append(line)
    s = "\n".join(lines[:4])
    if len(s) > MAX_TRANS_CHARS:
        s = s[:MAX_TRANS_CHARS].rstrip("；;，, ") + "…"
    return s


def rank_of(row):
    try:
        frq = int(row.get("frq") or 0)
    except ValueError:
        frq = 0
    try:
        bnc = int(row.get("bnc") or 0)
    except ValueError:
        bnc = 0
    candidates = [x for x in (frq, bnc) if x > 0]
    return min(candidates) if candidates else 10**9


def main():
    csv_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(os.environ.get("ECDICT_CSV", ""))
    if not csv_path.exists():
        print("ECDICT csv not found. Pass the path: python scripts/build-dict.py ecdict.csv")
        sys.exit(1)

    vocab = article_vocab()
    rows = []
    forms = {}
    with csv_path.open("r", encoding="utf-8", errors="ignore", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            word = (row.get("word") or "").strip().lower()
            if not word or len(word) < 2:
                continue
            if not re.fullmatch(r"[a-z][a-z'\-\. ]{1,40}", word):
                continue
            trans = clean_translation(row.get("translation"))
            if not trans:
                continue
            phonetic = (row.get("phonetic") or "").strip().strip("/")
            tag = (row.get("tag") or "").strip()
            rank = rank_of(row)
            must_keep = word in vocab
            if not must_keep and rank > 40000 and not tag:
                continue
            rows.append((rank, word, phonetic, trans, tag))

            exchange = (row.get("exchange") or "").strip()
            if exchange:
                # p:past/d:done/i:ing/3:third/s:plural/r:comparative/t:superlative
                for part in exchange.split("/"):
                    if ":" not in part:
                        continue
                    _, val = part.split(":", 1)
                    for form in val.split(","):
                        form = form.strip().lower()
                        if form and form != word and re.fullmatch(r"[a-z][a-z'\-]{1,40}", form):
                            forms.setdefault(form, word)

    rows.sort(key=lambda x: (x[0], x[1]))
    selected = rows[:MAX_WORDS]
    # Ensure article words are never dropped
    selected_words = {r[1] for r in selected}
    for r in rows[MAX_WORDS:]:
        if r[1] in vocab and r[1] not in selected_words:
            selected.append(r)
            selected_words.add(r[1])

    words = {}
    for rank, word, phonetic, trans, tag in selected:
        item = {
            "p": phonetic,
            "t": trans,
        }
        if tag:
            item["g"] = tag
        if rank < 10**9:
            item["f"] = rank
        words[word] = item

    # Only keep forms whose base and form are both in the dictionary
    forms = {k: v for k, v in forms.items() if k in words and v in words}

    payload = {
        "version": 1,
        "source": "ECDICT (skywind3000/ECDICT, MIT)",
        "count": len(words),
        "words": words,
        "forms": forms,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    size_mb = OUT.stat().st_size / 1024 / 1024
    print(f"✓ dictionary: {len(words)} words, {len(forms)} inflected forms, {size_mb:.2f} MB")
    missing = sorted(w for w in vocab if w not in words)
    if missing:
        print(f"  article words missing: {len(missing)} (e.g. {', '.join(missing[:12])})")


if __name__ == "__main__":
    main()
