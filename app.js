/* 논리로 고쳐 쓰기 — 앱 본체
   서버(Supabase)가 config.js에 설정되어 있으면 공유 저장소를 쓰고,
   없으면 같은 코드로 '체험 모드'(이 브라우저에만 저장)로 동작합니다. */
'use strict';

/* ================= 상수 ================= */
const STEPS=[
 {t:'학습 안내',s:'도입',g:'시작',goal:'이 교과서의 학습 흐름과 세 가지 원칙을 이해한다.'},
 {t:'기본 정보와 본문',s:'중심 주장 세우기 · 글 올리기',g:'Ⅰ. 내 글 분석',goal:'자신의 글을 올리거나 직접 쓰고, 글 전체가 입증하려는 중심 주장을 한 문장으로 세운다.'},
 {t:'단락 요지 쓰기',s:'내 말로 한 문장 압축',g:'Ⅰ. 내 글 분석',core:true,goal:'각 단락이 독자에게 남겨야 할 주장을 자신의 말로 한 문장으로 압축하고, 단락의 역할과 앞 단락과의 관계를 밝힌다.'},
 {t:'논증 요소 분석',s:'근거·예시·전제·반론·반박',g:'Ⅰ. 내 글 분석',goal:'단락마다 요지(주장)를 떠받치는 근거·예시·전제·반론·반박을 자신의 말로 분석하고, 비어 있는 요소를 확인한다.'},
 {t:'역개요 점검',s:'요지로 본 글의 뼈대',g:'Ⅰ. 내 글 분석',goal:'요지와 논증 요소만으로 글의 현재 구조를 재구성하고, 가장 약한 연결이 어디인지 스스로 진단한다.'},
 {t:'AI에게 조언 구하기',s:'본문 없이 분석만 전송',g:'Ⅱ. 비판적 검토',goal:'본문이 아닌 자신의 분석(요지·논증 요소·역개요)만으로 AI에게 검토 질문을 받는다.'},
 {t:'AI 조언 검토',s:'수용 · 부분 수용 · 거부',g:'Ⅱ. 비판적 검토',goal:'AI의 지적을 원문과 대조해 수용·부분 수용·거부로 판단하고, 그 근거를 쓴다.'},
 {t:'동료 검토',s:'메모 · 독자 요지 · 종합 피드백',g:'Ⅱ. 비판적 검토',goal:'동료의 글에 구체적인 메모와 종합 피드백을 남기고, 각 단락이 어떻게 읽혔는지 독자 요지로 알려 준다.'},
 {t:'피드백 답변',s:'이해 · 판단 · 반영 계획',g:'Ⅱ. 비판적 검토',goal:'받은 의견마다 어떻게 이해했는지, 수용 여부와 그 이유, 수정에 어떻게 반영할지 답한다.'},
 {t:'수정개요 작성',s:'단락 이동·통합·추가·삭제',g:'Ⅲ. 고쳐 쓰기 설계',goal:'자기 점검·AI 조언·동료 피드백을 종합해, 수정 후 단락 배열과 요지로 새 글의 설계도를 만든다.'},
 {t:'학습 성찰과 제출',s:'판단 이유 정리',g:'Ⅲ. 고쳐 쓰기 설계',goal:'무엇을 왜 그렇게 고치기로 했는지 설명하고 학습 기록을 제출한다.'}
];
const ROLES=['서론·문제 제기','논제 제시','근거','예시·사례','반론','재반박','한계·조건','결론'];
const RELS=['근거 제시 (왜냐하면)','결론 도출 (따라서)','예시 (예를 들어)','대조·반론 (그러나)','추가 (또한)','구체화 (즉)','전환 (한편)'];
const AN=[['evidence','근거','요지를 뒷받침하는 이유·자료'],['example','예시','근거를 구체화하는 사례'],['premise','전제','근거→주장에 필요한 숨은 가정'],['counter','반론','예상되는 반대 의견'],['rebuttal','반박','반론에 대한 응답']];
const OPS=['유지','수정','이동','통합','분리','삭제','추가'];
const TAGS={'논리 비약':'#c0392b','근거 부족':'#d35400','과잉 일반화':'#b7791f','개념 모호':'#7d5ba6','연결 불분명':'#2c7a7b','논제 불일치':'#8b1e2d','반론 미고려':'#3a5a98','표현':'#6b6b72','잘된 점':'#2f6f4f'};
const RLABEL={author:'작성자',reviewer:'동료',teacher:'교수자',auto:'자동 점검'};
const VERD=['수용','부분 수용','거부'];
const REFQ=['단락 요지를 쓰기 가장 어려웠던 단락은 어디였고, 그 이유는 무엇이었는가?','기존 글에서 발견한 가장 큰 논리적 문제는 무엇이었는가?','주장과 근거의 관계에서 어떤 문제를 발견했는가?','필요한 전제나 반론을 새롭게 확인했는가?','AI의 조언 중 수용하거나 거부한 것은 무엇이며 그 이유는 무엇인가?','수정개요에서 가장 크게 달라진 부분은 무엇인가?','수정 후 글의 논증 구조가 어떻게 개선될 것으로 기대하는가?'];
const OUTQ=['① 요지만 이어 읽었을 때 중심 주장이 입증되었다고 느껴지나요? 가장 약한 연결은 몇 단락과 몇 단락 사이이며, 왜 약한가요?','② 두 단락의 순서를 바꿔도 글이 성립한다면, 그 두 단락의 관계는 무엇인가요?','③ 이 글에 대한 가장 강한 반론을 한 문장으로 쓰고, 그것이 어느 단락에서 다뤄지는지(혹은 다뤄지지 않는지) 쓰세요.'];
const FBQ=[['good','① 설득력 있게 구성된 부분은 무엇인가요?','잘된 점'],['need','② 근거가 더 필요한 주장은 무엇인가요?','근거가 필요한 주장'],['arrange','③ 단락 배열이나 연결에서 보완할 점은 무엇인가요?','배열·연결 보완'],['question','④ 글쓴이가 검토해 볼 질문이나 수정 제안은 무엇인가요?','검토 질문·제안']];
const CHK=['좋았던 점을 구체적으로 짚었는가?','논리적 비약이나 설명이 필요한 지점을 지적했는가?','고칠 문장을 대신 쓰지 않고, 질문이나 방향으로 제시했는가?','인신 평가가 아니라 글의 내용과 구성에 초점을 두었는가?'];
const AI_MAX=5;
const ABS=/(모든|항상|반드시|전혀|절대|누구나|무조건|완전히|결코)/;

/* ================= 상태 ================= */
const CFG=window.AIDT_CONFIG||{};
const LIVE=!!(CFG.supabaseUrl&&CFG.supabaseAnonKey&&/^https:\/\//.test(CFG.supabaseUrl))&&!/[?&]demo\b/.test(location.search);
const DKEY='aidt-demo-v3';
let db=null,ME=null,PEOPLE={},MYP=null,S=null,MY=null,VIEW=null,CUR=null,PEERS=[],MYREV={fb:new Set(),cm:new Set(),n:0},TD=null,CLASSES=[];
const UI={tab7:'doc',tab8:'memo',tabT:'rec',tpage:'dash',tclass:'',sel:null,pending:null,showResolved:false,focusC:null,auth:'login'};

/* ================= 유틸 ================= */
const $=s=>document.querySelector(s);
const uid=()=>Math.random().toString(36).slice(2,10);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').replace(/[\s.,·'"“”‘’!?()\[\]\-:;~…]/g,'');
const cut=(s,n)=>{s=String(s||'');return s.length>n?s.slice(0,n)+'…':s};
const len=s=>String(s||'').trim().length;
const none=v=>!len(v)||/^없음/.test(String(v).trim());
function grams(s){s=norm(s);const g=new Set();for(let i=0;i<s.length-1;i++)g.add(s.slice(i,i+2));return g}
function jacc(a,b){const A=grams(a),B=grams(b);if(!A.size||!B.size)return 0;let n=0;A.forEach(x=>{if(B.has(x))n++});return n/(A.size+B.size-n)}
function lcs(a,b){a=norm(a);b=norm(b);let best=0,prev=new Array(b.length+1).fill(0);for(let i=1;i<=a.length;i++){const cur=new Array(b.length+1).fill(0);for(let j=1;j<=b.length;j++){if(a[i-1]===b[j-1]){cur[j]=prev[j-1]+1;if(cur[j]>best)best=cur[j]}}prev=cur}return best}
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('show'),2800)}
function blockPaste(e,msg){e.preventDefault();toast(msg||'이 칸에는 붙여 넣기를 할 수 없습니다. 자신의 말로 직접 쓰세요.')}
const NP='onpaste="blockPaste(event)" ondrop="event.preventDefault()"';
function dl(name,content,type){const b=new Blob([content],{type});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}
const fmt=t=>{if(!t)return '';const d=new Date(t);return isNaN(d)?String(t):d.toLocaleString('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})};
const emptyAn=()=>({evidence:'',example:'',premise:'',counter:'',rebuttal:''});
function radios(name,cur,fn){return `<div class="judge">${VERD.map(v=>`<label><input type="radio" name="${name}" ${cur===v?'checked':''} onchange="${fn}('${v}')"> ${v}</label>`).join('')}</div>`}
const debouncers={};
function later(key,fn,ms=700){clearTimeout(debouncers[key]);debouncers[key]=setTimeout(fn,ms)}
async function q(p){const r=await p;if(r.error){toast('서버 오류: '+r.error.message);throw r.error}return r.data}
function flashSaved(){const s=$('#saved');if(!s)return;s.textContent='저장됨 ✓';clearTimeout(s._h);s._h=setTimeout(()=>s.textContent='',1500)}
function loadScript(src){return new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=()=>no(new Error('스크립트를 불러오지 못했습니다'));document.head.appendChild(s)})}
const nameOf=id=>(PEOPLE[id]&&PEOPLE[id].name)||'(알 수 없음)';
function roleOf(c,ownerId){if(c.auto)return 'auto';const p=PEOPLE[c.author||c.reviewer];if(p&&p.role==='teacher')return 'teacher';return (c.author||c.reviewer)===ownerId?'author':'reviewer'}

/* ================= 체험 모드 저장소 (Supabase와 같은 호출 방식) ================= */
function fakeClient(){
 let DB;try{DB=JSON.parse(localStorage.getItem(DKEY))}catch(e){}
 if(!DB||!DB.profiles)DB=seedDemo('draft');
 const persist=()=>{try{localStorage.setItem(DKEY,JSON.stringify(DB))}catch(e){}};
 const clone=x=>JSON.parse(JSON.stringify(x));
 class Q{
  constructor(t){this.t=t;this.f=[];this.op='select';this.one=false;this.maybe=false;this.ord=null}
  select(){return this}
  eq(c,v){this.f.push(r=>r[c]===v);return this}
  neq(c,v){this.f.push(r=>r[c]!==v);return this}
  in(c,a){this.f.push(r=>a.includes(r[c]));return this}
  order(c,o){this.ord=[c,(o&&o.ascending===false)?-1:1];return this}
  single(){this.one=true;return this}
  maybeSingle(){this.one=true;this.maybe=true;return this}
  insert(v){this.op='insert';this.val=v;return this}
  update(v){this.op='update';this.val=v;return this}
  upsert(v,o){this.op='upsert';this.val=v;this.conf=o&&o.onConflict?o.onConflict.split(','):['id'];return this}
  delete(){this.op='delete';return this}
  then(res){let out;try{out={data:this.run(),error:null}}catch(e){out={data:null,error:{message:e.message}}}res(out)}
  run(){
   const T=DB[this.t]||(DB[this.t]=[]);const match=r=>this.f.every(f=>f(r));let rows;
   if(this.op==='select'){rows=T.filter(match);if(this.ord){const[c,d]=this.ord;rows.sort((a,b)=>(a[c]>b[c]?1:a[c]<b[c]?-1:0)*d)}}
   else if(this.op==='insert'){rows=[].concat(this.val).map(v=>({id:uid(),created_at:new Date().toISOString(),...v}));T.push(...rows);persist()}
   else if(this.op==='update'){rows=T.filter(match);rows.forEach(r=>Object.assign(r,this.val));persist()}
   else if(this.op==='upsert'){rows=[].concat(this.val).map(v=>{const ex=T.find(r=>this.conf.every(k=>r[k]===v[k]));if(ex){Object.assign(ex,v);return ex}const n={id:uid(),created_at:new Date().toISOString(),...v};T.push(n);return n});persist()}
   else if(this.op==='delete'){rows=T.filter(match);DB[this.t]=T.filter(r=>!match(r));if(this.t==='comments'){const ids=rows.map(r=>r.id);DB.replies=DB.replies.filter(r=>!ids.includes(r.comment))}persist()}
   rows=clone(rows);
   if(this.one){if(!rows.length){if(this.maybe)return null;throw new Error('결과가 없습니다')}return rows[0]}
   return rows;
  }
 }
 return {from:t=>new Q(t),_me:()=>clone(DB.profiles.find(p=>p.id===DB.me)),_users:()=>clone(DB.profiles),_setMe:id=>{DB.me=id;persist()},_reset:k=>{const me=DB.me;DB=seedDemo(k);DB.me=me;persist()}};
}

/* ================= 시작 ================= */
async function boot(){
 try{
  if(LIVE){
   await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
   db=window.supabase.createClient(CFG.supabaseUrl,CFG.supabaseAnonKey);
   const {data:{session}}=await db.auth.getSession();
   if(!session)return showAuth('login');
   const prof=await q(db.from('profiles').select('*').eq('id',session.user.id).maybeSingle());
   if(!prof)return showAuth('join');
   ME=prof;
  }else{db=fakeClient();ME=db._me()}
  await afterLogin();
 }catch(e){$('#main').innerHTML=`<div class="notice w">불러오기 오류: ${esc(e.message||e)}</div>`}
}
function blankData(){return {title:'',author:ME?ME.name:'',thesis:'',paras:[],outline:['','',''],ai:[],aiExtra:'',applied:{},rev:[],revLogic:'',revReason:'',reflect:REFQ.map(()=>''),status:'진행 중',intro:false,step:0}}
async function afterLogin(){
 const ps=await q(db.from('profiles').select('*'));PEOPLE={};ps.forEach(p=>PEOPLE[p.id]=p);PEOPLE[ME.id]=ME;
 VIEW=null;CUR=null;UI.pending=null;
 if(ME.role==='teacher'){S=null;MYP=null;MY=null;UI.tpage='dash';await loadTeacher()}
 else{
  MYP=await q(db.from('projects').select('*').eq('owner',ME.id).maybeSingle());
  if(!MYP)MYP=await q(db.from('projects').insert({owner:ME.id,class_code:ME.class_code,data:blankData(),shared:false,status:'진행 중'}).select().single());
  S=Object.assign(blankData(),MYP.data||{});if(!S.author)S.author=ME.name;
  MY=await loadCtx(MYP.id);await loadMyReviews();
 }
 render();window.scrollTo(0,0);
}
async function loadCtx(pid){
 const [project,comments,feedback,reader]=await Promise.all([
  q(db.from('projects').select('*').eq('id',pid).single()),
  q(db.from('comments').select('*').eq('project',pid).order('created_at')),
  q(db.from('feedback').select('*').eq('project',pid).order('created_at')),
  q(db.from('reader').select('*').eq('project',pid))]);
 const ids=comments.map(c=>c.id);
 const replies=ids.length?await q(db.from('replies').select('*').in('comment',ids).order('created_at')):[];
 return {pid,project,comments,feedback,reader,replies};
}
async function loadMyReviews(){
 const fb=await q(db.from('feedback').select('*').eq('reviewer',ME.id));
 const cm=await q(db.from('comments').select('*').eq('author',ME.id));
 MYREV={fb:new Set(fb.map(f=>f.project)),cm:new Set(cm.filter(c=>c.project!==(MYP&&MYP.id)).map(c=>c.project))};
 MYREV.n=fb.length+cm.filter(c=>c.project!==(MYP&&MYP.id)).length;
}
async function reloadCtx(){
 if(!CUR)return render();
 const n=await loadCtx(CUR.pid);
 if(MY&&MY.pid===n.pid)MY=n;if(VIEW&&VIEW.pid===n.pid)VIEW=n;CUR=n;
 if(ME.role!=='teacher')await loadMyReviews();
 render();
}
function save(){
 if(!MYP)return;
 later('save',async()=>{
  const r=await db.from('projects').update({data:S,status:S.status,shared:MYP.shared,updated_at:new Date().toISOString()}).eq('id',MYP.id);
  if(r.error)toast('저장 실패: '+r.error.message);else flashSaved();
 },600);
}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&debouncers.save){clearTimeout(debouncers.save);if(MYP)db.from('projects').update({data:S,status:S.status,shared:MYP.shared,updated_at:new Date().toISOString()}).eq('id',MYP.id).then(()=>{})}});

/* ================= 로그인 (서버 모드) ================= */
function showAuth(mode){
 UI.auth=mode||UI.auth;$('#nav').innerHTML='';$('#gprog').style.display='none';
 $('#who').innerHTML=LIVE&&mode==='join'?`<button class="btn s" onclick="logout()">로그아웃</button>`:'';
 const tab=UI.auth;
 $('#main').innerHTML=`<div class="authwrap">
  <h2 style="text-align:center">논리로 고쳐 쓰기</h2><p class="hint" style="text-align:center">단락 요지 중심 논증적 글쓰기 디지털 교과서</p>
  ${tab==='join'?`<div class="card"><h3>수업 참여</h3><p class="hint">로그인은 되었지만 아직 수업에 참여하지 않았습니다.</p>${joinFields()}<button class="btn p" style="width:100%;margin-top:12px" onclick="doJoin()">수업 참여하기</button></div>`:`
  <div class="tabs"><button class="${tab==='login'?'on':''}" onclick="showAuth('login')">로그인</button><button class="${tab==='signup'?'on':''}" onclick="showAuth('signup')">처음 가입</button></div>
  <div class="card">
   <label class="f">이메일</label><input class="t" id="au_email" type="email" autocomplete="email">
   <label class="f">비밀번호${tab==='signup'?' (8자 이상)':''}</label><input class="t" id="au_pw" type="password" autocomplete="${tab==='signup'?'new-password':'current-password'}">
   ${tab==='signup'?joinFields():''}
   <button class="btn p" style="width:100%;margin-top:14px" onclick="${tab==='signup'?'doSignup()':'doLogin()'}">${tab==='signup'?'가입하고 시작하기':'로그인'}</button>
  </div>`}</div>`;
}
function joinFields(){return `<label class="f">이름 (수업에서 보일 이름)</label><input class="t" id="au_name">
 <label class="f">수업 참여 코드</label><input class="t" id="au_code" placeholder="교수자가 알려 준 코드">
 <details style="margin-top:8px"><summary class="hint">교수자이신가요?</summary><label class="f">교수자 코드</label><input class="t" id="au_tcode" placeholder="교수자만 입력"></details>`}
async function doLogin(){
 const email=$('#au_email').value.trim(),password=$('#au_pw').value;
 const {error}=await db.auth.signInWithPassword({email,password});
 if(error)return toast('로그인 실패: 이메일과 비밀번호를 확인하세요.');
 boot();
}
async function doSignup(){
 const email=$('#au_email').value.trim(),password=$('#au_pw').value;
 if(password.length<8)return toast('비밀번호는 8자 이상으로 정하세요.');
 if(!len($('#au_name').value))return toast('이름을 입력하세요.');
 if(!len($('#au_code').value)&&!len($('#au_tcode')&&$('#au_tcode').value))return toast('수업 참여 코드를 입력하세요.');
 const vals=joinVals();
 const {data,error}=await db.auth.signUp({email,password});
 if(error)return toast('가입 실패: '+error.message);
 if(!data.session)return toast('가입 확인 메일을 보냈습니다. 메일의 링크를 누른 뒤 로그인하세요.');
 await join(vals);
}
function joinVals(){return {p_name:$('#au_name').value.trim(),p_code:$('#au_code').value.trim(),p_teacher_code:($('#au_tcode')&&$('#au_tcode').value.trim())||null}}
async function doJoin(){if(!len($('#au_name').value))return toast('이름을 입력하세요.');await join(joinVals())}
async function join(v){
 const {error}=await db.rpc('join_class',v);
 if(error)return toast(error.message.includes('코드')?error.message:'참여 실패: '+error.message);
 boot();
}
async function logout(){if(LIVE)await db.auth.signOut();location.reload()}

/* ================= 상태 판정 ================= */
function gistState(p){
 const g=(p.gist||'').trim();
 if(!g)return{k:'empty',ok:false,m:'아직 요지를 쓰지 않았습니다.'};
 if(g.length<10)return{k:'short',ok:false,m:'너무 짧습니다. 주장이 드러나는 완결된 한 문장으로 쓰세요.'};
 const L=lcs(g,p.text);
 if(L>=14||(norm(g).length>=10&&L/norm(g).length>0.6))return{k:'copy',ok:false,m:`원문과 ${L}자가 연속으로 같습니다. 원문 문장을 옮기지 말고 자신의 말로 압축하세요.`};
 if(/^이\s*단락은.*(설명|소개|이야기|다룬|서술)/.test(g))return{k:'topic',ok:false,m:'‘무엇에 대해 설명한다’는 주제 소개입니다. 단락이 주장하는 내용 자체를 쓰세요.'};
 if(/[.?!]\s*\S/.test(g))return{k:'multi',ok:false,m:'두 문장 이상입니다. 한 문장으로 압축하세요. 압축되지 않는다면 단락에 주장이 둘 섞여 있다는 신호입니다.'};
 if(!p.role)return{k:'norole',ok:false,m:'요지는 좋습니다. 단락의 역할을 골라 주세요.'};
 if(p.changed)return{k:'changed',ok:false,m:'본문이 수정되었습니다. 요지가 여전히 맞는지 확인하고 다시 저장하세요.'};
 return{k:'ok',ok:true,m:'완료'};
}
const anOK=p=>AN.every(([k])=>len(p.an&&p.an[k])>=2);
const respOK=r=>r&&r.verdict&&len(r.plan)>=10;
function doneFlags(D,X,rev){
 const P=D.paras||[],pts=(D.ai||[]).filter(e=>!e.refusal).flatMap(e=>e.points);
 const need=(X?X.comments:[]).filter(c=>c.tag!=='잘된 점'),fb=X?X.feedback:[];
 return [!!D.intro,P.length>=2&&len(D.thesis)>=10,P.length>0&&P.every(p=>gistState(p).ok),P.length>0&&P.every(anOK),(D.outline||[]).every(r=>len(r)>=20),
  pts.length>0,pts.length>0&&pts.every(p=>p.verdict&&len(p.reason)>=20),rev>0,(need.length+fb.length)>0&&need.every(c=>respOK(c.resp))&&fb.every(f=>respOK(f.resp)),
  (D.rev||[]).length>=2&&D.rev.every(r=>len(r.gist)>=10||r.op==='삭제')&&len(D.revReason)>=20,D.status==='제출 완료'];
}
const stepDone=i=>!!S&&doneFlags(S,MY,MYREV.n)[i];
const pctOf=f=>Math.round(f.slice(1).filter(Boolean).length/10*100);
const gistsDone=()=>S.paras.length>0&&S.paras.every(p=>gistState(p).ok);
const anDone=()=>S.paras.length>0&&S.paras.every(anOK);
function locked(i){if(i===5)return !(gistsDone()&&anDone()&&len(S.thesis)>=10);if(i===6)return !S.ai.some(e=>!e.refusal);return false}
const lockMsg={5:'요지·논증 요소 완성 후 열림',6:'AI 질문 후 열림'};

/* ================= 상단·내비게이션 ================= */
function renderWho(){
 const rl=ME.role==='teacher'?'교수자':'학생',cls=ME.class_code?(CLASSES.find(c=>c.code===ME.class_code)||{}).name||ME.class_code:'';
 if(!LIVE){
  const us=db._users();
  $('#who').innerHTML=`<span class="demo">체험 모드</span><span class="hint">체험 계정</span><select onchange="demoSwitch(this.value)">${us.map(u=>`<option value="${u.id}" ${u.id===ME.id?'selected':''}>${esc(u.name)} (${u.role==='teacher'?'교수자':'학생'})</option>`).join('')}</select><span id="saved"></span>`;
 }else{
  $('#who').innerHTML=`<span class="chip"><b>${esc(ME.name)}</b> · ${rl}${cls?' · '+esc(cls):''}</span><button class="btn s" onclick="logout()">로그아웃</button><span id="saved"></span>`;
 }
}
async function demoSwitch(id){db._setMe(id);ME=db._me();await afterLogin()}
async function demoReset(k){if(!confirm('체험 데이터를 처음 상태로 되돌릴까요?'))return;db._reset(k);ME=db._me();await afterLogin()}
function renderNav(){
 if(ME.role==='teacher'){
  $('#gprog').style.display='none';
  $('#nav').innerHTML=`<div class="grp">교수자</div>
   <button class="stepbtn ${UI.tpage!=='classes'?'on':''}" onclick="tgo('dash')"><span class="num">★</span><span><span class="tt">학생 현황</span><br><span class="ss">진행률 · 학습 기록 · 피드백</span></span></button>
   <button class="stepbtn ${UI.tpage==='classes'?'on':''}" onclick="tgo('classes')"><span class="num">#</span><span><span class="tt">분반·참여 코드</span><br><span class="ss">분반 만들기</span></span></button>
   ${!LIVE?`<div class="tools"><button onclick="demoReset('draft')">↺ 체험 데이터: 작성 중</button><button onclick="demoReset('full')">📘 체험 데이터: 완성본</button></div>`:''}`;
  return;
 }
 let g='',h='';
 STEPS.forEach((s,i)=>{if(s.g!==g){g=s.g;h+=`<div class="grp">${g}</div>`}
  h+=`<button class="stepbtn ${S.step===i?'on':''} ${stepDone(i)?'done':''} ${locked(i)?'locked':''}" onclick="go(${i})"><span class="num">${stepDone(i)?'✓':i===0?'·':i}</span><span><span class="tt">${s.t}${s.core?'<span class="core">핵심</span>':''}</span><br><span class="ss">${locked(i)?'🔒 '+lockMsg[i]:s.s}</span></span></button>`});
 h+=`<div class="tools"><button onclick="dlPortfolio()">⬇ 학습 기록 내려받기 (.doc)</button>
  ${!LIVE?`<button onclick="demoReset('draft')">↺ 체험 데이터: 작성 중</button><button onclick="demoReset('full')">📘 체험 데이터: 모든 단계 완성본</button>`:''}</div>`;
 $('#nav').innerHTML=h;
 $('#gprog').style.display='';const p=pctOf(doneFlags(S,MY,MYREV.n));$('#gbar').style.width=p+'%';$('#gpct').textContent=p+'%';
}
async function go(n){
 if(locked(n))toast(n===5?'AI 단계는 중심 주장·모든 단락의 요지·논증 요소를 완성해야 열립니다.':'먼저 5단계에서 AI에게 질문하세요.');
 S.step=n;UI.sel=null;UI.pending=null;$('#selbtn').style.display='none';save();
 if(n===7){VIEW=null;PEERS=await q(db.from('projects').select('*').eq('shared',true).neq('owner',ME.id).order('updated_at',{ascending:false}));PEERS=PEERS.filter(p=>p.class_code===ME.class_code)}
 if(n>=8&&n<=10){MY=await loadCtx(MYP.id)}
 render();window.scrollTo(0,0);
}
function head(i,concept,open){const s=STEPS[i];return `<div class="kicker">${i?i+'단계':'도입'}${s.core?' · 이 교과서의 핵심 활동':''}</div><h2>${s.t}</h2>
 <div class="goal"><b>학습 목표</b><span>${s.goal}</span></div>${concept?`<details class="concept" ${open?'open':''}><summary>개념 익히기</summary>${concept}</details>`:''}`}
function nextBtn(i){return i<10?`<div class="row" style="margin-top:18px">${i>0?`<button class="btn" onclick="go(${i-1})">← 이전</button>`:''}<button class="btn p" onclick="go(${i+1})">다음: ${STEPS[i+1].t} →</button></div>`:''}

/* ================= 0. 안내 ================= */
function step0(){
 return head(0)+`
 <div class="card"><h3>이 교과서에서 하는 일</h3>
  <p>이미 써 둔 자신의 글을 <b>단락 요지</b>로 압축하고, 그 요지를 바탕으로 논증 구조를 분석·점검한 뒤, AI와 동료의 의견을 <b>비판적으로 검토</b>해 <b>수정개요</b>를 세웁니다. 이 교과서는 글을 대신 고쳐 주지 않습니다. 고쳐야 할 곳을 스스로 찾고, 왜 그렇게 고치는지 설명할 수 있게 돕습니다.</p>
  <div class="flow">${STEPS.slice(1).map((s,i)=>`<span class="${s.core?'k':''}">${i+1} ${s.t}</span>${i<9?'<i>→</i>':''}`).join('')}</div>
 </div>
 <div class="prin">
  <div><b>① 요지는 내 말로</b>모든 활동의 출발점은 단락마다 직접 쓴 한 문장 요지입니다. 원문 복사·붙여 넣기는 막혀 있습니다. 요지가 안 써지는 단락이 곧 고쳐야 할 단락입니다.</div>
  <div><b>② AI에게 본문은 주지 않는다</b>AI는 글 전문을 받지 않습니다. 여러분이 쓴 중심 주장·요지·논증 요소만 받고, 문장을 대신 쓰지 않으며 질문만 돌려줍니다.</div>
  <div><b>③ 판단은 내가 한다</b>AI의 지적과 동료의 의견은 모두 수용·부분 수용·거부 중 하나로 판단하고 근거를 써야 합니다. 그 판단의 기록이 수정개요가 됩니다.</div>
 </div>
 <div class="notice i" style="margin-top:14px">작업 내용은 자동으로 저장됩니다. ${LIVE?'다른 기기에서 로그인해도 이어서 작업할 수 있고, 교수자가 진행 상황을 확인합니다.':'<b>체험 모드</b>에서는 이 브라우저에만 저장됩니다. 오른쪽 위에서 체험 계정을 바꾸면 동료·교수자 화면을 볼 수 있습니다.'}</div>
 ${!LIVE?'<div class="notice a">모든 화면을 먼저 둘러보려면 왼쪽 아래 <b>‘체험 데이터: 모든 단계 완성본’</b>을 누르세요.</div>':''}
 <div class="row" style="margin-top:18px"><button class="btn p" onclick="S.intro=true;go(1)">학습 시작하기 →</button></div>`;
}

/* ================= 1. 기본 정보 ================= */
function step1(){
 const txt=S.paras.map(p=>p.text).join('\n\n');
 return head(1,`<p><b>주제</b>는 ‘무엇에 대해 쓰는가’이고, <b>중심 주장</b>은 ‘글 전체에서 입증하려는 핵심 명제’입니다. 찬반이 갈릴 수 있는 하나의 평서문이어야 합니다.</p>
 <div class="ex"><div class="bad">✗ 주제: 생성형 AI와 대학 교육</div><div class="bad">✗ 질문: 생성형 AI를 어디까지 써야 할까?</div><div class="good">✓ 중심 주장: 대학은 학습자의 사고 과정을 대신하는 생성형 AI 활용을 제한해야 한다.</div></div>`,true)+`
 <div class="card"><h3>기본 정보</h3>
  <label class="f">글 제목</label><input class="t" value="${esc(S.title)}" oninput="S.title=this.value;save()">
  <label class="f">작성자</label><input class="t" value="${esc(S.author)}" oninput="S.author=this.value;save()">
  <label class="f">중심 주장 — 글 전체에서 입증하려는 핵심 명제 한 문장</label>
  <input class="t" maxlength="100" value="${esc(S.thesis)}" placeholder="예: 대학은 ○○한 생성형 AI 활용을 제한해야 한다." oninput="S.thesis=this.value;save();renderNav();$('#thc').textContent=this.value.length" ${NP}>
  <div class="hint"><span id="thc">${(S.thesis||'').length}</span>/100자 · 본문 문장을 복사하지 말고, 글을 다 읽은 지금 시점에서 다시 써 보세요.</div>
 </div>
 <div class="card"><h3>본문</h3>
  <div class="row" style="margin-bottom:8px">
   <label class="btn">📄 파일 올리기 (.docx · .txt · .md)<input type="file" accept=".docx,.txt,.md" hidden onchange="upload(this.files[0])"></label>
   <span class="hint">또는 아래에 직접 쓰세요. 줄바꿈으로 단락을 구분합니다.</span>
  </div>
  <textarea id="body" class="t body" placeholder="여기에 글을 쓰세요. 한 단락이 끝나면 줄을 바꿉니다.">${esc(txt)}</textarea>
  <div class="row" style="margin-top:8px"><button class="btn p" onclick="applyText($('#body').value)">본문 저장 · 단락 나누기</button><span class="hint">현재 ${S.paras.length}개 단락</span></div>
  <div class="notice i">🔒 본문은 <b>AI에게 전송되지 않습니다.</b> 동료 검토에 공개하기 전까지는 교수자만 볼 수 있습니다.</div>
 </div>`+nextBtn(1);
}
function applyText(txt){
 const lines=txt.split(/\n+/).map(s=>s.trim()).filter(Boolean);
 S.paras=lines.map((t,i)=>{const o=S.paras[i];if(o){const ch=o.text!==t;return{...o,text:t,changed:o.changed||(ch&&!!o.gist)}}return{text:t,gist:'',role:'',rel:'',an:emptyAn(),changed:false}});
 save();render();toast(`${lines.length}개 단락으로 나누었습니다.`);
}
async function upload(f){if(!f)return;try{let t;if(/\.docx$/i.test(f.name))t=await readDocx(f);else t=await f.text();if(!S.title)S.title=f.name.replace(/\.[^.]+$/,'');applyText(t)}catch(e){toast('파일을 읽지 못했습니다: '+e.message)}}
async function readDocx(file){
 const u=new Uint8Array(await file.arrayBuffer()),dv=new DataView(u.buffer);
 let e=-1;for(let i=u.length-22;i>=0;i--){if(dv.getUint32(i,true)===0x06054b50){e=i;break}}
 if(e<0)throw new Error('docx 형식이 아닙니다');
 const n=dv.getUint16(e+10,true);let o=dv.getUint32(e+16,true);
 for(let k=0;k<n;k++){
  const m=dv.getUint16(o+10,true),cs=dv.getUint32(o+20,true),nl=dv.getUint16(o+28,true),xl=dv.getUint16(o+30,true),cl=dv.getUint16(o+32,true),lo=dv.getUint32(o+42,true);
  const name=new TextDecoder().decode(u.slice(o+46,o+46+nl));
  if(name==='word/document.xml'){
   const ds=lo+30+dv.getUint16(lo+26,true)+dv.getUint16(lo+28,true),raw=u.slice(ds,ds+cs);
   const xml=m===0?new TextDecoder().decode(raw):await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text();
   const d=new DOMParser().parseFromString(xml,'application/xml'),W='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
   return [...d.getElementsByTagNameNS(W,'p')].map(p=>[...p.getElementsByTagNameNS(W,'t')].map(t=>t.textContent).join('')).filter(s=>s.trim()).join('\n');
  }
  o+=46+nl+xl+cl;
 }
 throw new Error('본문을 찾지 못했습니다');
}

/* ================= 2. 요지 ================= */
function gcls(g){return g.ok?'ok':['empty','norole','changed'].includes(g.k)?'mid':'bad'}
function step2(){
 if(!S.paras.length)return head(2)+`<div class="notice w">먼저 1단계에서 본문을 올리세요.</div>`;
 const done=S.paras.filter(p=>gistState(p).ok).length;
 return head(2,`<p><b>요지</b>는 그 단락이 독자에게 남겨야 할 <b>단 하나의 주장</b>입니다. 단락 속 문장을 옮기거나 이어 붙이면 요지 쓰기가 아닙니다. 요지가 한 문장으로 써지지 않는다면, 그 단락에는 주장이 둘 이상 섞여 있거나 주장이 없는 것입니다. 그 자체가 이미 수정할 곳을 알려 주는 진단입니다.</p>
 <div class="ex"><div class="bad">✗ 이 단락은 AI가 사고에 미치는 영향을 설명한다. <span class="hint">— 주제 소개일 뿐 주장이 아님</span></div><div class="bad">✗ 글쓰기는 완성된 생각을 옮겨 적는 일이 아니라 생각을 만들어 가는 과정이다. <span class="hint">— 원문 문장 복사</span></div><div class="good">✓ AI가 초고를 쓰면 생각을 만드는 과정이 생략된다. <span class="hint">— 자신의 말로, 단락의 주장을 한 문장에</span></div></div>
 <p class="hint">규칙: ① 한 문장 ② 80자 이내 ③ 원문 복사·붙여 넣기 금지 ④ 단락의 역할과 앞 단락과의 관계 표시. 이 요지는 다음 단계의 ‘주장(소주제문)’이 되고, AI에게 전달되는 유일한 본문 정보가 됩니다.</p>`,true)+`
 <div class="row" style="justify-content:space-between"><b id="gcount">진행: ${done} / ${S.paras.length} 단락</b><span class="hint">입력하면 바로 점검됩니다</span></div>
 <div class="progress"><i id="gprog2" style="width:${done/S.paras.length*100}%"></i></div>
 ${S.paras.map((p,i)=>{const g=gistState(p);return `<div class="card"><div class="pcard">
  <div><div class="ptxt"><span class="pno">${i+1}</span>${esc(p.text)}</div></div>
  <div>
   <div class="row"><div style="flex:1"><label class="f" style="margin-top:0">단락의 역할</label><select class="t" onchange="setP(${i},'role',this.value)"><option value="">선택</option>${ROLES.map(r=>`<option ${p.role===r?'selected':''}>${r}</option>`).join('')}</select></div>
   ${i>0?`<div style="flex:1"><label class="f" style="margin-top:0">앞 단락과의 관계</label><select class="t" onchange="setP(${i},'rel',this.value)"><option value="">선택</option>${RELS.map(r=>`<option ${p.rel===r?'selected':''}>${r}</option>`).join('')}</select></div>`:''}</div>
   <label class="f">${i+1}단락의 요지 — 내 말로 한 문장</label>
   <textarea class="t" rows="3" maxlength="80" placeholder="이 단락이 독자에게 남겨야 할 주장은?" oninput="setGist(${i},this.value)" onpaste="blockPaste(event,'요지는 붙여 넣을 수 없습니다. 원문을 보지 말고 기억나는 핵심을 직접 써 보세요.')" ondrop="event.preventDefault()">${esc(p.gist)}</textarea>
   <div class="gstate ${gcls(g)}" id="gs${i}">${g.ok?'✓ ':'• '}${g.m} <span class="hint" style="float:right">${(p.gist||'').length}/80</span></div>
  </div></div></div>`}).join('')}
 <div class="notice a">💡 요지가 잘 써지지 않는 단락을 기억해 두세요. 수정개요에서 가장 먼저 다뤄야 할 곳일 가능성이 큽니다.</div>`+nextBtn(2);
}
function setP(i,k,v){S.paras[i][k]=v;save();refreshGist(i);renderNav()}
function setGist(i,v){S.paras[i].gist=v;S.paras[i].changed=false;save();refreshGist(i);renderNav()}
function refreshGist(i){const el=$('#gs'+i);if(!el)return;const p=S.paras[i],g=gistState(p);el.className='gstate '+gcls(g);el.innerHTML=`${g.ok?'✓ ':'• '}${g.m} <span class="hint" style="float:right">${(p.gist||'').length}/80</span>`;
 const done=S.paras.filter(p=>gistState(p).ok).length;$('#gprog2').style.width=(done/S.paras.length*100)+'%';$('#gcount').textContent=`진행: ${done} / ${S.paras.length} 단락`}

/* ================= 3. 논증 요소 ================= */
function step3(){
 if(!S.paras.length)return head(3)+`<div class="notice w">먼저 1·2단계를 진행하세요.</div>`;
 const done=S.paras.filter(anOK).length;
 return head(3,`<p>2단계에서 쓴 요지가 각 단락의 <b>주장(소주제문)</b>입니다. 이제 그 주장을 무엇이 떠받치는지 분석합니다.</p>
 <div class="ex"><div><b>근거</b> 주장이 옳다고 믿을 이유나 자료 · <b>예시</b> 근거를 구체화하는 사례 · <b>전제</b> 근거에서 주장으로 넘어가려면 참이어야 하는 가정(글에 쓰여 있지 않은 숨은 전제 포함) · <b>반론</b> 예상되는 반대 의견 · <b>반박</b> 반론에 대한 응답</div></div>
 <p>해당 요소가 없으면 <b>‘없음’</b>이라고 쓰세요. ‘없음’이 많은 단락, 특히 <b>전제를 찾지 못한 근거 단락</b>과 <b>반론 없는 글</b>이 다음 단계의 점검 대상입니다. 원문 문장을 옮기지 말고 요약해서 쓰세요.</p>`,true)+`
 <div class="row" style="justify-content:space-between"><b id="acount">진행: ${done} / ${S.paras.length} 단락</b></div>
 <div class="progress"><i id="aprog" style="width:${done/S.paras.length*100}%"></i></div>
 ${S.paras.map((p,i)=>`<div class="card"><div class="pcard">
  <div><div class="ptxt"><span class="pno">${i+1}</span>${esc(p.text)}</div>
   <div class="gistbox"><small>주장(요지) · ${esc(p.role||'역할 미선택')}</small>${p.gist?esc(p.gist):'<i class="hint">2단계에서 요지를 먼저 쓰세요</i>'}</div></div>
  <div>${AN.map(([k,lab,h])=>`<div class="anrow"><label>${lab}<small>${h}</small></label><div><textarea class="t" rows="${k==='premise'?2:1}" maxlength="150" placeholder="${k==='premise'?'근거가 주장으로 이어지려면 무엇이 참이어야 하나?':'내 말로 요약, 없으면 ‘없음’'}" oninput="setAn(${i},'${k}',this.value)" ${NP}>${esc(p.an[k])}</textarea><div class="warnline" id="aw${i}${k}">${anWarn(p,k)}</div></div></div>`).join('')}</div>
 </div></div>`).join('')}`+nextBtn(3);
}
function anWarn(p,k){return lcs(p.an[k]||'',p.text)>=20?'원문 문장을 옮긴 것 같습니다. 요약해서 쓰세요.':''}
function setAn(i,k,v){const p=S.paras[i];p.an=p.an||emptyAn();p.an[k]=v;save();const w=$('#aw'+i+k);if(w)w.textContent=anWarn(p,k);const done=S.paras.filter(anOK).length;$('#aprog').style.width=(done/S.paras.length*100)+'%';$('#acount').textContent=`진행: ${done} / ${S.paras.length} 단락`;renderNav()}

/* ================= 4. 역개요 ================= */
function diagnose(){
 const P=S.paras,out=[],has=r=>P.some(p=>p.role===r);
 if(!has('반론')&&!has('한계·조건')&&P.every(p=>none(p.an.counter)))out.push(['w','반론이 글 어디에도 없습니다(역할·논증 요소 모두). 반대 입장의 독자는 어디에서 설득을 멈출까요?']);
 P.forEach((p,i)=>{if(!none(p.an.counter)&&none(p.an.rebuttal))out.push(['w',`${i+1}단락: 반론은 있지만 반박이 없습니다. 반론을 인정만 하고 끝나면 오히려 중심 주장이 약해집니다.`])});
 const ev=P.filter(p=>p.role==='근거').length;
 if(ev<2)out.push(['w',`‘근거’ 역할 단락이 ${ev}개입니다. 중심 주장을 받치는 근거가 충분한지 확인하세요.`]);
 P.forEach((p,i)=>{
  if(p.role==='근거'&&none(p.an.premise))out.push(['w',`${i+1}단락: 근거 단락인데 전제를 ‘없음’으로 썼습니다. 근거에서 주장으로 넘어가는 다리가 정말 필요 없나요?`]);
  if(p.role==='근거'&&none(p.an.evidence))out.push(['w',`${i+1}단락: 근거 단락인데 근거가 비어 있습니다.`]);
  if(!none(p.an.premise)&&ABS.test(p.an.premise))out.push(['w',`${i+1}단락의 전제 “${cut(p.an.premise,40)}”는 범위가 넓습니다. 이 전제는 참입니까?`]);
  if(!none(p.an.premise)&&/(원인|인과|때문|결과)/.test(p.an.premise))out.push(['i',`${i+1}단락의 전제는 인과 관계를 가정합니다. 함께 나타나는 것(상관)과 원인이 되는 것(인과)을 구분했나요?`]);
  if(i>0&&!p.rel)out.push(['w',`${i+1}단락: 앞 단락과의 관계가 비어 있습니다.`]);
  if(ABS.test(p.gist))out.push(['w',`${i+1}단락 요지의 ‘${p.gist.match(ABS)[0]}’: 근거가 이만큼 넓은 범위를 보여 주나요? (과잉 일반화)`]);
  if(i>0&&p.rel==='결론 도출 (따라서)'&&P.slice(0,i).filter(x=>x.role==='근거').length<=1)out.push(['w',`${i+1}단락은 ‘따라서’로 이어지지만 앞선 근거가 충분하지 않을 수 있습니다.`]);
 });
 const adds=P.filter((p,i)=>i>0&&p.rel==='추가 (또한)').length;if(adds>=2)out.push(['i',`‘추가(또한)’ 관계가 ${adds}번 나옵니다. 근거를 나열만 하고 서로 받쳐 주지 않는 구조일 수 있습니다.`]);
 const last=P[P.length-1];
 if(last&&last.role!=='결론')out.push(['i','마지막 단락의 역할이 ‘결론’이 아닙니다.']);
 if(last&&S.thesis&&jacc(last.gist,S.thesis)<0.3)out.push(['w','중심 주장과 마지막 단락 요지의 표현이 많이 다릅니다. 결론이 중심 주장보다 강하거나 약해지지 않았는지 확인하세요.']);
 return out;
}
function elLine(p){return AN.filter(([k])=>k!=='evidence').map(([k,l])=>`${l}: ${none(p.an[k])?'<span style="color:#9b2c2c">없음</span>':esc(cut(p.an[k],36))}`).join(' · ')}
function step4(){
 const P=S.paras;if(!P.length)return head(4)+`<div class="notice w">먼저 1~3단계를 진행하세요.</div>`;
 const D=diagnose();
 return head(4,`<p><b>역개요</b>는 다 쓴 글이 <b>지금 실제로</b> 어떤 순서와 논리로 짜여 있는지 기록한 것입니다. 요지와 논증 요소만 뽑아 순서대로 읽으면 글의 뼈대가 드러납니다. 뼈대만으로 중심 주장이 입증되지 않는다면 문장을 아무리 다듬어도 글은 설득력을 얻지 못합니다.</p><p>아래 자동 점검은 <b>단서</b>일 뿐입니다. 진단은 여러분이 세 질문에 답하면서 내립니다.</p>`)+`
 <div class="card"><h3>요지로 본 현재 글의 뼈대</h3>
  <div class="thesis"><small>중심 주장</small>${esc(S.thesis)||'<i>1단계에서 중심 주장을 쓰세요</i>'}</div>
  ${P.map((p,i)=>`${i>0?`<div class="conn ${p.rel?'':'missing'}">↓ ${p.rel?esc(p.rel):'관계 미표시'}</div>`:''}
  <div class="node"><span class="n">${i+1}</span><div>${p.role?`<span class="badge">${esc(p.role)}</span>`:''}${p.gist?esc(p.gist):'<i class="hint">요지 미작성</i>'}<div class="el">근거: ${none(p.an.evidence)?'<span style="color:#9b2c2c">없음</span>':esc(cut(p.an.evidence,50))}<br>${elLine(p)}</div></div></div>`).join('')}
 </div>
 <div class="card"><h3>자동 점검 단서 (${D.length})</h3>
  ${D.length?`<ul class="diag">${D.map(d=>`<li>${d[0]==='w'?'⚠️':'ℹ️'} ${esc(d[1])}</li>`).join('')}</ul>`:'<p class="hint">자동으로 찾은 단서가 없습니다. 그래도 아래 질문에 답하며 직접 점검하세요.</p>'}
 </div>
 <div class="card"><h3>현재 구조 진단</h3><p class="hint">각 20자 이상. 자기 글의 약점을 먼저 찾은 사람이 AI와 동료의 의견도 잘 판단합니다.</p>
  ${OUTQ.map((q,k)=>`<label class="f">${q}</label><textarea class="t" rows="3" oninput="S.outline[${k}]=this.value;save();renderNav()" ${NP}>${esc(S.outline[k])}</textarea>`).join('')}
 </div>`+nextBtn(4);
}

/* ================= 5. AI 조언 ================= */
function payload(type,qq){
 return `[중심 주장]\n${S.thesis}\n\n[단락별 분석 — 학생이 직접 쓴 요약]\n`+S.paras.map((p,i)=>`${i+1}. (${p.role}${i>0&&p.rel?' | 앞 단락과: '+p.rel:''})\n   주장(요지): ${p.gist}\n`+AN.map(([k,l])=>`   ${l}: ${p.an[k]||'-'}`).join('\n')).join('\n')+`\n\n[학생의 현재 구조 진단]\n${S.outline.map(x=>'- '+cut(x,80)).join('\n')}\n\n[질문 유형] ${type}\n[학생 질문] ${qq||'(아직 없음)'}\n\n※ 본문은 전송되지 않습니다.`;
}
function canAsk(){if(S.ai.length>=AI_MAX)return false;const l=S.ai[S.ai.length-1];return !l||l.refusal||l.points.every(p=>p.verdict&&len(p.reason)>=20)}
function step5(){
 if(locked(5))return head(5)+`<div class="notice w">🔒 이 단계는 <b>중심 주장</b>, <b>모든 단락의 요지</b>, <b>논증 요소 분석</b>을 완성해야 열립니다. AI는 여러분의 글 전문을 받지 않고 여러분이 쓴 분석만 받기 때문에, 분석이 부실하면 AI의 조언도 부실해집니다.</div><div class="row"><button class="btn p" onclick="go(2)">2단계로</button><button class="btn" onclick="go(3)">3단계로</button></div>`;
 const left=AI_MAX-S.ai.length,ok=canAsk(),last=S.ai[S.ai.length-1];
 return head(5,`<p>AI는 <b>글 전문을 받지 않습니다</b>. 여러분이 쓴 중심 주장·요지·논증 요소·구조 진단만 받습니다. AI는 원문을 보지 못했으므로 오류를 단정하지 않고, <b>원문에서 확인할 질문</b>만 돌려줍니다. 문장을 대신 쓰거나 고쳐 달라는 요청은 거절합니다.</p>`)+`
 <div class="notice a">⚠️ 현재 버전의 AI 질문은 여러분의 분석을 규칙에 따라 점검해 만든 <b>질문 생성기</b>입니다. 실제 AI 연결은 다음 단계에서 붙일 예정이며, 같은 제한(본문 차단·대필 거부·판단 의무)이 그대로 적용됩니다.</div>
 <div class="card"><h3>AI에게 물을 질문</h3>
  <div class="row"><div style="flex:1;min-width:200px"><label class="f" style="margin-top:0">질문 유형</label><select class="t" id="aitype" onchange="$('#pl').textContent=payload(this.value,$('#aiq').value)"><option>전제</option><option>반론</option><option>연결</option><option>자유 질문</option></select></div><div class="hint" style="align-self:flex-end">남은 질문 ${left}/${AI_MAX}회</div></div>
  <label class="f">질문 (200자 이내, 붙여 넣기 불가)</label>
  <textarea class="t" id="aiq" rows="3" maxlength="200" placeholder="예: 3단락의 요지에서 중심 주장으로 가려면 어떤 전제가 필요할까?" oninput="$('#pl').textContent=payload($('#aitype').value,this.value)" onpaste="blockPaste(event,'질문은 붙여 넣을 수 없습니다. 본문 문장도 AI에 보낼 수 없습니다.')" ondrop="event.preventDefault()"></textarea>
  <label class="f">AI에게 실제로 보내지는 내용</label><div class="payload" id="pl">${esc(payload('전제',''))}</div>
  <div class="row" style="margin-top:10px"><button class="btn p" id="askbtn" ${ok?'':'disabled'} onclick="askAI()">AI에게 묻기</button>${!ok&&left>0?'<span class="hint">앞선 AI 지적을 6단계에서 모두 판단해야 다음 질문을 할 수 있습니다.</span>':''}${left<=0?'<span class="hint">질문 횟수를 모두 썼습니다.</span>':''}</div>
 </div>
 ${last?`<div class="ai"><div class="q">가장 최근 응답 · Q${S.ai.length}. [${esc(last.type)}] ${esc(last.q)}</div>${last.points.map(pt=>`<div class="pt"><div class="tx">${esc(pt.text)}</div></div>`).join('')}
  ${last.refusal?'':`<div class="row"><button class="btn p" onclick="go(6)">6단계에서 이 조언 검토하기 →</button></div>`}</div>`:''}<div class="row" style="margin-top:18px"><button class="btn" onclick="go(4)">← 이전</button></div>`;
}
function askAI(){
 const qq=$('#aiq').value.trim(),type=$('#aitype').value;
 if(qq.length<5)return toast('질문을 5자 이상 쓰세요.');
 const nq=norm(qq),nd=norm(S.paras.map(p=>p.text).join(''));
 for(let i=0;i+12<=nq.length;i++){if(nd.includes(nq.slice(i,i+12)))return toast('질문에 본문 문장이 들어 있습니다. 본문은 AI에 보낼 수 없습니다. 단락 번호로 가리켜 물어보세요.')}
 S.ai.push({id:uid(),type,q:qq,...mock(type,qq),at:new Date().toISOString()});save();render();
}
function mock(type,qq){
 if(/(고쳐|써\s*줘|써\s*주|작성해|대신|다듬|바꿔\s*줘|첨삭|윤문|요약해|만들어\s*줘|완성해)/.test(qq))return{refusal:true,points:[{text:'이 도구는 문장을 대신 쓰거나 고치거나 요약하지 않습니다. 질문을 바꿔 보세요. 예: “3단락 요지에서 중심 주장으로 가려면 어떤 전제가 필요한가?”',verdict:'',reason:''}]};
 const P=S.paras,pts=[],idx=r=>P.map((p,i)=>p.role===r?i:-1).filter(i=>i>=0);
 const ev=idx('근거'),cn=P.map((p,i)=>(p.role==='반론'||!none(p.an.counter))?i:-1).filter(i=>i>=0),cc=idx('결론');
 const counter=()=>{if(!cn.length)pts.push({p:null,text:`역할과 논증 요소 어디에도 반론이 없습니다. 중심 주장(“${cut(S.thesis,40)}”)에 반대하는 독자라면 어떤 이유를 가장 먼저 들겠습니까? 그 반론을 인정하면 주장의 범위는 넓어집니까, 좁아집니까?`});else cn.forEach(i=>{if(none(P[i].an.rebuttal))pts.push({p:i,text:`${i+1}단락에 반론(“${cut(P[i].an.counter||P[i].gist,40)}”)이 있지만 반박이 없습니다. 반론을 인정한 뒤 중심 주장을 어떻게 지킵니까?`});else pts.push({p:i,text:`${i+1}단락의 반박(“${cut(P[i].an.rebuttal,40)}”)은 사실 판단에 기대고 있습니까, 개념의 구분에 기대고 있습니까? 사실 판단이라면 그것을 뒷받침할 근거가 본문에 있습니까?`})})};
 const premise=()=>{(ev.length?ev:[Math.min(1,P.length-1)]).slice(0,2).forEach(i=>{const p=P[i];if(!p)return;if(none(p.an.premise))pts.push({p:i,text:`${i+1}단락의 전제를 ‘없음’으로 썼습니다. 근거(“${cut(p.an.evidence,35)}”)에서 요지(“${cut(p.gist,35)}”)로 넘어가려면 어떤 가정이 참이어야 합니까? 원문에서 그 가정을 정당화했는지 확인하세요.`});else pts.push({p:i,text:`${i+1}단락에 적은 전제 “${cut(p.an.premise,45)}”는 참입니까? 이 전제가 성립하지 않는 경우를 하나 떠올릴 수 있다면, 본문에서 전제를 따로 정당화해야 합니다.`})})};
 const link=()=>{P.forEach((p,i)=>{if(i>0&&p.rel==='결론 도출 (따라서)'){const b=P.slice(0,i).filter(x=>x.role==='근거').length;if(b<=1)pts.push({p:i,text:`${i+1}단락은 ‘따라서’로 앞 내용을 받지만 앞에 근거로 표시된 단락은 ${b}개입니다. 이 근거만으로 ${i+1}단락의 요지가 도출됩니까?`})}});P.forEach((p,i)=>{if(ABS.test(p.gist))pts.push({p:i,text:`${i+1}단락 요지의 ‘${p.gist.match(ABS)[0]}’는 예외 하나로도 반박됩니다. 근거가 실제로 보여 주는 범위는 어디까지입니까?`})});const adds=P.map((p,i)=>i>0&&p.rel==='추가 (또한)'?i:-1).filter(i=>i>=0);if(adds.length>=2)pts.push({p:adds[0],text:`${adds.map(i=>i+1).join('·')}단락이 모두 ‘또한’으로 이어집니다. 순서를 바꿔도 글이 성립한다면, 이 근거들은 서로를 어떻게 받쳐 줍니까?`})};
 const thesisChk=()=>{const c=cc.length?cc[cc.length-1]:P.length-1;if(P[c]&&jacc(P[c].gist,S.thesis)<0.3)pts.push({p:c,text:`중심 주장과 ${c+1}단락(결론) 요지를 나란히 놓으면 표현이 상당히 다릅니다. 결론이 중심 주장보다 더 강하거나 약한 주장을 하고 있지는 않습니까?`})};
 if(type==='반론'){counter();premise()}else if(type==='전제'){premise();link()}else if(type==='연결'){link();thesisChk()}else{thesisChk();counter();link();premise()}
 const seen=new Set(),out=pts.filter(x=>!seen.has(x.text)&&seen.add(x.text));
 const asked=qq.match(/(\d+)\s*단락/);if(asked){const t=+asked[1]-1;out.sort((a,b)=>(b.p===t)-(a.p===t))}
 if(out.length<2)out.push({p:null,text:'분석만 읽은 독자가 중심 주장에 동의하지 않는다면, 근거가 부족해서입니까, 연결이 끊겨서입니까? 가장 약한 고리 하나를 골라 원문에서 확인해 보세요.'});
 return{refusal:false,points:out.slice(0,3).map(x=>({...x,verdict:'',reason:''}))};
}

/* ================= 6. AI 조언 검토 ================= */
function step6(){
 if(locked(6))return head(6)+`<div class="notice w">🔒 먼저 5단계에서 AI에게 질문하세요.</div><button class="btn p" onclick="go(5)">5단계로</button>`;
 return head(6,`<p>AI의 지적은 <b>정답이 아니라 가설</b>입니다. 본문을 본 적 없는 AI는 틀릴 수 있습니다. 각 지적을 <b>원문과 대조한 뒤</b> 수용·부분 수용·거부 중 하나로 판단하고, 내 글의 어느 부분 때문에 그렇게 판단했는지 근거를 쓰세요. 근거가 분명하다면 거부도 좋은 판단입니다.</p>`,true)+`
 ${S.ai.map((e,k)=>`<div class="ai"><div class="q">Q${k+1}. [${esc(e.type)}] ${esc(e.q)} <span class="hint">· ${esc(fmt(e.at))}</span></div>
  ${e.points.map((pt,j)=>`<div class="pt"><div class="tx">${esc(pt.text)}</div>
   ${e.refusal?'<div class="hint">대필 요청이 거절되었습니다. 판단할 필요가 없습니다.</div>':`${radios(`v${k}_${j}`,pt.verdict,`(v=>judge(${k},${j},'verdict',v))`)}
   <textarea class="t" rows="2" placeholder="판단 근거 (20자 이상): 원문의 어느 부분 때문에 이 지적이 맞거나 틀렸는가?" oninput="judge(${k},${j},'reason',this.value)" ${NP}>${esc(pt.reason)}</textarea>
   <div class="hint" id="jl${k}_${j}">${len(pt.reason)}/20자</div>`}
  </div>`).join('')}</div>`).reverse().join('')}
 <div class="card"><h3>원문과 대조해 추가로 발견한 점</h3><p class="hint">AI가 묻지 않았지만, 원문을 다시 읽으며 새로 찾은 문제를 쓰세요.</p><textarea class="t" rows="3" oninput="S.aiExtra=this.value;save()" ${NP}>${esc(S.aiExtra)}</textarea></div>
 <div class="row">${canAsk()?'<button class="btn" onclick="go(5)">← AI에게 다른 질문하기</button>':''}</div>`+nextBtn(6);
}
function judge(k,j,f,v){S.ai[k].points[j][f]=v;save();if(f==='reason'){const l=$('#jl'+k+'_'+j);if(l)l.textContent=len(v)+'/20자'}renderNav()}

/* ================= 공통: 문서·메모 보기 ================= */
function paraHTML(ctx,i){
 const text=ctx.project.data.paras[i].text;
 const cs=ctx.comments.filter(c=>c.p===i&&(UI.showResolved||!c.resolved)).map(c=>({c,at:text.indexOf(c.quote)})).filter(x=>x.at>=0&&x.c.quote).sort((a,b)=>a.at-b.at);
 let h='',pos=0;
 cs.forEach(({c,at})=>{if(at<pos)return;const col=TAGS[c.tag]||'#999';h+=esc(text.slice(pos,at))+`<mark data-c="${c.id}" class="${UI.focusC===c.id?'focus':''}" style="border-color:${col};background:${col}1f;color:inherit" onclick="focusC('${c.id}')">${esc(c.quote)}</mark>`;pos=at+c.quote.length});
 return h+esc(text.slice(pos));
}
function docView(ctx,mode){
 CUR=ctx;const D=ctx.project.data,owner=ctx.project.owner,canResolve=owner===ME.id||ME.role==='teacher';
 const list=ctx.comments.filter(c=>UI.showResolved||!c.resolved).sort((a,b)=>a.p-b.p);
 const myR=i=>{const r=ctx.reader.find(x=>x.reviewer===ME.id&&x.p===i);return r?r.text:''};
 return `<div class="notice i">문장을 <b>드래그해서 선택</b>하면 ‘메모 남기기’ 버튼이 나타납니다.${mode==='review'?' 각 단락 아래에는 <b>내가 읽은 요지</b>를 쓰세요. 작성자의 요지는 보이지 않습니다.':''}</div>
 <div class="row" style="margin-bottom:10px"><button class="btn s" onclick="autoCheck()">🔎 표현 점검 실행 (‘나’ 사용 등)</button><label class="hint"><input type="checkbox" ${UI.showResolved?'checked':''} onchange="UI.showResolved=this.checked;render()"> 해결된 메모도 보기</label><span class="hint">메모 ${ctx.comments.filter(c=>!c.resolved).length}개 열림 · ${ctx.comments.filter(c=>c.resolved).length}개 해결</span><button class="btn s" onclick="reloadCtx()">↻ 새로고침</button></div>
 <div class="docwrap">
  <div class="doc" onmouseup="onSel()" onkeyup="onSel()" ontouchend="onSel()">
   <h1>${esc(D.title||'제목 없음')}</h1><div class="by">${esc(D.author||nameOf(owner))}</div>
   ${(D.paras||[]).map((p,i)=>`<div class="para"><span class="pn">${i+1}</span><div class="ptext" data-p="${i}">${paraHTML(ctx,i)}</div>
    ${mode==='review'?`<div class="rg"><span>📖 내가 읽은 요지</span><input value="${esc(myR(i))}" placeholder="이 단락이 주장하는 바를 한 문장으로" oninput="setReader(${i},this.value)" ${NP}></div>`:''}</div>`).join('')}
  </div>
  <div class="side" id="side">${UI.pending?commentForm():''}${list.length?list.map(c=>cardHTML(c,owner,canResolve)).join(''):'<p class="hint">아직 메모가 없습니다.</p>'}</div>
 </div>`;
}
function commentForm(){
 const p=UI.pending;
 return `<div class="ccard" style="border-left-color:var(--accent)"><div class="au">새 메모 · ${p.p+1}단락</div><div class="q">“${esc(cut(p.quote,80))}”</div>
  <select class="t" id="ctag" style="margin:6px 0">${Object.keys(TAGS).map(t=>`<option>${t}</option>`).join('')}</select>
  <textarea class="t" id="cbody" rows="3" placeholder="어떤 문제가 왜 생기는지, 질문의 형태로 써 보세요."></textarea>
  <div class="acts"><button onclick="addComment()" style="background:var(--accent);color:#fff;border-color:var(--accent)">등록</button><button onclick="UI.pending=null;render()">취소</button></div></div>`;
}
function cardHTML(c,owner,canResolve){
 const col=TAGS[c.tag]||'#999',paras=CUR.project.data.paras,orphan=!paras[c.p]||paras[c.p].text.indexOf(c.quote)<0,rl=roleOf(c,owner);
 const reps=CUR.replies.filter(r=>r.comment===c.id);
 return `<div class="ccard ${c.resolved?'res':''} ${UI.focusC===c.id?'focus':''}" id="cc_${c.id}" style="border-left-color:${col}" onmouseenter="hl('${c.id}',1)" onmouseleave="hl('${c.id}',0)">
  <div class="hd"><span><span class="au">${c.auto?'표현 점검':esc(nameOf(c.author))}</span><span class="rolechip r-${rl}">${RLABEL[rl]}</span></span><span class="badge" style="background:${col}22;color:${col}">${esc(c.tag)}</span></div>
  <div class="q">${c.p+1}단락 · “${esc(cut(c.quote,70))}”${orphan?' <span style="color:#9b2c2c">(본문이 바뀌어 위치를 찾지 못함)</span>':''}</div>
  <div>${esc(c.body)}</div><div class="hint">${esc(fmt(c.created_at))}</div>
  ${reps.map(r=>{const rr=roleOf({author:r.author},owner);return `<div class="rep"><b>${esc(nameOf(r.author))}</b><span class="rolechip r-${rr}">${RLABEL[rr]}</span> ${esc(r.body)}</div>`}).join('')}
  ${c.resp&&c.resp.verdict?`<div class="rep"><b>작성자 답변</b> <span class="badge">${esc(c.resp.verdict)}</span> ${esc(c.resp.plan)}</div>`:''}
  <div class="row" style="margin-top:6px"><input class="t" id="r_${c.id}" placeholder="답글" style="flex:1;padding:4px 8px;font-size:13px" onkeydown="if(event.key==='Enter')reply('${c.id}')"></div>
  <div class="acts"><button onclick="reply('${c.id}')">답글</button>${canResolve?`<button onclick="toggleRes('${c.id}')">${c.resolved?'다시 열기':'✓ 해결'}</button>`:''}${c.author===ME.id||ME.role==='teacher'?`<button onclick="delComment('${c.id}')">삭제</button>`:''}</div>
 </div>`;
}
function onSel(){setTimeout(()=>{
 const sel=getSelection(),b=$('#selbtn');
 if(!sel||sel.isCollapsed||!sel.rangeCount){b.style.display='none';return}
 const el=n=>n&&(n.nodeType===3?n.parentElement:n);
 const a=el(sel.anchorNode)&&el(sel.anchorNode).closest('.ptext'),f=el(sel.focusNode)&&el(sel.focusNode).closest('.ptext');
 if(!a||a!==f){b.style.display='none';return}
 const qq=sel.toString().replace(/\s+/g,' ').trim();if(qq.length<2){b.style.display='none';return}
 const r=sel.getRangeAt(0).getBoundingClientRect();
 b.style.left=Math.max(8,r.left+scrollX+r.width/2-55)+'px';b.style.top=(r.top+scrollY-42)+'px';b.style.display='block';
 UI.sel={p:+a.dataset.p,quote:qq};
},0)}
function startComment(){if(!UI.sel||!CUR)return;if(CUR.project.data.paras[UI.sel.p].text.indexOf(UI.sel.quote)<0)return toast('단락 안의 연속된 문장만 선택하세요.');UI.pending=UI.sel;$('#selbtn').style.display='none';getSelection().removeAllRanges();render();setTimeout(()=>{const b=$('#cbody');if(b)b.focus()},50)}
async function addComment(){const body=$('#cbody').value.trim();if(body.length<5)return toast('메모 내용을 5자 이상 쓰세요.');
 await q(db.from('comments').insert({project:CUR.pid,author:ME.id,auto:false,p:UI.pending.p,quote:UI.pending.quote,tag:$('#ctag').value,body,resolved:false,resp:null}));UI.pending=null;await reloadCtx()}
async function reply(id){const i=$('#r_'+id),v=i.value.trim();if(!v)return;await q(db.from('replies').insert({comment:id,author:ME.id,body:v}));await reloadCtx()}
async function toggleRes(id){const c=CUR.comments.find(c=>c.id===id);await q(db.from('comments').update({resolved:!c.resolved}).eq('id',id));await reloadCtx()}
async function delComment(id){if(!confirm('메모를 삭제할까요?'))return;await q(db.from('comments').delete().eq('id',id));await reloadCtx()}
function focusC(id){UI.focusC=id;render();setTimeout(()=>{const c=$('#cc_'+id);if(c)c.scrollIntoView({block:'nearest',behavior:'smooth'})},30)}
function hl(id,on){const m=document.querySelector(`mark[data-c="${id}"]`);if(m)m.classList.toggle('focus',!!on||UI.focusC===id)}
function setReader(i,v){
 const ex=CUR.reader.find(x=>x.reviewer===ME.id&&x.p===i);if(ex)ex.text=v;else CUR.reader.push({project:CUR.pid,reviewer:ME.id,p:i,text:v});
 const pid=CUR.pid;later('rd'+i,async()=>{const r=await db.from('reader').upsert({project:pid,reviewer:ME.id,p:i,text:v},{onConflict:'project,reviewer,p'});if(r.error)toast('저장 실패: '+r.error.message);else flashSaved()});
}
async function autoCheck(){
 let n=0;const RX=/(나는|내가|나의|나에게|나도|나를|내 생각)/g,rows=[];
 CUR.project.data.paras.forEach((p,i)=>{let m;RX.lastIndex=0;while((m=RX.exec(p.text))){const qq=m[0];if(CUR.comments.some(c=>c.p===i&&c.auto&&c.quote===qq)||rows.some(r=>r.p===i&&r.quote===qq))continue;rows.push({project:CUR.pid,author:ME.id,auto:true,p:i,quote:qq,tag:'표현',body:'학술적 글에서는 ‘나’를 쓰지 않습니다. ‘본 연구’, ‘본 논문’ 등으로 바꾸고, 개인 경험이 근거라면 그것이 일반화될 수 있는지도 함께 점검하세요.',resolved:false,resp:null});n++}});
 if(rows.length)await q(db.from('comments').insert(rows));
 toast(n?`표현 점검 메모 ${n}개를 추가했습니다.`:'새로 찾은 표현 문제가 없습니다.');await reloadCtx();
}
function fbBox(f,owner){const rl=roleOf({reviewer:f.reviewer},owner);return `<div class="fbbox"><div class="row" style="justify-content:space-between"><span><b>${esc(nameOf(f.reviewer))}</b><span class="rolechip r-${rl}">${RLABEL[rl]}</span></span><span class="hint">${esc(fmt(f.created_at))}</span></div>
 <dl>${FBQ.map(([k,,sh])=>`<dt>${sh}</dt><dd>${esc(f[k])}</dd>`).join('')}</dl>`}
function fbForm(ctx){
 CUR=ctx;const mine=ctx.feedback.find(f=>f.reviewer===ME.id)||{};
 return `<div class="card"><h3>종합 피드백 ${mine.id?'(제출함 · 고쳐서 다시 제출 가능)':''}</h3>
  <div class="hint">중심 주장: <b>${esc(ctx.project.data.thesis||'(미입력)')}</b></div>
  ${FBQ.map(([k,qq])=>`<label class="f">${qq}</label><textarea class="t" rows="2" id="fb_${k}" ${NP}>${esc(mine[k]||'')}</textarea>`).join('')}
  <div class="chk"><b style="font-size:13px">제출 전 확인</b>${CHK.map(c=>`<label><input type="checkbox" class="fbchk"> ${c}</label>`).join('')}</div>
  <button class="btn p" onclick="submitFb()">피드백 제출</button></div>
  ${ctx.feedback.filter(f=>f.reviewer!==ME.id&&ME.role==='teacher').map(f=>fbBox(f,ctx.project.owner)+(f.resp&&f.resp.verdict?`<div class="hint"><b>작성자 답변</b> [${esc(f.resp.verdict)}] ${esc(f.resp.plan)}</div>`:'')+'</div>').join('')}`;
}
async function submitFb(){
 const o={};for(const [k] of FBQ){o[k]=$('#fb_'+k).value.trim();if(o[k].length<10)return toast('네 항목을 모두 10자 이상 구체적으로 쓰세요.')}
 if([...document.querySelectorAll('.fbchk')].some(c=>!c.checked))return toast('제출 전 확인 항목을 모두 점검하세요.');
 await q(db.from('feedback').upsert({project:CUR.pid,reviewer:ME.id,...o},{onConflict:'project,reviewer'}));
 toast('종합 피드백을 제출했습니다.');await reloadCtx();
}

/* ================= 7. 동료 검토 ================= */
function step7(){
 const top=head(7,`<p>좋은 피드백은 ‘좋다/별로다’가 아니라 <b>어디에서, 어떤 논리 문제가, 왜</b> 생기는지 짚습니다. 메모에는 문제 유형을 붙이고, 고칠 문장을 대신 써 주지 말고 <b>질문</b>으로 남기세요. 인신 평가가 아니라 글의 내용과 구성에 초점을 둡니다.</p><p><b>독자 요지</b>: 각 단락을 읽고 자신이 이해한 요지를 한 문장으로 씁니다. 작성자의 의도와 다르게 읽혔다면, 그 단락은 의도대로 전달되지 않는 것입니다.</p>`)+`
 <label class="toggle"><input type="checkbox" ${MYP.shared?'checked':''} onchange="setShared(this.checked)"> <span><b>내 글을 같은 분반 동료에게 검토용으로 공개</b><br><span class="hint">공개해야 동료가 내 글을 읽고 메모·피드백을 남길 수 있습니다. 내 요지와 분석은 동료 화면에 보이지 않습니다.</span></span></label>`;
 if(!VIEW){
  return top+`<h3>검토할 수 있는 동료의 글 (${PEERS.length})</h3>
  ${PEERS.length?PEERS.map(p=>`<div class="peercard"><div class="row" style="justify-content:space-between"><span class="hint">${esc(nameOf(p.owner))}</span>${MYREV.fb.has(p.id)?'<span class="lv h">피드백 제출함</span>':MYREV.cm.has(p.id)?'<span class="lv m">메모 남김</span>':''}</div>
   <h3>${esc(p.data.title||'제목 없음')}</h3><p class="hint" style="margin:4px 0 10px">중심 주장: ${esc(p.data.thesis||'(미입력)')}</p>
   <button class="btn p" onclick="openPeer('${p.id}')">글 읽고 검토하기</button></div>`).join(''):'<div class="notice w">아직 검토용으로 공개된 동료의 글이 없습니다. 동료가 공개하면 이곳에 나타납니다.</div>'}`+nextBtn(7);
 }
 const t=UI.tab7;
 return top+`<button class="back" onclick="VIEW=null;CUR=null;render()">← 동료 글 목록</button>
 <h3 style="margin:0 0 10px">${esc(VIEW.project.data.title)} <span class="hint">· ${esc(nameOf(VIEW.project.owner))}</span></h3>
 <div class="tabs"><button class="${t==='doc'?'on':''}" onclick="UI.tab7='doc';render()">📝 글 읽고 메모하기</button><button class="${t==='fb'?'on':''}" onclick="UI.tab7='fb';render()">🧾 종합 피드백 쓰기</button></div>`+(t==='doc'?docView(VIEW,'review'):fbForm(VIEW))+nextBtn(7);
}
async function openPeer(pid){VIEW=await loadCtx(pid);UI.tab7='doc';UI.pending=null;render();window.scrollTo(0,0)}
async function setShared(v){MYP.shared=v;await q(db.from('projects').update({shared:v}).eq('id',MYP.id));toast(v?'동료 검토용으로 공개했습니다.':'공개를 해제했습니다.')}

/* ================= 8. 피드백 답변 ================= */
function step8(){
 const t=UI.tab8,n=MY.comments.filter(c=>c.tag!=='잘된 점');
 const md=n.filter(c=>respOK(c.resp)).length,fd=MY.feedback.filter(f=>respOK(f.resp)).length;
 return head(8,`<p>받은 의견마다 세 가지를 답합니다. ① 이 의견을 <b>어떻게 이해했는가</b>, ② <b>수용·부분 수용·거부</b> 중 어떤 판단을 했고 왜 그런가, ③ 수정개요에 <b>어떻게 반영할 것인가</b>. 모든 제안을 그대로 받아들일 필요는 없습니다. 거부한다면 이유를 분명히 쓰세요.</p>`,true)+`
 ${MYP.shared?'':'<div class="notice w">아직 내 글을 동료에게 공개하지 않았습니다. 7단계에서 공개해야 동료의 의견을 받을 수 있습니다. 교수자의 의견은 공개 여부와 관계없이 도착합니다.</div>'}
 <div class="stats"><div class="stat"><b>${md}/${n.length}</b>메모 답변</div><div class="stat"><b>${fd}/${MY.feedback.length}</b>종합 피드백 답변</div><button class="btn s" onclick="go(8)">↻ 새 의견 확인</button></div>
 <div class="tabs">
  <button class="${t==='memo'?'on':''}" onclick="UI.tab8='memo';render()">💬 메모별 답변</button>
  <button class="${t==='fb'?'on':''}" onclick="UI.tab8='fb';render()">🧾 종합 피드백 답변</button>
  <button class="${t==='cmp'?'on':''}" onclick="UI.tab8='cmp';render()">🔍 독자 요지 비교</button>
  <button class="${t==='doc'?'on':''}" onclick="UI.tab8='doc';render()">📄 내 글에서 보기</button>
 </div>`+(t==='memo'?memoResp():t==='fb'?fbResp():t==='cmp'?cmpView():docView(MY,'own'))+nextBtn(8);
}
const RESP_PH='이 의견을 어떻게 이해했는가? 왜 그렇게 판단했는가? 수정개요에 어떻게 반영할 것인가? (10자 이상)';
function memoResp(){
 CUR=MY;const n=MY.comments.filter(c=>c.tag!=='잘된 점');if(!n.length)return '<p class="hint">답변할 메모가 없습니다.</p>';
 return n.map(c=>{const col=TAGS[c.tag]||'#999',r=c.resp||{},rl=roleOf(c,MYP.owner);return `<div class="ccard" style="border-left-color:${col};margin-bottom:10px">
  <div class="hd"><span><span class="au">${c.auto?'표현 점검':esc(nameOf(c.author))}</span><span class="rolechip r-${rl}">${RLABEL[rl]}</span></span><span class="badge" style="background:${col}22;color:${col}">${esc(c.tag)}</span></div>
  <div class="q">${c.p+1}단락 · “${esc(c.quote)}”</div><div>${esc(c.body)}</div>
  ${radios('m'+c.id,r.verdict,`(v=>setResp('c','${c.id}','verdict',v))`)}
  <textarea class="t" rows="2" placeholder="${RESP_PH}" oninput="setResp('c','${c.id}','plan',this.value)" ${NP}>${esc(r.plan||'')}</textarea></div>`}).join('');
}
function fbResp(){
 if(!MY.feedback.length)return '<p class="hint">아직 받은 종합 피드백이 없습니다.</p>';
 return MY.feedback.map(f=>{const r=f.resp||{};return fbBox(f,MYP.owner)+`${radios('f'+f.id,r.verdict,`(v=>setResp('f','${f.id}','verdict',v))`)}
  <textarea class="t" rows="3" placeholder="${RESP_PH}" oninput="setResp('f','${f.id}','plan',this.value)" ${NP}>${esc(r.plan||'')}</textarea></div>`}).join('');
}
function setResp(kind,id,k,v){
 const o=(kind==='c'?MY.comments:MY.feedback).find(x=>x.id===id);o.resp=Object.assign({verdict:'',plan:''},o.resp||{});o.resp[k]=v;
 const send=async()=>{const r=await db.from(kind==='c'?'comments':'feedback').update({resp:o.resp}).eq('id',id);if(r.error)toast('저장 실패: '+r.error.message);else flashSaved()};
 if(k==='verdict'){send();render()}else{later('resp'+id,send);renderNav()}
}
function readerNames(ctx){return [...new Set(ctx.reader.filter(r=>len(r.text)).map(r=>r.reviewer))]}
function level(x){return x>=0.35?['h','잘 전달됨']:x>=0.18?['m','부분 전달']:['l','다르게 읽힘']}
function cmpView(){
 const R=readerNames(MY);
 if(!R.length)return `<div class="notice w">아직 독자 요지가 없습니다. 동료가 7단계에서 내 글의 각 단락 아래에 자신이 읽은 요지를 쓰면 이곳에 비교가 나타납니다.</div>`;
 const rd=(id,i)=>{const r=MY.reader.find(x=>x.reviewer===id&&x.p===i);return r?r.text:''};
 return `<p class="hint">일치도는 표현의 겹침으로 계산한 <b>참고 수치</b>입니다. ‘다르게 읽힘’이 나온 단락은 중심 문장이 분명한지, 주장이 둘 섞여 있지 않은지 원문에서 확인하세요. 이 단락들은 9단계 ‘반영할 의견’에 자동으로 올라갑니다.</p>
 <div style="overflow:auto"><table class="tb"><tr><th style="width:44px">단락</th><th>내가 의도한 요지</th>${R.map(r=>`<th>${esc(nameOf(r))}이(가) 읽은 요지</th>`).join('')}</tr>
 ${S.paras.map((p,i)=>`<tr><td><b>${i+1}</b></td><td>${p.gist?esc(p.gist):'<i class="hint">미작성</i>'}</td>${R.map(r=>{const g=rd(r,i);if(!len(g))return '<td class="hint">—</td>';const[l,lab]=level(jacc(p.gist,g));return `<td>${esc(g)}<br><span class="lv ${l}">${lab}</span></td>`}).join('')}</tr>`).join('')}</table></div>`;
}

/* ================= 9. 수정개요 ================= */
function applyItems(){
 const out=[],acc=v=>['수용','부분 수용'].includes(v);
 MY.comments.forEach(c=>{if(c.resp&&acc(c.resp.verdict))out.push({key:'c'+c.id,src:'메모 · '+(c.auto?'표현 점검':nameOf(c.author)),p:c.p,tag:c.tag,v:c.resp.verdict,text:c.resp.plan})});
 MY.feedback.forEach(f=>{if(f.resp&&acc(f.resp.verdict))out.push({key:'f'+f.id,src:'종합 피드백 · '+nameOf(f.reviewer),p:null,tag:'종합',v:f.resp.verdict,text:f.resp.plan})});
 S.ai.forEach((e,k)=>{if(!e.refusal)e.points.forEach((pt,j)=>{if(acc(pt.verdict))out.push({key:`a${k}_${j}`,src:'AI 질문',p:pt.p,tag:'AI',v:pt.verdict,text:pt.reason})})});
 S.paras.forEach((p,i)=>{const R=MY.reader.filter(r=>r.p===i&&len(r.text));if(R.length&&Math.min(...R.map(r=>jacc(p.gist,r.text)))<0.18)out.push({key:'r'+i,src:'독자 요지 비교',p:i,tag:'다르게 읽힘',v:'',text:'독자가 이 단락의 요지를 의도와 다르게 읽음'})});
 return out;
}
function initRev(){if(S.rev.length&&!confirm('지금의 수정개요를 지우고 현재 글 구조에서 다시 시작할까요?'))return;S.rev=S.paras.map((p,i)=>({id:uid(),from:i,op:'유지',role:p.role,gist:p.gist,why:''}));save();render()}
function step9(){
 const items=applyItems(),ap=items.filter(x=>S.applied[x.key]).length;
 return head(9,`<p><b>역개요</b>가 ‘지금 글이 어떻게 짜여 있는가’라면, <b>수정개요</b>는 ‘고친 글을 어떻게 짤 것인가’입니다. 수정개요도 <b>단락 요지</b>로 씁니다. 수정 후 각 단락이 무엇을 주장할지 한 문장으로 쓸 수 없다면, 아직 고칠 방향이 정해지지 않은 것입니다.</p><p>고치는 순서는 큰 것에서 작은 것으로 갑니다. ① 중심 주장·전체 배열 → ② 단락의 역할과 연결 → ③ 단락 안의 근거·전제 → ④ 문장·표현.</p>`,true)+`
 <div class="card"><h3>반영하기로 한 의견 (${ap}/${items.length} 반영)</h3><p class="hint">6·8단계에서 ‘수용’ 또는 ‘부분 수용’한 의견과, 다르게 읽힌 단락이 모입니다. 수정개요에 반영했으면 체크하세요.</p>
  ${items.length?`<div style="overflow:auto"><table class="tb"><tr><th style="width:56px">반영</th><th style="width:56px">단락</th><th style="width:170px">출처</th><th>나의 반영 계획 / 판단</th></tr>${items.map(x=>`<tr><td style="text-align:center"><input type="checkbox" ${S.applied[x.key]?'checked':''} onchange="S.applied['${x.key}']=this.checked;save();render()" style="width:auto"></td><td>${x.p===null||x.p===undefined?'전체':x.p+1}</td><td><span class="badge">${esc(x.tag)}</span><div class="ref">${esc(x.src)}${x.v?' · '+x.v:''}</div></td><td>${esc(x.text)}</td></tr>`).join('')}</table></div>`:'<p class="hint">아직 모인 의견이 없습니다. 6·8단계에서 판단을 마치면 이곳에 나타납니다.</p>'}
 </div>
 <div class="card"><h3>수정개요 — 수정 후 단락 배열과 요지</h3>
  <div class="row" style="margin-bottom:10px"><button class="btn" onclick="initRev()">현재 글 구조에서 시작</button><button class="btn" onclick="S.rev.push({id:uid(),from:null,op:'추가',role:'',gist:'',why:''});save();render()">＋ 새 단락 추가</button><span class="hint">▲▼로 순서를 바꾸면 단락 이동이 됩니다.</span></div>
  ${S.rev.length?`<div style="overflow:auto"><table class="tb"><tr><th style="width:40px">새 순서</th><th style="width:150px">원래 단락</th><th style="width:84px">작업</th><th style="width:120px">역할</th><th>수정 후 요지 (한 문장)</th><th style="width:22%">이유 · 반영한 의견</th><th style="width:76px"></th></tr>
  ${S.rev.map((r,i)=>{const o=r.from!==null&&S.paras[r.from];return `<tr style="${r.op==='삭제'?'opacity:.55':''}"><td><b>${i+1}</b></td>
   <td>${o?`<b>${r.from+1}단락</b><div class="ref">${esc(cut(o.gist,60))}</div>`:'<span class="badge">새 단락</span>'}</td>
   <td><select onchange="setRev(${i},'op',this.value,1)">${OPS.map(v=>`<option ${r.op===v?'selected':''}>${v}</option>`).join('')}</select></td>
   <td><select onchange="setRev(${i},'role',this.value)"><option value="">선택</option>${ROLES.map(v=>`<option ${r.role===v?'selected':''}>${v}</option>`).join('')}</select></td>
   <td><textarea maxlength="100" placeholder="고친 뒤 이 단락이 주장할 내용" oninput="setRev(${i},'gist',this.value)" ${NP}>${esc(r.gist)}</textarea></td>
   <td><textarea placeholder="왜 이렇게 바꾸나? 어떤 의견을 반영했나?" oninput="setRev(${i},'why',this.value)" ${NP}>${esc(r.why)}</textarea></td>
   <td><button class="btn s" onclick="mvRev(${i},-1)" ${i?'':'disabled'}>▲</button><button class="btn s" onclick="mvRev(${i},1)" ${i<S.rev.length-1?'':'disabled'}>▼</button><button class="btn s" onclick="S.rev.splice(${i},1);save();render()">✕</button></td></tr>`}).join('')}</table></div>`:'<div class="notice i">‘현재 글 구조에서 시작’을 누르면 지금의 단락과 요지가 불려 옵니다. 그 위에서 이동·통합·분리·추가·삭제를 설계하세요.</div>'}
 </div>
 ${S.rev.length?`<div class="card"><h3>수정 전후 비교</h3><div class="pcard"><div><b class="hint">수정 전 (역개요)</b><div class="thesis" style="background:#555"><small>중심 주장</small>${esc(S.thesis)}</div>${S.paras.map((p,i)=>`<div class="node" style="margin-bottom:4px"><span class="n">${i+1}</span><div><span class="badge">${esc(p.role)}</span>${esc(p.gist)}</div></div>`).join('')}</div>
  <div><b class="hint">수정 후 (수정개요)</b><div class="thesis"><small>중심 주장</small>${esc(S.thesis)}</div>${S.rev.filter(r=>r.op!=='삭제').map((r,i)=>`<div class="node" style="margin-bottom:4px"><span class="n">${i+1}</span><div><span class="badge">${esc(r.role||'역할?')}</span><span class="badge" style="background:var(--accent-soft);color:var(--accent)">${esc(r.op)}</span>${esc(r.gist)||'<i class="hint">요지 미작성</i>'}</div></div>`).join('')}</div></div></div>`:''}
 <div class="card"><h3>수정 설계의 근거</h3>
  <label class="f">단락 사이의 논리적 연결을 보완할 방법</label><textarea class="t" rows="3" oninput="S.revLogic=this.value;save()" ${NP}>${esc(S.revLogic)}</textarea>
  <label class="f">자기 점검·AI 조언·동료 피드백을 반영한 수정 판단의 이유 (20자 이상)</label><textarea class="t" rows="4" oninput="S.revReason=this.value;save();renderNav()" ${NP}>${esc(S.revReason)}</textarea>
 </div>
 <div class="notice i">수정개요대로 글을 고친 뒤 1단계에서 본문을 다시 저장하면, 바뀐 단락은 2단계에서 요지를 다시 확인하도록 표시됩니다.</div>`+nextBtn(9);
}
function setRev(i,k,v,re){S.rev[i][k]=v;save();renderNav();if(re)render()}
function mvRev(i,d){const a=S.rev;[a[i],a[i+d]]=[a[i+d],a[i]];if(a[i+d].op==='유지')a[i+d].op='이동';save();render()}

/* ================= 10. 성찰 ================= */
function step10(){
 const sub=S.status==='제출 완료';
 return head(10,`<p>글의 구조를 고치는 것만큼 중요한 일은 <b>왜 그렇게 고쳤는지 설명하는 일</b>입니다. 막연한 소감 대신, 단락 번호와 받은 의견을 짚어 가며 구체적으로 쓰세요.</p>`,true)+`
 <div class="card"><h3>성찰 질문</h3>${REFQ.map((qq,k)=>`<label class="f">${k+1}. ${qq}</label><textarea class="t" rows="3" oninput="S.reflect[${k}]=this.value;save()" ${NP}>${esc(S.reflect[k])}</textarea>`).join('')}</div>
 <div class="card"><h3>제출</h3>
  <div class="stats">${STEPS.slice(1,10).map((s,i)=>`<div class="stat"><b>${stepDone(i+1)?'✓':'—'}</b>${i+1}. ${s.t}</div>`).join('')}</div>
  ${sub?`<div class="notice o">✓ 학습 기록을 제출했습니다. 제출 후에도 내용을 고칠 수 있습니다.</div>`:''}
  <div class="row"><button class="btn p" onclick="submitAll()">${sub?'다시 제출':'학습 기록 제출 완료'}</button><button class="btn" onclick="dlPortfolio()">⬇ 학습 기록 (.doc)</button><button class="btn" onclick="dlRev()">⬇ 수정개요만 (.doc)</button><button class="btn" onclick="dlTxt()">⬇ 본문 (.txt)</button></div>
  <p class="hint">.doc 파일은 한글·Word에서 열립니다. 제출한 기록은 교수자가 바로 확인합니다.</p></div><div class="row" style="margin-top:18px"><button class="btn" onclick="go(9)">← 이전</button></div>`;
}
function submitAll(){const miss=STEPS.slice(1,10).map((s,i)=>stepDone(i+1)?null:(i+1)+'단계').filter(Boolean);if(miss.length&&!confirm(`아직 끝나지 않은 단계가 있습니다: ${miss.join(', ')}\n그래도 제출할까요?`))return;if(REFQ.some((_,k)=>len(S.reflect[k])<20))return toast('성찰 질문에 각각 20자 이상 답하세요.');S.status='제출 완료';save();render();toast('학습 기록을 제출했습니다.')}

/* ================= 교수자 ================= */
async function loadTeacher(){
 CLASSES=await q(db.from('classes').select('*').order('code'));
 const [projects,comments,feedback]=await Promise.all([q(db.from('projects').select('*')),q(db.from('comments').select('*')),q(db.from('feedback').select('*'))]);
 TD={projects,comments,feedback};
}
async function tgo(p){UI.tpage=p;VIEW=null;CUR=null;UI.pending=null;await loadTeacher();render();window.scrollTo(0,0)}
function studentRows(){
 const studs=Object.values(PEOPLE).filter(p=>p.role==='student'&&(!UI.tclass||p.class_code===UI.tclass));
 return studs.map(st=>{
  const pr=TD.projects.find(p=>p.owner===st.id),D=pr?Object.assign(blankData(),pr.data):null;
  const X=pr?{comments:TD.comments.filter(c=>c.project===pr.id),feedback:TD.feedback.filter(f=>f.project===pr.id)}:{comments:[],feedback:[]};
  const rev=TD.feedback.filter(f=>f.reviewer===st.id&&(!pr||f.project!==pr.id)).length+TD.comments.filter(c=>c.author===st.id&&(!pr||c.project!==pr.id)).length;
  const f=D?doneFlags(D,X,rev):Array(11).fill(false);const nx=f.findIndex((v,i)=>i>0&&!v);
  const pts=D?D.ai.filter(e=>!e.refusal).flatMap(e=>e.points):[],need=X.comments.filter(c=>c.tag!=='잘된 점');
  return {st,pr,D,pct:pctOf(f),cur:nx<0?'완료':nx+'. '+STEPS[nx].t,gist:D?`${D.paras.filter(p=>gistState(p).ok).length}/${D.paras.length}`:'-',ai:`${pts.filter(p=>p.verdict).length}/${pts.length}`,
   resp:`${need.filter(c=>respOK(c.resp)).length+X.feedback.filter(x=>respOK(x.resp)).length}/${need.length+X.feedback.length}`,rev,status:pr?pr.status:'시작 전',shared:pr&&pr.shared,upd:pr?fmt(pr.updated_at):''};
 });
}
function teacherDash(){
 if(VIEW)return teacherStudent();
 const rows=studentRows(),tc={};
 TD.comments.filter(c=>rows.some(r=>r.pr&&r.pr.id===c.project)).forEach(c=>{tc[c.tag]=(tc[c.tag]||0)+1});const mx=Math.max(1,...Object.values(tc));
 return `<div class="kicker">교수자</div><h2>학생 현황</h2>
 ${!LIVE?'<div class="notice a">체험 모드입니다. 오른쪽 위에서 학생 계정으로 바꾸면 학생 화면을, 다시 선민서(교수자)로 돌아오면 그 결과를 이곳에서 볼 수 있습니다.</div>':''}
 <div class="row" style="margin-bottom:12px"><select class="t" style="width:auto" onchange="UI.tclass=this.value;render()"><option value="">전체 분반</option>${CLASSES.map(c=>`<option value="${esc(c.code)}" ${UI.tclass===c.code?'selected':''}>${esc(c.name)}</option>`).join('')}</select><button class="btn s" onclick="tgo('dash')">↻ 새로고침</button><button class="btn s" onclick="dlCSV()">⬇ 현황표 (.csv)</button></div>
 <div class="card"><div style="overflow:auto"><table class="tb"><tr><th>학생</th><th>분반</th><th>진행률</th><th>다음 할 단계</th><th>요지 완성</th><th>AI 지적 판단</th><th>받은 의견 답변</th><th>동료 검토</th><th>공개</th><th>상태</th><th>최근 저장</th><th></th></tr>
 ${rows.length?rows.map(r=>`<tr><td><b>${esc(r.st.name)}</b></td><td>${esc((CLASSES.find(c=>c.code===r.st.class_code)||{}).name||r.st.class_code||'')}</td><td><div class="progress" style="margin:4px 0;width:80px"><i style="width:${r.pct}%"></i></div>${r.pct}%</td><td>${esc(r.cur)}</td><td>${r.gist}</td><td>${r.ai}</td><td>${r.resp}</td><td>${r.rev}건</td><td>${r.shared?'공개':'—'}</td><td>${esc(r.status)}</td><td class="hint">${esc(r.upd)}</td><td>${r.pr?`<button class="btn s p" onclick="openStudent('${r.pr.id}')">열기</button>`:''}</td></tr>`).join(''):'<tr><td colspan="12" class="hint">아직 가입한 학생이 없습니다. ‘분반·참여 코드’에서 코드를 확인해 학생들에게 알려 주세요.</td></tr>'}</table></div></div>
 <div class="card"><h3>메모 유형 분포</h3><div class="bars">${Object.entries(tc).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div><span>${esc(k)}</span><i style="width:${v/mx*100}%;background:${TAGS[k]||'#999'}"></i><span>${v}</span></div>`).join('')||'<p class="hint">메모 없음</p>'}</div><p class="hint">학생들의 글에서 자주 지적된 논리 문제를 다음 수업 주제로 고를 때 참고하세요.</p></div>`;
}
async function openStudent(pid){VIEW=await loadCtx(pid);UI.tabT='rec';UI.pending=null;render();window.scrollTo(0,0)}
function teacherStudent(){
 const t=UI.tabT,D=Object.assign(blankData(),VIEW.project.data);
 return `<button class="back" onclick="VIEW=null;CUR=null;tgo('dash')">← 학생 현황</button>
 <div class="kicker">교수자 · 학생 기록</div><h2>${esc(nameOf(VIEW.project.owner))} <span class="hint" style="font-size:15px">· ${esc(D.title||'제목 없음')} · ${esc(VIEW.project.status)}</span></h2>
 <div class="tabs"><button class="${t==='rec'?'on':''}" onclick="UI.tabT='rec';render()">📚 학습 기록</button><button class="${t==='doc'?'on':''}" onclick="UI.tabT='doc';render()">📝 글에 메모하기</button><button class="${t==='fb'?'on':''}" onclick="UI.tabT='fb';render()">🧾 종합 피드백</button></div>
 ${t==='rec'?`<div class="row" style="margin-bottom:10px"><button class="btn s" onclick="dlPortfolio(VIEW)">⬇ 이 학생 기록 (.doc)</button></div><div class="preview">${portfolioBody(D,VIEW)}</div>`:t==='doc'?docView(VIEW,'teacher'):fbForm(VIEW)}`;
}
function classesPage(){
 return `<div class="kicker">교수자</div><h2>분반·참여 코드</h2>
 <div class="card"><p class="hint">학생은 가입할 때 아래 <b>참여 코드</b>를 입력합니다. 코드는 분반마다 다르게 두고, 수업 시간에만 알려 주세요.</p>
 <table class="tb"><tr><th>참여 코드</th><th>분반 이름</th><th>학생 수</th></tr>${CLASSES.map(c=>`<tr><td><b>${esc(c.code)}</b></td><td>${esc(c.name)}</td><td>${Object.values(PEOPLE).filter(p=>p.class_code===c.code&&p.role==='student').length}</td></tr>`).join('')}</table></div>
 <div class="card"><h3>새 분반 만들기</h3><div class="row"><input class="t" id="nc_code" placeholder="참여 코드 (예: WRITING-C)" style="flex:1;min-width:160px"><input class="t" id="nc_name" placeholder="분반 이름 (예: 글쓰기 C분반)" style="flex:1;min-width:160px"><button class="btn p" onclick="addClass()">추가</button></div></div>`;
}
async function addClass(){const code=$('#nc_code').value.trim(),name=$('#nc_name').value.trim();if(code.length<4||!name)return toast('코드(4자 이상)와 이름을 입력하세요.');await q(db.from('classes').insert({code,name}));toast('분반을 만들었습니다.');tgo('classes')}
function dlCSV(){const rows=studentRows();const e=s=>'"'+String(s??'').replace(/"/g,'""')+'"';
 const csv=['학생,분반,진행률,다음 단계,요지 완성,AI 판단,의견 답변,동료 검토,공개,상태,최근 저장',...rows.map(r=>[r.st.name,r.st.class_code,r.pct+'%',r.cur,r.gist,r.ai,r.resp,r.rev,r.shared?'공개':'',r.status,r.upd].map(e).join(','))].join('\n');
 dl('학생현황.csv','﻿'+csv,'text/csv;charset=utf-8')}

/* ================= 내보내기 ================= */
const DOCCSS='<style>body{font-family:"맑은 고딕",sans-serif;font-size:11pt;line-height:1.7}h1{font-size:16pt}h2{font-size:13pt;border-bottom:1px solid #999;margin-top:22pt}table{border-collapse:collapse;width:100%}td,th{border:1px solid #999;padding:5pt;vertical-align:top;font-size:10pt}th{background:#eee}.c{color:#555;font-size:10pt}mark{background:#fde68a}</style>';
function wrapDoc(b){return `<html><head><meta charset="utf-8">${DOCCSS}</head><body>${b}<p class="c">© 선민서 · 고려대학교 학부대학 글쓰기 수업용 개인 제작 자료</p></body></html>`}
function revTable(D){return `<table><tr><th>순서</th><th>원래 단락</th><th>작업</th><th>역할</th><th>수정 후 요지</th><th>이유</th></tr>${(D.rev||[]).map((r,i)=>`<tr><td>${i+1}</td><td>${r.from===null?'새 단락':r.from+1}</td><td>${esc(r.op)}</td><td>${esc(r.role)}</td><td>${esc(r.gist)}</td><td>${esc(r.why)}</td></tr>`).join('')}</table><p><b>연결 보완:</b> ${esc(D.revLogic)}</p><p><b>수정 판단의 이유:</b> ${esc(D.revReason)}</p>`}
function portfolioBody(D,X){
 const owner=X.project.owner;
 const body=D.paras.map((p,i)=>{let t=esc(p.text);X.comments.filter(c=>c.p===i).forEach((c,k)=>{t=t.replace(esc(c.quote),`<mark>${esc(c.quote)}</mark><sup>[${i+1}-${k+1}]</sup>`)});return `<p><b>${i+1}</b> ${t}</p>`}).join('');
 const an=D.paras.map((p,i)=>`<tr><td>${i+1}</td><td>${esc(p.role)}<br><span class="c">${esc(p.rel)}</span></td><td>${esc(p.gist)}</td>${AN.map(([k])=>`<td>${esc(p.an&&p.an[k])}</td>`).join('')}</tr>`).join('');
 const cm=X.comments.map(c=>{const k=X.comments.filter(x=>x.p===c.p).indexOf(c)+1,rl=roleOf(c,owner);return `<tr><td>[${c.p+1}-${k}]</td><td>${esc(c.tag)}</td><td>${c.auto?'표현 점검':esc(nameOf(c.author))} (${RLABEL[rl]})</td><td>“${esc(c.quote)}”<br>${esc(c.body)}${X.replies.filter(r=>r.comment===c.id).map(r=>`<br>↳ ${esc(nameOf(r.author))}: ${esc(r.body)}`).join('')}</td><td>${c.resp&&c.resp.verdict?`[${esc(c.resp.verdict)}] ${esc(c.resp.plan)}`:''}</td></tr>`}).join('');
 const fb=X.feedback.map(f=>`<p><b>${esc(nameOf(f.reviewer))}</b><br>${FBQ.map(([k,qq])=>`${qq}<br>→ ${esc(f[k])}`).join('<br>')}<br><b>답변:</b> ${f.resp&&f.resp.verdict?`[${esc(f.resp.verdict)}] ${esc(f.resp.plan)}`:'(미작성)'}</p>`).join('');
 const R=readerNames(X),rd=(id,i)=>{const r=X.reader.find(x=>x.reviewer===id&&x.p===i);return r?r.text:''};
 const ai=D.ai.map((e,k)=>`<p><b>Q${k+1} [${esc(e.type)}]</b> ${esc(e.q)}</p>`+e.points.map(pt=>`<p class="c">AI: ${esc(pt.text)}<br><b>판단: ${esc(pt.verdict||'-')}</b> — ${esc(pt.reason)}</p>`).join('')).join('');
 return `<h1>${esc(D.title)}</h1><p>작성자: ${esc(D.author)} · 상태: ${esc(D.status)}<br>중심 주장: ${esc(D.thesis)}</p>
 <h2>1. 본문 (메모 위치 표시)</h2>${body}
 <h2>2. 단락 요지와 논증 요소</h2><table><tr><th>단락</th><th>역할·관계</th><th>주장(요지)</th>${AN.map(a=>`<th>${a[1]}</th>`).join('')}</tr>${an}</table>
 <h2>3. 역개요 진단</h2>${OUTQ.map((qq,i)=>`<p class="c">${qq}</p><p>${esc(D.outline[i])}</p>`).join('')}
 <h2>4. AI 조언과 나의 판단</h2>${ai||'<p class="c">없음</p>'}<p><b>원문 대조 추가 발견:</b> ${esc(D.aiExtra)}</p>
 <h2>5. 메모와 답변</h2><table><tr><th>번호</th><th>유형</th><th>작성</th><th>내용</th><th>작성자 답변</th></tr>${cm}</table>
 <h2>6. 종합 피드백과 답변</h2>${fb||'<p class="c">없음</p>'}
 ${R.length?`<h2>7. 독자 요지 비교</h2><table><tr><th>단락</th><th>작성자 요지</th>${R.map(r=>`<th>${esc(nameOf(r))}</th>`).join('')}</tr>${D.paras.map((p,i)=>`<tr><td>${i+1}</td><td>${esc(p.gist)}</td>${R.map(r=>`<td>${esc(rd(r,i))}</td>`).join('')}</tr>`).join('')}</table>`:''}
 <h2>8. 수정개요</h2>${revTable(D)}
 <h2>9. 학습 성찰</h2>${REFQ.map((qq,i)=>`<p class="c">${i+1}. ${qq}</p><p>${esc(D.reflect[i])}</p>`).join('')}`;
}
function dlPortfolio(X){X=X&&X.project?X:MY;const D=X===MY?S:Object.assign(blankData(),X.project.data);dl(`학습기록_${D.author||'작성자'}.doc`,wrapDoc(portfolioBody(D,X)),'application/msword')}
function dlRev(){dl(`수정개요_${S.author||'작성자'}.doc`,wrapDoc(`<h1>수정개요</h1><p>제목: ${esc(S.title)}<br>작성자: ${esc(S.author)}<br>중심 주장: ${esc(S.thesis)}</p>${revTable(S)}`),'application/msword')}
function dlTxt(){dl(`${S.title||'본문'}.txt`,S.title+'\n'+S.author+'\n\n'+S.paras.map(p=>p.text).join('\n\n'),'text/plain;charset=utf-8')}

/* ================= 렌더 ================= */
const VIEWS=[step0,step1,step2,step3,step4,step5,step6,step7,step8,step9,step10];
function render(){
 if(!ME)return;
 renderWho();renderNav();
 if(ME.role==='teacher'){$('#main').innerHTML=UI.tpage==='classes'?classesPage():teacherDash();return}
 $('#main').innerHTML=VIEWS[S.step]();
}
document.addEventListener('mousedown',e=>{if(e.target.id!=='selbtn'&&!e.target.closest('.doc'))$('#selbtn').style.display='none'});
boot();
