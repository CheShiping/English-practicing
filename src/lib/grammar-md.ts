// 把 article/语法框架 的原始 Markdown 转成可渲染 HTML。
// 只做排版转换，不改动任何文字：标题、段落、列表、表格、:::info、粗体、
// 下划线、<font color> 高亮与 <br/> 都按原文保留。

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function fontToSpan(tag: string): string {
  const color = /color:\s*(#[0-9a-fA-F]{3,8})/.exec(tag)?.[1];
  const background = /background-color:\s*(#[0-9a-fA-F]{3,8})/.exec(tag)?.[1];
  const styles: string[] = [];
  // #262626 是笔记工具的默认正文色，去掉后跟随站点主题。
  if (color && !/^#262626$/i.test(color)) styles.push(`color:${color}`);
  if (background && !/^#ffffff$/i.test(background)) styles.push(`background-color:${background}`);
  return styles.length ? `<span style="${styles.join(';')}">` : '<span>';
}

function inline(text: string): string {
  const tokens = /(_\*\*|\*\*_|<br\s*\/?>|<\/?u>|<\/?font[^>]*>|\*\*)/gi;
  let out = '';
  let last = 0;
  let bold = false;
  let italic = false;
  let match: RegExpExecArray | null;

  while ((match = tokens.exec(text))) {
    out += escapeHtml(text.slice(last, match.index));
    const token = match[0];
    if (token === '**') {
      out += bold ? '</strong>' : '<strong>';
      bold = !bold;
    } else if (token === '_**') {
      out += '<strong><em>';
      bold = true;
      italic = true;
    } else if (token === '**_') {
      out += '</em></strong>';
      bold = false;
      italic = false;
    } else if (/^<br/i.test(token)) {
      out += '<br/>';
    } else if (/^<u>$/i.test(token)) {
      out += '<u>';
    } else if (/^<\/u>$/i.test(token)) {
      out += '</u>';
    } else if (/^<font/i.test(token)) {
      out += fontToSpan(token);
    } else {
      out += '</span>';
    }
    last = tokens.lastIndex;
  }

  out += escapeHtml(text.slice(last));
  if (italic) out += '</em>';
  if (bold) out += '</strong>';
  return out.replace(/<strong>\s*<\/strong>/g, '');
}

interface TableBlock {
  header: string[];
  rows: string[][];
}

function parseTable(lines: string[]): TableBlock {
  const cells = (line: string) =>
    line
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((cell) => cell.trim());

  const header = cells(lines[0]);
  const rows = lines
    .slice(1)
    .filter((line) => !cells(line).every((cell) => /^:?-{3,}:?$/.test(cell)))
    .map(cells);

  return { header, rows };
}

function renderTable(block: TableBlock): string {
  const head = block.header.map((cell) => `<th>${inline(cell)}</th>`).join('');
  const body = block.rows
    .map((row) => `<tr>${row.map((cell) => `<td>${inline(cell)}</td>`).join('')}</tr>`)
    .join('');
  return `<div class="grammar-md-table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

const isHeading = (line: string) => /^#{1,6}\s+/.test(line);
const isTableRow = (line: string) => /^\s*\|/.test(line);
const isListItem = (line: string) => /^\s*[-*]\s+/.test(line);
const isCallout = (line: string) => /^:::info\s*$/.test(line);

export function grammarMarkdownToHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const html: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i += 1;
      continue;
    }

    if (isCallout(line)) {
      i += 1;
      const body: string[] = [];
      while (i < lines.length && !/^:::\s*$/.test(lines[i])) {
        if (lines[i].trim()) body.push(lines[i].trim());
        i += 1;
      }
      i += 1;
      html.push(`<div class="grammar-md-callout"><p>${body.map(inline).join('<br/>')}</p></div>`);
      continue;
    }

    if (isHeading(line)) {
      const level = Math.min(line.match(/^#+/)![0].length, 4);
      html.push(`<h${level}>${inline(line.replace(/^#{1,6}\s+/, ''))}</h${level}>`);
      i += 1;
      continue;
    }

    if (isTableRow(line)) {
      const rows: string[] = [];
      while (i < lines.length && isTableRow(lines[i])) {
        rows.push(lines[i]);
        i += 1;
      }
      if (rows.length >= 2) html.push(renderTable(parseTable(rows)));
      continue;
    }

    if (isListItem(line)) {
      const items: string[] = [];
      while (i < lines.length && isListItem(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, '').trim());
        i += 1;
      }
      html.push(`<ul>${items.map((item) => `<li>${inline(item)}</li>`).join('')}</ul>`);
      continue;
    }

    const paragraph: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !isHeading(lines[i]) &&
      !isTableRow(lines[i]) &&
      !isListItem(lines[i]) &&
      !isCallout(lines[i]) &&
      !/^:::\s*$/.test(lines[i])
    ) {
      paragraph.push(lines[i].trim());
      i += 1;
    }
    html.push(`<p>${paragraph.map(inline).join('<br/>')}</p>`);
  }

  return html.join('\n');
}
