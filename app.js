// ─── DB ──────────────────────────────────────────────────────────────────────
let db;
function initDB() {
  return new Promise((res, rej) => {
    const req = indexedDB.open('TransformOS', 3);
    req.onupgradeneeded = e => {
      const d = e.target.result;
      ['habits','goals','workouts','exercises','bloodwork','labHistory',
       'bodyStats','sleep','brand','phoneLog','chatHistory','settings'].forEach(store => {
        if (!d.objectStoreNames.contains(store)) d.createObjectStore(store, { keyPath: 'id' });
      });
    };
    req.onsuccess = e => { db = e.target.result; res(db); };
    req.onerror = () => rej(req.error);
  });
}
async function dbGet(store, id) {
  return new Promise((res, rej) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).get(id);
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}
async function dbPut(store, obj) {
  return new Promise((res, rej) => {
    const tx = db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).put(obj);
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}
async function dbGetAll(store) {
  return new Promise((res, rej) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => res(req.result || []);
    req.onerror = () => rej(req.error);
  });
}
async function dbDelete(store, id) {
  return new Promise((res, rej) => {
    const tx = db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).delete(id);
    req.onsuccess = () => res();
    req.onerror = () => rej(req.error);
  });
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const CYCLE_START = new Date('2026-04-26');
const CYCLE_WEEKS = 12;
const TODAY = new Date().toDateString();
const TODAY_KEY = new Date().toISOString().split('T')[0];

const INSPIRATION = [
  "Every rep is a vote for the person you're becoming.",
  "The tan, the physique, the skin — it's all one lifestyle.",
  "Discipline compounds like interest. Stay consistent.",
  "You're 19. You have time. But don't waste a single day.",
  "Track everything. What gets measured gets improved.",
  "The version of you at 10% BF exists. Go find him.",
  "Rest is part of the protocol. Recovery = growth.",
  "Champions are built in the moments nobody sees.",
  "One clean meal, one good session, one more day forward.",
  "OnPoint: improve every single day, no matter how small.",
  "The compound effect is real — show up when it doesn't feel like it.",
  "Your future self is watching every choice you make today.",
  "Pain is temporary. The physique is permanent.",
  "Eat, sleep, train, repeat. Trust the process.",
  "You don't rise to the occasion — you fall to your systems.",
  "Build the brand. Build the body. Build the life.",
  "Clear skin, deep tan, lean mass — it's a complete lifestyle.",
  "Every day you delay is a day your future self loses."
];

const DEFAULT_HABITS = [
  {id:'train',label:'Train',icon:'🏋️'},
  {id:'cardio',label:'Cardio',icon:'🏃'},
  {id:'protein',label:'Hit Protein',icon:'🥩'},
  {id:'water',label:'3L Water',icon:'💧'},
  {id:'sleep',label:'8h Sleep',icon:'😴'},
  {id:'sun',label:'Sun Exposure',icon:'☀️'},
  {id:'skincare',label:'Skincare',icon:'🫧'},
  {id:'pin',label:'Pinned Today',icon:'💉'},
  {id:'content',label:'Post Content',icon:'📲'},
  {id:'meditate',label:'Mindset',icon:'🧠'},
];

const GOALS_DEF = [
  {id:'bf',label:'Body Fat',target:10,unit:'%',icon:'🔥'},
  {id:'weight',label:'Lean Mass',target:80,unit:'kg',icon:'⚡'},
  {id:'tan',label:'Tan Progress',target:10,unit:'/10',icon:'☀️'},
  {id:'skin',label:'Skin Clarity',target:10,unit:'/10',icon:'✨'},
];

const LABS = [
  {key:'testosterone',label:'Testosterone (Total)',unit:'ng/dL',normal:'300–1000',warn:'On 450mg expect 1500–3000+',
    analyze(v){
      if(v<300) return {flag:'high',msg:'Low T detected. Check draw timing (mid-cycle, 48h after pin).',action:'Re-test mid-cycle. Check injection technique.'};
      if(v<=1000) return {flag:'low',msg:'Natural range. On 450mg Test E expect much higher — likely trough draw.',action:'Retest 48h after pin for accurate on-cycle reading.'};
      if(v<=3500) return {flag:'ok',msg:'✅ Expected on-cycle range. Levels look solid.',action:'Keep monitoring. No action needed.'};
      return {flag:'high',msg:'Very high. Monitor hematocrit and BP closely.',action:'Watch E2 and hematocrit. Consider dose review.'};
    }
  },
  {key:'alt',label:'ALT (Liver)',unit:'U/L',normal:'<40',warn:'Anavar raises this',
    analyze(v){
      if(v<=40) return {flag:'ok',msg:'✅ ALT normal. Liver handling Anavar well.',action:'Continue. Retest in 4 weeks.'};
      if(v<=80) return {flag:'low',msg:'⚠️ ALT mildly elevated (1–2x normal). Expected on Anavar.',action:'Add TUDCA 500mg/day. Zero alcohol. Retest in 2–3 weeks.'};
      if(v<=120) return {flag:'high',msg:'🚨 ALT significantly elevated (2–3x). Take action now.',action:'TUDCA 1000mg/day. Drop Anavar to 10mg. Retest in 2 weeks.'};
      return {flag:'high',msg:'🚨 ALT critically high. Serious liver stress.',action:'STOP Anavar immediately. TUDCA 1000mg/day. See a doctor.'};
    }
  },
  {key:'ast',label:'AST (Liver)',unit:'U/L',normal:'<40',warn:'Anavar raises this',
    analyze(v){
      if(v<=40) return {flag:'ok',msg:'✅ AST normal.',action:'Continue protocol.'};
      if(v<=80) return {flag:'low',msg:'⚠️ AST mildly elevated. Expected on Anavar.',action:'TUDCA 500mg/day. No alcohol. Monitor.'};
      if(v<=120) return {flag:'high',msg:'🚨 AST significantly elevated.',action:'TUDCA 1000mg/day. Reduce Anavar to 10mg. Retest in 2 weeks.'};
      return {flag:'high',msg:'🚨 AST critically elevated.',action:'Stop Anavar immediately. See a doctor. TUDCA 1000mg/day.'};
    }
  },
  {key:'hdl',label:'HDL Cholesterol',unit:'mg/dL',normal:'>40',warn:'Anavar significantly tanks HDL',
    analyze(v){
      if(v>=40) return {flag:'ok',msg:'✅ HDL acceptable.',action:'Maintain cardio and clean diet.'};
      if(v>=25) return {flag:'low',msg:'⚠️ HDL low. Anavar suppressing it.',action:'4g/day fish oil. Increase cardio. Cut saturated fat.'};
      return {flag:'high',msg:'🚨 HDL critically low. Cardiovascular risk.',action:'Consider reducing Anavar. 4–6g fish oil. Daily cardio. See a doctor.'};
    }
  },
  {key:'ldl',label:'LDL Cholesterol',unit:'mg/dL',normal:'<100',warn:'Can rise on cycle',
    analyze(v){
      if(v<100) return {flag:'ok',msg:'✅ LDL in good range.',action:'Maintain diet.'};
      if(v<130) return {flag:'low',msg:'⚠️ LDL borderline high.',action:'Increase omega-3s. Reduce processed foods.'};
      return {flag:'high',msg:'🚨 LDL elevated. Cardiovascular risk.',action:'4g fish oil. Clean diet hard. Cycle length review.'};
    }
  },
  {key:'hematocrit',label:'Hematocrit',unit:'%',normal:'38–50',warn:'Test raises this — clot risk',
    analyze(v){
      if(v<38) return {flag:'low',msg:'⚠️ Low hematocrit. Check iron/dehydration.',action:'Check iron and ferritin. Iron-rich foods. Retest.'};
      if(v<=50) return {flag:'ok',msg:'✅ Hematocrit normal.',action:'Stay hydrated. Monitor regularly.'};
      if(v<=54) return {flag:'low',msg:'⚠️ Elevated hematocrit. Blood thickening risk.',action:'Donate blood. Hydrate 4L+/day. Lower Test if persistent.'};
      return {flag:'high',msg:'🚨 Dangerously high hematocrit. Clot/stroke risk.',action:'Donate blood immediately. Stop or drastically reduce Test. See a doctor urgently.'};
    }
  },
  {key:'estradiol',label:'Estradiol E2 (sensitive)',unit:'pg/mL',normal:'20–40',warn:'Critical on cycle — AI if high',
    analyze(v){
      if(v<15) return {flag:'high',msg:'⚠️ E2 crashed. Joint pain, low libido, depression risk.',action:'STOP any AI. Allow E2 to rise naturally. Retest in 2 weeks.'};
      if(v<20) return {flag:'low',msg:'⚠️ E2 slightly low. Monitor.',action:'Hold AI. Retest in 2 weeks. Watch for joint pain.'};
      if(v<=40) return {flag:'ok',msg:'✅ E2 optimal. Perfect balance.',action:'No AI needed. Monitor every 4–6 weeks.'};
      if(v<=60) return {flag:'low',msg:'⚠️ E2 slightly elevated. Watch for water retention.',action:'Low-dose AI: Aromasin 6.25mg EOD or Anastrozole 0.25mg E3D. Retest in 3 weeks.'};
      if(v<=90) return {flag:'high',msg:'🚨 E2 high. Gyno and water retention risk.',action:'Aromasin 12.5mg EOD or Anastrozole 0.5mg E3D. Retest in 3 weeks.'};
      return {flag:'high',msg:'🚨 E2 very high. Gyno risk is real. Act now.',action:'Aromasin 25mg EOD or Anastrozole 0.5mg E2D. Add Nolvadex 20mg/day if nipple sensitivity. See doctor if lumps.'};
    }
  },
  {key:'creatinine',label:'Creatinine',unit:'mg/dL',normal:'0.7–1.2',warn:'Kidney marker',
    analyze(v){
      if(v<0.7) return {flag:'ok',msg:'Low but likely fine.',action:'Monitor.'};
      if(v<=1.2) return {flag:'ok',msg:'✅ Creatinine normal. Kidneys well.',action:'Stay hydrated.'};
      if(v<=1.5) return {flag:'low',msg:'⚠️ Mildly elevated. Could be dehydration or creatine.',action:'Drink more water. Retest hydrated.'};
      return {flag:'high',msg:'🚨 Significantly elevated. Kidney stress.',action:'Stop creatine if using. 4L+ water daily. See a doctor.'};
    }
  },
  {key:'psa',label:'PSA (Prostate)',unit:'ng/mL',normal:'<2.5',warn:'Test can raise PSA',
    analyze(v){
      if(v<2.5) return {flag:'ok',msg:'✅ PSA normal. Good baseline.',action:'Record baseline. Retest every 3 months on cycle.'};
      if(v<4) return {flag:'low',msg:'⚠️ PSA mildly elevated.',action:'Retest in 4 weeks. See doctor if rising.'};
      return {flag:'high',msg:'🚨 PSA significantly elevated.',action:'See a doctor before continuing.'};
    }
  },
  {key:'shbg',label:'SHBG',unit:'nmol/L',normal:'10–57',warn:'Anavar lowers SHBG → more free Test',
    analyze(v){
      if(v<10) return {flag:'high',msg:'⚠️ SHBG very low (Anavar effect). More androgenic activity.',action:'Monitor acne/hair thinning. If worsening, reduce Anavar.'};
      if(v<=57) return {flag:'ok',msg:'✅ SHBG in range.',action:'No action needed.'};
      return {flag:'low',msg:'SHBG high — less free T bioavailable.',action:'Rare on Anavar. Double-check result.'};
    }
  },
];

const DEFAULT_EXERCISES = [
  {id:'bench',name:'Bench Press',category:'Chest',unit:'kg'},
  {id:'squat',name:'Back Squat',category:'Legs',unit:'kg'},
  {id:'deadlift',name:'Deadlift',category:'Back',unit:'kg'},
  {id:'ohp',name:'OHP',category:'Shoulders',unit:'kg'},
  {id:'row',name:'Barbell Row',category:'Back',unit:'kg'},
  {id:'curl',name:'Barbell Curl',category:'Arms',unit:'kg'},
  {id:'rdl',name:'Romanian Deadlift',category:'Legs',unit:'kg'},
  {id:'dip',name:'Weighted Dip',category:'Chest',unit:'kg'},
  {id:'pullup',name:'Weighted Pull-Up',category:'Back',unit:'kg'},
  {id:'incline',name:'Incline DB Press',category:'Chest',unit:'kg'},
];

// ─── CYCLE MATH ───────────────────────────────────────────────────────────────
function getDayOfCycle(){return Math.max(0,Math.floor((new Date()-CYCLE_START)/86400000));}
function getWeekOfCycle(){return Math.floor(getDayOfCycle()/7)+1;}
function getCyclePct(){return Math.min((getDayOfCycle()/(CYCLE_WEEKS*7))*100,100);}
function fmtDate(d){return d.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});}
function getPCTDate(){const l=new Date(CYCLE_START);l.setDate(l.getDate()+CYCLE_WEEKS*7);const p=new Date(l);p.setDate(p.getDate()+14);return fmtDate(p);}
function getHCGStop(){const l=new Date(CYCLE_START);l.setDate(l.getDate()+CYCLE_WEEKS*7);const s=new Date(l);s.setDate(s.getDate()-4);return fmtDate(s);}
function getDailyQuote(){const d=Math.floor(Date.now()/86400000);return INSPIRATION[d%INSPIRATION.length];}

// ─── STATE ────────────────────────────────────────────────────────────────────
let state = {
  habits: {},
  dailyGoals: [],
  goalValues: {},
  bloodwork: {},
  labHistory: [],
  bodyStats: {weight:'',bf:'',waist:'',chest:'',arms:'',bp:'120/70'},
  sleep: {hours:'', quality:'', notes:''},
  brand: {name:'My Brand', tagline:'Building the long game.', socials:[]},
  phoneLog: [],
  workouts: [],
  exercises: DEFAULT_EXERCISES,
  currentWorkout: null,
  chatHistory: [],
  settings: {name:''},
  streak: 0,
};

// ─── INIT ─────────────────────────────────────────────────────────────────────
async function init() {
  await initDB();
  await loadAllState();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
  renderAll();
  setTimeout(() => {
    const splash = document.getElementById('splash');
    splash.classList.add('fade-out');
    setTimeout(() => splash.remove(), 600);
  }, 2000);
}

async function loadAllState() {
  const [habits, dailyGoals, goalValues, bloodwork, labHistory,
         bodyStats, sleep, brand, phoneLog, workouts, exercises, chatHistory, settings, streak] =
    await Promise.all([
      dbGet('habits', TODAY_KEY),
      dbGet('goals', 'daily_'+TODAY_KEY),
      dbGet('goals', 'values'),
      dbGet('bloodwork', 'current'),
      dbGet('labHistory', 'all'),
      dbGet('bodyStats', 'current'),
      dbGet('sleep', TODAY_KEY),
      dbGet('brand', 'profile'),
      dbGet('phoneLog', TODAY_KEY),
      dbGetAll('workouts'),
      dbGetAll('exercises'),
      dbGet('chatHistory', 'all'),
      dbGet('settings', 'user'),
      dbGet('settings', 'streak'),
    ]);
  if(habits) state.habits = habits.data || {};
  if(dailyGoals) state.dailyGoals = dailyGoals.data || [];
  if(goalValues) state.goalValues = goalValues.data || {};
  if(bloodwork) state.bloodwork = bloodwork.data || {};
  if(labHistory) state.labHistory = labHistory.data || [];
  if(bodyStats) state.bodyStats = {...state.bodyStats, ...bodyStats.data};
  if(sleep) state.sleep = {...state.sleep, ...sleep.data};
  if(brand) state.brand = {...state.brand, ...brand.data};
  if(phoneLog) state.phoneLog = phoneLog.data || [];
  if(workouts && workouts.length) state.workouts = workouts;
  if(exercises && exercises.length) state.exercises = exercises;
  if(chatHistory) state.chatHistory = chatHistory.data || [];
  if(settings) state.settings = {...state.settings, ...settings.data};
  if(streak) state.streak = streak.data || 0;
  checkStreak();
}

async function saveHabits(){await dbPut('habits',{id:TODAY_KEY,data:state.habits});}
async function saveDailyGoals(){await dbPut('goals',{id:'daily_'+TODAY_KEY,data:state.dailyGoals});}
async function saveGoalValues(){await dbPut('goals',{id:'values',data:state.goalValues});}
async function saveBloodwork(){await dbPut('bloodwork',{id:'current',data:state.bloodwork});}
async function saveLabHistory(){await dbPut('labHistory',{id:'all',data:state.labHistory});}
async function saveBodyStats(){await dbPut('bodyStats',{id:'current',data:state.bodyStats});}
async function saveSleep(){await dbPut('sleep',{id:TODAY_KEY,data:state.sleep});}
async function saveBrand(){await dbPut('brand',{id:'profile',data:state.brand});}
async function savePhoneLog(){await dbPut('phoneLog',{id:TODAY_KEY,data:state.phoneLog});}
async function saveChatHistory(){await dbPut('chatHistory',{id:'all',data:state.chatHistory});}
async function saveSettings(){await dbPut('settings',{id:'user',data:state.settings});}
async function saveStreak(){await dbPut('settings',{id:'streak',data:state.streak});}

function checkStreak(){
  const yesterday = new Date();yesterday.setDate(yesterday.getDate()-1);
  const yk = yesterday.toISOString().split('T')[0];
  dbGet('habits',yk).then(d=>{
    if(d && Object.values(d.data||{}).filter(Boolean).length >= 5) {
      const lastStreakKey = localStorage.getItem('lastStreakDate');
      if(lastStreakKey !== TODAY_KEY){
        state.streak = (state.streak||0)+1;
        localStorage.setItem('lastStreakDate',TODAY_KEY);
        saveStreak();
      }
    }
  });
}

// ─── RENDER ALL ───────────────────────────────────────────────────────────────
function renderAll() {
  renderHeader();
  renderDashboard();
  renderDaily();
  renderTrain();
  renderHealth();
  renderBrand();
  renderGoals();
  renderCoach();
}

// ─── HEADER ───────────────────────────────────────────────────────────────────
function renderHeader() {
  const week = getWeekOfCycle(), day = getDayOfCycle(), pct = getCyclePct();
  const name = state.settings.name || 'Dashboard';
  document.getElementById('header-name').textContent = name.toUpperCase();
  document.getElementById('week-day').textContent = `WEEK ${week} · DAY ${day}`;
  document.getElementById('cycle-bar').style.width = pct+'%';
  document.getElementById('cycle-pct').textContent = pct.toFixed(0)+'% DONE';
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function renderDashboard() {
  document.getElementById('inspo-text').textContent = `"${getDailyQuote()}"`;

  const day = getDayOfCycle(), week = getWeekOfCycle(), pct = getCyclePct();
  document.getElementById('dash-stat-week').textContent = `W${week}`;
  document.getElementById('dash-stat-day').textContent = day;
  document.getElementById('dash-stat-pct').textContent = pct.toFixed(0)+'%';

  renderDashHabits();
  renderDashGoalsMini();
  renderDashAlerts();
}

function renderDashHabits() {
  const grid = document.getElementById('dash-habits-grid');
  if(!grid) return;
  grid.innerHTML = '';
  let score = 0;
  DEFAULT_HABITS.forEach(h => {
    if(state.habits[h.id]) score++;
    const btn = document.createElement('button');
    btn.className = 'habit-btn'+(state.habits[h.id]?' done':'');
    btn.innerHTML = `<span class="habit-emoji">${h.icon}</span><span class="habit-label">${h.label}</span>${state.habits[h.id]?'<span class="habit-check">✓</span>':''}`;
    btn.onclick = async () => {
      state.habits[h.id] = !state.habits[h.id];
      await saveHabits();
      renderDashHabits();
    };
    grid.appendChild(btn);
  });
  const sc = document.getElementById('habit-score');
  if(sc){ sc.textContent = score+'/'+DEFAULT_HABITS.length; sc.style.color = score===DEFAULT_HABITS.length?'var(--green)':'var(--gold)'; }
}

function renderDashGoalsMini() {
  const grid = document.getElementById('dash-goals-mini');
  if(!grid) return;
  grid.innerHTML = '';
  GOALS_DEF.forEach(g => {
    const val = state.goalValues[g.id];
    const has = val !== undefined && val !== null && val !== '';
    const pct = has ? Math.min((parseFloat(val)/g.target)*100,100) : 0;
    const d = document.createElement('div');
    d.className = 'goal-mini';
    d.innerHTML = `<div class="goal-mini-icon">${g.icon}</div><div class="goal-mini-label">${g.label}</div><div class="goal-mini-value ${has?'has-data':''}">${has?val+g.unit:'—'}</div><div class="goal-mini-target">→ ${g.target}${g.unit}</div><div class="mini-bar-bg"><div class="mini-bar-fill" style="width:${pct}%"></div></div>`;
    grid.appendChild(d);
  });
}

function renderDashAlerts() {
  const el = document.getElementById('dash-alerts');
  if(!el) return;
  el.innerHTML = '';
  const week = getWeekOfCycle();
  const alerts = [];

  if(week === 6) alerts.push({cls:'yellow',title:'⚠️ Week 6 — Get Bloods TODAY',body:'Critical check-in week. Book your blood panel now: E2, ALT/AST, lipids, hematocrit.'});
  else if(week < 6) alerts.push({cls:'blue',title:`🩺 Blood Panel Due Week 6`,body:`${6-week} week(s) until your check-in. Book it now so you don't forget.`});
  else alerts.push({cls:'blue',title:'💊 Post-Week-6',body:'Keep monitoring. PCT date: '+getPCTDate()});

  LABS.forEach(m => {
    const val = state.bloodwork[m.key];
    if(!val || val==='') return;
    const r = m.analyze(parseFloat(val));
    if(r && r.flag !== 'ok') {
      alerts.push({cls:r.flag==='high'?'red':'yellow',title:(r.flag==='high'?'🚨 ':'⚠️ ')+m.label.split('(')[0].trim(),body:r.action});
    }
  });

  if(!alerts.length){
    el.innerHTML = '<div style="font-size:11px;color:#333;text-align:center;padding:12px 0">No active alerts ✓</div>';
    return;
  }
  alerts.forEach(a => {
    const d = document.createElement('div');
    d.className = 'alert-card '+a.cls;
    d.innerHTML = `<div class="alert-title" style="color:${a.cls==='red'?'var(--red)':a.cls==='yellow'?'var(--yellow)':a.cls==='green'?'var(--green)':'var(--aqua)'}">${a.title}</div><div class="alert-body">${a.body}</div>`;
    el.appendChild(d);
  });
}

// ─── DAILY / PLANNER ──────────────────────────────────────────────────────────
function renderDaily() {
  const el = document.getElementById('daily-goals-list');
  if(!el) return;
  el.innerHTML = '';
  const done = state.dailyGoals.filter(g=>g.done).length;
  const total = state.dailyGoals.length;
  const progress = document.getElementById('daily-progress');
  if(progress) progress.textContent = `${done} / ${total} COMPLETE`;

  state.dailyGoals.forEach((g, i) => {
    const d = document.createElement('div');
    d.className = 'goal-item'+(g.done?' done':'');
    d.innerHTML = `
      <div class="goal-check ${g.done?'checked':''}" onclick="toggleDailyGoal(${i})"></div>
      <span class="goal-text">${g.text}</span>
      <span class="goal-delete" onclick="deleteDailyGoal(${i})">✕</span>`;
    el.appendChild(d);
  });
}

async function toggleDailyGoal(i) {
  state.dailyGoals[i].done = !state.dailyGoals[i].done;
  await saveDailyGoals();
  renderDaily();
}
async function deleteDailyGoal(i) {
  state.dailyGoals.splice(i,1);
  await saveDailyGoals();
  renderDaily();
}
async function addDailyGoal() {
  const inp = document.getElementById('add-goal-inp');
  if(!inp || !inp.value.trim()) return;
  state.dailyGoals.push({text:inp.value.trim(),done:false,id:Date.now()});
  inp.value = '';
  await saveDailyGoals();
  renderDaily();
}

// ─── TRAIN ────────────────────────────────────────────────────────────────────
function renderTrain() {
  renderExerciseLibrary();
  renderWorkoutLog();
}

function renderExerciseLibrary() {
  const el = document.getElementById('exercise-library');
  if(!el) return;
  el.innerHTML = '';
  state.exercises.forEach(ex => {
    const history = getExerciseHistory(ex.id);
    const last = history[0];
    const pb = history.reduce((best, s) => Math.max(best, s.weight||0), 0);
    const d = document.createElement('div');
    d.className = 'exercise-card';
    d.innerHTML = `
      <div class="exercise-header" onclick="openExerciseModal('${ex.id}')">
        <div>
          <div class="exercise-name">${ex.name}</div>
          <div class="exercise-meta">${ex.category} · ${last?`Last: ${last.weight}kg×${last.reps}`:'No sessions yet'}</div>
        </div>
        <div style="text-align:right">
          ${pb?`<div class="exercise-pb">PB: ${pb}kg</div>`:''}
          <div style="font-size:10px;color:#444;margin-top:4px">TAP TO LOG →</div>
        </div>
      </div>`;
    el.appendChild(d);
  });
}

function getExerciseHistory(exId) {
  const sessions = [];
  state.workouts.forEach(w => {
    (w.exercises||[]).forEach(e => {
      if(e.exId === exId) {
        (e.sets||[]).forEach(s => {
          if(s.logged) sessions.push({...s, date:w.date});
        });
      }
    });
  });
  return sessions.sort((a,b)=>new Date(b.date)-new Date(a.date));
}

function renderWorkoutLog() {
  const el = document.getElementById('active-workout');
  if(!el) return;
  if(!state.currentWorkout) {
    el.innerHTML = `<div style="text-align:center;padding:24px 0;color:var(--muted)">
      <div style="font-size:32px;margin-bottom:10px">🏋️</div>
      <div style="font-size:13px;margin-bottom:14px">No active workout</div>
      <button class="btn-primary" onclick="startWorkout()">START WORKOUT</button>
    </div>`;
    return;
  }
  const w = state.currentWorkout;
  const elapsed = Math.floor((Date.now() - w.startTime)/60000);
  let html = `<div class="workout-header">
    <div>
      <div class="workout-title">${w.name||'WORKOUT'}</div>
      <div class="workout-meta">${elapsed}min · ${w.exercises.length} exercises</div>
    </div>
    <button class="btn-ghost" onclick="endWorkout()">Finish</button>
  </div>`;

  w.exercises.forEach((ex, ei) => {
    const exDef = state.exercises.find(e=>e.id===ex.exId)||{name:ex.exId};
    const history = getExerciseHistory(ex.exId);
    const lastSession = history[0];
    html += `<div class="exercise-card">
      <div class="exercise-header">
        <div>
          <div class="exercise-name">${exDef.name}</div>
          ${lastSession?`<div class="exercise-meta">Last: ${lastSession.weight}kg × ${lastSession.reps}</div>`:'<div class="exercise-meta">First session</div>'}
        </div>
        <button class="btn-ghost" style="font-size:9px" onclick="addSet(${ei})">+ SET</button>
      </div>
      <div style="display:grid;grid-template-columns:24px 1fr 1fr 32px;gap:8px;padding:6px 16px 4px;font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:1px">
        <span>#</span><span>KG</span><span>REPS</span><span></span>
      </div>`;
    ex.sets.forEach((set,si) => {
      html += `<div class="set-row">
        <span class="set-num">${si+1}</span>
        <input class="set-input" type="number" value="${set.weight||''}" placeholder="0" onchange="updateSet(${ei},${si},'weight',this.value)">
        <input class="set-input" type="number" value="${set.reps||''}" placeholder="0" onchange="updateSet(${ei},${si},'reps',this.value)">
        <button class="set-done-btn ${set.logged?'logged':''}" onclick="toggleSetLogged(${ei},${si})">${set.logged?'✓':''}</button>
      </div>`;
    });
    if(lastSession){
      const target = Math.ceil(lastSession.reps*1.05);
      html += `<div class="overload-tip">🎯 Progressive overload target: <strong>${lastSession.weight}kg × ${target} reps</strong></div>`;
    }
    html += '</div>';
  });

  html += `<div class="add-exercise-btn" onclick="openAddExerciseModal()">+ ADD EXERCISE</div>`;
  el.innerHTML = html;
}

async function startWorkout() {
  state.currentWorkout = {
    id: 'w_'+Date.now(),
    name: 'WORKOUT',
    date: TODAY_KEY,
    startTime: Date.now(),
    exercises: []
  };
  renderWorkoutLog();
}

async function endWorkout() {
  if(!state.currentWorkout) return;
  state.currentWorkout.endTime = Date.now();
  state.workouts.push(state.currentWorkout);
  await dbPut('workouts', state.currentWorkout);
  state.currentWorkout = null;
  renderWorkoutLog();
  renderExerciseLibrary();
}

function addSet(ei) {
  if(!state.currentWorkout) return;
  state.currentWorkout.exercises[ei].sets.push({weight:'',reps:'',logged:false});
  renderWorkoutLog();
}

function updateSet(ei, si, field, val) {
  if(!state.currentWorkout) return;
  state.currentWorkout.exercises[ei].sets[si][field] = parseFloat(val)||val;
}

async function toggleSetLogged(ei, si) {
  if(!state.currentWorkout) return;
  const set = state.currentWorkout.exercises[ei].sets[si];
  set.logged = !set.logged;
  renderWorkoutLog();
}

function openExerciseModal(exId) {
  const ex = state.exercises.find(e=>e.id===exId);
  if(!ex) return;
  if(state.currentWorkout) {
    const existing = state.currentWorkout.exercises.find(e=>e.exId===exId);
    if(!existing) {
      state.currentWorkout.exercises.push({exId, sets:[{weight:'',reps:'',logged:false}]});
    }
    renderWorkoutLog();
    switchTab('train');
  } else {
    startWorkout().then(()=>{
      state.currentWorkout.exercises.push({exId, sets:[{weight:'',reps:'',logged:false}]});
      renderWorkoutLog();
      switchTab('train');
    });
  }
}

function openAddExerciseModal() {
  document.getElementById('add-ex-modal').classList.add('open');
  renderAddExerciseList();
}

function renderAddExerciseList() {
  const el = document.getElementById('add-ex-list');
  if(!el) return;
  el.innerHTML = '';
  state.exercises.forEach(ex => {
    const d = document.createElement('div');
    d.className = 'search-result';
    d.innerHTML = `<div class="search-result-title">${ex.name}</div><div class="search-result-sub">${ex.category}</div>`;
    d.onclick = () => {
      if(state.currentWorkout) {
        if(!state.currentWorkout.exercises.find(e=>e.exId===ex.id)){
          state.currentWorkout.exercises.push({exId:ex.id,sets:[{weight:'',reps:'',logged:false}]});
        }
        renderWorkoutLog();
      }
      document.getElementById('add-ex-modal').classList.remove('open');
    };
    el.appendChild(d);
  });
}

async function addCustomExercise() {
  const nameInp = document.getElementById('custom-ex-name');
  const catInp = document.getElementById('custom-ex-cat');
  if(!nameInp.value.trim()) return;
  const ex = {id:'ex_'+Date.now(), name:nameInp.value.trim(), category:catInp.value||'Other', unit:'kg'};
  state.exercises.push(ex);
  await dbPut('exercises', ex);
  nameInp.value = ''; catInp.value = '';
  renderAddExerciseList();
  renderExerciseLibrary();
}

// ─── HEALTH ───────────────────────────────────────────────────────────────────
function renderHealth() {
  renderBodyStats();
  renderSleep();
  renderBloodwork();
  renderLabHistory();
}

function renderBodyStats() {
  const fields = ['weight','bf','waist','chest','arms','bp'];
  fields.forEach(f => {
    const el = document.getElementById('stat-'+f);
    if(el) el.value = state.bodyStats[f]||'';
  });
}

async function updateBodyStat(field, val) {
  state.bodyStats[field] = val;
  await saveBodyStats();
}

function renderSleep() {
  ['hours','quality','notes'].forEach(f => {
    const el = document.getElementById('sleep-'+f);
    if(el) el.value = state.sleep[f]||'';
  });
}

async function updateSleep(field, val) {
  state.sleep[field] = val;
  await saveSleep();
}

function renderBloodwork() {
  const list = document.getElementById('labs-list');
  if(!list) return;
  list.innerHTML = '';
  let hasAny = false;
  let alerts = [];

  LABS.forEach(m => {
    const val = state.bloodwork[m.key]||'';
    if(val) hasAny = true;
    const result = val ? m.analyze(parseFloat(val)) : null;
    let cardClass = 'lab-card';
    if(result){ if(result.flag==='high') cardClass+=' flag-high'; else if(result.flag==='low') cardClass+=' flag-low'; else cardClass+=' flag-ok'; }
    if(result && result.flag!=='ok') alerts.push({...result,label:m.label});

    const d = document.createElement('div');
    d.className = cardClass;
    d.innerHTML = `
      <div class="lab-top">
        <div>
          <div class="lab-name">${m.label}</div>
          <div class="lab-normal">Normal: ${m.normal} ${m.unit}</div>
          ${m.warn?`<div class="lab-warn">⚠️ ${m.warn}</div>`:''}
        </div>
        <div class="lab-input-wrap">
          <input class="lab-input" type="number" value="${val}" placeholder="—" />
          <span class="lab-unit">${m.unit}</span>
        </div>
      </div>
      ${result?`<div class="lab-flag ${result.flag==='ok'?'ok':result.flag==='high'?'high':'low'}"><strong>${result.msg}</strong><br><span style="opacity:.8;font-size:10px">→ ${result.action}</span></div>`:''}`;
    d.querySelector('.lab-input').addEventListener('input', async e => {
      state.bloodwork[m.key] = e.target.value;
      await saveBloodwork();
      renderBloodwork();
      renderDashAlerts();
    });
    list.appendChild(d);
  });

  // Summary
  const sumEl = document.getElementById('lab-summary');
  if(sumEl){
    if(hasAny){
      sumEl.style.display='block';
      const rows = document.getElementById('lab-summary-rows');
      if(rows){
        rows.innerHTML = LABS.map(m=>{
          const val=state.bloodwork[m.key];
          if(!val) return '';
          const r=m.analyze(parseFloat(val));
          const dot=r.flag==='ok'?'<span style="color:var(--green)">●</span>':r.flag==='high'?'<span style="color:var(--red)">●</span>':'<span style="color:var(--yellow)">●</span>';
          return `<div class="summary-row">${dot}<span style="color:#aaa;flex:1;margin:0 8px">${m.label.split('(')[0].trim()}</span><span style="font-weight:700;font-size:10px;color:${r.flag==='ok'?'var(--green)':r.flag==='high'?'var(--red)':'var(--yellow)'}">${r.flag.toUpperCase()}</span></div>`;
        }).join('');
      }
    } else { sumEl.style.display='none'; }
  }
}

async function saveLabPanel() {
  const hasAny = LABS.some(m=>state.bloodwork[m.key]&&state.bloodwork[m.key]!=='');
  if(!hasAny){alert('Enter at least one value first.');return;}
  const panel = {date:new Date().toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}),week:'Week '+getWeekOfCycle(),data:{...state.bloodwork}};
  state.labHistory.unshift(panel);
  if(state.labHistory.length>15) state.labHistory=state.labHistory.slice(0,15);
  await saveLabHistory();
  renderLabHistory();
  alert('Panel saved to history ✓');
}

function renderLabHistory() {
  const el = document.getElementById('lab-history');
  if(!el) return;
  el.innerHTML = '';
  if(!state.labHistory.length){
    el.innerHTML='<div style="font-size:11px;color:#333;text-align:center;padding:12px 0">No saved panels yet.</div>';
    return;
  }
  state.labHistory.forEach(panel=>{
    const d = document.createElement('div');
    d.className='history-panel';
    d.style.marginBottom='10px';
    let rows='';
    LABS.forEach(m=>{
      const val=panel.data[m.key];
      if(!val) return;
      const r=m.analyze(parseFloat(val));
      const dot=r.flag==='ok'?'<span style="color:var(--green)">●</span>':r.flag==='high'?'<span style="color:var(--red)">●</span>':'<span style="color:var(--yellow)">●</span>';
      rows+=`<div class="history-row">${dot}<span style="color:#888;flex:1;margin-left:6px">${m.label.split('(')[0].trim()}</span><span class="history-val">${val} ${m.unit}</span></div>`;
    });
    d.innerHTML=`<div class="history-label">${panel.week} · ${panel.date}</div>${rows}`;
    el.appendChild(d);
  });
}

// ─── BRAND ────────────────────────────────────────────────────────────────────
function renderBrand() {
  const nameEl = document.getElementById('brand-name-display');
  if(nameEl) nameEl.textContent = state.brand.name || 'My Brand';
  const tagEl = document.getElementById('brand-tagline-display');
  if(tagEl) tagEl.textContent = state.brand.tagline || '';
  renderSocials();
  renderPostHistory();
}

function renderSocials() {
  const el = document.getElementById('socials-list');
  if(!el) return;
  el.innerHTML = '';
  const socials = state.brand.socials || [];
  if(!socials.length){
    el.innerHTML = '<div style="font-size:11px;color:#333;text-align:center;padding:16px 0">No platforms added yet. Add one below.</div>';
    return;
  }
  socials.forEach((s,i) => {
    const icons = {TikTok:'🎵',Instagram:'📸',YouTube:'▶️',Twitter:'🐦',Other:'🌐'};
    const growth = s.history && s.history.length>1 ? s.followers-(s.history[s.history.length-2]||0) : 0;
    const d = document.createElement('div');
    d.className='social-card';
    d.innerHTML=`
      <div class="social-header">
        <div class="social-platform">
          <div class="social-icon" style="background:${s.color||'#1a1a1a'}">${icons[s.platform]||'🌐'}</div>
          <div>
            <div class="social-name">${s.platform}</div>
            <div class="social-handle">${s.handle||''}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <div class="live-dot"></div>
          <button class="btn-ghost" style="font-size:9px" onclick="deleteSocial(${i})">Remove</button>
        </div>
      </div>
      <div class="social-followers" style="color:${s.color||'var(--text)'}">
        <input class="followers-input" type="number" value="${s.followers||0}" onchange="updateFollowers(${i},this.value)" />
      </div>
      <div class="social-growth ${growth<0?'negative':''}">${growth>=0?'+':''}${growth} since last update</div>
      <div class="trend-line" id="trend-${i}"></div>`;
    el.appendChild(d);
    renderTrendLine('trend-'+i, s.history||[s.followers||0]);
  });
}

function renderTrendLine(elId, history) {
  const el = document.getElementById(elId);
  if(!el || !history.length) return;
  const max = Math.max(...history);
  el.innerHTML = history.map(v=>`<div class="trend-bar" style="height:${max?Math.max(4,(v/max)*36):4}px"></div>`).join('');
}

async function updateFollowers(i, val) {
  const s = state.brand.socials[i];
  s.history = [...(s.history||[]), parseInt(val)||0];
  s.followers = parseInt(val)||0;
  await saveBrand();
  renderSocials();
}

async function deleteSocial(i) {
  state.brand.socials.splice(i,1);
  await saveBrand();
  renderSocials();
}

async function addSocial() {
  const platform = document.getElementById('social-platform').value;
  const handle = document.getElementById('social-handle').value;
  const followers = parseInt(document.getElementById('social-followers-inp').value)||0;
  const colors = {TikTok:'#ff0050',Instagram:'#e1306c',YouTube:'#ff0000',Twitter:'#1da1f2',Other:'#888'};
  state.brand.socials = state.brand.socials||[];
  state.brand.socials.push({platform,handle,followers,color:colors[platform]||'#888',history:[followers]});
  await saveBrand();
  document.getElementById('add-social-modal').classList.remove('open');
  renderSocials();
}

function renderPostHistory() {
  const el = document.getElementById('post-dots');
  if(!el) return;
  const posted = (state.brand.postsToday || 0);
  el.innerHTML = Array.from({length:10},(_,i)=>`<div class="post-dot ${i<posted?'posted':''}" onclick="togglePostDot(${i})"></div>`).join('');
  const cnt = document.getElementById('posts-today-count');
  if(cnt) cnt.textContent = posted;
}

async function togglePostDot(i) {
  const current = state.brand.postsToday||0;
  state.brand.postsToday = i < current ? i : i+1;
  await saveBrand();
  renderPostHistory();
}

// ─── GOALS ────────────────────────────────────────────────────────────────────
function renderGoals() {
  const cont = document.getElementById('goals-full-list');
  if(!cont) return;
  cont.innerHTML = '';
  GOALS_DEF.forEach(g => {
    const val = state.goalValues[g.id]||'';
    const pct = val!==''?Math.min((parseFloat(val)/g.target)*100,100):0;
    const fc = pct>=100?'linear-gradient(90deg,#4ade80,#22c55e)':'linear-gradient(90deg,var(--gold),var(--pink))';
    const d = document.createElement('div');
    d.className='goal-full';
    d.innerHTML=`
      <div class="goal-full-top">
        <div class="goal-full-left">
          <span class="goal-full-icon">${g.icon}</span>
          <div><div class="goal-full-name">${g.label}</div><div class="goal-full-target">Target: ${g.target}${g.unit}</div></div>
        </div>
        <div><input class="goal-val-input" type="number" value="${val}" placeholder="—" /><div class="goal-unit">${g.unit}</div></div>
      </div>
      <div class="goal-bar-bg"><div class="goal-bar-fill" style="width:${pct}%;background:${fc}"></div></div>
      <div class="goal-bar-pct">${pct.toFixed(0)}% to target</div>`;
    cont.appendChild(d);
    d.querySelector('.goal-val-input').addEventListener('input', async e => {
      state.goalValues[g.id]=e.target.value;
      await saveGoalValues();
      renderDashGoalsMini();
      const np=e.target.value!==''?Math.min((parseFloat(e.target.value)/g.target)*100,100):0;
      const nfc=np>=100?'linear-gradient(90deg,#4ade80,#22c55e)':'linear-gradient(90deg,var(--gold),var(--pink))';
      d.querySelector('.goal-bar-fill').style.width=np+'%';
      d.querySelector('.goal-bar-fill').style.background=nfc;
      d.querySelector('.goal-bar-pct').textContent=np.toFixed(0)+'% to target';
    });
  });

  // Custom goals
  renderCustomGoals();
}

function renderCustomGoals() {
  const el = document.getElementById('custom-goals-list');
  if(!el) return;
  const custom = state.goalValues._custom || [];
  el.innerHTML = '';
  custom.forEach((g,i) => {
    const pct = g.current&&g.target?Math.min((g.current/g.target)*100,100):0;
    const d = document.createElement('div');
    d.className='goal-full';
    d.style.position='relative';
    d.innerHTML=`
      <button onclick="deleteCustomGoal(${i})" style="position:absolute;top:10px;right:10px;background:none;border:none;color:var(--dim);cursor:pointer;font-size:14px">✕</button>
      <div class="goal-full-top" style="padding-right:24px">
        <div class="goal-full-left">
          <span class="goal-full-icon">${g.icon||'🎯'}</span>
          <div><div class="goal-full-name">${g.name}</div><div class="goal-full-target">Target: ${g.target} ${g.unit}</div></div>
        </div>
        <div><input class="goal-val-input" type="number" value="${g.current||''}" placeholder="—" onchange="updateCustomGoal(${i},this.value)" /><div class="goal-unit">${g.unit}</div></div>
      </div>
      <div class="goal-bar-bg"><div class="goal-bar-fill" style="width:${pct}%;background:linear-gradient(90deg,var(--aqua),var(--pink))"></div></div>
      <div class="goal-bar-pct">${pct.toFixed(0)}% to target</div>`;
    el.appendChild(d);
  });
}

async function addCustomGoal() {
  const name=document.getElementById('cg-name').value.trim();
  const target=parseFloat(document.getElementById('cg-target').value);
  const unit=document.getElementById('cg-unit').value.trim()||'';
  const icon=document.getElementById('cg-icon').value.trim()||'🎯';
  if(!name||!target) return;
  const custom=state.goalValues._custom||[];
  custom.push({name,target,unit,icon,current:0});
  state.goalValues._custom=custom;
  await saveGoalValues();
  document.getElementById('cg-name').value='';
  document.getElementById('cg-target').value='';
  document.getElementById('cg-unit').value='';
  document.getElementById('cg-icon').value='';
  document.getElementById('add-goal-modal').classList.remove('open');
  renderGoals();
}

async function updateCustomGoal(i, val) {
  const custom=state.goalValues._custom||[];
  custom[i].current=parseFloat(val)||0;
  state.goalValues._custom=custom;
  await saveGoalValues();
  renderCustomGoals();
}

async function deleteCustomGoal(i) {
  const custom=state.goalValues._custom||[];
  custom.splice(i,1);
  state.goalValues._custom=custom;
  await saveGoalValues();
  renderCustomGoals();
}

// ─── COACH ────────────────────────────────────────────────────────────────────
function renderCoach() {
  const el = document.getElementById('chat-area');
  if(!el) return;
  el.innerHTML = '';
  if(!state.chatHistory.length){
    const welcome = {role:'ai',text:'Hey! I\'m your personal coach. Tell me how today went — training, food, sleep, phone usage — and I\'ll give you a step-by-step action plan to reach 10% BF and 80kg lean. What happened today?'};
    state.chatHistory.push(welcome);
  }
  state.chatHistory.slice(-20).forEach(msg => {
    const d = document.createElement('div');
    d.className=`msg ${msg.role}`;
    d.innerHTML=msg.text.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>');
    el.appendChild(d);
  });
  el.scrollTop = el.scrollHeight;
}

async function sendCoachMessage() {
  const inp = document.getElementById('coach-input');
  if(!inp||!inp.value.trim()) return;
  const userMsg = inp.value.trim();
  inp.value = '';
  state.chatHistory.push({role:'user',text:userMsg});
  await saveChatHistory();
  renderCoach();

  // Build context
  const week=getWeekOfCycle();
  const day=getDayOfCycle();
  const doneBF=state.goalValues.bf||'unknown';
  const doneWeight=state.goalValues.weight||'unknown';
  const habitsDone=Object.values(state.habits).filter(Boolean).length;
  const sleep=state.sleep.hours||'unknown';

  const systemPrompt=`You are a personal life coach and transformation advisor for a 19-year-old male on a physique and life improvement journey.
His context:
- Age: 19
- Goal: 10% body fat, 80kg lean body mass, deep tan, clear skin, brand building
- Current cycle: 450mg Test E (150mg Sun/Wed/Fri), 750 IU HCG (250 IU Sun/Wed/Fri), 20mg Anavar daily
- Started: 26 April 2026. Currently Week ${week}, Day ${day}
- Current BF: ${doneBF}%, Current weight: ${doneWeight}kg
- Habits done today: ${habitsDone}/10
- Sleep last night: ${sleep} hours
- Bloodwork alerts: ${LABS.filter(m=>state.bloodwork[m.key]).map(m=>{const r=m.analyze(parseFloat(state.bloodwork[m.key]));return r.flag!=='ok'?m.label+': '+r.flag:''}).filter(Boolean).join(', ')||'none'}

Give practical, specific, motivating advice. Be direct and honest. Format responses clearly with action steps when relevant. Use **bold** for key points. Keep responses concise but complete.`;

  // Use Anthropic API
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        model:'claude-sonnet-4-20250514',
        max_tokens:1000,
        system:systemPrompt,
        messages:state.chatHistory.filter(m=>m.role!=='ai'||state.chatHistory.indexOf(m)>0).map(m=>({
          role:m.role==='user'?'user':'assistant',
          content:m.text
        }))
      })
    });
    const data = await res.json();
    const reply = data.content?.[0]?.text || 'Sorry, I had trouble responding. Try again.';
    state.chatHistory.push({role:'ai',text:reply});
    await saveChatHistory();
    renderCoach();
  } catch(e){
    const fallback = generateFallbackResponse(userMsg);
    state.chatHistory.push({role:'ai',text:fallback});
    await saveChatHistory();
    renderCoach();
  }
}

function generateFallbackResponse(msg){
  const lower=msg.toLowerCase();
  const week=getWeekOfCycle();
  if(lower.includes('train')||lower.includes('gym')||lower.includes('workout')){
    return `**Training update received.**\n\nWeek ${week} of your cycle — this is when Test E is building up. Your strength should be improving.\n\n**Action steps:**\n1. Log your sets in the Train tab\n2. Always aim to beat last session by 1 rep or 2.5kg\n3. Prioritise compounds — they drive the most muscle growth\n4. Make sure you're eating enough protein (2g per kg bodyweight = 160g+)\n\nKeep pushing. The cycle amplifies effort, not laziness.`;
  }
  if(lower.includes('eat')||lower.includes('food')||lower.includes('diet')){
    return `**Diet check-in noted.**\n\nAt your stage — gaining lean mass while on cycle — nutrition is everything.\n\n**Non-negotiables:**\n1. **Protein:** 180-200g/day minimum (chicken, beef, eggs, fish)\n2. **Calories:** Slight surplus if building, slight deficit if cutting\n3. **Carbs around training** — oats pre, rice/potato post\n4. **Healthy fats:** Avocado, olive oil, nuts (supports hormone production)\n5. **Drink 3-4L water daily** — especially on Anavar (kidney health)\n\nLog what you actually ate and I can give more specific advice.`;
  }
  if(lower.includes('sleep')){
    return `**Sleep is where you grow.** On cycle this is even more critical.\n\n**Optimise tonight:**\n1. Room dark and cool (18°C)\n2. No screens 30min before bed\n3. Go to bed at the same time every night\n4. 7-9 hours minimum — GH releases during deep sleep\n\nPoor sleep = wasted cycle. Track your hours in the Health tab.`;
  }
  return `Got it. Keep focused on the fundamentals this week — training hard, eating right, sleeping 8 hours, and staying consistent with your protocol.\n\nWeek ${week} — you're ${getWeekOfCycle()/CYCLE_WEEKS*100|0}% through your cycle. Stay sharp. What specifically do you want to optimise?`;
}

// Voice input
let recognition = null;
function toggleVoice() {
  if(!('webkitSpeechRecognition' in window||'SpeechRecognition' in window)){
    alert('Voice input not supported on this browser. Try Chrome.');
    return;
  }
  const btn=document.getElementById('voice-btn');
  if(recognition){
    recognition.stop();recognition=null;
    btn.classList.remove('listening');
    return;
  }
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  recognition=new SR();
  recognition.continuous=false;
  recognition.interimResults=false;
  recognition.lang='en-GB';
  recognition.onresult=e=>{
    const inp=document.getElementById('coach-input');
    if(inp) inp.value=e.results[0][0].transcript;
  };
  recognition.onend=()=>{recognition=null;btn.classList.remove('listening');};
  recognition.start();
  btn.classList.add('listening');
}

// ─── PHONE LOG ────────────────────────────────────────────────────────────────
function renderPhoneLog() {
  const el=document.getElementById('phone-log-list');
  if(!el) return;
  el.innerHTML='';
  const apps=[
    {name:'Instagram',icon:'📸',color:'#e1306c'},
    {name:'TikTok',icon:'🎵',color:'#ff0050'},
    {name:'YouTube',icon:'▶️',color:'#ff0000'},
    {name:'Snapchat',icon:'👻',color:'#fffc00'},
    {name:'Messages',icon:'💬',color:'#34c759'},
    {name:'Other',icon:'📱',color:'#888'},
  ];
  const total=apps.reduce((s,a)=>s+(state.phoneLog.find(p=>p.app===a.name)?.minutes||0),0);
  apps.forEach(app=>{
    const entry=state.phoneLog.find(p=>p.app===app.name)||{app:app.name,minutes:0};
    const pct=total?Math.round((entry.minutes/total)*100):0;
    const d=document.createElement('div');
    d.className='app-usage-row';
    d.innerHTML=`
      <div class="app-usage-icon">${app.icon}</div>
      <div class="app-usage-name">${app.name}</div>
      <input type="number" value="${entry.minutes}" placeholder="0" style="width:60px;padding:4px 6px;font-size:12px;text-align:right" onchange="updatePhoneLog('${app.name}',this.value)" />
      <span style="font-size:10px;color:var(--muted);width:28px">min</span>
      <div class="usage-bar-wrap"><div class="usage-bar" style="width:${pct}%;background:${app.color}"></div></div>`;
    el.appendChild(d);
  });
  const totalEl=document.getElementById('total-screen-time');
  if(totalEl) totalEl.textContent=`${Math.floor(total/60)}h ${total%60}m today`;
}

async function updatePhoneLog(appName,val){
  const idx=state.phoneLog.findIndex(p=>p.app===appName);
  if(idx>=0) state.phoneLog[idx].minutes=parseInt(val)||0;
  else state.phoneLog.push({app:appName,minutes:parseInt(val)||0});
  await savePhoneLog();
  renderPhoneLog();
}

// ─── SEARCH ───────────────────────────────────────────────────────────────────
function openSearch() {
  document.getElementById('search-overlay').classList.add('open');
  document.getElementById('search-input').focus();
}
function closeSearch() {
  document.getElementById('search-overlay').classList.remove('open');
  document.getElementById('search-results').innerHTML='';
  document.getElementById('search-input').value='';
}
function handleSearch(val) {
  const el=document.getElementById('search-results');
  if(!el) return;
  el.innerHTML='';
  if(!val.trim()) return;
  const results=[
    {title:'Body Fat',sub:'Current: '+(state.goalValues.bf||'—')+'%',tab:'goals'},
    {title:'Blood Panel',sub:'Lab markers and analysis',tab:'health'},
    {title:'Start Workout',sub:'Open workout logger',tab:'train'},
    {title:'Coach Chat',sub:'Talk to your AI coach',tab:'coach'},
    {title:'Daily Goals',sub:'Today\'s checklist',tab:'daily'},
    {title:'Brand / Socials',sub:'Follower tracking',tab:'brand'},
    {title:'Sleep Log',sub:'Last night: '+(state.sleep.hours||'—')+'h',tab:'health'},
    {title:'Cycle Progress',sub:`Week ${getWeekOfCycle()} of ${CYCLE_WEEKS}`,tab:'dashboard'},
    ...state.exercises.map(e=>({title:e.name,sub:e.category,tab:'train'})),
  ].filter(r=>r.title.toLowerCase().includes(val.toLowerCase())||r.sub.toLowerCase().includes(val.toLowerCase()));

  results.slice(0,8).forEach(r=>{
    const d=document.createElement('div');
    d.className='search-result';
    d.innerHTML=`<div class="search-result-title">${r.title}</div><div class="search-result-sub">${r.sub}</div>`;
    d.onclick=()=>{closeSearch();switchTab(r.tab);};
    el.appendChild(d);
  });
  if(!results.length) el.innerHTML='<div style="color:var(--muted);font-size:12px;padding:12px 0">No results found</div>';
}

// ─── TABS ─────────────────────────────────────────────────────────────────────
function switchTab(name, btnEl) {
  document.querySelectorAll('.tab-content').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  const tabEl=document.getElementById('tab-'+name);
  if(tabEl) tabEl.classList.add('active');
  if(btnEl) btnEl.classList.add('active');
  else {
    const btn=document.querySelector(`.nav-btn[data-tab="${name}"]`);
    if(btn) btn.classList.add('active');
  }
  document.getElementById('content').scrollTop=0;

  // Lazy renders
  if(name==='health') renderHealth();
  if(name==='coach') renderCoach();
  if(name==='phonelog') renderPhoneLog();
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
async function saveSettingsForm(){
  state.settings.name=document.getElementById('settings-name').value.trim()||'Dashboard';
  state.brand.name=document.getElementById('settings-brand').value.trim()||state.brand.name;
  state.brand.tagline=document.getElementById('settings-tagline').value.trim()||state.brand.tagline;
  await saveSettings();
  await saveBrand();
  renderHeader();
  renderBrand();
  document.getElementById('settings-modal').classList.remove('open');
}

// ─── BOOT ─────────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', init);

// Expose globals
window.switchTab=switchTab;
window.toggleDailyGoal=toggleDailyGoal;
window.deleteDailyGoal=deleteDailyGoal;
window.addDailyGoal=addDailyGoal;
window.addSet=addSet;
window.updateSet=updateSet;
window.toggleSetLogged=toggleSetLogged;
window.openExerciseModal=openExerciseModal;
window.openAddExerciseModal=openAddExerciseModal;
window.addCustomExercise=addCustomExercise;
window.endWorkout=endWorkout;
window.startWorkout=startWorkout;
window.saveLabPanel=saveLabPanel;
window.updateBodyStat=updateBodyStat;
window.updateSleep=updateSleep;
window.addSocial=addSocial;
window.deleteSocial=deleteSocial;
window.updateFollowers=updateFollowers;
window.togglePostDot=togglePostDot;
window.addCustomGoal=addCustomGoal;
window.updateCustomGoal=updateCustomGoal;
window.deleteCustomGoal=deleteCustomGoal;
window.sendCoachMessage=sendCoachMessage;
window.toggleVoice=toggleVoice;
window.updatePhoneLog=updatePhoneLog;
window.openSearch=openSearch;
window.closeSearch=closeSearch;
window.handleSearch=handleSearch;
window.saveSettingsForm=saveSettingsForm;
window.renderAddExerciseList=renderAddExerciseList;
