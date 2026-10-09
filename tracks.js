/* =========================================================
   КРУГОВЫЕ ТРАССЫ — Овал, S-образная, Восьмёрка, Спираль
   Каждая трасса — набор функций от прогресса круга p (0..1):
     curve(p) — смещение центра дороги по X
     width(p) — ширина дороги (множитель)
     hill(p)  — вертикальные волны ("4D")
   ========================================================= */

const TRACKS = {
    oval: {
        name: 'OVAL',
        desc: 'Классический овал. Два поворота, длинные прямые.',
        laps: 3,
        hue: 190,
        curve: (p) => Math.sin(p * Math.PI * 2) * 0.85,
        width: (p) => 1.0,
        hill: (p) => Math.sin(p * Math.PI * 4) * 0.08
    },
    s_curve: {
        name: 'S-CURVE',
        desc: 'Извилистая трасса. Требует плавного руля.',
        laps: 3,
        hue: 130,
        curve: (p) => Math.sin(p * Math.PI * 4) * 0.7,
        width: (p) => 0.95,
        hill: (p) => Math.sin(p * Math.PI * 6) * 0.12
    },
    figure_eight: {
        name: 'FIGURE-8',
        desc: 'Восьмёрка. Пересечение в центре.',
        laps: 4,
        hue: 320,
        curve: (p) => Math.sin(p * Math.PI * 4) * 0.9,
        width: (p) => 0.85,
        hill: (p) => Math.sin(p * Math.PI * 2) * 0.15
    },
    spiral: {
        name: 'SPIRAL',
        desc: 'Спираль. Длинные виражи.',
        laps: 3,
        hue: 260,
        curve: (p) => Math.sin(p * Math.PI * 2 + Math.sin(p * Math.PI * 6) * 0.5) * 0.75,
        width: (p) => 1.05,
        hill: (p) => Math.sin(p * Math.PI * 8) * 0.1
    }
};

/* Список ключей шин (порядок для UI) */
const TIRE_KEYS = ['soft','medium','hard'];

/* =========================================================
   РЕЖИМЫ ГОНКИ
   ========================================================= */
const RACE_MODES = {
    gp: {
        name: 'GRAND PRIX',
        desc: 'Круговая гонка против 5 соперников. Кто первый — тот победил.',
        badge: '5 AI'
    },
    time_trial: {
        name: 'TIME TRIAL',
        desc: 'Гонка на время. Только ты и призрак твоего лучшего круга.',
        badge: 'SOLO'
    },
    elimination: {
        name: 'ELIMINATION',
        desc: 'Каждые 30 секунд последний выбывает. Продержись до конца.',
        badge: 'SURVIVAL'
    }
};
