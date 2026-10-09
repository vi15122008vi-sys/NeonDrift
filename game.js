/* =========================================================
   NEON DRIFT 4D v3 — ядро игры
   ========================================================= */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let W, H;

function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initRain();
}
window.addEventListener('resize', resize);

/* ====== Биомы ====== */
const BIOMES = [
    { name:'Неон-Сити', hue:190, roadHue:250, groundHue:280, skyHue:240 },
    { name:'Пустыня', hue:35, roadHue:20, groundHue:30, skyHue:15 },
    { name:'Тундра', hue:200, roadHue:210, groundHue:200, skyHue:220 },
    { name:'Кибер-Космос',hue:290, roadHue:270, groundHue:300, skyHue:260 }
];

/* ====== Достижения ====== */
const ACHIEVEMENTS = [
    { id:'first_race', name:'Первый заезд', desc:'Завершить первую гонку', check:s=>s.races>=1 },
    { id:'score_1k', name:'Новичок', desc:'1 000 очков за заезд', check:s=>s.lastScore>=1000 },
    { id:'score_10k', name:'Профи', desc:'10 000 очков за заезд', check:s=>s.lastScore>=10000 },
    { id:'score_50k', name:'Мастер', desc:'50 000 очков за заезд', check:s=>s.lastScore>=50000 },
    { id:'combo_5', name:'Комбо x5', desc:'Достичь комбо x5', check:s=>s.maxCombo>=5 },
    { id:'combo_8', name:'Комбо x8', desc:'Достичь комбо x8', check:s=>s.maxCombo>=8 },
    { id:'dist_1k', name:'Путешественник',desc:'1000м за заезд', check:s=>s.lastDist>=1000 },
    { id:'dist_5k', name:'Марафонец', desc:'5000м за заезд', check:s=>s.lastDist>=5000 },
    { id:'total_dist_10',name:'Десятка', desc:'Всего 10 км', check:s=>s.totalDist>=10000 },
    { id:'total_dist_100',name:'Сотка', desc:'Всего 100 км', check:s=>s.totalDist>=100000 },
    { id:'coins_1k', name:'Копилка', desc:'1 000 монет всего', check:s=>s.totalCoins>=1000 },
    { id:'coins_10k', name:'Богач', desc:'10 000 монет всего', check:s=>s.totalCoins>=10000 },
    { id:'coins_100k', name:'Магнат', desc:'100 000 монет всего', check:s=>s.totalCoins>=100000 },
    { id:'cars_5', name:'Коллекционер', desc:'5 машин в гараже', check:s=>s.unlockedCount>=5 },
    { id:'cars_20', name:'Автолюбитель', desc:'20 машин', check:s=>s.unlockedCount>=20 },
    { id:'cars_50', name:'Полный гараж', desc:'Все 50 машин', check:s=>s.unlockedCount>=50 },
    { id:'crash_10', name:'Первые шишки', desc:'10 аварий', check:s=>s.crashes>=10 },
    { id:'crash_100', name:'Вечный ремонт', desc:'100 аварий', check:s=>s.crashes>=100 },
    { id:'survive_2min', name:'Держись!', desc:'Продержаться 2 минуты', check:s=>s.lastTime>=120 },
    { id:'survive_5min', name:'Железный', desc:'Продержаться 5 минут', check:s=>s.lastTime>=300 }
];

/* ====== Ключи localStorage ====== */
const STATS_KEY = 'nd4d_stats';
const ACHV_KEY = 'nd4d_achv';
const COINS_KEY = 'nd4d_coins';
const OWNED_KEY = 'nd4d_owned';
const GHOST_KEY = 'nd4d_ghost';

function loadStats() {
    try {
        return Object.assign({
            races:0, lastScore:0, bestScore:0, lastDist:0, totalDist:0,
            totalCoins:0, maxCombo:1, crashes:0, lastTime:0, totalTime:0,
            unlockedCount:0
        }, JSON.parse(localStorage.getItem(STATS_KEY) || '{}'));
    } catch { 
        return {races:0,lastScore:0,bestScore:0,lastDist:0,totalDist:0,totalCoins:0,maxCombo:1,crashes:0,lastTime:0,totalTime:0,unlockedCount:0}; 
    }
}
function saveStats(s) { localStorage.setItem(STATS_KEY, JSON.stringify(s)); }

function loadAchv() {
    try { return JSON.parse(localStorage.getItem(ACHV_KEY) || '{}'); }
    catch { return {}; }
}
function saveAchv(a) { localStorage.setItem(ACHV_KEY, JSON.stringify(a)); }

function loadCoins() { return +(localStorage.getItem(COINS_KEY) || 0); }
function saveCoins(c) { localStorage.setItem(COINS_KEY, c); }

function loadOwned() {
    try {
        const arr = JSON.parse(localStorage.getItem(OWNED_KEY) || '[]');
        return Array.isArray(arr) && arr.length ? arr : null;
    } catch { return null; }
}
function saveOwned(arr) { localStorage.setItem(OWNED_KEY, JSON.stringify(arr)); }

/* Применяем кастомизацию ко всем машинам */
applyCustomToCars();

let coins = loadCoins();
let owned = loadOwned();
if (!owned) {
    owned = CARS.filter(c => c.price === 0).map(c => c.id);
    saveOwned(owned);
}
for (const c of CARS) c.unlocked = owned.includes(c.id);

let stats = loadStats();
stats.unlockedCount = owned.length;

let achvState = loadAchv();

/* ====== Игровое состояние ====== */
const state = {
    running:false, paused:false, over:false,
    speed:0, distance:0, score:0, level:1,
    nitro:1, nitroActive:false,
    combo:1, comboTimer:0, maxCombo:1,
    time:0, weather:'clear', weatherTimer:22,
    biomeIndex:0, biomeTimer:800,
    cameraShake:0, cameraTilt:0, hue:190,
    driftScore:0, drifting:false,
    coinsEarned:0, sessionCoins:0,
    collisionLock:false
};

let selectedCar = CARS.find(c => c.unlocked) || CARS[0];

const player = { x:0, targetX:0, tilt:0 };
const road = { curve:0, hill:0, scroll:0 };

let obstacles = [];
let particles = [];
let stars = [];
let rainDrops = [];
let coinDrops = [];
let floatTexts = [];
let ghostFrames = [];
let ghostFrameIdx = 0;
let currentGhost = null;

/* ====== Управление ====== */
const keys = {};
const touch = { left:false, right:false, gas:false, brake:false };

document.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    keys[k] = true;
    if (e.key === ' ') { e.preventDefault(); if (state.running && !state.over) togglePause(); }
});
document.addEventListener('keyup', e => {
    keys[e.key.toLowerCase()] = false;
});

let touchStartX = null;
canvas.addEventListener('touchstart', e => {
    if (e.target !== canvas) return;
    e.preventDefault();
    const t = e.touches[0];
    if (touchStartX === null) touchStartX = t.clientX;
    if (t.clientY > H * 0.55) touch.gas = true;
    if (t.clientX < W * 0.2) touch.left = true;
    if (t.clientX > W * 0.8) touch.right = true;
}, {passive:false});

canvas.addEventListener('touchmove', e => {
    if (e.target !== canvas) return;
    e.preventDefault();
    if (touchStartX === null) return;
    const x = e.touches[0].clientX;
    const dx = x - touchStartX;
    if (dx < -25) { touch.left = true; touch.right = false; touchStartX = x; }
    else if (dx > 25) { touch.right = true; touch.left = false; touchStartX = x; }
}, {passive:false});

canvas.addEventListener('touchend', e => {
    if (e.target !== canvas) return;
    e.preventDefault();
    touch.left = touch.right = touch.gas = touch.brake = false;
    touchStartX = null;
}, {passive:false});

/* ====== UI ====== */
const $ = id => document.getElementById(id);
const startScreen = $('startScreen');
const gameOverScreen = $('gameOverScreen');
const pauseScreen = $('pauseScreen');
const hud = $('hud');
const speedEl = $('speed'), speedFill = $('speedFill');
const scoreEl = $('score'), levelEl = $('level'), coinsEl = $('coins');
const nitroFill = $('nitroFill');
const comboEl = $('combo'), comboValueEl = $('comboValue');
const driftInd = $('driftInd');
const biomeEl = $('biome');
const carsGrid = $('carsGrid');
const carInfo = $('carInfo');
const classFilter = $('classFilter');
const achvGrid = $('achvGrid');
const statsGrid = $('statsGrid');
const colorSwatches = $('colorSwatches');
const neonSwatches = $('neonSwatches');
const wheelPicks = $('wheelPicks');
const customRow = $('customRow');

/* ====== Табы ====== */
document.querySelectorAll('.tab').forEach(tab => {
    tab.onclick = () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.dataset.tab;
        document.getElementById('tab-' + target).classList.add('active');
        AUDIO.click();
        if (target === 'achv') renderAchievements();
        if (target === 'stats') renderStats();
    };
});

/* ====== Настройки ====== */
const soundOn = $('soundOn'), volumeSlider = $('volume'), musicOn = $('musicOn'), ghostOn = $('ghostOn');
soundOn.checked = localStorage.getItem('nd4d_sound') !== '0';
volumeSlider.value = +(localStorage.getItem('nd4d_vol') || 60);
musicOn.checked = localStorage.getItem('nd4d_music') !== '0';
ghostOn.checked = localStorage.getItem('nd4d_ghost') !== '0';
AUDIO.enabled = soundOn.checked;
AUDIO.volume = +volumeSlider.value / 100;
AUDIO.musicOn = musicOn.checked;

soundOn.onchange = () => { AUDIO.setEnabled(soundOn.checked); localStorage.setItem('nd4d_sound', soundOn.checked ? '1' : '0'); };
volumeSlider.oninput = () => { AUDIO.setVolume(+volumeSlider.value / 100); localStorage.setItem('nd4d_vol', volumeSlider.value); };
musicOn.onchange = () => { AUDIO.musicOn = musicOn.checked; localStorage.setItem('nd4d_music', musicOn.checked ? '1' : '0'); };
ghostOn.onchange = () => { localStorage.setItem('nd4d_ghost', ghostOn.checked ? '1' : '0'); };

$('resetStats').onclick = () => {
    if (!confirm('Сбросить всю статистику и достижения?')) return;
    localStorage.removeItem(STATS_KEY);
    localStorage.removeItem(ACHV_KEY);
    stats = loadStats();
    achvState = {};
    renderStats();
    renderAchievements();
};

/* ====== Фильтр класса ====== */
let classFilterValue = 'ALL';
function renderFilter() {
    classFilter.innerHTML = '';
    const opts = ['ALL', 'D', 'C', 'B', 'A', 'S'];
    for (const o of opts) {
        const btn = document.createElement('button');
        btn.className = 'filter-btn' + (o === classFilterValue ? ' active' : '');
        btn.textContent = o === 'ALL' ? 'ВСЕ' : CAR_CLASSES[o].name;
        btn.onclick = () => { classFilterValue = o; renderFilter(); renderGarage(); AUDIO.click(); };
        classFilter.appendChild(btn);
    }
}

/* ====== Гараж ====== */
function renderGarage() {
    carsGrid.innerHTML = '';
    const filtered = classFilterValue === 'ALL' ? CARS : CARS.filter(c => c.cls === classFilterValue);
    for (const car of filtered) {
        const card = document.createElement('div');
        card.className = 'car-card'
            + (car.id === selectedCar.id ? ' selected' : '')
            + (car.unlocked ? '' : ' locked');

        const cvs = document.createElement('canvas');
        cvs.width = 160; cvs.height = 140;
        card.appendChild(cvs);

        const priceTag = car.unlocked
            ? `<div class="owned-badge">✓</div>`
            : `<div class="car-price">💰 ${car.price.toLocaleString()}</div>`;
        card.insertAdjacentHTML('beforeend', `
            <div class="car-name">${car.name}</div>
            <div class="car-class">${CAR_CLASSES[car.cls].name}</div>
            ${priceTag}
            ${car.unlocked ? '' : '<div class="lock-icon">🔒</div>'}
        `);

        const cctx = cvs.getContext('2d');
        drawCarShape(cctx, car, 62, 118);

        card.addEventListener('click', () => {
            if (car.unlocked) {
                selectedCar = car;
                AUDIO.click();
                renderGarage();
                renderCarInfo();
                renderCustomRow();
            } else {
                tryPurchase(car, card);
            }
        });

        carsGrid.appendChild(card);
    }
    renderCarInfo();
    renderCustomRow();
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
        renderCarInfo();
        renderCustomRow();
        coinsEl.textContent = coins;
    } else {
        AUDIO.click();
        card.animate([
            {transform:'translateX(0)'},
            {transform:'translateX(-6px)'},
            {transform:'translateX(6px)'},
            {transform:'translateX(0)'}
        ], {duration:250});
    }
}

function renderCarInfo() {
    const c = selectedCar;
    carInfo.innerHTML = `
        <div class="info-desc"><b>${c.name}</b> · ${c.desc || CAR_CLASSES[c.cls].name}</div>
        <div class="stat-bars">
            <div class="stat-bar-item">СКОРОСТЬ<div class="stat-bar"><div style="width:${c.stats.speed*10}%"></div></div></div>
            <div class="stat-bar-item">УПРАВЛ.<div class="stat-bar"><div style="width:${c.stats.handling*10}%"></div></div></div>
            <div class="stat-bar-item">НИТРО<div class="stat-bar"><div style="width:${c.stats.nitro*10}%"></div></div></div>
        </div>
    `;
}

function renderCustomRow() {
    if (!selectedCar.unlocked) { customRow.classList.add('hidden'); return; }
    customRow.classList.remove('hidden');

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
            renderGarage(); renderCustomRow(); AUDIO.click();
        };
        colorSwatches.appendChild(sw);
    });

    neonSwatches.innerHTML = '';
    NEON_PALETTE.forEach(col => {
        const sw = document.createElement('div');
        sw.className = 'swatch' + (col === selectedCar.neonColor ? ' active' : '');
        sw.style.background = col;
        sw.style.boxShadow = `0 0 10px ${col}`;
        sw.onclick = () => {
            selectedCar.neonColor = col;
            const c = loadCustom();
            c[selectedCar.id] = Object.assign(c[selectedCar.id] || {}, { neonColor: col });
            saveCustom(c);
            renderGarage(); renderCustomRow(); AUDIO.click();
        };
        neonSwatches.appendChild(sw);
    });

    wheelPicks.innerHTML = '';
    for (let i = 0; i < WHEEL_STYLES; i++) {
        const wp = document.createElement('div');
        wp.className = 'wheel-pick' + (i === selectedCar.wheelStyle ? ' active' : '');
        wp.textContent = '⚙';
        wp.onclick = () => {
            selectedCar.wheelStyle = i;
            const c = loadCustom();
            c[selectedCar.id] = Object.assign(c[selectedCar.id] || {}, { wheelStyle: i });
            saveCustom(c);
            renderGarage(); renderCustomRow(); AUDIO.click();
        };
        wheelPicks.appendChild(wp);
    }
}

/* ====== Достижения ====== */
function renderAchievements() {
    achvGrid.innerHTML = '';
    for (const a of ACHIEVEMENTS) {
        const done = !!achvState[a.id];
        const el = document.createElement('div');
        el.className = 'achv-card' + (done ? ' done' : '');
        el.innerHTML = `
            <div class="achv-icon">${done ? '🏆' : '🔒'}</div>
            <div>
                <div class="achv-name">${a.name}</div>
                <div class="achv-desc">${a.desc}</div>
            </div>
        `;
        achvGrid.appendChild(el);
    }
}

function checkAchievements() {
    const s = stats;
    const newly = [];
    for (const a of ACHIEVEMENTS) {
        if (!achvState[a.id] && a.check(s)) {
            achvState[a.id] = true;
            newly.push(a);
        }
    }
    if (newly.length) {
        saveAchv(achvState);
        const toast = $('achvToast');
        toast.textContent = '🏆 ' + newly[newly.length - 1].name;
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 3500);
        AUDIO.levelUp();
    }
}

/* ====== Статистика ====== */
function renderStats() {
    const s = stats;
    const items = [
        ['Всего заездов', s.races],
        ['Лучший счёт', s.bestScore.toLocaleString()],
        ['Всего дистанция', (s.totalDist/1000).toFixed(1) + ' км'],
        ['Всего монет', s.totalCoins.toLocaleString()],
        ['Макс. комбо', 'x' + s.maxCombo],
        ['Аварий', s.crashes],
        ['Общее время', formatTime(s.totalTime)],
        ['Машин открыто', s.unlockedCount + ' / 50']
    ];
    statsGrid.innerHTML = '';
    for (const [label, value] of items) {
        const el = document.createElement('div');
        el.className = 'stat-card';
        el.innerHTML = `<div class="stat-card-label">${label}</div><div class="stat-card-value">${value}</div>`;
        statsGrid.appendChild(el);
    }
}

function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}м ${s}с`;
}

/* ====== Кнопки ====== */
$('startBtn').onclick = () => {
    AUDIO.init();
    AUDIO.ensureResume();
    AUDIO.click();
    startGame();
};
$('restartBtn').onclick = () => { AUDIO.click(); startGame(); };
$('pauseBtn').onclick = () => { AUDIO.click(); togglePause(); };
$('resumeBtn').onclick = () => { AUDIO.click(); togglePause(); };
$('menuBtn').onclick = () => { AUDIO.click(); toMenu(); };
$('quitBtn').onclick = () => { AUDIO.click(); toMenu(); };

function toMenu() {
    state.running = false;
    state.paused = false;
    state.over = false;
    AUDIO.stopEngine();
    AUDIO.stopNitro();
    AUDIO.stopMusic();
    startScreen.classList.remove('hidden');
    gameOverScreen.classList.add('hidden');
    pauseScreen.classList.add('hidden');
    hud.classList.add('hidden');
    coinsEl.textContent = coins;
    renderGarage();
}

/* ====== Призрак ====== */
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

/* ====== Старт игры ====== */
function startGame() {
    Object.assign(state, {
        running:true, paused:false, over:false,
        speed:0, distance:0, score:0, level:1,
        nitro:1, nitroActive:false,
        combo:1, comboTimer:0, maxCombo:1,
        time:0, weather:'clear', weatherTimer:22,
        biomeIndex:0, biomeTimer:800,
        cameraShake:0, cameraTilt:0, hue:190,
        driftScore:0, drifting:false,
        coinsEarned:0, sessionCoins:0,
        collisionLock:false
    });
    player.x = 0; player.targetX = 0; player.tilt = 0;
    obstacles = []; particles = []; floatTexts = []; coinDrops = [];
    road.curve = 0; road.hill = 0; road.scroll = 0;
    initStars(); initRain();

    currentGhost = ghostOn.checked ? loadGhost() : null;
    ghostFrames = [];
    ghostFrameIdx = 0;

    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    pauseScreen.classList.add('hidden');
    hud.classList.remove('hidden');
    coinsEl.textContent = coins;
    biomeEl.textContent = BIOMES[0].name;

    AUDIO.startEngine();
    if (AUDIO.musicOn) AUDIO.startMusic();
}

function togglePause() {
    if (!state.running || state.over) return;
    state.paused = !state.paused;
    pauseScreen.classList.toggle('hidden', !state.paused);
    if (state.paused) {
        AUDIO.stopEngine();
        AUDIO.stopNitro();
        AUDIO.stopMusic();
    } else {
        AUDIO.startEngine();
        if (AUDIO.musicOn) AUDIO.startMusic();
    }
}

function endGame() {
    if (state.over) return;
    state.over = true;
    state.running = false;
    state.cameraShake = 1.4;
    state.collisionLock = true;
    spawnCrashParticles();
    AUDIO.crash();
    AUDIO.stopEngine();
    AUDIO.stopNitro();
    AUDIO.stopMusic();

    const finalScore = Math.floor(state.score);
    const finalDist = Math.floor(state.distance);
    const finalTime = state.time;

    const wasRecord = finalScore >= stats.bestScore;
    stats.races += 1;
    stats.lastScore = finalScore;
    stats.bestScore = Math.max(stats.bestScore, finalScore);
    stats.lastDist = finalDist;
    stats.totalDist += finalDist;
    stats.totalCoins += state.sessionCoins;
    stats.maxCombo = Math.max(stats.maxCombo, state.maxCombo);
    stats.crashes += 1;
    stats.lastTime = finalTime;
    stats.totalTime += finalTime;
    saveStats(stats);

    if (wasRecord && ghostFrames.length > 10) {
        saveGhost(ghostFrames);
    }

    checkAchievements();

    setTimeout(() => {
        $('finalScore').textContent = finalScore.toLocaleString();
        $('finalCoins').textContent = state.sessionCoins.toLocaleString();
        $('finalDist').textContent = finalDist.toLocaleString();
        $('finalCombo').textContent = state.maxCombo;
        $('newRecord').classList.toggle('hidden', !wasRecord);
        gameOverScreen.classList.remove('hidden');
        hud.classList.add('hidden');
    }, 900);
}

/* ====== Декор ====== */
function initStars() {
    stars = [];
    for (let i = 0; i < 160; i++) {
        stars.push({
            x: Math.random(),
            y: Math.random() * 0.55,
            s: Math.random() * 1.6 + 0.4,
            b: Math.random() * Math.PI * 2
        });
    }
}
function initRain() {
    rainDrops = [];
    const count = Math.floor((W * H) / 9000);
    for (let i = 0; i < Math.min(count, 200); i++) {
        rainDrops.push({
            x: Math.random() * W,
            y: Math.random() * H,
            v: Math.random() * 12 + 8,
            len: Math.random() * 12 + 8
        });
    }
}

/* ====== Перспектива ====== */
function project(x, z, hillY = 0) {
    const depth = Math.max(z, 0.02);
    const scale = 1 / depth;
    const curve = road.curve * (1 - depth);
    const sx = W/2 + (x - curve) * W * 0.42 * scale * depth * 1.9;
    const horizon = H * 0.46;
    const sy = horizon + (0.55 + hillY) * scale * 78;
    const roadW = W * 0.62 * scale * depth * 1.9;
    return { x: sx, y: sy, scale: scale * depth * 1.9, roadW };
}

/* ====== Отрисовка ====== */
function draw() {
    ctx.save();
    if (state.cameraShake > 0) {
        const s = state.cameraShake * 18;
        ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
    }

    drawBackground();
    if (state.running || state.over) {
        drawRoad();
        drawGhost();
        drawObstacles();
        drawCoins();
        drawParticles();
        drawPlayer();
        drawFloatTexts();
    }
    drawWeather();
    drawVignette();
    ctx.restore();
}

function drawBackground() {
    const biome = BIOMES[state.biomeIndex];
    const horizon = H * 0.46;

    const sky = ctx.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, `hsl(${biome.skyHue}, 70%, 6%)`);
    sky.addColorStop(0.6, `hsl(${(biome.skyHue + 30) % 360}, 80%, 10%)`);
    sky.addColorStop(1, `hsl(${(biome.skyHue + 60) % 360}, 70%, 16%)`);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, horizon);

    const sunX = W * 0.72, sunY = horizon * 0.55;
    const sunR = Math.min(W, H) * 0.09;
    const sunHue = state.weather === 'night' ? 200 : biome.hue;
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR * 2.5);
    sunGrad.addColorStop(0, `hsla(${sunHue}, 100%, 75%, 1)`);
    sunGrad.addColorStop(0.3, `hsla(${sunHue}, 100%, 55%, 0.7)`);
    sunGrad.addColorStop(1, `hsla(${sunHue}, 100%, 40%, 0)`);
    ctx.fillStyle = sunGrad;
    ctx.fillRect(sunX - sunR*3, sunY - sunR*3, sunR*6, sunR*6);

    for (const s of stars) {
        const tw = 0.5 + 0.5 * Math.sin(state.time * 2 + s.b);
        ctx.globalAlpha = tw * (state.weather === 'night' ? 1 : 0.55);
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(s.x * W, s.y * horizon, s.s, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    const ground = ctx.createLinearGradient(0, horizon, 0, H);
    ground.addColorStop(0, `hsl(${biome.groundHue}, 60%, 8%)`);
    ground.addColorStop(1, `hsl(${(biome.groundHue + 20) % 360}, 70%, 3%)`);
    ctx.fillStyle = ground;
    ctx.fillRect(0, horizon, W, H - horizon);
}

function drawRoad() {
    const biome = BIOMES[state.biomeIndex];
    const segments = 90;
    const nearZ = 0.06, farZ = 1.0;
    const neon = selectedCar.neonColor;

    for (let i = segments; i >= 0; i--) {
        const z1 = nearZ + (farZ - nearZ) * (i / segments);
        const z2 = nearZ + (farZ - nearZ) * ((i + 1) / segments);

        const hillY1 = Math.sin((z1 + road.hill) * 7) * 0.16;
        const hillY2 = Math.sin((z2 + road.hill) * 7) * 0.16;
        const curve1 = Math.sin((z1 + road.curve) * 2.4) * 0.55;
        const curve2 = Math.sin((z2 + road.curve) * 2.4) * 0.55;

        const p1L = project(-1 + curve1, z1, hillY1);
        const p1R = project( 1 + curve1, z1, hillY1);
        const p2L = project(-1 + curve2, z2, hillY2);
        const p2R = project( 1 + curve2, z2, hillY2);

        const stripe = Math.floor(z1 * 34 + road.scroll * 12) % 2;
        const light = stripe ? 14 : 9;
        ctx.fillStyle = `hsl(${biome.roadHue}, 25%, ${light}%)`;
        ctx.beginPath();
        ctx.moveTo(p1L.x, p1L.y);
        ctx.lineTo(p1R.x, p1R.y);
        ctx.lineTo(p2R.x, p2R.y);
        ctx.lineTo(p2L.x, p2L.y);
        ctx.closePath();
        ctx.fill();

        const laneAlpha = (1 - i / segments) * 0.7;
        if (stripe) {
            for (const laneX of [-0.33, 0.33]) {
                const c1 = project(laneX + curve1, z1, hillY1);
                const c2 = project(laneX + curve2, z2, hillY2);
                const dashW = Math.max(1, 2.4 * c1.scale);
                ctx.fillStyle = `hsla(60, 100%, 70%, ${laneAlpha})`;
                ctx.beginPath();
                ctx.moveTo(c1.x - dashW, c1.y);
                ctx.lineTo(c1.x + dashW, c1.y);
                ctx.lineTo(c2.x + dashW * 0.5, c2.y);
                ctx.lineTo(c2.x - dashW * 0.5, c2.y);
                ctx.closePath();
                ctx.fill();
            }
        }

        const alpha = 1 - i / segments;
        ctx.strokeStyle = neon;
        ctx.globalAlpha = alpha * 0.95;
        ctx.lineWidth = Math.max(1, 3.5 * p1L.scale);
        ctx.shadowColor = neon;
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.moveTo(p1L.x, p1L.y); ctx.lineTo(p2L.x, p2L.y);
        ctx.moveTo(p1R.x, p1R.y); ctx.lineTo(p2R.x, p2R.y);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }
}

function drawGhost() {
    if (!currentGhost || ghostFrameIdx >= currentGhost.frames.length) return;
    const f = currentGhost.frames[ghostFrameIdx];
    if (!f) return;

    const screenX = W/2 + f.x * W * 0.35;
    const screenY = H * 0.86;
    const car = CARS.find(c => c.id === currentGhost.car) || selectedCar;
    const baseSize = Math.min(W, H) * 0.11;
    const carW = baseSize * (car.w / 0.30);
    const carH = carW * (car.h / car.w);

    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.translate(screenX, screenY);
    ctx.rotate((f.tilt || 0) * 0.35);
    drawCarShape(ctx, car, carW, carH, { headlights: false });
    ctx.restore();
}

function drawObstacles() {
    obstacles.sort((a, b) => b.z - a.z);
    for (const o of obstacles) {
        if (o.z <= 0.03 || o.z > 1.05) continue;
        const curve = Math.sin((o.z + road.curve) * 2.4) * 0.55;
        const hillY = Math.sin((o.z + road.hill) * 7) * 0.16;
        const p = project(o.x + curve, o.z, hillY);
        if (p.y < H * 0.44) continue;

        const car = o.carRef;
        const carW = p.roadW * 0.20;
        const carH = carW * (car.h / car.w);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(Math.PI + (o.tilt || 0));
        ctx.globalAlpha = Math.min(1, (1.05 - o.z) * 2.5);
        drawCarShape(ctx, car, carW, carH);
        ctx.restore();
    }
    ctx.globalAlpha = 1;
}

function drawCoins() {
    for (const c of coinDrops) {
        if (c.z <= 0.03 || c.z > 1.05) continue;
        const curve = Math.sin((c.z + road.curve) * 2.4) * 0.55;
        const hillY = Math.sin((c.z + road.hill) * 7) * 0.16;
        const p = project(c.x + curve, c.z, hillY);
        if (p.y < H * 0.44) continue;

        const r = Math.max(2, p.roadW * 0.035);
        ctx.save();
        ctx.translate(p.x, p.y - r * 3);
        const t = state.time * 6 + c.phase;
        const wobble = Math.abs(Math.cos(t));
        ctx.scale(wobble * 0.8 + 0.2, 1);
        ctx.shadowColor = '#ffea00';
        ctx.shadowBlur = 15;
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
        g.addColorStop(0, '#fff8b0');
        g.addColorStop(0.6, '#ffd700');
        g.addColorStop(1, '#b8860b');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#b8860b';
        ctx.font = `bold ${r*1.2}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', 0, r * 0.1);
        ctx.restore();
    }
}

function drawParticles() {
    for (const p of particles) {
        const a = p.life / p.maxLife;
        ctx.globalAlpha = a;
        ctx.fillStyle = `hsl(${p.hue}, 100%, ${p.bright}%)`;
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * a, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
}

function drawFloatTexts() {
    for (const t of floatTexts) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, t.life);
        ctx.font = `bold ${t.size}px sans-serif`;
        ctx.fillStyle = t.color;
        ctx.shadowColor = t.color;
        ctx.shadowBlur = 12;
        ctx.textAlign = 'center';
        ctx.fillText(t.text, t.x, t.y);
        ctx.restore();
    }
}

function drawPlayer() {
    const screenX = W/2 + player.x * W * 0.35;
    const screenY = H * 0.86;

    const baseSize = Math.min(W, H) * 0.11;
    const carW = baseSize * (selectedCar.w / 0.30);
    const carH = carW * (selectedCar.h / selectedCar.w);

    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.rotate(player.tilt * 0.35 + state.cameraTilt * 0.5);

    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath();
    ctx.ellipse(0, carH * 0.45, carW * 0.65, carH * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();

    if (state.drifting) {
        for (let i = 0; i < 2; i++) {
            const sx = (Math.random() - 0.5) * carW;
            const sy = carH * 0.4 + Math.random() * 8;
            ctx.fillStyle = `rgba(220,220,220,${0.4 - i * 0.1})`;
            ctx.beginPath();
            ctx.arc(sx, sy, 6 + Math.random() * 6, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    if (state.nitroActive && state.nitro > 0) {
        const flame = Math.random() * 0.5 + 0.5;
        const fl = ctx.createLinearGradient(0, carH * 0.5, 0, carH * 0.5 + 60 * flame);
        fl.addColorStop(0, 'rgba(255,255,255,0.95)');
        fl.addColorStop(0.3, 'rgba(0,229,255,0.9)');
        fl.addColorStop(1, 'rgba(255,43,138,0)');
        ctx.fillStyle = fl;
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 30;
        ctx.beginPath();
        ctx.moveTo(-carW * 0.25, carH * 0.5);
        ctx.lineTo( carW * 0.25, carH * 0.5);
        ctx.lineTo(0, carH * 0.5 + 55 * flame);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    drawCarShape(ctx, selectedCar, carW, carH);
    ctx.restore();
}

function drawWeather() {
    if (state.weather === 'rain') {
        ctx.strokeStyle = 'rgba(160,200,255,0.55)';
        ctx.lineWidth = 1;
        for (const d of rainDrops) {
            ctx.beginPath();
            ctx.moveTo(d.x, d.y);
            ctx.lineTo(d.x - 2, d.y + d.len);
            ctx.stroke();
        }
        ctx.fillStyle = 'rgba(20,30,60,0.15)';
        ctx.fillRect(0, 0, W, H);
    } else if (state.weather === 'fog') {
        const fog = ctx.createLinearGradient(0, H*0.4, 0, H);
        fog.addColorStop(0, 'rgba(200,220,255,0.05)');
        fog.addColorStop(1, 'rgba(200,220,255,0.35)');
        ctx.fillStyle = fog;
        ctx.fillRect(0, H*0.4, W, H*0.6);
    } else if (state.weather === 'night') {
        ctx.fillStyle = 'rgba(0,10,30,0.35)';
        ctx.fillRect(0, 0, W, H);
    }
}

function drawVignette() {
    const g = ctx.createRadialGradient(W/2, H/2, Math.min(W,H)*0.35, W/2, H/2, Math.max(W,H)*0.85);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.75)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
}

/* ====== Спавн ====== */
let spawnTimer = 0;
let coinSpawnTimer = 0;

function spawnObstacle() {
    const pool = CARS.filter(c => c.id !== selectedCar.id);
    const carRef = pool[Math.floor(Math.random() * pool.length)];
    const lanes = [-0.66, 0, 0.66];
    const laneX = lanes[Math.floor(Math.random() * lanes.length)];
    const enemySpeed = 0.5 + Math.random() * 0.5;

    obstacles.push({
        x: laneX,
        z: 1.05,
        carRef,
        w: 0.2,
        enemySpeed,
        tilt: (Math.random() - 0.5) * 0.15,
        targetX: laneX,
        switchTimer: 3 + Math.random() * 5
    });
}

function spawnCoin() {
    const lanes = [-0.66, 0, 0.66];
    const laneX = lanes[Math.floor(Math.random() * lanes.length)];
    coinDrops.push({
        x: laneX,
        z: 1.05,
        phase: Math.random() * Math.PI * 2,
        value: 5 + Math.floor(Math.random() * 3) * 5
    });
}

function spawnExhaust() {
    const screenX = W/2 + player.x * W * 0.35;
    const screenY = H * 0.86 + Math.min(W,H)*0.07;
    for (let i = 0; i < 2; i++) {
        particles.push({
            x: screenX + (Math.random() - 0.5) * 26,
            y: screenY + (Math.random() - 0.5) * 8,
            vx: (Math.random() - 0.5) * 1.4,
            vy: -Math.random() * 2.5 - 0.8,
            size: Math.random() * 2.5 + 1.5,
            life: 0.7, maxLife: 0.7,
            hue: (state.hue + 60) % 360, bright: 60
        });
    }
}

function spawnCrashParticles() {
    const screenX = W/2 + player.x * W * 0.35;
    const screenY = H * 0.86;
    for (let i = 0; i < 90; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = Math.random() * 14 + 3;
        particles.push({
            x: screenX, y: screenY,
            vx: Math.cos(a) * s,
            vy: Math.sin(a) * s - 4,
            size: Math.random() * 6 + 2,
            life: 1.6, maxLife: 1.6,
            hue: Math.random() * 60, bright: 70
        });
    }
}

function spawnFloatText(x, y, text, color, size = 20) {
    floatTexts.push({ x, y, text, color, size, life: 1, vy: -1.2 });
}

/* ====== Обновление ====== */
function update(dt) {
    state.cameraShake *= Math.max(0, 1 - dt * 3);
    state.cameraTilt += (player.tilt * 0.25 - state.cameraTilt) * dt * 4;

    if (state.running && !state.paused && !state.over) {
        state.time += dt;
        state.weatherTimer -= dt;
        if (state.weatherTimer <= 0) {
            const pool = ['clear', 'clear', 'rain', 'fog', 'night'];
            state.weather = pool[Math.floor(Math.random() * pool.length)];
            state.weatherTimer = 20 + Math.random() * 20;
        }

        if (state.weather === 'rain') {
            for (const d of rainDrops) {
                d.y += d.v * (1 + state.speed * 0.5);
                d.x -= state.speed * 2;
                if (d.y > H) { d.y = -20; d.x = Math.random() * W; }
                if (d.x < -10) d.x = W + 10;
            }
        }

        state.hue = (state.hue + dt * 12) % 360;

        updateDriving(dt);
        updateObstacles(dt);
        updateCoins(dt);
        updateParticles(dt);
        updateFloatTexts(dt);
        updateHUD();
    } else {
        updateParticles(dt);
        updateFloatTexts(dt);
    }
}

function updateDriving(dt) {
    let dir = 0;
    if (keys['arrowleft'] || keys['a'] || touch.left) dir -= 1;
    if (keys['arrowright'] || keys['d'] || touch.right) dir += 1;

    let accel = 0;
    if (keys['arrowup'] || keys['w'] || touch.gas) accel = 1;
    if (keys['arrowdown'] || keys['s'] || touch.brake) accel = -1;

    const nitroKey = keys['shift'];

    const canNitro = nitroKey && state.nitro > 0 && state.speed > 0.4 && !state.over;
    if (canNitro && !state.nitroActive) AUDIO.startNitro();
    if (!canNitro && state.nitroActive) AUDIO.stopNitro();
    state.nitroActive = canNitro;

    if (canNitro) {
        state.nitro = Math.max(0, state.nitro - dt * 0.35);
        state.cameraShake = Math.max(state.cameraShake, 0.35);
    } else {
        state.nitro = Math.min(1, state.nitro + dt * 0.08);
    }

    const handlingFactor = 0.7 + selectedCar.stats.handling * 0.06;
    const speedFactor = 0.7 + selectedCar.stats.speed * 0.06;
    const baseMax = 1.4 * speedFactor + state.level * 0.06;
    const maxSpeed = baseMax + (canNitro ? 1.2 : 0);

    let target = baseMax * 0.75;
    if (accel > 0) target = maxSpeed;
    else if (accel < 0) target = baseMax * 0.35;
    if (canNitro) target = maxSpeed;

    state.speed += (target - state.speed) * dt * (accel > 0 ? 1.6 : 2.2);
    state.speed = Math.max(0.15, Math.min(state.speed, maxSpeed + 0.1));

    const maxSteer = 1.9 * handlingFactor;
    const speedSteer = Math.min(1, state.speed * 0.9);
    player.targetX += dir * dt * maxSteer * speedSteer;
    player.targetX = Math.max(-0.86, Math.min(0.86, player.targetX));
    player.x += (player.targetX - player.x) * dt * 9;

    const targetTilt = dir * 0.5 - player.x * 0.6;
    player.tilt += (targetTilt - player.tilt) * dt * 7;

    const driftConditions = accel < 0 && Math.abs(dir) > 0 && state.speed > baseMax * 0.6;
    state.drifting = driftConditions;
    if (state.drifting) {
        state.driftScore += dt * 30 * state.combo;
        state.score += dt * 30 * state.combo;
        if (Math.random() < 0.3) spawnExhaust();
        driftInd.classList.remove('hidden');
    } else {
        driftInd.classList.add('hidden');
    }

    road.curve += dt * state.speed * 1.3;
    road.hill += dt * state.speed * 1.05;
    road.scroll += dt * state.speed;

    state.distance += state.speed * dt * 8;
    state.score += state.speed * dt * (18 * state.combo);

    state.biomeTimer -= state.speed * dt * 8;
    if (state.biomeTimer <= 0) {
        state.biomeIndex = (state.biomeIndex + 1) % BIOMES.length;
        state.biomeTimer = 800;
        biomeEl.textContent = BIOMES[state.biomeIndex].name;
        spawnFloatText(W/2, H * 0.3, BIOMES[state.biomeIndex].name, '#00e5ff', 36);
        AUDIO.levelUp();
    }

    const newLevel = Math.floor(state.distance / 140) + 1;
    if (newLevel > state.level) {
        state.level = newLevel;
        AUDIO.levelUp();
        spawnFloatText(W/2, H * 0.4, 'УРОВЕНЬ ' + newLevel, '#ffea00', 30);
    }

    if (state.comboTimer > 0) {
        state.comboTimer -= dt;
        if (state.comboTimer <= 0) {
            state.combo = 1;
            comboEl.classList.add('hidden');
        }
    }

    spawnTimer += dt;
    const interval = Math.max(0.42, 1.1 - state.level * 0.055);
    if (spawnTimer > interval) {
        spawnTimer = 0;
        if (Math.random() < 0.9) spawnObstacle();
    }

    coinSpawnTimer += dt;
    if (coinSpawnTimer > 1.8 + Math.random() * 1.5) {
        coinSpawnTimer = 0;
        if (Math.random() < 0.7) spawnCoin();
    }

    if (Math.random() < state.speed * 0.9) spawnExhaust();

    AUDIO.updateEngine(state.speed, baseMax);

    if (ghostFrames.length < 3600) {
        ghostFrames.push({ x: player.x, tilt: player.tilt });
    }
}

function updateObstacles(dt) {
    const move = state.speed * dt * 1.05;
    for (const o of obstacles) {
        o.z -= (move - o.enemySpeed * dt);
        o.switchTimer -= dt;
        if (o.switchTimer <= 0) {
            const lanes = [-0.66, 0, 0.66];
            o.targetX = lanes[Math.floor(Math.random() * lanes.length)];
            o.switchTimer = 2 + Math.random() * 4;
        }
        o.x += (o.targetX - o.x) * dt * 2;
    }

    for (const o of obstacles) {
        if (o.z <= 0.03) {
            const dx = Math.abs(o.x - player.x);
            if (dx < 0.25 && !state.over) {
                state.combo = Math.min(state.combo + 1, 8);
                state.comboTimer = 2.5;
                state.maxCombo = Math.max(state.maxCombo, state.combo);
                comboEl.classList.remove('hidden');
                comboValueEl.textContent = state.combo;
                const bonus = 40 * state.combo;
                state.score += bonus;
                spawnFloatText(
                    W/2 + (o.x - player.x) * W * 0.35,
                    H * 0.65,
                    '+' + bonus,
                    '#ffea00',
                    22
                );
            } else if (!state.over) {
                state.score += 12;
            }
        }
    }

    obstacles = obstacles.filter(o => o.z > 0.03);

    for (const o of obstacles) {
        if (o.z > 0.03 && o.z < 0.20 && !state.collisionLock) {
            const dx = Math.abs(o.x - player.x);
            if (dx < 0.16) {
                endGame();
                return;
            }
        }
    }
}

function updateCoins(dt) {
    const move = state.speed * dt * 1.05;
    for (const c of coinDrops) c.z -= move;

    for (const c of coinDrops) {
        if (c.z <= 0.03) continue;
        if (c.z < 0.15) {
            const dx = Math.abs(c.x - player.x);
            if (dx < 0.20) {
                const val = c.value;
                coins += val;
                state.sessionCoins += val;
                state.coinsEarned += val;
                saveCoins(coins);
                coinsEl.textContent = coins;
                spawnFloatText(
                    W/2 + (c.x - player.x) * W * 0.35,
                    H * 0.72,
                    '+' + val + '💰',
                    '#ffd700',
                    24
                );
                AUDIO.coin();
                c.z = 0;
            }
        }
    }

    coinDrops = coinDrops.filter(c => c.z > 0.03);
}

function updateParticles(dt) {
    for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12;
        p.vx *= 0.98;
        p.life -= dt;
    }
    particles = particles.filter(p => p.life > 0);
}

function updateFloatTexts(dt) {
    for (const t of floatTexts) {
        t.y += t.vy * 40 * dt;
        t.life -= dt * 0.9;
    }
    floatTexts = floatTexts.filter(t => t.life > 0);
}

function updateHUD() {
    const kmh = Math.floor(state.speed * 100);
    speedEl.textContent = kmh;
    const max = 350;
    speedFill.style.width = Math.min(100, (kmh / max) * 100) + '%';
    scoreEl.textContent = Math.floor(state.score).toLocaleString();
    levelEl.textContent = state.level;
    nitroFill.style.width = (state.nitro * 100) + '%';
}

/* ====== Цикл ====== */
let lastTime = performance.now();
function loop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    update(dt);
    draw();

    if (state.running && currentGhost) {
        ghostFrameIdx = Math.min(
            currentGhost.frames.length - 1,
            Math.floor(state.time * 60)
        );
    }

    requestAnimationFrame(loop);
}

/* ====== Инициализация ====== */
initStars();
initRain();
renderFilter();
renderGarage();
renderAchievements();
renderStats();
coinsEl.textContent = coins;
draw();
requestAnimationFrame(loop);

/* Защита от скролла */
document.addEventListener('touchmove', e => {
    if (e.target === canvas) e.preventDefault();
}, { passive:false });
