// 예시 계정 2개를 만들어 글 올리기와 동료 피드백을 입력합니다. (한 번만 실행)
import { writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
const cfg = (await import('node:fs')).readFileSync('config.js','utf8');
const URL = cfg.match(/supabaseUrl:\s*"([^"]+)"/)[1], KEY = cfg.match(/supabaseAnonKey:\s*"([^"]+)"/)[1];
const CODE = (await import('node:fs')).readFileSync("seed/RUN","utf8").split("\n")[0].trim();
const tag = randomBytes(3).toString('hex');
const pw = () => randomBytes(9).toString('base64url');
async function call(path, { method = 'POST', token, body, prefer } = {}) {
  const r = await fetch(URL + path, { method, headers: { apikey: KEY, 'Content-Type': 'application/json',
    ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(prefer ? { Prefer: prefer } : {}) },
    body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  if (!r.ok) throw new Error(`${method} ${path} → ${r.status} ${t.slice(0, 300)}`);
  return t ? JSON.parse(t) : null;
}
async function signup(local, name) {
  const password = pw(); let email, d;
  for (const dom of ['example.com', 'gmail.com']) {
    email = `${local}.${tag}@${dom}`;
    try { d = await call('/auth/v1/signup', { body: { email, password } }); break; }
    catch (e) { if (!/email/i.test(e.message) || dom === 'gmail.com') throw e; console.log('retry domain:', e.message.slice(0, 120)); }
  }
  const token = d.access_token || (d.session && d.session.access_token);
  if (!token) throw new Error('세션 없음(Confirm email 켜짐?): ' + JSON.stringify(d).slice(0, 200));
  const uid = (d.user && d.user.id) || JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()).sub;
  await call('/rest/v1/rpc/join_class', { token, body: { p_name: name, p_code: CODE, p_teacher_code: null } });
  return { email, password, token, uid, name };
}
const T = [
 '생성형 AI가 확산된 이후 여러 대학이 과제 평가에 AI 탐지 프로그램을 도입하고 있다. 탐지 프로그램은 제출된 글이 AI로 작성되었을 가능성을 수치로 제시하며, 일부 교수자는 이 수치를 부정행위 판단의 근거로 활용한다. 그러나 탐지 결과는 확률적 추정에 불과하므로, 이를 평가의 근거로 삼으면 학생에게 부당한 불이익이 돌아갈 수 있다. 본 글은 대학이 과제 평가에서 AI 탐지 프로그램의 결과를 판단 근거로 사용해서는 안 된다고 주장한다.',
 '탐지 프로그램은 문장이 규칙적이고 예측 가능할수록 AI가 작성했다고 판단하는 경향이 있다. 이 때문에 모국어가 아닌 언어로 글을 쓰는 학생이나 정형화된 문체를 익힌 학생의 글이 AI 작성 글로 잘못 판정될 수 있다. 실제로 탐지 프로그램의 오판 사례는 꾸준히 보고되고 있다. 따라서 탐지 프로그램은 전혀 신뢰할 수 없는 도구이다.',
 '부정행위 판단에서 중요한 것은 학생이 실제로 부정한 방법을 사용했는지를 입증하는 일이다. 탐지 프로그램의 수치는 학생이 무엇을 했는지를 보여 주지 않으며, 학생은 자신이 AI를 사용하지 않았다는 사실을 증명할 방법이 거의 없다. 결국 탐지 결과에 의존하는 평가는 입증의 책임을 학생에게 떠넘기게 된다.',
 '나는 지난 학기 과제에서 탐지 프로그램 때문에 재제출을 요구받은 적이 있다. 직접 쓴 글이었지만 탐지 결과가 높게 나왔다는 이유였고, 그 과정에서 글쓰기에 대한 의욕을 잃었다. 이처럼 탐지 프로그램은 학생들의 글쓰기 동기를 떨어뜨린다.',
 '그러므로 대학은 AI 탐지 프로그램의 사용을 전면 중단해야 한다. 그 대신 초고 제출이나 면담처럼 과제의 작성 과정을 확인할 수 있는 방법을 활용하는 것이 바람직하다. 평가는 기계의 추정이 아니라 학생이 실제로 거친 과정에 근거해야 한다.'];
const G = [
 ['AI 탐지 결과는 추정일 뿐이므로 과제 평가의 판단 근거로 써서는 안 된다.', '서론·문제 제기', ''],
 ['탐지기는 규칙적인 문장을 AI 글로 잘못 볼 수 있어 전혀 믿을 수 없다.', '근거', '근거 제시 (왜냐하면)'],
 ['탐지 수치에 기대면 학생이 결백을 스스로 증명해야 하는 부당한 구조가 된다.', '근거', '추가 (또한)'],
 ['재제출을 겪은 경험처럼 탐지기는 학생의 글쓰기 의욕을 꺾는다.', '근거', '추가 (또한)'],
 ['대학은 탐지기 사용을 멈추고 초고나 면담으로 과정을 확인해야 한다.', '결론', '결론 도출 (따라서)']];
const A = [
 ['탐지 결과는 확률적 추정임', '없음', '추정만으로 불이익을 주는 것은 부당하다', '없음', '없음'],
 ['규칙적 문체의 학생 글이 오판될 수 있음, 오판 사례가 보고됨', '모국어가 아닌 학생, 정형화된 문체의 학생', '오판 가능성이 있으면 도구 전체를 믿을 수 없다', '없음', '없음'],
 ['수치는 학생의 행위를 보여 주지 못하고 학생은 결백을 증명하기 어려움', '없음', '입증 책임은 판단하는 쪽에 있어야 한다', '없음', '없음'],
 ['직접 쓴 글인데 재제출을 요구받고 의욕을 잃은 경험', '지난 학기 재제출 경험', '한 사람의 경험이 학생 전체에 해당한다', '없음', '없음'],
 ['2~4단락의 문제를 종합함', '초고 제출, 면담', '과정 확인이 탐지기보다 공정하다', '없음', '없음']];
const K = ['evidence', 'example', 'premise', 'counter', 'rebuttal'];
const paras = T.map((text, i) => ({ text, gist: G[i][0], role: G[i][1], rel: G[i][2], an: Object.fromEntries(K.map((k, j) => [k, A[i][j]])), changed: false }));
const dataA = { title: 'AI 탐지 프로그램을 평가 근거로 삼아서는 안 된다', author: '김민지(예시)',
  thesis: '대학은 AI 탐지 프로그램의 결과를 과제 평가의 판단 근거로 삼아서는 안 된다.', paras,
  outline: ['2단락에서 5단락으로 가는 연결이 가장 약하다. 2단락은 오판 가능성을 말했는데 결론은 탐지기 사용 자체를 멈추자고 해서 주장이 커졌다.',
            '2·3·4단락이 모두 ‘또한’으로 이어져 순서를 바꿔도 글이 된다. 근거들이 서로를 받쳐 주지 않고 나열되어 있다.',
            '가장 강한 반론은 ‘탐지기 없이 AI 부정행위를 어떻게 막느냐’이다. 이 반론은 어느 단락에서도 다루지 않았다.'],
  ai: [], aiExtra: '', applied: {}, rev: [], revLogic: '', revReason: '', reflect: ['', '', '', '', '', '', ''], status: '진행 중', intro: true, step: 5 };
const a = await signup('logicwriting.demo.a', '김민지(예시)');
const b = await signup('logicwriting.demo.b', '박준호(예시)');
const [pa] = await call('/rest/v1/projects', { token: a.token, prefer: 'return=representation', body: { owner: a.uid, class_code: CODE, data: dataA, shared: true, status: '진행 중' } });
await call('/rest/v1/projects', { token: b.token, prefer: 'return=minimal', body: { owner: b.uid, class_code: CODE, data: { title: '', author: '박준호(예시)', thesis: '', paras: [], outline: ['', '', ''], ai: [], aiExtra: '', applied: {}, rev: [], revLogic: '', revReason: '', reflect: ['', '', '', '', '', '', ''], status: '진행 중', intro: true, step: 7 }, shared: false, status: '진행 중' } });
const C = [
 [1, '실제로 탐지 프로그램의 오판 사례는 꾸준히 보고되고 있다', '근거 부족', '어디에서 보고된 사례인지 출처가 있으면 훨씬 설득력이 있을 것 같아요.'],
 [1, '따라서 탐지 프로그램은 전혀 신뢰할 수 없는 도구이다', '과잉 일반화', '오판 가능성이 있다는 것과 전혀 믿을 수 없다는 것은 다른 이야기 같아요. 얼마나 자주 틀리는지가 중요하지 않을까요?'],
 [2, '결국 탐지 결과에 의존하는 평가는 입증의 책임을 학생에게 떠넘기게 된다', '잘된 점', '이 단락이 글 전체에서 가장 설득력 있었어요.'],
 [3, '이처럼 탐지 프로그램은 학생들의 글쓰기 동기를 떨어뜨린다', '과잉 일반화', '한 번의 경험으로 학생들 전체를 말하기는 어려울 것 같아요. 다른 학생들의 경우도 있을까요?'],
 [4, '그러므로 대학은 AI 탐지 프로그램의 사용을 전면 중단해야 한다', '논제 불일치', '서론에서는 ‘평가 근거로 쓰지 말자’였는데 여기서는 ‘사용 중단’이에요. 참고용으로만 쓰는 것도 안 되나요?']];
for (const [p, quote, tag2, body] of C) {
  if (!T[p].includes(quote)) throw new Error('인용 불일치: ' + quote);
  await call('/rest/v1/comments', { token: b.token, prefer: 'return=minimal', body: { project: pa.id, author: b.uid, auto: false, p, quote, tag: tag2, body, resolved: false } });
}
const R = ['탐지 프로그램 결과로 학생을 평가하면 안 된다.', '탐지 프로그램은 오판이 있어서 믿을 수 없다.', '학생이 AI를 안 썼다는 걸 증명하기 어렵다.', '탐지 프로그램 때문에 글쓰기 의욕이 떨어진다.', '탐지 프로그램 대신 초고와 면담을 써야 한다.'];
for (let p = 0; p < R.length; p++) await call('/rest/v1/reader', { token: b.token, prefer: 'return=minimal', body: { project: pa.id, reviewer: b.uid, p, text: R[p] } });
await call('/rest/v1/feedback', { token: b.token, prefer: 'return=minimal', body: { project: pa.id, reviewer: b.uid,
  good: '3단락에서 탐지 수치가 입증 책임을 학생에게 떠넘긴다는 점을 짚은 것이 가장 설득력 있었다.',
  need: '2단락의 ‘오판 사례가 보고된다’는 출처가 없고, 4단락은 개인 경험 하나로 학생 전체를 일반화했다.',
  arrange: '2·3·4단락이 나열되어 있어서, 가장 강한 3단락을 앞에 두고 나머지를 받쳐 주는 순서가 나을 것 같다.',
  question: '탐지기를 쓰지 않으면 AI 부정행위는 어떻게 막을 수 있을까? 결론의 초고·면담이 그 답이라면 근거가 더 필요해 보인다.' } });
// 학생 A의 답글 하나
const cs = await call(`/rest/v1/comments?project=eq.${pa.id}&select=id,tag&order=created_at`, { method: 'GET', token: a.token });
await call('/rest/v1/replies', { token: a.token, prefer: 'return=minimal', body: { comment: cs[0].id, author: a.uid, body: '맞아요, 출처를 찾아보고 없으면 표현을 낮추겠습니다.' } });
const out = `A ${a.email} ${a.password}\nB ${b.email} ${b.password}\n`;
writeFileSync('seed/creds.txt', out);
console.log('완료: 계정 2개, 메모', C.length, '개, 독자 요지', R.length, '개, 종합 피드백 1개');
