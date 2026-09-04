// 사이트를 만든다 — 개발자 소개(index.html)와 앱별 개인정보처리방침(HTML).
//
//   node tools/build.mjs
//
// ═══════════════════════════════════════════════════════════════════════════
// # ⚠️ 이 도구가 있는 이유
//
// 앱이 늘어날 때마다 HTML 을 손으로 고치면 **앱마다 페이지가 조금씩 달라진다.**
// 법적 고지라 **어느 앱에서 보든 같은 모양이어야 한다.**
//
// # ⇒ **새 앱을 더하는 일이 셋으로 끝난다:**
//   ① 폴더를 만든다              `앱이름/`
//   ② 처리방침 원문을 넣는다      `앱이름/privacy.md`
//   ③ `site.json` 에 한 줄 더한다
//   그리고 `node tools/build.mjs`.
//
// # ⚠️ **`app-ads.txt` 는 앱마다 만들지 않는다.** 저장소 루트에 하나뿐이고 모든 앱이 같이 쓴다 —
// 광고 회사가 **도메인 루트에서만** 그 파일을 찾기 때문이다.
//
// ⚠️ **새 패키지를 안 쓴다.** Node 기본 기능만 쓴다 — 이 저장소에 `node_modules` 를 두지 않는다.
// ═══════════════════════════════════════════════════════════════════════════

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const site = JSON.parse(fs.readFileSync(path.join(ROOT, 'site.json'), 'utf8'));

// ── 글자를 HTML 에 안전하게 넣는다 ─────────────────────────────────────
const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** 한 줄 안의 **굵게** 와 [글자](주소) 를 HTML 로 바꾼다. ⚠ 순서가 중요하다 — 먼저 escape 한다. */
function inline(text) {
  let s = esc(text);
  // 링크가 먼저다. 굵게를 먼저 처리하면 주소 안의 별표를 건드릴 수 있다.
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2">$1</a>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  return s;
}

// ═══════════════════════════════════════════════════════════════════════════
// 마크다운 → HTML. **이 문서들이 실제로 쓰는 문법만** 다룬다:
// 제목(#·##·###) · 가로선(---) · 목록(-) · 표(|) · 굵게 · 링크 · 문단.
//
// # ⚠️ **일반 마크다운 변환기가 아니다.** 쓰지 않는 문법(인용·코드블록·번호목록)은 안 다룬다 —
// **다루는 척하다 틀리는 것보다 안 다루는 편이 낫다.** 새 문법을 쓰려면 여기를 먼저 늘린다.
// ═══════════════════════════════════════════════════════════════════════════
function mdToHtml(md) {
  const lines = md.split('\n');
  const out = [];
  let i = 0;

  const flushParagraph = (buf) => {
    if (buf.length === 0) return;
    out.push('<p>' + buf.map(inline).join('<br>') + '</p>');
    buf.length = 0;
  };

  const para = [];
  while (i < lines.length) {
    const line = lines[i];

    // ── 표 ──────────────────────────────────────────────────────────────
    if (line.startsWith('|')) {
      flushParagraph(para);
      const rows = [];
      while (i < lines.length && lines[i].startsWith('|')) {
        rows.push(lines[i]);
        i += 1;
      }
      const cells = (r) =>
        r.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
      // 둘째 줄이 |---|---| 구분선이면 첫 줄이 머리다.
      const hasHead = rows.length > 1 && /^\|[\s:-]+\|/.test(rows[1]);
      const body = hasHead ? rows.slice(2) : rows;
      out.push('<table>');
      if (hasHead) {
        out.push('<thead><tr>' + cells(rows[0]).map((c) => `<th>${inline(c)}</th>`).join('') + '</tr></thead>');
      }
      out.push('<tbody>');
      for (const r of body) {
        out.push('<tr>' + cells(r).map((c) => `<td>${inline(c)}</td>`).join('') + '</tr>');
      }
      out.push('</tbody></table>');
      continue;
    }

    // ── 목록 ────────────────────────────────────────────────────────────
    if (/^- /.test(line)) {
      flushParagraph(para);
      const items = [];
      while (i < lines.length && (/^- /.test(lines[i]) || (/^\s+\S/.test(lines[i]) && items.length > 0))) {
        if (/^- /.test(lines[i])) items.push(lines[i].slice(2));
        // 들여쓴 줄은 **앞 항목의 이어지는 줄**이다.
        else items[items.length - 1] += ' ' + lines[i].trim();
        i += 1;
      }
      out.push('<ul>' + items.map((t) => `<li>${inline(t)}</li>`).join('') + '</ul>');
      continue;
    }

    // ── 제목 ────────────────────────────────────────────────────────────
    const h = line.match(/^(#{1,3}) (.*)$/);
    if (h) {
      flushParagraph(para);
      const level = h[1].length;
      out.push(`<h${level}>${inline(h[2])}</h${level}>`);
      i += 1;
      continue;
    }

    // ── 가로선 ──────────────────────────────────────────────────────────
    if (/^---+$/.test(line)) {
      flushParagraph(para);
      out.push('<hr>');
      i += 1;
      continue;
    }

    // ── 빈 줄 = 문단 끝 ─────────────────────────────────────────────────
    if (line.trim() === '') {
      flushParagraph(para);
      i += 1;
      continue;
    }

    para.push(line);
    i += 1;
  }
  flushParagraph(para);
  return out.join('\n');
}

// ═══════════════════════════════════════════════════════════════════════════
// # ⚠️ **스타일은 최소한이다. 법적 문서라 읽히는 것이 먼저다.**
//
// | | 왜 |
// |---|---|
// | 글자 **17px** | 모바일에서 확대 없이 읽히는 하한이다 |
// | 폭 **최대 42em** | 한 줄이 너무 길면 다음 줄 첫머리를 못 찾는다 |
// | **시스템 글꼴** | 웹폰트를 안 받는다 — **느린 망에서도 바로 읽힌다** |
// | 색 **거의 검정/흰색** | 대비를 최대로. **앱 톤(딥 플럼·금색)을 쓰지 않는다** |
//
// # ⚠️ **앱과 같은 톤으로 꾸미지 않는다**(사용자 지시). 브랜드 페이지가 아니라 고지문이다.
// ⚠ 어두운 화면을 쓰는 사람을 위해 `prefers-color-scheme` 만 맞춘다 — 그건 읽기 편의다.
// ═══════════════════════════════════════════════════════════════════════════
const STYLE = `
:root { color-scheme: light dark; }
* { box-sizing: border-box; }
body {
  margin: 0;
  padding: 24px 20px 72px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif;
  font-size: 17px;
  line-height: 1.75;
  color: #1a1a1a;
  background: #fff;
  word-break: keep-all;
  overflow-wrap: anywhere;
}
main { max-width: 42em; margin: 0 auto; }
h1 { font-size: 1.5em; line-height: 1.4; margin: 0 0 1.2em; }
h2 { font-size: 1.18em; line-height: 1.5; margin: 2.2em 0 0.7em; }
h3 { font-size: 1.04em; margin: 1.6em 0 0.5em; }
p { margin: 0 0 1em; }
ul { margin: 0 0 1em; padding-left: 1.3em; }
li { margin-bottom: 0.4em; }
hr { border: 0; border-top: 1px solid #ddd; margin: 2em 0; }
a { color: #0645ad; }
table { border-collapse: collapse; width: 100%; margin: 0 0 1.2em; font-size: 0.94em; }
th, td { border: 1px solid #ddd; padding: 8px 10px; text-align: left; vertical-align: top; }
th { background: #f4f4f4; }
/* 표가 좁은 화면을 밀지 않게 스스로 스크롤한다. */
.table-scroll { overflow-x: auto; }
footer { max-width: 42em; margin: 3em auto 0; padding-top: 1.5em; border-top: 1px solid #ddd; font-size: 0.9em; color: #555; }
@media (prefers-color-scheme: dark) {
  body { color: #e8e8e8; background: #16161a; }
  hr, th, td, footer { border-color: #3a3a42; }
  th { background: #24242b; }
  a { color: #8ab4f8; }
  footer { color: #a0a0a8; }
}
`.trim();

function page({ title, body, footer }) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>
${STYLE}
</style>
</head>
<body>
<main>
${body}
</main>
${footer ? `<footer>${footer}</footer>` : ''}
</body>
</html>
`;
}

/** ⚠ **UTF-8 · LF · BOM 없음**으로 쓴다. 셋 중 하나만 어긋나도 브라우저나 크롤러가 다르게 읽는다. */
function write(rel, text) {
  const full = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, Buffer.from(text.replace(/\r\n/g, '\n'), 'utf8'));
  console.log(`  ✓ ${rel}  ${fs.statSync(full).size} bytes`);
}

// ═══════════════════════════════════════════════════════════════════════════
// 앱별 처리방침
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n■ 처리방침');
for (const app of site.apps) {
  const src = path.join(ROOT, app.id, 'privacy.md');
  if (!fs.existsSync(src)) {
    console.error(`  ✗ ${app.id}/privacy.md 가 없다`);
    process.exitCode = 1;
    continue;
  }
  const md = fs.readFileSync(src, 'utf8');

  // # ⚠️ **채우지 않은 자리가 남아 있으면 여기서 멈춘다.**
  // 「[ 이름을 적으세요 ]」가 그대로 웹에 뜨는 사고를 막는 유일한 장치다.
  const left = md.split('\n').filter((l) => /\[\s/.test(l) && !/\]\(/.test(l));
  if (left.length > 0) {
    console.error(`  ✗ ${app.id}: 안 채운 자리가 ${left.length}줄 남았다`);
    left.forEach((l) => console.error(`      ${l.trim().slice(0, 70)}`));
    process.exitCode = 1;
    continue;
  }

  write(
    `${app.id}/privacy.html`,
    page({
      title: `${app.name} 개인정보처리방침`,
      body: mdToHtml(md),
      footer: `<a href="/">${esc(site.developer.name)}</a> · 문의 <a href="mailto:${esc(site.developer.email)}">${esc(site.developer.email)}</a>`,
    }),
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// index.html — 스토어 등록정보의 「개발자 웹사이트」가 될 자리
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n■ index');
const appList = site.apps
  .map(
    (a) =>
      `<li><strong>${esc(a.name)}</strong><br>` +
      `${esc(a.tagline)}<br>` +
      `<a href="/${a.id}/privacy.html">개인정보처리방침</a></li>`,
  )
  .join('\n');

write(
  'index.html',
  page({
    title: site.developer.name,
    body:
      `<h1>${esc(site.developer.name)}</h1>\n` +
      `<p>${esc(site.developer.intro)}</p>\n` +
      `<h2>앱</h2>\n<ul>\n${appList}\n</ul>`,
    footer: `문의 <a href="mailto:${esc(site.developer.email)}">${esc(site.developer.email)}</a>`,
  }),
);

console.log('\n완료.\n');
