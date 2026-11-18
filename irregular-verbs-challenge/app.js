// Firebase modular SDK. Paste your Firebase Web App config in firebaseConfig below.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import {
  getFirestore, collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc,
  deleteDoc, onSnapshot, query, orderBy, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyAL6Gvt1mXzwMUIAleOaO5H00NOsIb_KVc",
  authDomain: "chien-non.firebaseapp.com",
  projectId: "chien-non",
  storageBucket: "chien-non.appspot.com",
  messagingSenderId: "449788967862",
  appId: "1:449788967862:web:3e0b8f084bf6c2f58f9f17",
};

const $ = (id) => document.getElementById(id);
const state = { auth:null, db:null, uid:null, roomCode:null, room:null, me:null, isHost:false, unsubRoom:null, unsubPeople:null, unsubWords:null, unsubScores:null, words:[], participants:[], submissions:[], submitted:false, quiz:[], selectedWordIds:new Set(), wordSearch:"", selectionInitialized:false, hintsUsed:{}, draftAnswers:[], saveTimer:null };
const WORDS = 'verbQuiz_words';
const ROOMS = 'verbQuiz_rooms';
const sampleWords = [
  ['thì, là, ở','be','was, were','been'],['bắt đầu','begin','began','begun'],['mua','buy','bought','bought'],['đến','come','came','come'],['làm','do','did','done'],['uống','drink','drank','drunk'],['ăn','eat','ate','eaten'],['đi','go','went','gone'],['có','have','had','had'],['biết','know','knew','known'],['làm, chế tạo','make','made','made'],['nói','say','said','said'],['nhìn thấy','see','saw','seen'],['lấy, mang','take','took','taken'],['viết','write','wrote','written']
];

function toast(message){const el=$('toast');el.textContent=message;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),2800)}
function showView(name){$('homeView').classList.toggle('hidden',name!=='home');$('roomView').classList.toggle('hidden',name!=='room');window.scrollTo({top:0,behavior:'smooth'})}
function clean(s){return String(s??'').trim()}
function norm(s){return clean(s).toLocaleLowerCase('en-US').replace(/\s+/g,' ').replace(/\s*,\s*/g,', ')}
function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function randomCode(){const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let out='';for(let i=0;i<6;i++)out+=chars[Math.floor(Math.random()*chars.length)];return out}
function shuffle(list){const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function fmtDate(ts){if(!ts)return '—';const d=ts.toDate?ts.toDate():new Date(ts);return d.toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})}
function setBusy(button,busy,label){button.disabled=busy;if(busy){button.dataset.old=button.textContent;button.textContent=label||'Đang xử lý...'}else if(button.dataset.old){button.textContent=button.dataset.old;delete button.dataset.old}}

async function init(){
  if(firebaseConfig.apiKey==='YOUR_API_KEY'){toast('Bạn cần điền Firebase Web App config trong app.js');$('wordStatus').textContent='Chưa cấu hình Firebase. Xem README.md để thiết lập.';return}
  try{
    const app=initializeApp(firebaseConfig);state.auth=getAuth(app);state.db=getFirestore(app);
    const credential=await signInAnonymously(state.auth);state.uid=credential.user.uid;
    await loadWords();
    $('wordStatus').textContent='Đã kết nối Firebase';
    offerResumeDraft();
  }catch(err){console.error(err);$('wordStatus').textContent='Không thể kết nối Firebase: '+err.message;toast('Lỗi Firebase: '+err.message)}
}

async function loadWords(){
  const snap=await getDocs(collection(state.db,WORDS));
  if(snap.empty){for(const w of sampleWords)await addDoc(collection(state.db,WORDS),{vi:w[0],v1:w[1],v2:w[2],v3:w[3],createdAt:serverTimestamp()})}
  if(state.unsubWords)state.unsubWords();
  state.unsubWords=onSnapshot(query(collection(state.db,WORDS),orderBy('vi')),(s)=>{
    state.words=s.docs.map(d=>({id:d.id,...d.data()}));if(!state.selectionInitialized){state.words.forEach(w=>state.selectedWordIds.add(w.id));state.selectionInitialized=true}else{state.selectedWordIds=new Set([...state.selectedWordIds].filter(id=>state.words.some(w=>w.id===id)))}renderWords();
  },e=>{console.error(e);$('wordStatus').textContent='Không đọc được ngân hàng từ: '+e.message});
}
function renderWords(){
  $('wordCount').textContent=state.words.length+' từ';
  const sorted=[...state.words].sort((a,b)=>String(a.v1||'').localeCompare(String(b.v1||''),'en',{sensitivity:'base'}));
  const filtered=sorted.filter(w=>{const q=clean(state.wordSearch).toLocaleLowerCase();return !q||[w.vi,w.v1,w.v2,w.v3].some(x=>String(x||'').toLowerCase().includes(q))});
  $('wordTableBody').innerHTML=filtered.length?filtered.map(w=>`<tr><td><input class="word-select" type="checkbox" data-word-select="${w.id}" ${state.selectedWordIds.has(w.id)?'checked':''} aria-label="Chọn ${escapeHtml(w.v1)}"></td><td>${escapeHtml(w.vi)}</td><td>${escapeHtml(w.v1)}</td><td>${escapeHtml(w.v2)}</td><td>${escapeHtml(w.v3)}</td><td><button class="delete-word" data-delete="${w.id}" title="Xóa từ">Xóa</button></td></tr>`).join(''):'<tr><td colspan="6" class="empty-cell">Không có từ phù hợp.</td></tr>';
  updateWordSelectionSummary();
}
function updateWordSelectionSummary(){const n=state.selectedWordIds.size;$('selectionSummary').textContent=`Đã chọn ${n} từ`; $('selectedWordCount').textContent=`${n} từ đã chọn`; }

async function addWord(){
  const w={vi:clean($('wordVi').value),v1:clean($('wordV1').value),v2:clean($('wordV2').value),v3:clean($('wordV3').value)};
  if(Object.values(w).some(v=>!v)){toast('Vui lòng nhập đủ 4 ô.');return}
  try{const added=await addDoc(collection(state.db,WORDS),{...w,createdAt:serverTimestamp()});state.selectedWordIds.add(added.id);['wordVi','wordV1','wordV2','wordV3'].forEach(id=>$(id).value='');$('wordVi').focus();toast('Đã thêm từ mới!')}
  catch(e){toast('Không thể thêm từ: '+e.message)}
}
async function deleteWord(id){if(!confirm('Bạn chắc chắn muốn xóa từ này khỏi ngân hàng?'))return;try{await deleteDoc(doc(state.db,WORDS,id));toast('Đã xóa từ.')}catch(e){toast('Không thể xóa: '+e.message)}}
function parseWordText(text){
  const lines=text.split(/[;\n\r]+/).map(x=>x.trim()).filter(Boolean);const parsed=[];
  for(const line of lines){const p=line.split('-').map(x=>x.trim());if(p.length>=4&&p[0]&&p[1]&&p[2]&&p[3])parsed.push({vi:p[0],v1:p[1],v2:p[2],v3:p.slice(3).join('-')})}
  return parsed;
}
async function importWords(file){
  try{const text=await file.text();let rows=[];
    if(file.name.toLowerCase().endsWith('.json')){const data=JSON.parse(text);rows=Array.isArray(data)?data.map(x=>({vi:x.vi||x.vn||'',v1:x.v1||'',v2:x.v2||'',v3:x.v3||''})):[]}
    else rows=parseWordText(text);
    rows=rows.filter(x=>clean(x.vi)&&clean(x.v1)&&clean(x.v2)&&clean(x.v3));if(!rows.length){toast('Không tìm thấy dòng hợp lệ.');return}
    for(const w of rows){const added=await addDoc(collection(state.db,WORDS),{...w,createdAt:serverTimestamp()});state.selectedWordIds.add(added.id)}renderWords();toast('Đã nhập '+rows.length+' từ.');
  }catch(e){toast('Lỗi nhập dữ liệu: '+e.message)}finally{$('importWordsFile').value=''}
}
function exportWords(){const text=state.words.map(w=>`${w.vi}-${w.v1}-${w.v2}-${w.v3};`).join('\n');const blob=new Blob([text],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='words.txt';a.click();URL.revokeObjectURL(url)}

async function createRoom(){
  const name=clean($('hostName').value),count=Number($('questionCount').value),hintLimit=Number($('hintLimit').value),selectedIds=[...state.selectedWordIds];if(!name){toast('Nhập tên của bạn trước nhé.');return}if(!Number.isInteger(count)||count<1||count>100){toast('Số lượng từ phải từ 1 đến 100.');return}if(selectedIds.length<count){toast(`Bạn đã chọn ${selectedIds.length} từ, không đủ cho bài kiểm tra ${count} từ.`);return}if(!Number.isInteger(hintLimit)||hintLimit<0||hintLimit>100){toast('Số lượt trợ giúp phải từ 0 đến 100.');return}
  const btn=$('createRoomBtn');setBusy(btn,true,'Đang tạo phòng...');
  try{let code;for(let i=0;i<8;i++){code=randomCode();const exists=await getDoc(doc(state.db,ROOMS,code));if(!exists.exists())break;code=null}if(!code)throw new Error('Không tạo được mã phòng, vui lòng thử lại.');
    await setDoc(doc(state.db,ROOMS,code),{code,hostUid:state.uid,hostName:name,questionCount:count,hintLimit,selectedWordIds:selectedIds,status:'waiting',createdAt:serverTimestamp()});
    await setDoc(doc(state.db,ROOMS,code,'participants',state.uid),{uid:state.uid,name,role:'host',joinedAt:serverTimestamp(),submitted:false});
    enterRoom(code,true,name);
  }catch(e){console.error(e);toast('Tạo phòng thất bại: '+e.message)}finally{setBusy(btn,false)}
}
async function joinRoom(){
  const name=clean($('playerName').value),code=clean($('roomCodeInput').value).toUpperCase();if(!name){toast('Nhập tên của bạn trước nhé.');return}if(!/^[A-Z0-9]{6}$/.test(code)){toast('Mã phòng phải gồm 6 ký tự.');return}
  const btn=$('joinRoomBtn');setBusy(btn,true,'Đang vào phòng...');
  try{const snap=await getDoc(doc(state.db,ROOMS,code));if(!snap.exists())throw new Error('Không tìm thấy phòng này.');const room=snap.data();if(room.status==='finished')throw new Error('Phòng đã kết thúc.');
    const participantRef=doc(state.db,ROOMS,code,'participants',state.uid);const old=await getDoc(participantRef);
    if(old.exists()&&old.data().submitted){toast('Bạn đã nộp bài trong phòng này rồi.');}
    else await setDoc(participantRef,{uid:state.uid,name,role:state.uid===room.hostUid?'host':'player',joinedAt:old.exists()?old.data().joinedAt:serverTimestamp(),submitted:old.exists()?!!old.data().submitted:false},{merge:true});
    enterRoom(code,state.uid===room.hostUid,name);
  }catch(e){toast(e.message)}finally{setBusy(btn,false)}
}

function enterRoom(code,isHost,name){
  cleanupRoomListeners();state.roomCode=code;state.isHost=isHost;state.me={uid:state.uid,name};state.submitted=false;state.quiz=[];state.hintsUsed={};state.draftAnswers=[];
  $('roomCodeDisplay').textContent=code;$('roomModeLabel').textContent=isHost?'HOST ROOM':'PLAYER ROOM';$('roomTitle').textContent=isHost?'Phòng của '+name:'Chào '+name+'!';$('roomSubtitle').textContent='Mỗi người sẽ nhận một bộ từ ngẫu nhiên.';$('startQuizBtn').classList.toggle('hidden',!isHost);$('finishRoomBtn').classList.add('hidden');$('hostResults').classList.toggle('hidden',!isHost);$('hostNote').textContent=isHost?'Bạn là chủ phòng. Bấm “Bắt đầu kiểm tra” khi cả lớp đã sẵn sàng.':'Chia sẻ mã phòng với bạn bè và chờ chủ phòng bắt đầu.';
  showView('room');
  state.unsubRoom=onSnapshot(doc(state.db,ROOMS,code),async snap=>{if(!snap.exists()){toast('Phòng không còn tồn tại.');showView('home');return}state.room={id:snap.id,...snap.data()};renderRoomState();if(state.room.status==='active')await ensurePersonalQuiz();if(state.room.status==='finished')renderRoomState()},e=>toast('Lỗi theo dõi phòng: '+e.message));
  state.unsubPeople=onSnapshot(query(collection(state.db,ROOMS,code,'participants'),orderBy('joinedAt')),(snap)=>{state.participants=snap.docs.map(d=>({id:d.id,...d.data()}));renderParticipants();renderScoreboard()},e=>console.error(e));
  if(isHost)state.unsubScores=onSnapshot(collection(state.db,ROOMS,code,'submissions'),snap=>{state.submissions=snap.docs.map(d=>({id:d.id,...d.data()}));renderScoreboard()},e=>console.error(e));
}
function cleanupRoomListeners(){['unsubRoom','unsubPeople','unsubScores'].forEach(k=>{if(state[k])state[k]();state[k]=null})}
function renderRoomState(){
  const r=state.room;if(!r)return;const status=r.status;$('roomStatus').textContent=status==='waiting'?'Đang chờ':status==='active'?'Đang thi':'Đã kết thúc';$('roomSectionTitle').textContent=status==='waiting'?'Đang chờ bắt đầu':status==='active'?'Bài kiểm tra của bạn':'Phòng đã kết thúc';$('startQuizBtn').classList.toggle('hidden',!state.isHost||status!=='waiting');$('finishRoomBtn').classList.toggle('hidden',!state.isHost||status!=='active');$('waitingArea').classList.toggle('hidden',status!=='waiting');$('quizArea').classList.toggle('hidden',status!=='active'||state.submitted);$('resultArea').classList.toggle('hidden',!state.submitted);
  if(status==='waiting')$('waitingArea').querySelector('h3').textContent=state.isHost?'Mọi người đã sẵn sàng chưa?':'Chờ chủ phòng bắt đầu nhé!';
  if(state.isHost)$('hostResults').classList.remove('hidden');
  if(status==='finished'&&state.isHost)$('hostNote').textContent='Phòng đã kết thúc. Bạn có thể xem bảng xếp hạng và từng bài làm bên dưới.';
}
function renderParticipants(){
  $('participantCount').textContent=state.participants.length;
  $('participantList').innerHTML=state.participants.map(p=>`<div class="participant"><div class="avatar">${escapeHtml((p.name||'?').charAt(0).toUpperCase())}</div><div class="participant-name">${escapeHtml(p.name||'Người chơi')}<div class="participant-role">${p.role==='host'?'Chủ phòng':p.submitted?'Đã nộp bài':'Đang tham gia'}</div></div><span>${p.submitted?'✓':'•'}</span></div>`).join('')||'<p class="subtle">Chưa có người tham gia.</p>';
}
async function finishRoom(){if(!state.isHost||!state.room)return;if(!confirm('Kết thúc phòng kiểm tra? Người chưa nộp bài sẽ không thể tiếp tục.'))return;try{await updateDoc(doc(state.db,ROOMS,state.roomCode),{status:'finished',finishedAt:serverTimestamp()});toast('Đã kết thúc phòng.')}catch(e){toast('Không thể kết thúc phòng: '+e.message)}}
async function startQuiz(){
  if(!state.isHost||!state.room)return;const ids=state.room.selectedWordIds||[...state.selectedWordIds];if(state.words.filter(w=>ids.includes(w.id)).length<state.room.questionCount){toast('Nguồn từ được chọn không đủ số lượng câu hỏi.');return}
  try{await updateDoc(doc(state.db,ROOMS,state.roomCode),{status:'active',startedAt:serverTimestamp()});toast('Bài kiểm tra đã bắt đầu!')}catch(e){toast('Không thể bắt đầu: '+e.message)}
}
async function ensurePersonalQuiz(){
  if(state.submitted||state.quiz.length)return;
  const ref=doc(state.db,ROOMS,state.roomCode,'participants',state.uid);const snap=await getDoc(ref);if(!snap.exists())return;const p=snap.data();state.hintsUsed=p.hintsUsedWords||{};const localDraft=loadLocalDraft();state.draftAnswers=Array.isArray(p.draftAnswers)&&p.draftAnswers.length?p.draftAnswers:(localDraft?.answers||[]);if(localDraft?.hintsUsed)state.hintsUsed={...state.hintsUsed,...localDraft.hintsUsed};
  if(p.submitted){state.submitted=true;state.quiz=p.questionSet||[];const sub=await getDoc(doc(state.db,ROOMS,state.roomCode,'submissions',state.uid));renderSavedResult(sub.exists()?sub.data():p);renderRoomState();return}
  if(Array.isArray(p.questionSet)&&p.questionSet.length){state.quiz=p.questionSet;state.draftAnswers=Array.isArray(p.draftAnswers)&&p.draftAnswers.length?p.draftAnswers:(localDraft?.answers||[]);state.hintsUsed={...(p.hintsUsedWords||{}),...(localDraft?.hintsUsed||{})};renderQuiz();renderRoomState();return}
  const sourceIds=Array.isArray(state.room.selectedWordIds)?state.room.selectedWordIds:null;const source=sourceIds?state.words.filter(w=>sourceIds.includes(w.id)):state.words;const selected=shuffle(source).slice(0,state.room.questionCount).map(w=>({id:w.id,vi:w.vi,v1:w.v1,v2:w.v2,v3:w.v3}));
  await updateDoc(ref,{questionSet:selected,quizCreatedAt:serverTimestamp(),draftAnswers:[]});state.quiz=selected;state.draftAnswers=[];renderQuiz();renderRoomState();saveLocalDraft();
}
function draftKey(){return state.uid&&state.roomCode?`verbQuiz_draft_${state.uid}_${state.roomCode}`:null}
function collectDraftAnswers(){return state.quiz.map((word,i)=>{const row={};for(const k of ['v1','v2','v3']){const input=document.querySelector(`#quizTableBody input[data-answer="${i}"][data-field="${k}"]`);row[k]=input?input.value:(state.hintsUsed[word.id]===k?word[k]:'')}return row})}
function saveLocalDraft(){const key=draftKey();if(!key||!state.quiz.length||state.submitted)return;const data={roomCode:state.roomCode,name:state.me?.name||'',uid:state.uid,answers:collectDraftAnswers(),hintsUsed:state.hintsUsed,quiz:state.quiz,updatedAt:Date.now()};try{localStorage.setItem(key,JSON.stringify(data));localStorage.setItem('verbQuiz_lastDraft',JSON.stringify({roomCode:state.roomCode,name:data.name,uid:state.uid,updatedAt:data.updatedAt}))}catch(e){console.warn('Không thể lưu bản nháp trên thiết bị:',e)}}
function loadLocalDraft(){const key=draftKey();if(!key)return null;try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):null}catch{return null}}
function scheduleDraftSave(){if(state.submitted)return;state.draftAnswers=collectDraftAnswers();saveLocalDraft();const status=$('draftSaveStatus');if(status)status.textContent='Đang lưu...';clearTimeout(state.saveTimer);state.saveTimer=setTimeout(async()=>{try{const ref=doc(state.db,ROOMS,state.roomCode,'participants',state.uid);await updateDoc(ref,{draftAnswers:state.draftAnswers,hintsUsedWords:state.hintsUsed,draftUpdatedAt:serverTimestamp()});if(status)status.textContent='✓ Đã lưu'}catch(e){console.warn('Firestore draft save failed:',e);if(status)status.textContent='Đã lưu trên thiết bị'}},500)}
function offerResumeDraft(){try{const last=JSON.parse(localStorage.getItem('verbQuiz_lastDraft')||'null');if(!last||last.uid!==state.uid||Date.now()-last.updatedAt>30*24*60*60*1000)return;const key=`verbQuiz_draft_${state.uid}_${last.roomCode}`;if(!localStorage.getItem(key))return;if(confirm(`Bạn có bài kiểm tra chưa hoàn tất ở phòng ${last.roomCode}. Bạn có muốn tiếp tục không?`)){$('playerName').value=last.name||'';$('roomCodeInput').value=last.roomCode||'';joinRoom()}}catch(e){console.warn('Không thể kiểm tra bản nháp:',e)}}
function renderQuiz(){
  $('quizTableBody').innerHTML=state.quiz.map((w,i)=>`<tr data-row="${i}"><td>${i+1}</td><td>${escapeHtml(w.vi)}</td>${['v1','v2','v3'].map(k=>{const reveal=state.hintsUsed[w.id]===k;return `<td><input data-answer="${i}" data-field="${k}" aria-label="${escapeHtml(w.vi)} ${k}" autocomplete="off" ${reveal?'disabled value=\"'+escapeHtml(w[k])+'\" class=\"hint-revealed\"':''}></td>`}).join('')}<td><button class="hint-btn" data-hint="${i}" ${state.hintsUsed[w.id]||Number(state.room?.hintLimit||0)<=0?'disabled':''}>${state.hintsUsed[w.id]?'✓ Đã dùng':Number(state.room?.hintLimit||0)<=0?'Không có hint':'💡 Hint'}</button></td></tr>`).join('');renderHintMeter();updateProgress();
}
function updateProgress(){const inputs=[...document.querySelectorAll('#quizTableBody input')];const filled=inputs.filter(x=>clean(x.value)).length;const percent=inputs.length?Math.round(filled/inputs.length*100):0;$('progressText').textContent=`${filled/3|0} / ${state.quiz.length} từ đã điền ít nhất một ô`;$('progressPercent').textContent=percent+'%';$('progressBar').style.width=percent+'%'}
function getAnswers() {
  const inputs = document.querySelectorAll(
    '#quizTableBody input[data-answer][data-field]'
  );

  const answers = state.quiz.map(word => ({
    word,
    v1: '',
    v2: '',
    v3: ''
  }));

  inputs.forEach(input => {
    const index = Number(input.dataset.answer);
    const field = input.dataset.field;

    if (answers[index] && ['v1', 'v2', 'v3'].includes(field)) {
      answers[index][field] = input.value.trim();
    }
  });

  console.log('DEBUG - Answers collected:', answers);

  return answers;
}
function checkOne(answer,key){const accepted=String(answer.word[key]||'').split(',').map(norm);return accepted.includes(norm(answer[key]))}
async function submitQuiz(){
  if(state.submitted)return;if(!confirm('Bạn chắc chắn muốn hoàn tất và nộp bài? Sau khi nộp sẽ không thể sửa đáp án.'))return;
  const answers=getAnswers();
  const filledCount = answers.reduce((count, a) => {
  return count +
    Number(!!a.v1.trim()) +
    Number(!!a.v2.trim()) +
    Number(!!a.v3.trim());
}, 0);

if (filledCount === 0) {
  toast('Không đọc được đáp án. Vui lòng kiểm tra lại bài làm!');
  return;
}
  const details=answers.map(a=>({vi:a.word.vi,v1:a.v1,v2:a.v2,v3:a.v3,ok1:checkOne(a,'v1'),ok2:checkOne(a,'v2'),ok3:checkOne(a,'v3'),correct:{v1:a.word.v1,v2:a.word.v2,v3:a.word.v3}}));
  const correct=details.reduce((n,d)=>n+Number(d.ok1)+Number(d.ok2)+Number(d.ok3),0);const total=details.length*3;const correctWords=details.filter(d=>d.ok1&&d.ok2&&d.ok3).length;
  const payload={uid:state.uid,name:state.me.name,details,correct,total,correctWords,totalWords:details.length,score:Math.round(correct/total*100),hintsUsed:Object.keys(state.hintsUsed).length,hintedWords:state.hintsUsed,submittedAt:serverTimestamp()};
  try{await setDoc(doc(state.db,state.roomCode?ROOMS:ROOMS,state.roomCode,'submissions',state.uid),payload);await updateDoc(doc(state.db,ROOMS,state.roomCode,'participants',state.uid),{submitted:true,score:payload.score,correct,total,submittedAt:serverTimestamp()});state.submitted=true;try{await updateDoc(doc(state.db,ROOMS,state.roomCode,'participants',state.uid),{draftAnswers:[],draftCompletedAt:serverTimestamp()})}catch(e){console.warn('Could not clear Firestore draft:',e)}try{const key=draftKey();if(key)localStorage.removeItem(key);localStorage.removeItem('verbQuiz_lastDraft')}catch{}renderResult(payload);renderRoomState();toast('Đã nộp bài thành công!')}
  catch(e){console.error(e);toast('Nộp bài thất bại: '+e.message)}
}
function renderResult(data){
  $('quizArea').classList.add('hidden');$('resultArea').classList.remove('hidden');$('resultArea').innerHTML=`<div class="result-title">🎉 Bạn đã hoàn thành bài kiểm tra!</div><div class="result-summary"><div class="result-stat"><strong>${data.score}%</strong><span>Điểm số</span></div><div class="result-stat"><strong>${data.correct}/${data.total}</strong><span>Đáp án đúng</span></div><div class="result-stat"><strong>${data.correctWords}/${data.totalWords}</strong><span>Từ đúng cả 3 dạng</span></div></div><p class="subtle">Đáp án sai được tô đỏ. Đáp án đúng được tô xanh. 💡 Bạn đã dùng ${data.hintsUsed||0} lượt trợ giúp.</p>${resultTable(data.details)}`;
}
function resultTable(details){return `<div class="table-scroll"><table class="result-table"><thead><tr><th>Tiếng Việt</th><th>Verb 1</th><th>Verb 2</th><th>Verb 3</th></tr></thead><tbody>${details.map(d=>`<tr><td><b>${escapeHtml(d.vi)}</b></td>${['v1','v2','v3'].map(k=>`<td><div class="${d['ok'+k.slice(1)]?'good':'bad'}">${escapeHtml(d[k]||'—')} ${d['ok'+k.slice(1)]?'✓':'✗'}</div>${d['ok'+k.slice(1)]?'':`<small class="good">Đúng: ${escapeHtml(d.correct[k])}</small>`}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`}
function renderSavedResult(p){renderResult({score:p.score||0,correct:p.correct||0,total:p.total||0,correctWords:p.correctWords||0,totalWords:p.totalWords||0,details:p.details||[]})}
function renderScoreboard(){
  if(!state.isHost)return;const results=[...state.submissions].sort((a,b)=>(b.score||0)-(a.score||0)||(b.correct||0)-(a.correct||0));
  $('scoreTableBody').innerHTML=results.length?results.map((s,i)=>`<tr><td>${i===0?'🏆':i+1}</td><td><b>${escapeHtml(s.name)}</b></td><td>${s.correct||0}</td><td>${s.total||0}</td><td><b>${s.score||0}%</b></td><td>${s.hintsUsed||0}</td><td>${fmtDate(s.submittedAt)}</td><td><button data-submission="${s.uid}">Xem bài</button></td></tr>`).join(''):'<tr><td colspan="8" class="empty-cell">Chưa có ai nộp bài.</td></tr>';
}
async function showSubmission(uid){const s=state.submissions.find(x=>x.uid===uid);if(!s)return;$('submissionDetail').classList.remove('hidden');$('submissionDetail').innerHTML=`<h3>Bài làm của ${escapeHtml(s.name)}</h3><p class="subtle">${s.correct}/${s.total} đáp án đúng · ${s.score}% · 💡 ${s.hintsUsed||0} lượt trợ giúp</p>${resultTable(s.details||[])}`;$('submissionDetail').scrollIntoView({behavior:'smooth',block:'start'})}


function renderHintMeter(){const limit=Number(state.room?.hintLimit||0),used=Object.keys(state.hintsUsed).length,remaining=Math.max(0,limit-used);$('hintMeter').innerHTML=`💡 Lượt trợ giúp còn <b>${remaining}/${limit}</b> · Đã dùng ${used}`;}
async function useHint(index){if(state.submitted)return;const word=state.quiz[index];if(!word||state.hintsUsed[word.id]){toast('Từ này đã dùng trợ giúp rồi.');return}const limit=Number(state.room?.hintLimit||0),used=Object.keys(state.hintsUsed).length;if(used>=limit){toast('Bạn đã hết lượt trợ giúp.');return}const available=['v1','v2','v3'].filter(k=>!clean(document.querySelector(`#quizTableBody input[data-answer=\"${index}\"][data-field=\"${k}\"]`)?.value));if(!available.length){toast('Bạn đã điền đủ 3 ô của từ này rồi.');return}const field=available[Math.floor(Math.random()*available.length)];state.hintsUsed[word.id]=field;const inp=document.querySelector(`#quizTableBody input[data-answer=\"${index}\"][data-field=\"${field}\"]`);if(inp){inp.value=word[field];inp.disabled=true;inp.classList.add('hint-revealed')}renderHintMeter();scheduleDraftSave();const participantRef=doc(state.db,ROOMS,state.roomCode,'participants',state.uid);try{await updateDoc(participantRef,{hintsUsedWords:state.hintsUsed});const btn=document.querySelector(`#quizTableBody button[data-hint=\"${index}\"]`);if(btn){btn.disabled=true;btn.textContent='✓ Đã dùng'}toast(`Hint: ${field.toUpperCase()} đã được bật mí!`)}catch(e){delete state.hintsUsed[word.id];if(inp){inp.value='';inp.disabled=false;inp.classList.remove('hint-revealed')}renderHintMeter();toast('Không lưu được hint: '+e.message)}}

$('showCreate').addEventListener('click',()=>$('hostName').focus());$('showJoin').addEventListener('click',()=>$('playerName').focus());$('createRoomBtn').addEventListener('click',createRoom);$('joinRoomBtn').addEventListener('click',joinRoom);$('addWordBtn').addEventListener('click',addWord);$('exportWordsBtn').addEventListener('click',exportWords);$('importWordsFile').addEventListener('change',e=>{if(e.target.files[0])importWords(e.target.files[0])});$('wordTableBody').addEventListener('click',e=>{const b=e.target.closest('[data-delete]');if(b)deleteWord(b.dataset.delete)});$('wordTableBody').addEventListener('change',e=>{const c=e.target.closest('[data-word-select]');if(c){c.checked?state.selectedWordIds.add(c.dataset.wordSelect):state.selectedWordIds.delete(c.dataset.wordSelect);updateWordSelectionSummary()}});$('wordSearch').addEventListener('input',e=>{state.wordSearch=e.target.value;renderWords()});$('selectAllWords').addEventListener('click',()=>{state.words.forEach(w=>state.selectedWordIds.add(w.id));renderWords()});$('clearWordSelection').addEventListener('click',()=>{state.selectedWordIds.clear();renderWords()});$('startQuizBtn').addEventListener('click',startQuiz);$('finishRoomBtn').addEventListener('click',finishRoom);$('submitQuizBtn').addEventListener('click',submitQuiz);$('quizTableBody').addEventListener('input',()=>{updateProgress();scheduleDraftSave()});$('quizTableBody').addEventListener('click',e=>{const b=e.target.closest('[data-hint]');if(b)useHint(Number(b.dataset.hint));});$('scoreTableBody').addEventListener('click',e=>{const b=e.target.closest('[data-submission]');if(b)showSubmission(b.dataset.submission)});$('copyRoomCode').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(state.roomCode);toast('Đã sao chép mã phòng!')}catch{toast('Mã phòng: '+state.roomCode)}});$('backHomeBtn').addEventListener('click',()=>{cleanupRoomListeners();state.roomCode=null;showView('home')});$('brandHome').addEventListener('click',e=>{e.preventDefault();cleanupRoomListeners();showView('home')});$('roomCodeInput').addEventListener('input',e=>e.target.value=e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6));
init();
