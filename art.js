/* 논리로 고쳐 쓰기 — 직접 그린 그림 (SVG). 외부 이미지·저작물을 쓰지 않습니다. */
const ART = (() => {
 const W = '#ffffff', G = '#f5c451', GL = 'rgba(255,255,255,.22)';
 const wrap = (body, vb = '0 0 120 120') => `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
 const disc = `<circle cx="60" cy="60" r="54" fill="${GL}"/>`;
 // 단계별 그림 (진홍 배경 위, 흰 선 + 금색 포인트)
 const icons = {
  0: disc + `<path d="M22 92 C40 70 52 84 66 62 S88 44 98 30" stroke="${W}" stroke-width="5" stroke-dasharray="2 9"/>
   <circle cx="22" cy="92" r="6" fill="${W}"/><circle cx="66" cy="62" r="6" fill="${W}"/>
   <path d="M98 30 V12" stroke="${W}" stroke-width="4"/><path d="M98 12 L114 18 L98 24 Z" fill="${G}"/>`,
  1: disc + `<rect x="32" y="22" width="50" height="66" rx="7" fill="${W}"/>
   <path d="M42 50 H72 M42 60 H72 M42 70 H62" stroke="#9fb8dc" stroke-width="4"/>
   <circle cx="57" cy="35" r="7" fill="${G}"/><circle cx="57" cy="35" r="2.5" fill="#1f4e9c"/>
   <path d="M76 82 L94 64 L101 71 L83 89 L74 91 Z" fill="${G}" stroke="${W}" stroke-width="2"/>`,
  2: disc + `<path d="M22 34 H58 M22 44 H54 M22 54 H58 M22 64 H50 M22 74 H56" stroke="${W}" stroke-width="5"/>
   <path d="M64 54 H78" stroke="${W}" stroke-width="5"/><path d="M74 46 L82 54 L74 62" stroke="${W}" stroke-width="5"/>
   <rect x="86" y="48" width="18" height="12" rx="6" fill="${G}"/>`,
  3: disc + `<path d="M24 48 L60 24 L96 48 Z" fill="${G}" stroke="${W}" stroke-width="4"/>
   <path d="M38 52 V86 M60 52 V86 M82 52 V86" stroke="${W}" stroke-width="7"/>
   <path d="M26 92 H94" stroke="${W}" stroke-width="6"/>`,
  4: disc + `<circle cx="60" cy="28" r="10" fill="${G}"/>
   <path d="M60 38 V54 M60 54 H32 V66 M60 54 H88 V66 M60 54 V66" stroke="${W}" stroke-width="4"/>
   <rect x="22" y="66" width="20" height="16" rx="5" fill="${W}"/><rect x="50" y="66" width="20" height="16" rx="5" fill="${W}"/><rect x="78" y="66" width="20" height="16" rx="5" fill="${W}"/>
   <path d="M32 82 V92 M88 82 V92" stroke="${W}" stroke-width="3" stroke-dasharray="2 5"/>`,
  5: disc + `<path d="M26 30 H82 a8 8 0 0 1 8 8 V66 a8 8 0 0 1 -8 8 H52 L38 88 V74 H26 a8 8 0 0 1 -8 -8 V38 a8 8 0 0 1 8 -8 Z" fill="${W}"/>
   <path d="M47 46 a8 8 0 1 1 12 7 c-3 2 -4 3 -4 7" stroke="#1f4e9c" stroke-width="5"/><circle cx="55" cy="67" r="3" fill="#1f4e9c"/>
   <path d="M98 22 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 Z" fill="${G}"/>`,
  6: disc + `<path d="M60 22 V90 M38 92 H82" stroke="${W}" stroke-width="5"/><path d="M28 36 H92" stroke="${W}" stroke-width="5"/>
   <path d="M28 36 L18 62 H38 Z M92 36 L82 62 H102 Z" stroke="${W}" stroke-width="3"/>
   <path d="M16 62 a12 8 0 0 0 24 0 Z" fill="${G}"/><path d="M80 62 a12 8 0 0 0 24 0 Z" fill="${W}"/>
   <circle cx="60" cy="22" r="6" fill="${G}"/>`,
  7: disc + `<path d="M18 30 H66 a7 7 0 0 1 7 7 V58 a7 7 0 0 1 -7 7 H38 L26 76 V65 H18 a7 7 0 0 1 -7 -7 V37 a7 7 0 0 1 7 -7 Z" fill="${W}"/>
   <path d="M22 42 H58 M22 52 H48" stroke="#9fb8dc" stroke-width="4"/>
   <path d="M54 56 H100 a7 7 0 0 1 7 7 V82 a7 7 0 0 1 -7 7 H96 V98 L86 89 H54 a7 7 0 0 1 -7 -7 V63 a7 7 0 0 1 7 -7 Z" fill="${G}"/>
   <path d="M60 68 H96 M60 77 H84" stroke="#1f4e9c" stroke-width="4"/>`,
  9: disc + `<path d="M24 28 H86 a8 8 0 0 1 8 8 V64 a8 8 0 0 1 -8 8 H56 L40 86 V72 H24 a8 8 0 0 1 -8 -8 V36 a8 8 0 0 1 8 -8 Z" fill="${W}"/>
   <path d="M38 50 L50 62 L74 38" stroke="#1f8a5b" stroke-width="7"/>
   <path d="M100 74 a18 18 0 0 1 -26 18" stroke="${G}" stroke-width="5"/><path d="M78 84 L72 93 L82 96" stroke="${G}" stroke-width="5"/>`,
  8: disc + `<rect x="30" y="22" width="60" height="76" rx="8" fill="${W}"/><rect x="46" y="16" width="28" height="12" rx="4" fill="${G}"/>
   <path d="M40 46 l5 5 9 -10 M40 64 l5 5 9 -10 M40 82 l5 5 9 -10" stroke="#1f8a5b" stroke-width="4"/>
   <path d="M62 47 H80 M62 65 H80 M62 83 H74" stroke="#9fb8dc" stroke-width="4"/>`,
  10: disc + `<rect x="18" y="26" width="84" height="66" rx="8" fill="${W}"/>
   <path d="M18 40 H102" stroke="#cfdcef" stroke-width="2"/>
   <rect x="28" y="50" width="22" height="12" rx="3" fill="#9fb8dc"/><rect x="28" y="70" width="22" height="12" rx="3" fill="${G}"/>
   <rect x="70" y="50" width="22" height="12" rx="3" fill="${G}"/><rect x="70" y="70" width="22" height="12" rx="3" fill="#9fb8dc"/>
   <path d="M52 56 C60 56 60 76 68 76 M52 76 C60 76 60 56 68 56" stroke="#1f4e9c" stroke-width="3"/>`,
  11: disc + `<path d="M14 94 L46 46 L60 64 L76 40 L106 94 Z" fill="${W}"/>
   <path d="M76 40 V18" stroke="#232b4a" stroke-width="3"/><path d="M76 18 L92 24 L76 30 Z" fill="${G}"/>
   <path d="M38 58 L46 46 L54 56" stroke="#cfdcef" stroke-width="3"/>
   <circle cx="28" cy="28" r="9" fill="${G}"/>`,
  t: disc + `<path d="M26 92 H96" stroke="${W}" stroke-width="5"/>
   <rect x="32" y="60" width="14" height="30" rx="3" fill="${W}"/><rect x="54" y="44" width="14" height="46" rx="3" fill="${G}"/><rect x="76" y="28" width="14" height="62" rx="3" fill="${W}"/>
   <path d="M30 50 L52 34 L70 40 L96 18" stroke="${G}" stroke-width="4"/>`
 };
 const hero = k => wrap(icons[k] || icons[0]);

 // 로고
 const logo = () => wrap(`<rect width="120" height="120" rx="30" fill="#1f4e9c"/><path d="M32 38 H88 M32 58 H72 M32 78 H80" stroke="#fff" stroke-width="10"/><circle cx="88" cy="82" r="13" fill="#d9a441"/>`);

 // 세 원칙 아이콘 (밝은 배경용)
 const prin = [
  wrap(`<rect x="18" y="20" width="84" height="80" rx="14" fill="#e2ecf8"/><path d="M34 46 H86 M34 62 H74" stroke="#1f4e9c" stroke-width="7"/><path d="M68 92 L94 66 L102 74 L76 100 L64 102 Z" fill="#d9a441"/>`),
  wrap(`<rect x="18" y="22" width="84" height="76" rx="14" fill="#eef3fb"/><path d="M38 50 H82 M38 66 H66" stroke="#2b59c3" stroke-width="7"/><circle cx="84" cy="84" r="18" fill="#fff" stroke="#2b59c3" stroke-width="5"/><path d="M76 76 L92 92 M92 76 L76 92" stroke="#2f7fbf" stroke-width="5"/>`),
  wrap(`<circle cx="60" cy="60" r="44" fill="#eaf2fb"/><path d="M60 26 V92 M36 92 H84 M30 40 H90" stroke="#232b4a" stroke-width="6"/><path d="M30 40 L20 64 H40 Z M90 40 L80 64 H100 Z" stroke="#232b4a" stroke-width="3"/><path d="M18 64 a12 8 0 0 0 24 0 Z" fill="#d9a441"/><path d="M78 64 a12 8 0 0 0 24 0 Z" fill="#1f4e9c"/>`)
 ];

 // 고쳐 쓰기 여정: 진행 상황이 반영되는 오솔길
 function journey(flags, cur, labels) {
  const n = 11, Wd = 760, H = 190, pts = [];
  for (let i = 0; i < n; i++) { const x = 40 + i * (Wd - 80) / (n - 1); const y = 120 - Math.sin(i / (n - 1) * Math.PI * 1.6) * 40 - i * 4; pts.push([x, y]); }
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < n; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], mx = (x0 + x1) / 2; d += ` C${mx} ${y0} ${mx} ${y1} ${x1} ${y1}`; }
  const done = flags.slice(1).filter(Boolean).length;
  let s = `<rect x="0" y="0" width="${Wd}" height="${H}" rx="16" fill="#f4f8fc"/>
   <path d="M0 160 C120 140 220 175 360 158 S600 140 760 150 V190 H0 Z" fill="#dce7f2"/>
   <circle cx="690" cy="40" r="20" fill="#f5c451" opacity=".9"/>
   <path d="${d}" stroke="#c9d8ea" stroke-width="16" fill="none" stroke-linecap="round"/>
   <path d="${d}" stroke="#9fb4cf" stroke-width="2" fill="none" stroke-dasharray="3 9"/>`;
  pts.forEach(([x, y], i) => {
   const st = i + 1, ok = flags[st], on = st === cur;
   s += `<g><circle cx="${x}" cy="${y}" r="${on ? 15 : 12}" fill="${ok ? '#1f8a5b' : on ? '#1f4e9c' : '#ffffff'}" stroke="${ok ? '#1f8a5b' : on ? '#1f4e9c' : '#9fb4cf'}" stroke-width="2.5"/>
    <text x="${x}" y="${y + 4.5}" text-anchor="middle" font-size="12" font-weight="800" fill="${ok || on ? '#fff' : '#6b7d96'}" font-family="Pretendard Variable,sans-serif">${ok ? '✓' : st}</text>
    <text x="${x}" y="${y + (i % 2 ? -22 : 32)}" text-anchor="middle" font-size="10.5" fill="#686b7a" font-family="Pretendard Variable,sans-serif">${labels[st] || ''}</text></g>`;
  });
  const [fx, fy] = pts[n - 1];
  s += `<path d="M${fx + 22} ${fy + 6} V${fy - 34}" stroke="#232b4a" stroke-width="3"/><path d="M${fx + 22} ${fy - 34} L${fx + 42} ${fy - 27} L${fx + 22} ${fy - 20} Z" fill="${done >= 10 ? '#d9a441' : '#9fb8dc'}"/>`;
  return `<svg viewBox="0 0 ${Wd} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="학습 진행 상황: ${done}개 단계 완료">${s}</svg>`;
 }

 // 제출 축하
 const celebrate = () => wrap(`<circle cx="60" cy="60" r="54" fill="#eaf2fb"/>
  <path d="M40 30 H80 V48 a20 20 0 0 1 -40 0 Z" fill="#d9a441"/><path d="M40 36 H28 a10 10 0 0 0 12 14 M80 36 H92 a10 10 0 0 1 -12 14" stroke="#d9a441" stroke-width="5"/>
  <path d="M60 68 V82 M46 90 H74" stroke="#1f4e9c" stroke-width="7"/>
  <path d="M60 38 l3 6 7 1 -5 5 1 7 -6 -3 -6 3 1 -7 -5 -5 7 -1 Z" fill="#fff"/>
  <circle cx="22" cy="30" r="3" fill="#2f7fbf"/><circle cx="98" cy="26" r="3" fill="#2b59c3"/><circle cx="102" cy="70" r="3" fill="#1f8a5b"/><circle cx="18" cy="76" r="3" fill="#d9a441"/>
  <path d="M28 14 l2 6 M94 92 l4 4 M14 54 l6 0" stroke="#1f4e9c" stroke-width="3"/>`);

 // 로그인 화면 그림: 단락 블록이 계단처럼 쌓여 깃발로
 const welcome = () => wrap(`<ellipse cx="120" cy="132" rx="104" ry="10" fill="#dce7f2"/>
  <rect x="30" y="98" width="52" height="28" rx="6" fill="#e2ecf8"/><rect x="78" y="74" width="52" height="52" rx="6" fill="#eef3fb"/><rect x="126" y="50" width="52" height="76" rx="6" fill="#eaf2fb"/>
  <path d="M40 108 H70 M40 116 H62 M88 86 H120 M88 94 H112 M136 62 H168 M136 70 H160" stroke="#1f4e9c" stroke-width="4" stroke-linecap="round" opacity=".55"/>
  <path d="M152 50 V18" stroke="#232b4a" stroke-width="3.5"/><path d="M152 18 L176 26 L152 34 Z" fill="#1f4e9c"/>
  <circle cx="200" cy="34" r="12" fill="#d9a441"/>`, '0 0 240 144');

 return { hero, logo, prin, journey, celebrate, welcome };
})();
