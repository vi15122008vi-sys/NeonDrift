/* =========================================================
   NEON DRIFT 4D v5 — GRAND PRIX
   Круговые трассы · физика · режимы · AI · призрак
   ========================================================= */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const showcaseCanvas = document.getElementById('showcaseCanvas');
const showcaseCtx = showcaseCanvas ? showcaseCanvas.getContext('2d') : null;
let W = 800, H = 600;

function sizeCanvas(cvs, cx) {
    if (!cvs || !cx) return { w: 0, h: 0 };
    const rect = cvs.getBoundingClientRect();
    const w = Math.max(rect.width, 100);
    const h = Math.max(rect.height, 100);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cvs.width = w * dpr;
    cvs.height = h * dpr;
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w, h };
}

function resize() {
    const s = sizeCanvas(canvas, ctx);
    W = s.w; H = s.h;
    if (showcaseCanvas && showcaseCtx) sizeCanvas(showcaseCanvas, showcaseCtx);
}
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 200));

/* ====== ДОСТИЖЕНИЯ ====== */
const ACHIEVEMENTS = [
    { id:'first_race',   name:'FIRST RACE',      desc:'Завершить первую гонку',       check:s=>s.races>=1 },
    { id:'podium',       name:'PODIUM',          desc:'Финишировать в топ-3',         check:s=>s.lastPosition<=3 && s.lastPosition>0 },
    { id:'win',          name:'WINNER',          desc:'Победить в гонке',             check:s=>s.lastPosition===1 },
    { id:'win_5',        name:'CHAMPION',        desc:'5 побед',                      check:s=>s.wins>=5 },
    { id:'lap_1min',     name:'FAST LAP',        desc:'Круг меньше минуты',           check:s=>s.bestLap>0 && s.bestLap<60 },
    { id:'lap_45s',      name:'ALIEN',           desc:'Круг меньше 45 секунд',        check:s=>s.bestLap>0 && s.bestLap<45 },
    { id:'combo_8',      name:'COMBO x8',        desc:'Достичь комбо x8',             check:s=>s.maxCombo>=8 },
    { id:'drift_5s',     name:'DRIFT KING',      desc:'Дрифтовать 5 секунд',          check:s=>s.longestDrift>=5 },
    { id:'nos_10',       name:'NITRO MASTER',    desc:'Использовать нитро 10 раз',    check:s=>s.nitroUses>=10 },
    { id:'coins_10k',    name:'RICH',            desc:'10 000 монет всего',           check:s=>s.totalCoins>=10000 },
    { id:'coins_100k',   name:'MAGNATE',         desc:'100 000 монет всего',          check:s=>s.totalCoins>=100000 },
    { id:'cars_10',      name:'COLLECTOR',       desc:'10 машин в гараже',            check:s=>s.unlockedCount>=10 },
    { id:'cars_25',      name:'ENTHUSIAST',      desc:'25 машин',                     check:s=>s.unlockedCount>=25 },
    { id:'cars_50',      name:'FULL GARAGE',     desc:'Все 50 машин',                 check:s=>s.unlockedCount>=50 },
    { id:'tracks_all',   name:'EXPLORER',        desc:'Проехать на всех 4 трассах',   check:s=>Object.keys(s.tracksPlayed||{}).length>=4 },
    { id:'gp_win',       name:'GP CHAMPION',     desc:'Победить в Grand Prix',        check:s=>s.modesWon && s.modesWon.gp },
    { id:'elim_win',     name:'SURVIVOR',        desc:'Победить в Elimination',       check:s=>s.modesWon && s.modesWon.elimination },
    { id:'tt_win',       name:'TIME LORD',       desc:'Побить свой рекорд в Time Trial', check:s=>s.ttRecord>0 },
    { id:'total_dist_50',name:'HALF CENTURY',    desc:'Всего 50 км',                  check:s=>s.totalDist>=50000 },
    { id:'total_dist_500',name:'ROAD WARRIOR',   desc:'Всего 500 км',                 check:s=>s.totalDist>=500000 }
];

const STATS_KEY='nd5_stats', ACHV_KEY='nd5_achv', COINS_KEY='nd5_coins', OWNED_KEY='nd5_owned', GHOST_KEY='nd5_ghost';

function defaultStats(){
    return {
        races:0, wins:0, totalDist:0, totalCoins:0, maxCombo:1, longestDrift:0,
        nitroUses:0, bestLap:0, lastPosition:0, ttRecord:0,
        modesWon:{gp:false, elimination:false, time_trial:false},
        tracksPlayed:{}, unlockedCount:0
    };
}
function loadStats(){try{return Object.assign(defaultStats(),JSON.parse(localStorage.getItem(STATS_KEY)||'{}'));}catch{return defaultStats();}}
function saveStats(s){try{localStorage.setItem(STATS_KEY,JSON.stringify(s));}catch{}}
function loadAchv(){try{return JSON.parse(localStorage.getItem(ACHV_KEY)||'{}');}catch{return {};}}
function saveAchv(a){try{localStorage.setItem(ACHV_KEY,JSON.stringify(a));}catch{}}
function loadCoins(){return +(localStorage.getItem(COINS_KEY)||0);}
function saveCoins(c){try{localStorage.setItem(COINS_KEY,c);}catch{}}
function loadOwned(){try{const a=JSON.parse(localStorage.getItem(OWNED_KEY)||'[]');return Array.isArray(a)&&a.length?a:null;}catch{return null;}}
function saveOwned(a){try{localStorage.setItem(OWNED_KEY,JSON.stringify(a));}catch{}}

applyCustomToCars();

let coins = loadCoins();
let owned = loadOwned();
if (!owned) { owned = CARS.filter(c => c.price === 0).map(c => c.id); saveOwned(owned); }
for (const c of CARS) c.unlocked = owned.includes(c.id);

let stats = loadStats();
stats.unlockedCount = owned.length;
let achvState = loadAchv();

/* ====== ВЫБОР ====== */
let selectedCar = CARS.find(c => c.unlocked) || CARS[0];
let selectedTrackKey = 'oval';
let selectedTireKey = 'medium';
let selectedModeKey = 'gp';

/* ====== СОСТОЯНИЕ ====== */
const state = {
    running:false, paused:false, over:false, finished:false,
    countdown:3.99, started:false,
    player:null,
    aiCars:[],
    coinDrops:[],
    particles:[],
    floatTexts:[],
    ghostFrames:[], ghostFrameIdx:0, currentGhost:null,
    time:0,
    cameraShake:0, cameraTilt:0,
    flashTimer:0, chromaticTimer:0,
    nitro:1, nitroActive:false,
    combo:1, comboTimer:0, maxCombo:1,
    sessionCoins:0,
    lap:1, lapTotal:3, lapTimer:0, lapStartTime:0, bestLap:0, lapTimes:[],
    playerProgress:0, playerRank:1,
    eliminationTimer:30,
    finishOrder:[],
    driftTimer:0, longestDrift:0, nitroUses:0,
    weather:'clear', weatherTimer:22,
    hue:190,
    coinSpawnTimer:0,
    pitting:false
};

/* ====== ВВОД ====== */
const keys = {};
const touchState = { left:false, right:false, gas:false, brake:false, nitro:false };

document.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    keys[k] = true;
    if (e.key === ' ') { e.preventDefault(); if (state.running && !state.over) togglePause(); }
});
document.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

function bindTouchButton(selector, keyName) {
    const btn = document.querySelector(selector);
    if (!btn || btn.dataset.bound === '1') return;
    btn.dataset.bound = '1';
    const on = e => { e.preventDefault(); touchState[keyName]=true; btn.classList.add('active'); };
    const off = e => { e.preventDefault(); touchState[keyName]=false; btn.classList.remove('active'); };
    btn.addEventListener('touchstart', on, {passive:false});
    btn.addEventListener('touchend', off, {passive:false});
    btn.addEventListener('touchcancel', off, {passive:false});
    btn.addEventListener('mousedown', on);
    btn.addEventListener('mouseup', off);
    btn.addEventListener('mouseleave', off);
}
function bindAllTouchButtons(){
    bindTouchButton('.dpad-left','left');
    bindTouchButton('.dpad-right','right');
    bindTouchButton('.pedal-gas','gas');
    bindTouchButton('.pedal-brake','brake');
    bindTouchButton('.nitro-btn','nitro');
}

/* ====== UI ====== */
const $ = id => document.getElementById(id);
const startScreen = $('startScreen');
const gameOverScreen = $('gameOverScreen');
const pauseScreen = $('pauseScreen');
const hud = $('hud');
const countdownEl = $('countdown');
const touchControls = $('touchControls');
const speedEl = $('speed'), speedFill = $('speedFill');
const lapEl = $('lap'), lapTimeEl = $('lapTime');
const positionEl = $('position'), gapEl = $('gap');
const nitroFill = $('nitroFill'), tireEl = $('tire');
const carsGrid = $('carsGrid');
const carInfo = $('carInfo');
const classFilter = $('classFilter');
const achvGrid = $('achvGrid');
const statsGrid = $('statsGrid');
const colorSwatches = $('colorSwatches');
const neonSwatches = $('neonSwatches');
const wheelPicks = $('wheelPicks');
const resultsGrid = $('resultsGrid');
const raceResultTitle = $('raceResultTitle');
const modesGrid = $('modesGrid');
const trackPicker = $('trackPicker');
const tirePicker = $('tirePicker');

/* ====== ТАБЫ ====== */
document.querySelectorAll('.tab').forEach(tab => {
    tab.onclick = () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const t = tab.dataset.tab;
        const panel = document.getElementById('tab-' + t);
        if (panel) panel.classList.add('active');
        AUDIO.click();
        if (t === 'achv') renderAchievements();
        if (t === 'stats') renderStats();
        if (t === 'modes') renderModes();
        if (t === 'garage') { renderGarage(); renderShowcase(); }
    };
});

/* ====== НАСТРОЙКИ ====== */
const soundOn=$('soundOn'), volumeSlider=$('volume'), musicOn=$('musicOn');
const ghostOn=$('ghostOn'), touchOn=$('touchOn'), shakeOn=$('shakeOn');

soundOn.checked = localStorage.getItem('nd5_sound') !== '0';
volumeSlider.value = +(localStorage.getItem('nd5_vol') || 60);
musicOn.checked = localStorage.getItem('nd5_music') !== '0';
ghostOn.checked = localStorage.getItem('nd5_ghost') !== '0';
touchOn.checked = localStorage.getItem('nd5_touch') !== '0';
shakeOn.checked = localStorage.getItem('nd5_shake') !== '0';

AUDIO.enabled = soundOn.checked;
AUDIO.volume = +volumeSlider.value / 100;
AUDIO.musicOn = musicOn.checked;

soundOn.onchange = () => { AUDIO.setEnabled(soundOn.checked); localStorage.setItem('nd5_sound', soundOn.checked?'1':'0'); };
volumeSlider.oninput = () => { AUDIO.setVolume(+volumeSlider.value/100); localStorage.setItem('nd5_vol', volumeSlider.value); };
musicOn.onchange = () => { AUDIO.musicOn = musicOn.checked; localStorage.setItem('nd5_music', musicOn.checked?'1':'0'); };
ghostOn.onchange = () => { localStorage.setItem('nd5_ghost', ghostOn.checked?'1':'0'); };
touchOn.onchange = () => { localStorage.setItem('nd5_touch', touchOn.checked?'1':'0'); updateTouchVisibility(); };
shakeOn.onchange = () => { localStorage.setItem('nd5_shake', shakeOn.checked?'1':'0'); };

function updateTouchVisibility() {
    const show = touchOn.checked && state.running && !state.over && !state.paused;
    touchControls.classList.toggle('hidden', !show);
}

$('resetStats').onclick = () => {
    if (!confirm('Сбросить всю статистику?')) return;
    localStorage.removeItem(STATS_KEY);
    localStorage.removeItem(ACHV_KEY);
    stats = defaultStats();
    achvState = {};
    renderStats(); renderAchievements();
};

/* ====== ГАРАЖ ====== */
let classFilterValue = 'ALL';
function renderFilter() {
    if (!classFilter) return;
    classFilter.innerHTML = '';
    const opts = ['ALL','D','C','B','A','S'];
    for (const o of opts) {
        const btn = document.createElement('button');
        btn.className = 'filter-btn' + (o === classFilterValue ? ' active' : '');
        btn.textContent = o === 'ALL' ? 'ALL' : o;
        btn.onclick = () => { classFilterValue = o; renderFilter(); renderGarage(); AUDIO.click(); };
        classFilter.appendChild(btn);
    }
}

function renderGarage() {
    if (!carsGrid) return;
    carsGrid.innerHTML = '';
    const filtered = classFilterValue === 'ALL' ? CARS : CARS.filter(c => c.cls === classFilterValue);
    for (const car of filtered) {
        const card = document.createElement('div');
        card.className = 'car-card' + (car.id === selectedCar.id ? ' selected' : '') + (car.unlocked ? '' : ' locked');

        const cvs = document.createElement('canvas');
        cvs.className = 'car-preview';
        cvs.width = 180; cvs.height = 120;
        card.appendChild(cvs);

        const priceTag = car.unlocked
            ? `<div class="owned-badge">✓</div>`
            : `<div class="car-price">💰 ${car.price.toLocaleString()}</div>`;
        card.insertAdjacentHTML('beforeend', `
            <div class="car-name">${car.name}</div>
            <div class="car-class">${CAR_CLASSES[car.cls].name.toUpperCase()}</div>
            ${priceTag}
            ${car.unlocked ? '' : '<div class="lock-icon">🔒</div>'}
        `);

        const cctx = cvs.getContext('2d');
        drawCarShape(cctx, car, 60, 100);

        card.addEventListener('click', () => {
            if (car.unlocked) {
                selectedCar = car;
                AUDIO.click();
                renderGarage();
                renderShowcase();
            } else {
                tryPurchase(car, card);
            }
        });
        carsGrid.appendChild(card);
    }
    renderShowcase();
}

function tryPurchase(car, card) {
    if (coins >= car.price) {
        if (!confirm(`Купить ${car.name} за ${car.price.toLocaleString()} монет?`)) return;
        coins -= car.price;
        saveCoins(coins);
        owned.push(car.id);
        saveOwned(owned);
        car.unlocked = true;
        stats.unlockedCount = owned.length;
        saveStats(stats);
        AUDIO.purchase();
        selectedCar = car;
        renderGarage();
    } else {
        AUDIO.click();
        card.animate([
            {transform:'translateX(0)'},{transform:'translateX(-5px)'},
            {transform:'translateX(5px)'},{transform:'translateX(0)'}
        ], {duration:220});
    }
}

function renderShowcase() {
    if (carInfo) {
        const c = selectedCar;
        carInfo.innerHTML = `
            <div class="info-name">${c.name}</div>
            <div class="info-class">${CAR_CLASSES[c.cls].name.toUpperCase()}</div>
            <div class="info-desc">${c.desc || 'Гоночный автомобиль класса ' + c.cls}</div>
            <div class="stat-bars">
                <div class="stat-row">SPEED <div class="stat-track"><div style="width:${c.stats.speed*10}%"></div></div></div>
                <div class="stat-row">HANDLING <div class="stat-track"><div style="width:${c.stats.handling*10}%"></div></div></div>
                <div class="stat-row">NITRO <div class="stat-track"><div style="width:${c.stats.nitro*10}%"></div></div></div>
            </div>
        `;
    }

    if (showcaseCtx && showcaseCanvas) {
        const s = sizeCanvas(showcaseCanvas, showcaseCtx);
        showcaseCtx.clearRect(0, 0, s.w, s.h);
        const carW = Math.min(s.w * 0.35, 180);
        const carH = carW * (selectedCar.h / selectedCar.w);
        showcaseCtx.save();
        showcaseCtx.translate(s.w / 2, s.h * 0.55);
        drawCarShape(showcaseCtx, selectedCar, carW, carH);
        showcaseCtx.restore();
    }

    if (colorSwatches) {
        colorSwatches.innerHTML = '';
        COLOR_PALETTE.forEach(col => {
            const sw = document.createElement('div');
            sw.className = 'swatch' + (col === selectedCar.bodyColor ? ' active' : '');
            sw.style.background = col;
            sw.onclick = () => {
                selectedCar.bodyColor = col;
                const c = loadCustom();
                c[selectedCar.id] = Object.assign(c[selectedCar.id] || {}, { bodyColor: col });
                saveCustom(c);
                renderGarage(); renderShowcase(); AUDIO.click();
            };
            colorSwatches.appendChild(sw);
        });
    }
    if (neonSwatches) {
        neonSwatches.innerHTML = '';
        NEON_PALETTE.forEach(col => {
            const sw = document.createElement('div');
            sw.className = 'swatch' + (col === selectedCar.neonColor ? ' active' : '');
            sw.style.background = col;
            sw.style.boxShadow = `0 0 6px ${col}`;
            sw.onclick = () => {
                selectedCar.neonColor = col;
                const c = loadCustom();
                c[selectedCar.id] = Object.assign(c[selectedCar.id] || {}, { neonColor: col });
                saveCustom(c);
                renderGarage(); renderShowcase(); AUDIO.click();
            };
            neonSwatches.appendChild(sw);
        });
    }
    if (wheelPicks) {
        wheelPicks.innerHTML = '';
        for (let i = 0; i < WHEEL_STYLES; i++) {
            const wp = document.createElement('div');
            wp.className = 'wheel-pick' + (i === selectedCar.wheelStyle ? ' active' : '');
            wp.textContent = '◉';
            wp.onclick = () => {
                selectedCar.wheelStyle = i;
                const c = loadCustom();
                c[selectedCar.id] = Object.assign(c[selectedCar.id] || {}, { wheelStyle: i });
                saveCustom(c);
                renderGarage(); renderShowcase(); AUDIO.click();
            };
            wheelPicks.appendChild(wp);
        }
    }
}

/* ====== РЕЖИМЫ ====== */
function renderModes() {
    if (modesGrid) {
        modesGrid.innerHTML = '';
        for (const key in RACE_MODES) {
            const m = RACE_MODES[key];
            const el = document.createElement('div');
            el.className = 'mode-card' + (key === selectedModeKey ? ' selected' : '');
            el.innerHTML = `
                <div class="mode-badge">${m.badge}</div>
                <h3>${m.name}</h3>
                <p>${m.desc}</p>
            `;
            el.onclick = () => { selectedModeKey = key; renderModes(); AUDIO.click(); };
            modesGrid.appendChild(el);
        }
    }
    if (trackPicker) {
        trackPicker.innerHTML = '';
        for (const key in TRACKS) {
            const t = TRACKS[key];
            const btn = document.createElement('button');
            btn.className = 'track-btn' + (key === selectedTrackKey ? ' active' : '');
            btn.textContent = t.name;
            btn.onclick = () => { selectedTrackKey = key; renderModes(); AUDIO.click(); };
            trackPicker.appendChild(btn);
        }
    }
    if (tirePicker) {
        tirePicker.innerHTML = '';
        for (const key of TIRE_KEYS) {
            const t = TIRES[key];
            const btn = document.createElement('button');
            btn.className = 'tire-btn' + (key === selectedTireKey ? ' active' : '');
            btn.textContent = t.name;
            btn.style.color = key === selectedTireKey ? t.color : '';
            btn.onclick = () => { selectedTireKey = key; renderModes(); AUDIO.click(); };
            tirePicker.appendChild(btn);
        }
    }
}

/* ====== ДОСТИЖЕНИЯ ====== */
function renderAchievements() {
    if (!achvGrid) return;
    achvGrid.innerHTML = '';
    for (const a of ACHIEVEMENTS) {
        const done = !!achvState[a.id];
        const el = document.createElement('div');
        el.className = 'achv-card' + (done ? ' done' : '');
        el.innerHTML = `
            <div class="achv-icon">${done ? '★' : '?'}</div>
            <div>
                <div class="achv-name">${a.name}</div>
                <div class="achv-desc">${a.desc}</div>
            </div>
        `;
        achvGrid.appendChild(el);
    }
}

function checkAchievements() {
    const newly = [];
    for (const a of ACHIEVEMENTS) {
        if (!achvState[a.id] && a.check(stats)) {
            achvState[a.id] = true;
            newly.push(a);
        }
    }
    if (newly.length) {
        saveAchv(achvState);
        const toast = $('achvToast');
        if (toast) {
            toast.textContent = '★ ' + newly[newly.length - 1].name;
            toast.classList.remove('hidden');
            setTimeout(() => toast.classList.add('hidden'), 3500);
        }
        AUDIO.levelUp();
    }
}

/* ====== СТАТИСТИКА ====== */
function renderStats() {
    if (!statsGrid) return;
    const s = stats;
    const items = [
        ['RACES', s.races],
        ['WINS', s.wins],
        ['BEST LAP', s.bestLap > 0 ? formatLapTime(s.bestLap) : '—'],
        ['DISTANCE', (s.totalDist/1000).toFixed(1) + ' km'],
        ['COINS', s.totalCoins.toLocaleString()],
        ['MAX COMBO', 'x' + s.maxCombo],
        ['LONGEST DRIFT', s.longestDrift.toFixed(1) + 's'],
        ['CARS', s.unlockedCount + ' / 50']
    ];
    statsGrid.innerHTML = '';
    for (const [label, value] of items) {
        const el = document.createElement('div');
        el.className = 'stat-card';
        el.innerHTML = `<div class="stat-card-label">${label}</div><div class="stat-card-value">${value}</div>`;
        statsGrid.appendChild(el);
    }
}

function formatLapTime(sec) {
    if (!isFinite(sec) || sec <= 0) return '--:--.--';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec * 100) % 100);
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${String(ms).padStart(2,'0')}`;
}

/* ====== КНОПКИ ====== */
$('startBtn').onclick = async () => {
    AUDIO.init();
    await AUDIO.ensureResumeAsync();
    AUDIO.click();
    startGame();
};
$('restartBtn').onclick = () => { AUDIO.click(); startGame(); };
if ($('pauseBtn')) $('pauseBtn').onclick = () => { AUDIO.click(); togglePause(); };
$('resumeBtn').onclick = () => { AUDIO.click(); togglePause(); };
$('menuBtn').onclick = () => { AUDIO.click(); toMenu(); };
$('quitBtn').onclick = () => { AUDIO.click(); toMenu(); };

function toMenu() {
    state.running = false;
    state.paused = false;
    state.over = false;
    state.flashTimer = 0;
    state.chromaticTimer = 0;
    AUDIO.stopEngine(); AUDIO.stopNitro(); AUDIO.stopMusic();
    startScreen.classList.remove('hidden');
    gameOverScreen.classList.add('hidden');
    pauseScreen.classList.add('hidden');
    countdownEl.classList.add('hidden');
    hud.classList.add('hidden');
    touchControls.classList.add('hidden');
    renderGarage();
}

/* ====== СТАРТ ====== */
function startGame() {
    Object.assign(state, {
        running:false, paused:false, over:false, finished:false,
        countdown:3.99, started:false,
        player:null, aiCars:[],
        coinDrops:[], particles:[], floatTexts:[],
        ghostFrames:[], ghostFrameIdx:0,
        time:0, cameraShake:0, cameraTilt:0,
        flashTimer:0, chromaticTimer:0,
        nitro:1, nitroActive:false,
        combo:1, comboTimer:0, maxCombo:1,
        sessionCoins:0,
        lap:1, lapTotal:TRACKS[selectedTrackKey].laps,
        lapTimer:0, lapStartTime:0, bestLap:0, lapTimes:[],
        playerProgress:0, playerRank:1,
        eliminationTimer:30,
        finishOrder:[],
        driftTimer:0, longestDrift:0, nitroUses:0,
        weather:'clear', weatherTimer:22,
        hue:TRACKS[selectedTrackKey].hue,
        coinSpawnTimer:0,
        pitting:false
    });

    state.player = new CarPhysics(selectedCar, TIRES[selectedTireKey]);
    state.player.x = 0;

    if (selectedModeKey === 'gp') {
        const pool = CARS.filter(c => c.id !== selectedCar.id);
        for (let i = 0; i < 5; i++) {
            const car = pool[Math.floor(Math.random() * pool.length)];
            const tires = TIRES[TIRE_KEYS[Math.floor(Math.random() * TIRE_KEYS.length)]];
            const phys = new CarPhysics(car, tires);
            phys.x = (i - 2) * 0.35;
            state.aiCars.push({
                physics: phys,
                car,
                progress: -0.004 * (i + 1),
                lap: 1,
                rank: i + 2,
                skill: 0.92 + Math.random() * 0.12,
                eliminated: false,
                finished: false
            });
        }
    }

    state.currentGhost = (ghostOn.checked && selectedModeKey === 'time_trial') ? loadGhost() : null;
    state.ghostFrames = [];

    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    pauseScreen.classList.add('hidden');
    hud.classList.remove('hidden');
    touchControls.classList.remove('hidden');

    document.querySelectorAll('.ctrl-btn').forEach(b => b.classList.remove('active'));
    for (const k in touchState) touchState[k] = false;

    updateTouchVisibility();
    startCountdown();
}

/* ====== ОТСЧЁТ ====== */
function startCountdown() {
    state.countdown = 3.99;
    state.started = false;
    state.running = true;
    countdownEl.classList.remove('hidden');
    tickCountdown();
}

function tickCountdown() {
    if (state.countdown > 0) {
        const num = Math.ceil(state.countdown);
        const label = num > 0 ? String(num) : 'GO';
        if (countdownEl.textContent !== label) {
            countdownEl.textContent = label;
            countdownEl.style.animation = 'none';
            void countdownEl.offsetWidth;
            countdownEl.style.animation = 'cdPulse 0.9s ease-out';
        }
        requestAnimationFrame(tickCountdown);
    } else {
        countdownEl.classList.add('hidden');
        state.started = true;
        AUDIO.startEngine();
        if (AUDIO.musicOn) AUDIO.startMusic();
    }
}

function togglePause() {
    if (!state.running || state.over) return;
    state.paused = !state.paused;
    pauseScreen.classList.toggle('hidden', !state.paused);
    updateTouchVisibility();
    for (const k in touchState) touchState[k] = false;
    document.querySelectorAll('.ctrl-btn').forEach(b => b.classList.remove('active'));
    if (state.paused) {
        AUDIO.stopEngine(); AUDIO.stopNitro(); AUDIO.stopMusic();
    } else {
        AUDIO.startEngine();
        if (AUDIO.musicOn) AUDIO.startMusic();
    }
}

function vibrate(ms) {
    if (!shakeOn.checked) return;
    if (navigator.vibrate) navigator.vibrate(ms);
}

/* ====== ФИНИШ ====== */
function endGame(finishedNaturally) {
    if (state.over) return;
    state.over = true;
    state.running = false;
    state.paused = false;
    state.finished = !!finishedNaturally;
    state.flashTimer = finishedNaturally ? 0 : 0.5;
    state.chromaticTimer = finishedNaturally ? 0.3 : 0.8;
    if (!finishedNaturally) {
        state.cameraShake = 1.4;
        spawnCrashParticles();
        AUDIO.crash();
        vibrate([200, 80, 200]);
    }
    AUDIO.stopEngine(); AUDIO.stopNitro(); AUDIO.stopMusic();
    updateTouchVisibility();

    const raceTime = state.time;
    const playerRank = computePlayerRank();

    stats.races += 1;
    const progress = Number(state.playerProgress) || 0;
    stats.totalDist += Math.max(0, Math.floor(progress * 5000));
    stats.totalCoins += state.sessionCoins;
    stats.maxCombo = Math.max(stats.maxCombo, state.maxCombo);
    stats.longestDrift = Math.max(stats.longestDrift, state.longestDrift);
    stats.nitroUses += state.nitroUses;
    stats.lastPosition = playerRank;
    if (playerRank === 1 && finishedNaturally) stats.wins += 1;
    if (state.bestLap > 0 && (stats.bestLap === 0 || state.bestLap < stats.bestLap)) stats.bestLap = state.bestLap;

    if (!stats.tracksPlayed) stats.tracksPlayed = {};
    stats.tracksPlayed[selectedTrackKey] = true;

    if (finishedNaturally && playerRank === 1) {
        if (!stats.modesWon) stats.modesWon = {};
        stats.modesWon[selectedModeKey] = true;
        if (selectedModeKey === 'time_trial') stats.ttRecord = Math.max(stats.ttRecord, 1 / Math.max(raceTime, 0.1));
    }

    saveStats(stats);
    if (finishedNaturally && state.ghostFrames.length > 10 && selectedModeKey === 'time_trial') {
        saveGhost(state.ghostFrames);
    }

    checkAchievements();

    raceResultTitle.textContent = finishedNaturally
        ? (playerRank === 1 ? 'VICTORY' : 'RACE FINISHED')
        : 'CRASHED';

    resultsGrid.innerHTML = `
        <div class="result-item"><div class="result-label">POSITION</div><div class="result-value">${playerRank}<small>/${selectedModeKey === 'gp' ? 6 : 1}</small></div></div>
        <div class="result-item"><div class="result-label">BEST LAP</div><div class="result-value">${state.bestLap > 0 ? formatLapTime(state.bestLap) : '—'}</div></div>
        <div class="result-item"><div class="result-label">TIME</div><div class="result-value">${formatLapTime(raceTime)}</div></div>
        <div class="result-item"><div class="result-label">COINS</div><div class="result-value">${state.sessionCoins}</div></div>
    `;

    setTimeout(() => {
        gameOverScreen.classList.remove('hidden');
        hud.classList.add('hidden');
    }, 600);
}

/* ====== ПРИЗРАК ====== */
function loadGhost() {
    try {
        const data = JSON.parse(localStorage.getItem(GHOST_KEY) || 'null');
        if (data && Array.isArray(data.frames) && data.car) {
            const car = CARS.find(c => c.id === data.car);
            if (car) return { frames: data.frames, car };
        }
    } catch {}
    return null;
}
function saveGhost(frames) {
    if (frames.length < 10) return;
    try {
        const thin = frames.filter((_, i) => i % 3 === 0);
        localStorage.setItem(GHOST_KEY, JSON.stringify({ frames: thin, car: selectedCar.id }));
    } catch {}
}

/* ====== ЗВЁЗДЫ / ДОЖДЬ ====== */
let stars = [], rainDrops = [];
function initStars() {
    stars = [];
    for (let i = 0; i < 140; i++) {
        stars.push({
            x: Math.random(), y: Math.random() * 0.5,
            s: Math.random() * 1.6 + 0.3, b: Math.random() * Math.PI * 2
        });
    }
}
function initRain() {
    rainDrops = [];
    const count = Math.floor((W * H) / 11000);
    for (let i = 0; i < Math.min(count, 180); i++) {
        rainDrops.push({
            x: Math.random() * W, y: Math.random() * H,
            v: Math.random() * 12 + 8, len: Math.random() * 12 + 8
        });
    }
}

/* ====== ПРОЕКЦИЯ ====== */
function project(x, z, hillY = 0) {
    const depth = Math.max(z, 0.02);
    const scale = 1 / depth;
    const boost = state.nitroActive ? 1.12 : 1;
    const sx = W / 2 + x * W * 0.42 * scale * depth * 1.9 * boost;
    const horizon = H * 0.46;
    const sy = horizon + (0.55 + hillY) * scale * 78 / boost;
    const roadW = W * 0.62 * scale * depth * 1.9 * boost;
    return { x: sx, y: sy, scale: scale * depth * 1.9, roadW };
}

/* ====== ОТРИСОВКА ====== */
function draw() {
    ctx.save();
    if (state.cameraShake > 0) {
        const s = state.cameraShake * 16;
        ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
    }
    drawBackground();

    if (state.running || state.over || state.paused) {
        drawRoad();
        drawGhost();
        drawAICars();
        drawCoins();
        drawParticles();
        drawPlayer();
        drawFloatTexts();
    }

    drawWeather();
    drawVignette();

    if (state.chromaticTimer > 0) {
        const off = state.chromaticTimer * 6;
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = state.chromaticTimer * 0.3;
        ctx.fillStyle = '#f00'; ctx.fillRect(off, 0, W, H);
        ctx.fillStyle = '#0ff'; ctx.fillRect(-off, 0, W, H);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
    }

    if (state.flashTimer > 0) {
        ctx.fillStyle = `rgba(255,50,50,${state.flashTimer * 0.6})`;
        ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
}

function drawBackground() {
    const track = TRACKS[selectedTrackKey];
    const horizon = H * 0.46;

    const sky = ctx.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, `hsl(${track.hue - 20}, 40%, 4%)`);
    sky.addColorStop(0.6, `hsl(${track.hue}, 50%, 8%)`);
    sky.addColorStop(1, `hsl(${track.hue + 20}, 55%, 14%)`);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, horizon);

    const sunX = W * 0.68, sunY = horizon * 0.5;
    const sunR = Math.min(W, H) * 0.09;
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR * 3);
    sunGrad.addColorStop(0, `hsla(${track.hue}, 90%, 75%, 1)`);
    sunGrad.addColorStop(0.25, `hsla(${track.hue}, 90%, 55%, 0.7)`);
    sunGrad.addColorStop(1, `hsla(${track.hue}, 90%, 40%, 0)`);
    ctx.fillStyle = sunGrad;
    ctx.fillRect(sunX - sunR * 3, sunY - sunR * 3, sunR * 6, sunR * 6);

    for (const s of stars) {
        const tw = 0.5 + 0.5 * Math.sin(state.time * 2 + s.b);
        ctx.globalAlpha = tw * 0.7;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(s.x * W, s.y * horizon, s.s, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    const ground = ctx.createLinearGradient(0, horizon, 0, H);
    ground.addColorStop(0, `hsl(${track.hue}, 30%, 6%)`);
    ground.addColorStop(1, `hsl(${track.hue}, 40%, 2%)`);
    ctx.fillStyle = ground;
    ctx.fillRect(0, horizon, W, H - horizon);
}

function drawRoad() {
    const track = TRACKS[selectedTrackKey];
    const segments = 80;
    const nearZ = 0.06, farZ = 1.0;
    const neon = selectedCar.neonColor;
    const baseZ = state.playerProgress;

    for (let i = segments; i >= 0; i--) {
        const z1 = nearZ + (farZ - nearZ) * (i / segments);
        const z2 = nearZ + (farZ - nearZ) * ((i + 1) / segments);

        const p1 = (baseZ + z1) % 1;
        const p2 = (baseZ + z2) % 1;

        const curve1 = track.curve(p1);
        const curve2 = track.curve(p2);
        const hillY1 = track.hill(p1);
        const hillY2 = track.hill(p2);

        const p1L = project(-1 + curve1, z1, hillY1);
        const p1R = project( 1 + curve1, z1, hillY1);
        const p2L = project(-1 + curve2, z2, hillY2);
        const p2R = project( 1 + curve2, z2, hillY2);

        const stripe = Math.floor((p1 + z1) * 60) % 2;
        const light = stripe ? 12 : 8;
        const laneAlpha = (1 - i / segments) * 0.65;

        ctx.fillStyle = `hsl(${track.hue}, 12%, ${light}%)`;
        ctx.beginPath();
        ctx.moveTo(p1L.x, p1L.y);
        ctx.lineTo(p1R.x, p1R.y);
        ctx.lineTo(p2R.x, p2R.y);
        ctx.lineTo(p2L.x, p2L.y);
        ctx.closePath();
        ctx.fill();

        if (stripe) {
            const c1 = project(curve1, z1, hillY1);
            const c2 = project(curve2, z2, hillY2);
            const dashW = Math.max(1, 2 * c1.scale);
            ctx.fillStyle = `hsla(60, 80%, 70%, ${laneAlpha})`;
            ctx.beginPath();
            ctx.moveTo(c1.x - dashW, c1.y);
            ctx.lineTo(c1.x + dashW, c1.y);
            ctx.lineTo(c2.x + dashW * 0.5, c2.y);
            ctx.lineTo(c2.x - dashW * 0.5, c2.y);
            ctx.closePath();
            ctx.fill();
        }

        const alpha = 1 - i / segments;
        ctx.strokeStyle = neon;
        ctx.globalAlpha = alpha * 0.9;
        ctx.lineWidth = Math.max(1, 3.2 * p1L.scale);
        ctx.shadowColor = neon;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(p1L.x, p1L.y); ctx.lineTo(p2L.x, p2L.y);
        ctx.moveTo(p1R.x, p1R.y); ctx.lineTo(p2R.x, p2R.y);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }
}

function drawGhost() {
    if (!state.currentGhost) return;
    const frames = state.currentGhost.frames;
    if (!frames.length) return;
    const f = frames[Math.min(state.ghostFrameIdx, frames.length - 1)];
    if (!f) return;
    const car = CARS.find(c => c.id === state.currentGhost.car) || selectedCar;
    const screenX = W / 2 + f.x * W * 0.35;
    const screenY = H * 0.86;
    const baseSize = Math.min(W, H) * 0.11;
    const carW = baseSize * (car.w / 0.30);
    const carH = carW * (car.h / car.w);

    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.rotate((f.tilt || 0) * 0.4);
    drawCarShape(ctx, car, carW, carH, { headlights: false, opacity: 0.28 });
    ctx.restore();
}

function drawAICars() {
    for (const ai of state.aiCars) {
        if (ai.eliminated) continue;
        const relProgress = ai.progress - state.playerProgress;
        if (relProgress < -0.05 || relProgress > 1) continue;
        const z = Math.max(0.05, Math.min(1, relProgress));
        const track = TRACKS[selectedTrackKey];
        const p = ((state.playerProgress + z) % 1 + 1) % 1;
        const curve = track.curve(p);
        const hillY = track.hill(p);

        const carX = ai.physics.x * 0.85 + curve;
        const proj = project(carX, z, hillY);
        if (proj.y < H * 0.44) continue;

        const car = ai.car;
        const carW = proj.roadW * 0.20;
        const carH = carW * (car.h / car.w);
        const alpha = Math.min(1, (1.05 - z) * 2.5);

        ctx.save();
        ctx.globalAlpha = 0.4 * alpha;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.beginPath();
        ctx.ellipse(proj.x, proj.y + carH * 0.4, carW * 0.6, carH * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.translate(proj.x, proj.y);
        ctx.rotate(Math.PI + (ai.physics.tilt || 0));
        drawCarShape(ctx, car, carW, carH, { opacity: alpha });
        ctx.restore();
    }
}

function drawCoins() {
    for (const c of state.coinDrops) {
        if (c.z <= 0.03 || c.z > 1.05) continue;
        const track = TRACKS[selectedTrackKey];
        const p = ((state.playerProgress + c.z) % 1 + 1) % 1;
        const curve = track.curve(p);
        const hillY = track.hill(p);
        const proj = project(c.x + curve, c.z, hillY);
        if (proj.y < H * 0.44) continue;

        const r = Math.max(2, proj.roadW * 0.04);
        ctx.save();
        ctx.translate(proj.x, proj.y - r * 3);
        const t = state.time * 6 + c.phase;
        const wobble = Math.abs(Math.cos(t));
        ctx.scale(wobble * 0.8 + 0.2, 1);
        ctx.shadowColor = '#ffea00';
        ctx.shadowBlur = 18;
        const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r);
        g.addColorStop(0, '#fff8b0');
        g.addColorStop(0.6, '#ffd700');
        g.addColorStop(1, '#b8860b');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function drawParticles() {
    for (const p of state.particles) {
        const a = p.life / p.maxLife;
        ctx.globalAlpha = a;
        ctx.fillStyle = `hsl(${p.hue}, 100%, ${p.bright}%)`;
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * a, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
}

function drawFloatTexts() {
    for (const t of state.floatTexts) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, t.life);
        ctx.font = `bold ${t.size}px Inter, sans-serif`;
        ctx.fillStyle = t.color;
        ctx.textAlign = 'center';
        ctx.fillText(t.text, t.x, t.y);
        ctx.restore();
    }
}

function drawPlayer() {
    if (!state.player) return;
    const screenX = W / 2 + state.player.x * W * 0.35;
    const screenY = H * 0.86;
    const baseSize = Math.min(W, H) * 0.11;
    const carW = baseSize * (selectedCar.w / 0.30);
    const carH = carW * (selectedCar.h / selectedCar.w);

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath();
    ctx.ellipse(screenX, screenY + carH * 0.45, carW * 0.7, carH * 0.13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.rotate(state.player.tilt * 0.4);

    if (state.player.drifting) {
        for (let i = 0; i < 4; i++) {
            const sx = (Math.random() - 0.5) * carW * 1.4;
            const sy = carH * 0.4 + Math.random() * 12;
            ctx.fillStyle = `rgba(220,220,220,${0.5 - i * 0.1})`;
            ctx.beginPath();
            ctx.arc(sx, sy, 8 + Math.random() * 10, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    if (state.nitroActive && state.nitro > 0) {
        const flame = Math.random() * 0.5 + 0.5;
        const intensity = state.player.speed > 2 ? 1.6 : 1;
        const fl = ctx.createLinearGradient(0, carH * 0.5, 0, carH * 0.5 + 80 * flame * intensity);
        fl.addColorStop(0, 'rgba(255,255,255,1)');
        fl.addColorStop(0.2, 'rgba(180,240,255,0.95)');
        fl.addColorStop(0.5, 'rgba(0,229,255,0.85)');
        fl.addColorStop(1, 'rgba(255,43,138,0)');
        ctx.fillStyle = fl;
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 40;
        ctx.beginPath();
        ctx.moveTo(-carW * 0.3, carH * 0.5);
        ctx.lineTo( carW * 0.3, carH * 0.5);
        ctx.lineTo(0, carH * 0.5 + 70 * flame * intensity);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    drawCarShape(ctx, selectedCar, carW, carH);
    ctx.restore();
}

function drawWeather() {
    if (state.weather === 'rain') {
        ctx.strokeStyle = 'rgba(160,200,255,0.5)';
        ctx.lineWidth = 1.2;
        for (const d of rainDrops) {
            ctx.beginPath();
            ctx.moveTo(d.x, d.y);
            ctx.lineTo(d.x - 3, d.y + d.len);
            ctx.stroke();
        }
        ctx.fillStyle = 'rgba(20,30,60,0.18)';
        ctx.fillRect(0, 0, W, H);
    } else if (state.weather === 'fog') {
        const fog = ctx.createLinearGradient(0, H * 0.35, 0, H);
        fog.addColorStop(0, 'rgba(200,220,255,0.02)');
        fog.addColorStop(1, 'rgba(200,220,255,0.35)');
        ctx.fillStyle = fog;
        ctx.fillRect(0, H * 0.35, W, H * 0.65);
    } else if (state.weather === 'night') {
        ctx.fillStyle = 'rgba(0,10,30,0.35)';
        ctx.fillRect(0, 0, W, H);
    }
}

function drawVignette() {
    const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.85);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.75)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
}

/* ====== ЧАСТИЦЫ ====== */
function spawnExhaust() {
    if (!state.player) return;
    const screenX = W / 2 + state.player.x * W * 0.35;
    const screenY = H * 0.86 + Math.min(W, H) * 0.07;
    for (let i = 0; i < 2; i++) {
        state.particles.push({
            x: screenX + (Math.random() - 0.5) * 24,
            y: screenY + (Math.random() - 0.5) * 6,
            vx: (Math.random() - 0.5) * 1.2,
            vy: -Math.random() * 2 - 0.6,
            size: Math.random() * 2 + 1.5,
            life: 0.6, maxLife: 0.6,
            hue: (state.hue + 40) % 360, bright: 55
        });
    }
}

function spawnCrashParticles() {
    const screenX = W / 2 + (state.player ? state.player.x : 0) * W * 0.35;
    const screenY = H * 0.86;
    for (let i = 0; i < 100; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = Math.random() * 14 + 3;
        state.particles.push({
            x: screenX, y: screenY,
            vx: Math.cos(a) * s, vy: Math.sin(a) * s - 3,
            size: Math.random() * 6 + 2,
            life: 1.5, maxLife: 1.5,
            hue: Math.random() * 40, bright: 65
        });
    }
}

function spawnFloatText(x, y, text, color, size = 18) {
    state.floatTexts.push({ x, y, text, color, size, life: 1, vy: -1 });
}

/* ====== РАНГ ====== */
function computePlayerRank() {
    if (selectedModeKey !== 'gp') return 1;
    let ahead = 0;
    for (const ai of state.aiCars) {
        if (ai.eliminated) continue;
        if (ai.progress > state.playerProgress) ahead++;
    }
    return ahead + 1;
}

/* ====== ОБНОВЛЕНИЕ ====== */
function update(dt) {
    state.cameraShake *= Math.max(0, 1 - dt * 3);
    state.cameraTilt += ((state.player ? state.player.tilt * 0.3 : 0) - state.cameraTilt) * dt * 4;
    if (state.chromaticTimer > 0) state.chromaticTimer = Math.max(0, state.chromaticTimer - dt * 1.5);
    if (state.flashTimer > 0) state.flashTimer = Math.max(0, state.flashTimer - dt * 2);

    for (const p of state.particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12;
        p.vx *= 0.98;
        p.life -= dt;
    }
    state.particles = state.particles.filter(p => p.life > 0);
    for (const t of state.floatTexts) { t.y += t.vy * 40 * dt; t.life -= dt * 0.9; }
    state.floatTexts = state.floatTexts.filter(t => t.life > 0);

    if (!state.running || state.paused || state.over) return;

    if (!state.started) {
        state.countdown -= dt;
        return;
    }

    state.time += dt;
    state.lapTimer += dt;

    state.weatherTimer -= dt;
    if (state.weatherTimer <= 0) {
        const pool = ['clear', 'clear', 'rain', 'fog', 'night'];
        state.weather = pool[Math.floor(Math.random() * pool.length)];
        state.weatherTimer = 20 + Math.random() * 20;
    }
    if (state.weather === 'rain') {
        for (const d of rainDrops) {
            d.y += d.v * (1 + (state.player ? state.player.speed : 0) * 0.5);
            d.x -= (state.player ? state.player.speed : 0) * 2;
            if (d.y > H) { d.y = -20; d.x = Math.random() * W; }
            if (d.x < -10) d.x = W + 10;
        }
    }

    state.hue = (state.hue + dt * 8) % 360;

    const input = {
        steer: (keys['arrowright'] || keys['d'] || touchState.right ? 1 : 0) -
               (keys['arrowleft']  || keys['a'] || touchState.left  ? 1 : 0),
        gas: !!(keys['arrowup'] || keys['w'] || touchState.gas),
        brake: !!(keys['arrowdown'] || keys['s'] || touchState.brake),
        nitro: false
    };

    // Пит-стоп — заряжаем нитро у края на низкой скорости
    if (state.player) {
        const nearEdge = Math.abs(state.player.x) > 0.78;
        const slowEnough = state.player.speed < 0.5;
        if (nearEdge && slowEnough && !state.pitting) {
            state.pitting = true;
            state.nitro = Math.min(1, state.nitro + dt * 1.5);
        } else if (!nearEdge || !slowEnough) {
            state.pitting = false;
        }
    }

    // Нитро
    const nitroKey = keys['shift'] || touchState.nitro;
    const canNitro = nitroKey && state.nitro > 0 && state.player.speed > 0.4;
    if (canNitro && !state.nitroActive) { AUDIO.startNitro(); state.nitroUses++; }
    if (!canNitro && state.nitroActive) AUDIO.stopNitro();
    state.nitroActive = canNitro;
    input.nitro = canNitro;
    if (canNitro) {
        state.nitro = Math.max(0, state.nitro - dt * TIRES[selectedTireKey].nitroRate);
        state.cameraShake = Math.max(state.cameraShake, 0.35);
    } else if (!state.pitting) {
        state.nitro = Math.min(1, state.nitro + dt * 0.06);
    }

    const speedFactor = 1 + state.lap * 0.02;
    const res = state.player.update(dt, input, speedFactor);

    const deltaProgress = state.player.speed * dt * 0.018;
    state.playerProgress += deltaProgress;

    if (state.playerProgress >= state.lap) {
        state.lapTimes.push(state.lapTimer);
        if (state.bestLap === 0 || state.lapTimer < state.bestLap) state.bestLap = state.lapTimer;
        spawnFloatText(W / 2, H * 0.35, formatLapTime(state.lapTimer), '#00e5ff', 32);

        if (state.lap >= state.lapTotal) {
            state.lap = state.lapTotal;
            endGame(true);
            return;
        } else {
            state.lap++;
            state.lapTimer = 0;
        }
    }

    if (state.player.drifting) {
        state.driftTimer += dt;
        if (state.driftTimer > state.longestDrift) state.longestDrift = state.driftTimer;
    } else {
        state.driftTimer = 0;
    }

    if (state.comboTimer > 0) {
        state.comboTimer -= dt;
        if (state.comboTimer <= 0) state.combo = 1;
    }

    updateAI(dt);

    state.coinSpawnTimer += dt;
    if (state.coinSpawnTimer > 2 + Math.random() * 2) {
        state.coinSpawnTimer = 0;
        spawnCoin();
    }
    updateCoins(dt);

    if (state.currentGhost) {
        state.ghostFrameIdx = Math.floor(state.time * 60);
    }

    if (selectedModeKey === 'time_trial' && state.ghostFrames.length < 6000) {
        state.ghostFrames.push({ x: state.player.x, tilt: state.player.tilt });
    }

    if (selectedModeKey === 'elimination') {
        state.eliminationTimer -= dt;
        if (state.eliminationTimer <= 0) {
            state.eliminationTimer = 30;
            eliminateLast();
        }
    }

    AUDIO.updateEngine(state.player.speed, res.maxSpeed);

    if (Math.random() < state.player.speed * 0.7) spawnExhaust();

    updateHUD();
}

function updateAI(dt) {
    if (selectedModeKey !== 'gp') return;
    const track = TRACKS[selectedTrackKey];
    for (const ai of state.aiCars) {
        if (ai.eliminated || ai.finished) continue;
        const aiZ = ((ai.progress + 0.3) % 1 + 1) % 1;
        const upcomingCurve = track.curve(aiZ);

        const targetX = upcomingCurve + Math.sin(state.time * 0.5 + ai.skill * 10) * 0.15;
        const steer = Math.max(-1, Math.min(1, (targetX - ai.physics.x) * 2));
        const curveIntensity = Math.abs(upcomingCurve);
        const brake = curveIntensity > 0.6 && ai.physics.speed > 1.6;

        const input = {
            steer,
            gas: !brake,
            brake,
            nitro: false
        };

        ai.physics.update(dt, input, ai.skill);
        ai.progress += ai.physics.speed * dt * 0.018 * ai.skill;

        if (ai.progress >= state.lapTotal && !ai.finished) {
            ai.finished = true;
            state.finishOrder.push({ type: 'ai', car: ai });
        }
    }
}

function eliminateLast() {
    if (!state.aiCars.length) return;
    let worst = state.aiCars[0];
    for (const ai of state.aiCars) {
        if (ai.eliminated || ai.finished) continue;
        if (ai.progress < worst.progress) worst = ai;
    }
    if (worst.eliminated) return;
    worst.eliminated = true;
    state.aiCars = state.aiCars.filter(a => !a.eliminated);
    spawnFloatText(W / 2, H * 0.3, 'ELIMINATED', '#ff5a5a', 30);
    if (state.aiCars.length === 0) {
        endGame(true);
    }
}

function spawnCoin() {
    if (!state.player) return;
    const track = TRACKS[selectedTrackKey];
    const z = 0.9 + Math.random() * 0.15;
    const p = ((state.playerProgress + z) % 1 + 1) % 1;
    const x = track.curve(p) + (Math.random() - 0.5) * 0.6;
    state.coinDrops.push({
        x, z,
        phase: Math.random() * Math.PI * 2,
        value: 5 + Math.floor(Math.random() * 4) * 5
    });
}

function updateCoins(dt) {
    if (!state.player) return;
    for (const c of state.coinDrops) c.z -= state.player.speed * dt * 1.0;
    for (const c of state.coinDrops) {
        if (c.z > 0.03 && c.z < 0.15) {
            if (Math.abs(c.x - state.player.x) < 0.2) {
                const val = c.value;
                coins += val;
                state.sessionCoins += val;
                saveCoins(coins);
                spawnFloatText(W / 2 + (c.x - state.player.x) * W * 0.35, H * 0.72, '+' + val, '#ffd700', 20);
                AUDIO.coin();
                vibrate(15);
                c.z = 0;
            }
        }
    }
    state.coinDrops = state.coinDrops.filter(c => c.z > 0.03);
}

function updateHUD() {
    if (!state.player) return;
    const kmh = Math.floor(state.player.speed * 72);
    speedEl.textContent = kmh;
    speedFill.style.width = Math.min(100, (kmh / 300) * 100) + '%';
    nitroFill.style.width = (state.nitro * 100) + '%';
    lapEl.textContent = `${Math.min(state.lap, state.lapTotal)} / ${state.lapTotal}`;
    lapTimeEl.textContent = formatLapTime(state.lapTimer);
    const rank = computePlayerRank();
    positionEl.innerHTML = `${rank}<small>/${selectedModeKey === 'gp' ? 6 : 1}</small>`;
    tireEl.textContent = TIRES[selectedTireKey].name;
    tireEl.style.color = TIRES[selectedTireKey].color;

    if (selectedModeKey === 'gp') {
        let nearestAhead = null;
        for (const ai of state.aiCars) {
            if (ai.eliminated) continue;
            const diff = ai.progress - state.playerProgress;
            if (diff > 0 && (nearestAhead === null || diff < nearestAhead)) nearestAhead = diff;
        }
        if (nearestAhead !== null) {
            const speedDiv = Math.max(state.player.speed * 0.018, 0.2);
            const gapSec = (nearestAhead / speedDiv).toFixed(2);
            gapEl.textContent = '+' + gapSec + 's';
            gapEl.style.color = '#ff5a5a';
        } else {
            gapEl.textContent = 'LEADER';
            gapEl.style.color = '#00e5ff';
        }
    } else {
        gapEl.textContent = 'SOLO';
        gapEl.style.color = '#00e5ff';
    }
}

/* ====== ЦИКЛ ====== */
let lastTime = performance.now();
function loop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
}

/* ====== СТАРТ ====== */
function boot() {
    resize();
    initStars();
    initRain();
    renderFilter();
    renderGarage();
    renderAchievements();
    renderStats();
    renderModes();
    bindAllTouchButtons();
    draw();
    requestAnimationFrame(loop);
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
} else {
    boot();
}
