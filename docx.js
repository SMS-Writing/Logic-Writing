/* 학습 기록을 진짜 Word(.docx) 파일로 만드는 도구 — 외부 라이브러리 없이 브라우저에서 만듭니다. */
const DOCX = (() => {
 const enc = new TextEncoder();
 // CRC32
 const T = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
 const crc32 = b => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = T[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
 // 압축하지 않는 ZIP
 function zip(files) {
  const parts = [], central = []; let off = 0;
  for (const [name, text] of files) {
   const nb = enc.encode(name), db = enc.encode(text), crc = crc32(db);
   const h = new DataView(new ArrayBuffer(30));
   h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
   h.setUint32(14, crc, true); h.setUint32(18, db.length, true); h.setUint32(22, db.length, true); h.setUint16(26, nb.length, true);
   parts.push(new Uint8Array(h.buffer), nb, db);
   const c = new DataView(new ArrayBuffer(46));
   c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true);
   c.setUint32(16, crc, true); c.setUint32(20, db.length, true); c.setUint32(24, db.length, true); c.setUint16(28, nb.length, true); c.setUint32(42, off, true);
   central.push(new Uint8Array(c.buffer), nb);
   off += 30 + nb.length + db.length;
  }
  const cs = central.reduce((n, a) => n + a.length, 0), e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, cs, true); e.setUint32(16, off, true);
  return new Blob([...parts, ...central, new Uint8Array(e.buffer)], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
 }
 const x = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
 // 글자 단위(run) 만들기
 function runs(node, f = {}) {
  let out = '';
  node.childNodes.forEach(n => {
   if (n.nodeType === 3) { const t = n.textContent.replace(/\s+/g, ' '); if (!t) return;
    out += `<w:r><w:rPr>${f.b ? '<w:b/>' : ''}${f.hl ? '<w:highlight w:val="yellow"/>' : ''}${f.sup ? '<w:vertAlign w:val="superscript"/>' : ''}${f.gray ? '<w:color w:val="666666"/><w:sz w:val="19"/>' : f.small ? '<w:sz w:val="19"/>' : ''}</w:rPr><w:t xml:space="preserve">${x(t)}</w:t></w:r>`; }
   else if (n.nodeType === 1) { const tg = n.tagName.toLowerCase();
    if (tg === 'br') out += '<w:r><w:br/></w:r>';
    else out += runs(n, { ...f, b: f.b || tg === 'b' || tg === 'strong' || tg === 'th', hl: f.hl || tg === 'mark', sup: f.sup || tg === 'sup', gray: f.gray || n.classList.contains('c') || n.classList.contains('hint'), small: f.small }); }
  });
  return out;
 }
 const para = (inner, style) => `<w:p>${style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : ''}${inner}</w:p>`;
 function table(t) {
  const rows = [...t.querySelectorAll('tr')], cols = Math.max(...rows.map(r => r.children.length));
  // 칸마다 글자 수를 재서 너비를 나눔 (번호 같은 짧은 칸은 좁게, 긴 글 칸은 넓게)
  const TOTAL = 9300, need = Array(cols).fill(0);
  rows.forEach(r => [...r.children].forEach((c, i) => { const L = c.textContent.trim().length; need[i] = Math.max(need[i], Math.min(L, 60)); }));
  const avg = Array(cols).fill(0); rows.forEach(r => [...r.children].forEach((c, i) => { avg[i] += Math.min(c.textContent.trim().length, 200) / rows.length; }));
  const wt = need.map((m, i) => Math.max(3, Math.sqrt(Math.max(m, 2)) * 2 + avg[i] / 6));
  const sum = wt.reduce((a, b) => a + b, 0);
  let ws = wt.map(v => Math.max(600, Math.round(TOTAL * v / sum)));
  const k = TOTAL / ws.reduce((a, b) => a + b, 0); ws = ws.map(v => Math.round(v * k));
  return `<w:tbl><w:tblPr><w:tblW w:w="${TOTAL}" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblBorders>${['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map(s => `<w:${s} w:val="single" w:sz="4" w:color="A0AEC0"/>`).join('')}</w:tblBorders><w:tblCellMar><w:left w:w="80" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr>
   <w:tblGrid>${ws.map(w => `<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid>
   ${rows.map(r => `<w:tr><w:trPr><w:cantSplit/></w:trPr>${[...r.children].map((c, i) => `<w:tc><w:tcPr><w:tcW w:w="${ws[i]}" w:type="dxa"/>${c.tagName === 'TH' ? '<w:shd w:val="clear" w:color="auto" w:fill="E9F0F7"/>' : ''}</w:tcPr><w:p><w:pPr><w:spacing w:after="0" w:line="264" w:lineRule="auto"/></w:pPr>${runs(c, { b: c.tagName === 'TH', small: true })}</w:p></w:tc>`).join('')}</w:tr>`).join('')}</w:tbl><w:p/>`;
 }
 function blocks(root) {
  let out = '';
  root.childNodes.forEach(n => {
   if (n.nodeType === 3) { if (n.textContent.trim()) out += para(runs({ childNodes: [n] })); return; }
   if (n.nodeType !== 1) return;
   const tg = n.tagName.toLowerCase();
   if (tg === 'h1') out += para(runs(n), 'Title');
   else if (tg === 'h2') out += para(runs(n), 'Heading1');
   else if (tg === 'h3' || tg === 'h4') out += para(runs(n), 'Heading2');
   else if (tg === 'table') out += table(n);
   else if (tg === 'ul' || tg === 'ol') n.querySelectorAll('li').forEach(li => out += para('<w:r><w:t xml:space="preserve">· </w:t></w:r>' + runs(li)));
   else if (tg === 'div' || tg === 'section') out += blocks(n);
   else out += para(runs(n, { gray: n.classList && n.classList.contains('c') }));
  });
  return out;
 }
 function build(html, footer) {
  const doc = new DOMParser().parseFromString(`<div id="r">${html}</div>`, 'text/html');
  const body = blocks(doc.getElementById('r')) + para(runs({ childNodes: [document.createTextNode(footer || '')] }, { gray: true }));
  const NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
  const font = '<w:rFonts w:ascii="Malgun Gothic" w:hAnsi="Malgun Gothic" w:eastAsia="맑은 고딕" w:cs="Malgun Gothic"/>';
  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles ${NS}>
   <w:docDefaults><w:rPrDefault><w:rPr>${font}<w:sz w:val="21"/><w:lang w:val="ko-KR" w:eastAsia="ko-KR"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="300" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
   <w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
   <w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:pPr><w:spacing w:after="200"/></w:pPr><w:rPr><w:b/><w:color w:val="1F4E9C"/><w:sz w:val="34"/></w:rPr></w:style>
   <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:pPr><w:keepNext/><w:spacing w:before="320" w:after="120"/><w:pBdr><w:bottom w:val="single" w:sz="6" w:color="1F4E9C"/></w:pBdr></w:pPr><w:rPr><w:b/><w:color w:val="1F4E9C"/><w:sz w:val="26"/></w:rPr></w:style>
   <w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:pPr><w:keepNext/><w:spacing w:before="200" w:after="80"/></w:pPr><w:rPr><w:b/><w:sz w:val="23"/></w:rPr></w:style>
  </w:styles>`;
  const document_ = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${NS}><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1300" w:bottom="1440" w:left="1300" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`;
  return zip([
   ['[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>'],
   ['_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'],
   ['word/_rels/document.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'],
   ['word/document.xml', document_],
   ['word/styles.xml', styles]]);
 }
 return { build };
})();
