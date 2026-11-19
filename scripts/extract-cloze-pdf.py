#!/usr/bin/env python3
"""一次性工具：把 article/完型/*.pdf 的完型填空提取成可维护的 markdown 源。

用法（需要 PyMuPDF）：
    python scripts/extract-cloze-pdf.py

产物：article/完型/完型填空_PDF提取.md
    ## 第 N 篇
    <正文，空格统一写作 ___N___>
    1. A. ... B. ... C. ... D. ...

只做排版还原，不改写原文用词；提取后仍需人工校对。
"""
import glob
import os
import re

import pymupdf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "article", "完型", "完型填空_PDF提取.md")

OPT_LINE = re.compile(r"^\s*(\d{1,2})\s*[．.、]?\s*A\s*[．.、]")
INLINE_OPT = re.compile(r"(\d{1,2})\s*[．.、]?\s*A\s*[．.、]")
# 选项片段：A. xxx / B．xxx / C、xxx；个别篇目漏了标点（“27. A everything”）
OPT_TOKEN = re.compile(r"(?<![A-Za-z])([A-D])\s*(?:[．.、)）:：]\s*|\s+)")

# PDF 原文的空格丢失/编号笔误，按篇号定点修补（重跑脚本仍可复现）
PATCHES = {
    3: [("To her, I switched", "To ___3___ her, I switched")],
    15: [("cart ___2___ sadly", "cart ___11___ sadly")],
    20: [("they have 12 and given", "they have ___12___ and given")],
}



def split_passages(text):
    parts = re.split(r"第（(\d+)）篇", text)
    out = []
    for i in range(1, len(parts), 2):
        out.append((int(parts[i]), parts[i + 1]))
    out.sort()
    return out


def find_options_start(lines, first_num):
    """选项区起点：第一个空格的编号 + A 选项所在行（有些篇目编号延续上一篇，从 21 起）"""
    for idx, line in enumerate(lines):
        m = re.match(r"^\s*(\d{1,2})\s*[．.、]?\s*A\s*[．.、\s]", line)
        if m and int(m.group(1)) == first_num:
            return idx
    for idx, line in enumerate(lines):
        if OPT_LINE.match(line):
            return idx
    return None


def parse_options(lines):
    """把选项区还原成按出现顺序排列的 [[A,B,C,D], ...]

    PDF 里题号偶有笔误（重复、错位），所以不信任题号，只信任出现顺序；
    调用方再按正文空格的升序把选项组逐一对上去。
    """
    buf = " ".join(lines)
    buf = re.sub(r"\s+", " ", buf)
    groups = []
    chunks = re.split(r"(?<![\w.])(\d{1,2})\s*[．.、]?\s*A\s*(?:[．.、]|\s)", buf)
    # chunks: [before, num, body, num, body, ...]
    for i in range(1, len(chunks) - 1, 2):
        body = "A．" + chunks[i + 1]
        marks = list(OPT_TOKEN.finditer(body))
        items = []
        for j, m in enumerate(marks):
            start = m.end()
            end = marks[j + 1].start() if j + 1 < len(marks) else len(body)
            items.append(body[start:end].strip(" ;,，。"))
        if len(items) >= 4:
            groups.append(items[:4])
    return groups


def normalize_blanks(text):
    """把各种空格写法统一成 ___N___"""
    text = text.replace("\u00a0", " ")
    # __1__ / _1_ / ___1___
    text = re.sub(r"_{1,4}\s*(\d{1,2})\s*_{0,4}", r" ___\1___ ", text)
    # 独立的数字行（PDF 里空格常常只剩一个数字）
    text = re.sub(r"(?m)^\s*(\d{1,2})\s*$", r" ___\1___ ", text)
    # “9 ______” / “10 ______”
    text = re.sub(r"(?<![\w_>])(\d{1,2})\s*_{2,}", r" ___\1___ ", text)
    # 句末裸数字：“college to 1\n” → 保守起见只在后面紧跟换行时处理（下面 join 前处理）
    text = re.sub(r"[ \t]+", " ", text)
    return text


def join_text(raw):
    lines = [l.strip() for l in raw.split("\n")]
    lines = [l for l in lines if l]
    out = []
    for line in lines:
        if not out:
            out.append(line)
            continue
        prev = out[-1]
        if prev.endswith("-") and not prev.endswith(" -"):
            # 断词连字符：life-\nsaving → life-saving
            out[-1] = prev + line
        else:
            out[-1] = prev + " " + line
    text = "\n\n".join(out)
    text = text.replace("  ", " ")
    return text.strip()


def main():
    passages = []
    for pdf in sorted(glob.glob(os.path.join(ROOT, "article", "完型", "*.pdf"))):
        doc = pymupdf.open(pdf)
        text = "\n".join(p.get_text() for p in doc)
        for num, body in split_passages(text):
            passages.append((num, body, os.path.basename(pdf)))
    passages.sort()

    report = []
    skipped = []
    out = [
        "<!-- 由 scripts/extract-cloze-pdf.py 从 article/完型/*.pdf 提取，仅做排版还原 -->",
        "",
    ]
    for num, body, src in passages:
        lines = body.split("\n")
        first_num = 1
        for l in lines:
            m = re.match(r"^\s*(\d{1,2})\s*$", l) or re.search(r"_{1,4}\s*(\d{1,2})\s*_{0,4}", l)
            if m:
                first_num = int(m.group(1))
                break
        start = find_options_start(lines, first_num)
        if start is None:
            raw_text, raw_opts = body, []
        else:
            raw_text, raw_opts = "\n".join(lines[:start]), lines[start:]
        groups = parse_options(raw_opts) if raw_opts else []

        text = normalize_blanks(raw_text)
        text = join_text(text)
        for old, new in PATCHES.get(num, []):
            if old not in text:
                print(f"  ⚠ 第 {num} 篇修补未命中：{old!r}")
            text = text.replace(old, new)

        nums = sorted({int(n) for n in re.findall(r"___(\d{1,2})___", text)})
        options = dict(zip(nums, groups))
        missing_opts = [n for n in nums if n not in options]
        extra_opts = groups[len(nums):]
        report.append((num, len(nums), len(groups), missing_opts, len(extra_opts), src))

        if not groups:
            skipped.append(num)
            continue

        out.append(f"## 第 {num} 篇")
        out.append("")
        out.append(text)
        out.append("")
        for n in nums:
            opts = options.get(n)
            if not opts:
                out.append(f"{n}. （选项缺失）")
            else:
                out.append(f"{n}. " + " ".join(f"{'ABCD'[i]}. {o}" for i, o in enumerate(opts)))
        out.append("")

    with open(OUT, "w", encoding="utf8") as f:
        f.write("\n".join(out))

    print(f"✓ 提取 {len(passages) - len(skipped)} 篇 → {os.path.relpath(OUT, ROOT)}")
    if skipped:
        print(f"  跳过（PDF 内无选项）: 第 {'、'.join(map(str, skipped))} 篇")
    for num, blanks, opts, miss, extra, src in report:
        flag = "  ⚠" if miss or extra or blanks != opts else ""
        print(
            f"  第 {num:>2} 篇  空格 {blanks:>2}  选项 {opts:>2}  缺选项 {miss or '-'}  多余 {extra or '-'}{flag}"
        )


if __name__ == "__main__":
    main()
