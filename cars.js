/* =========================================================
   50 МАШИН · 5 КЛАССОВ · кастомизация
   ========================================================= */

const CAR_CLASSES = {
    D: { name:'Класс D', color:'#7dd3fc' },
    C: { name:'Класс C', color:'#4ade80' },
    B: { name:'Класс B', color:'#facc15' },
    A: { name:'Класс A', color:'#fb923c' },
    S: { name:'Класс S', color:'#f43f5e' }
};

function makeCar(i, cls, name, price, body, neon, stats, opts={}) {
    return {
        id: 'car_' + i,
        name, cls, price,
        unlocked: price === 0,
        bodyColor: body,
        neonColor: neon,
        accentColor: '#0a0a0a',
        stats,
        desc: opts.desc || '',
        w: opts.w || 0.30 + Math.random()*0.08,
        h: opts.h || 0.56 + Math.random()*0.12,
        cabinW: opts.cabinW || 0.20,
        cabinH: opts.cabinH || 0.20,
        spoiler: opts.spoiler ?? true,
        wheelStyle: 0
    };
}

const CARS = [
    /* КЛАСС D — 10 */
    makeCar(1,'D','CITY HATCH',0,'#64748b','#94a3b8',{speed:4,handling:6,nitro:4},{desc:'Городской хэтчбек.'}),
    makeCar(2,'D','SEDAN LX',0,'#334155','#38bdf8',{speed:5,handling:6,nitro:4},{desc:'Классический седан.'}),
    makeCar(3,'D','MINI GO',0,'#dc2626','#f87171',{speed:4,handling:7,nitro:4},{desc:'Компактный и юркий.'}),
    makeCar(4,'D','URBAN 40',500,'#0ea5e9','#22d3ee',{speed:5,handling:6,nitro:5}),
    makeCar(5,'D','PICKUP',700,'#a16207','#fbbf24',{speed:4,handling:5,nitro:6}),
    makeCar(6,'D','VAN CARGO',900,'#78716c','#a8a29e',{speed:3,handling:5,nitro:7}),
    makeCar(7,'D','WAGON T',1100,'#14532d','#4ade80',{speed:5,handling:6,nitro:5}),
    makeCar(8,'D','COUPE 92',1400,'#7c2d12','#fb923c',{speed:6,handling:6,nitro:5}),
    makeCar(9,'D','OFFROAD JR',1700,'#365314','#84cc16',{speed:5,handling:7,nitro:5}),
    makeCar(10,'D','TURBO KIT',2100,'#4c1d95','#a78bfa',{speed:6,handling:6,nitro:6}),
    /* КЛАСС C — 10 */
    makeCar(11,'C','SPORT 200',2800,'#059669','#34d399',{speed:6,handling:7,nitro:6}),
    makeCar(12,'C','RX COUPE',3500,'#be123c','#fb7185',{speed:7,handling:6,nitro:6}),
    makeCar(13,'C','STREET GT',4300,'#1d4ed8','#60a5fa',{speed:7,handling:7,nitro:6}),
    makeCar(14,'C','RALLY X',5200,'#c2410c','#fb923c',{speed:6,handling:8,nitro:6}),
    makeCar(15,'C','DRIFT SPEC',6200,'#a21caf','#e879f9',{speed:7,handling:8,nitro:6}),
    makeCar(16,'C','TRACK DAY',7200,'#0f766e','#2dd4bf',{speed:7,handling:7,nitro:7}),
    makeCar(17,'C','NIGHT RUN',8400,'#1e1b4b','#818cf8',{speed:8,handling:6,nitro:7}),
    makeCar(18,'C','AWD PRO',9600,'#166534','#22c55e',{speed:7,handling:8,nitro:7}),
    makeCar(19,'C','TURBO S',11000,'#991b1b','#ef4444',{speed:8,handling:7,nitro:7}),
    makeCar(20,'C','V6 LEGEND',12500,'#075985','#38bdf8',{speed:8,handling:7,nitro:7}),
    /* КЛАСС B — 10 */
    makeCar(21,'B','VYPER GT',14000,'#e11d2b','#ff3355',{speed:8,handling:8,nitro:7},{desc:'Классический спорткар.'}),
    makeCar(22,'B','MUSCLE 440',15500,'#f59e0b','#fbbf24',{speed:8,handling:6,nitro:8}),
    makeCar(23,'B','EURO R',17000,'#1e40af','#3b82f6',{speed:8,handling:8,nitro:7}),
    makeCar(24,'B','JDM ICON',19000,'#fbbf24','#fde047',{speed:8,handling:9,nitro:7}),
    makeCar(25,'B','WRC EVO',21000,'#0369a1','#22d3ee',{speed:8,handling:9,nitro:8}),
    makeCar(26,'B','DRAG KING',23000,'#7f1d1d','#dc2626',{speed:9,handling:5,nitro:8}),
    makeCar(27,'B','CIRCUIT 8',26000,'#15803d','#4ade80',{speed:9,handling:8,nitro:7}),
    makeCar(28,'B','SUPER TOUR',29000,'#6d28d9','#a78bfa',{speed:9,handling:8,nitro:8}),
    makeCar(29,'B','ROADSTER 2',32000,'#be185d','#f472b6',{speed:8,handling:9,nitro:8}),
    makeCar(30,'B','GTR STAGE 3',36000,'#0f172a','#22d3ee',{speed:9,handling:9,nitro:8}),
    /* КЛАСС A — 10 */
    makeCar(31,'A','AERO X1',42000,'#06b6d4','#00e5ff',{speed:9,handling:9,nitro:8}),
    makeCar(32,'A','PHANTOM GT',48000,'#4c1d95','#c026d3',{speed:10,handling:8,nitro:9}),
    makeCar(33,'A','STORM R',55000,'#0891b2','#67e8f9',{speed:10,handling:9,nitro:8}),
    makeCar(34,'A','BLAZE 9',63000,'#ea580c','#fb923c',{speed:10,handling:9,nitro:9}),
    makeCar(35,'A','CARBON F',72000,'#18181b','#a3a3a3',{speed:10,handling:9,nitro:9}),
    makeCar(36,'A','V12 MASTER',82000,'#b91c1c','#fca5a5',{speed:10,handling:9,nitro:9}),
    makeCar(37,'A','TITAN GT',93000,'#3f3f46','#a1a1aa',{speed:10,handling:10,nitro:9}),
    makeCar(38,'A','APEX 1',105000,'#065f46','#34d399',{speed:10,handling:10,nitro:9}),
    makeCar(39,'A','REDLINE 8',118000,'#dc2626','#f87171',{speed:10,handling:10,nitro:10}),
    makeCar(40,'A','NIGHTMARE',132000,'#1e1b4b','#a855f7',{speed:10,handling:10,nitro:10}),
    /* КЛАСС S — 10 */
    makeCar(41,'S','PHANTOM ZR',150000,'#a855f7','#c026d3',{speed:10,handling:10,nitro:10}),
    makeCar(42,'S','VOLT E-7',165000,'#22c55e','#4ade80',{speed:9,handling:10,nitro:10},{desc:'Электро. Бесконечное нитро.'}),
    makeCar(43,'S','HYPER ONE',180000,'#0ea5e9','#22d3ee',{speed:10,handling:10,nitro:10}),
    makeCar(44,'S','VIRTUAL X',195000,'#7c3aed','#a78bfa',{speed:10,handling:10,nitro:10}),
    makeCar(45,'S','GODSPEED',210000,'#fbbf24','#fde047',{speed:10,handling:10,nitro:10}),
    makeCar(46,'S','QUANTUM',225000,'#06b6d4','#67e8f9',{speed:10,handling:10,nitro:10}),
    makeCar(47,'S','NEON KING',240000,'#ec4899','#f9a8d4',{speed:10,handling:10,nitro:10}),
    makeCar(48,'S','DIMENSION',255000,'#8b5cf6','#c4b5fd',{speed:10,handling:10,nitro:10}),
    makeCar(49,'S','OMEGA',270000,'#ef4444','#fca5a5',{speed:10,handling:10,nitro:10}),
    makeCar(50,'S','4D ULTIMATE',300000,'#ffffff','#00e5ff',{speed:10,handling:10,nitro:10},{desc:'Финальный. Легенда.'})
];

const COLOR_PALETTE = [
    '#e11d2b','#f59e0b','#fbbf24','#22c55e','#06b6d4',
    '#3b82f6','#8b5cf6','#ec4899','#a855f7','#0ea5e9',
    '#f5f5f5','#1f2937','#0891b2','#84cc16','#f97316'
];
const NEON_PALETTE = [
    '#00e5ff','#ff3355','#a855f7','#22c55e','#fbbf24',
    '#ec4899','#4ade80','#22d3ee','#f97316','#c026d3'
];
const WHEEL_STYLES = 5;

function loadCustom() {
    try { return JSON.parse(localStorage.getItem('nd4d_custom') || '{}'); }
    catch { return {}; }
}
function saveCustom(c) { localStorage.setItem('nd4d_custom', JSON.stringify(c)); }
function applyCustomToCars() {
    const c = loadCustom();
    for (const car of CARS) {
        const u = c[car.id];
        if (!u) continue;
        if (u.bodyColor) car.bodyColor = u.bodyColor;
        if (u.neonColor) car.neonColor = u.neonColor;
        if (typeof u.wheelStyle === 'number') car.wheelStyle = u.wheelStyle;
    }
}

function drawCarShape(ctx, car, width, height, opts = {}) {
    const w = width, h = height;
    const hw = w/2, hh = h/2;
    const { bodyColor, accentColor, neonColor, cabinW, cabinH, spoiler, wheelStyle } = car;
    const headlightsOn = opts.headlights !== false;
    const opacity = opts.opacity ?? 1;

    const noseW = w * 0.62;
    const tailW = w * 0.90;

    ctx.globalAlpha = opacity;

    ctx.save();
    ctx.shadowColor = neonColor;
    ctx.shadowBlur = w * 0.5;

    ctx.beginPath();
    ctx.moveTo(-noseW/2, -hh);
    ctx.quadraticCurveTo(-noseW/2*0.55, -hh*1.05, 0, -hh*1.05);
    ctx.quadraticCurveTo( noseW/2*0.55, -hh*1.05, noseW/2, -hh);
    ctx.lineTo( tailW/2, hh*0.72);
    ctx.quadraticCurveTo( tailW/2, hh, tailW/2*0.82, hh);
    ctx.lineTo(-tailW/2*0.82, hh);
    ctx.quadraticCurveTo(-tailW/2, hh, -tailW/2, hh*0.72);
    ctx.closePath();

    const bg = ctx.createLinearGradient(-hw, 0, hw, 0);
    bg.addColorStop(0, shade(bodyColor, -0.5));
    bg.addColorStop(0.2, shade(bodyColor, -0.15));
    bg.addColorStop(0.5, bodyColor);
    bg.addColorStop(0.8, shade(bodyColor, -0.15));
    bg.addColorStop(1, shade(bodyColor, -0.5));
    ctx.fillStyle = bg;
    ctx.fill();

    const vg = ctx.createLinearGradient(0, -hh, 0, hh);
    vg.addColorStop(0, 'rgba(255,255,255,0)');
    vg.addColorStop(0.5, 'rgba(255,255,255,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = vg;
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = Math.max(1.2, w * 0.022);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    const shine = ctx.createLinearGradient(0, -hh, 0, hh*0.3);
    shine.addColorStop(0, 'rgba(255,255,255,0.5)');
    shine.addColorStop(0.4, 'rgba(255,255,255,0.1)');
    shine.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = shine;
    ctx.beginPath();
    ctx.moveTo(-noseW/2*0.7, -hh*0.9);
    ctx.lineTo( noseW/2*0.7, -hh*0.9);
    ctx.lineTo( tailW/2*0.7, 0);
    ctx.lineTo(-tailW/2*0.7, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillRect(-w*0.055, -hh*0.9, w*0.035, h*0.28);
    ctx.fillRect( w*0.02,  -hh*0.9, w*0.035, h*0.28);

    const wsY = -hh + h*0.28;
    const wsH = h*0.13;
    const wsW = cabinW * w * 0.95;
    ctx.beginPath();
    ctx.moveTo(-wsW/2*0.85, wsY+wsH);
    ctx.lineTo( wsW/2*0.85, wsY+wsH);
    ctx.lineTo( wsW/2,       wsY);
    ctx.lineTo(-wsW/2,       wsY);
    ctx.closePath();
    const wsGrad = ctx.createLinearGradient(0, wsY, 0, wsY+wsH);
    wsGrad.addColorStop(0, 'rgba(200,240,255,0.7)');
    wsGrad.addColorStop(0.3, 'rgba(80,130,200,0.85)');
    wsGrad.addColorStop(1, 'rgba(10,20,40,0.95)');
    ctx.fillStyle = wsGrad;
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.moveTo(-wsW/2*0.7, wsY+wsH*0.85);
    ctx.lineTo( wsW/2*0.2, wsY+wsH*0.85);
    ctx.lineTo( wsW/2*0.4, wsY+wsH*0.15);
    ctx.lineTo(-wsW/2*0.5, wsY+wsH*0.15);
    ctx.closePath();
    ctx.fill();

    const roofY = wsY + wsH;
    const roofH = cabinH * h * 0.85;
    const roofGrad = ctx.createLinearGradient(-w/2, 0, w/2, 0);
    roofGrad.addColorStop(0, shade(bodyColor, -0.35));
    roofGrad.addColorStop(0.5, shade(bodyColor, -0.1));
    roofGrad.addColorStop(1, shade(bodyColor, -0.35));
    ctx.fillStyle = roofGrad;
    ctx.beginPath();
    ctx.moveTo(-cabinW*w/2*0.95, roofY);
    ctx.lineTo( cabinW*w/2*0.95, roofY);
    ctx.lineTo( cabinW*w/2,       roofY + roofH);
    ctx.lineTo(-cabinW*w/2,       roofY + roofH);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.lineWidth = Math.max(1, w*0.01);
    ctx.stroke();

    const rsY = roofY + roofH;
    const rsH = h*0.08;
    const rsGrad = ctx.createLinearGradient(0, rsY, 0, rsY+rsH);
    rsGrad.addColorStop(0, 'rgba(10,20,40,0.95)');
    rsGrad.addColorStop(1, 'rgba(80,130,200,0.7)');
    ctx.fillStyle = rsGrad;
    ctx.beginPath();
    ctx.moveTo(-cabinW*w/2, rsY);
    ctx.lineTo( cabinW*w/2, rsY);
    ctx.lineTo( cabinW*w/2*0.85, rsY+rsH);
    ctx.lineTo(-cabinW*w/2*0.85, rsY+rsH);
    ctx.closePath();
    ctx.fill();

    if (headlightsOn) {
        const headY = -hh*0.98;
        const headW = w*0.18;
        const headH = h*0.05;
        ctx.save();
        ctx.shadowColor = '#fff8c0';
        ctx.shadowBlur = w*0.4;
        const hg = ctx.createRadialGradient(0,headY,0,0,headY,headW);
        hg.addColorStop(0, '#ffffff');
        hg.addColorStop(1, '#fff3a0');
        ctx.fillStyle = hg;
        roundRect(ctx, -noseW/2 + w*0.03, headY, headW, headH, 3); ctx.fill();
        roundRect(ctx,  noseW/2 - w*0.03 - headW, headY, headW, headH, 3); ctx.fill();
        ctx.restore();
    }

    ctx.save();
    ctx.shadowColor = '#ff2222';
    ctx.shadowBlur = w*0.4;
    ctx.fillStyle = '#ff2b2b';
    roundRect(ctx, -tailW/2 + w*0.04, hh-h*0.06, w*0.22, h*0.05, 2); ctx.fill();
    roundRect(ctx,  tailW/2 - w*0.04 - w*0.22, hh-h*0.06, w*0.22, h*0.05, 2); ctx.fill();
    ctx.restore();

    if (spoiler) {
        ctx.fillStyle = accentColor;
        ctx.fillRect(-tailW/2*0.95, hh-h*0.035, tailW*0.95, h*0.05);
        ctx.fillStyle = neonColor;
        ctx.fillRect(-tailW/2*0.95, hh-h*0.035, tailW*0.95, h*0.014);
    }

    drawWheel(ctx, -tailW/2-w*0.015, -hh+h*0.14, w*0.085, h*0.15, wheelStyle);
    drawWheel(ctx,  tailW/2+w*0.015, -hh+h*0.14, w*0.085, h*0.15, wheelStyle);
    drawWheel(ctx, -tailW/2-w*0.015,  hh-h*0.22, w*0.095, h*0.17, wheelStyle);
    drawWheel(ctx,  tailW/2+w*0.015,  hh-h*0.22, w*0.095, h*0.17, wheelStyle);

    ctx.save();
    ctx.shadowColor = neonColor;
    ctx.shadowBlur = w*0.5;
    ctx.strokeStyle = neonColor;
    ctx.lineWidth = Math.max(1, w*0.024);
    ctx.beginPath();
    ctx.moveTo(-tailW/2, -hh+h*0.18); ctx.lineTo(-tailW/2, hh-h*0.18);
    ctx.moveTo( tailW/2, -hh+h*0.18); ctx.lineTo( tailW/2, hh-h*0.18);
    ctx.stroke();
    ctx.restore();

    ctx.globalAlpha = 1;
}

function drawWheel(ctx, x, y, w, h, style=0) {
    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = '#0a0a0a';
    roundRect(ctx, -w/2, -h/2, w, h, Math.min(w,h)*0.35);
    ctx.fill();

    const tireGrad = ctx.createLinearGradient(-w/2, 0, w/2, 0);
    tireGrad.addColorStop(0, 'rgba(50,50,50,0.6)');
    tireGrad.addColorStop(0.5, 'rgba(0,0,0,0)');
    tireGrad.addColorStop(1, 'rgba(0,0,0,0.7)');
    ctx.fillStyle = tireGrad;
    roundRect(ctx, -w/2, -h/2, w, h, Math.min(w,h)*0.35);
    ctx.fill();

    const r = Math.min(w, h) * 0.4;

    if (style === 0) {
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
        g.addColorStop(0, '#ccc');
        g.addColorStop(0.6, '#888');
        g.addColorStop(1, '#444');
        ctx.fillStyle = g;
        for (let i = 0; i < 5; i++) {
            ctx.save();
            ctx.rotate(i * Math.PI * 2 / 5);
            ctx.fillRect(-w*0.055, -h*0.42, w*0.11, h*0.42);
            ctx.restore();
        }
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(0, 0, r*0.3, 0, Math.PI*2);
        ctx.fill();
    } else if (style === 1) {
        const g = ctx.createRadialGradient(-r*0.3, -r*0.3, 0, 0, 0, r);
        g.addColorStop(0, '#e8e8e8');
        g.addColorStop(0.6, '#999');
        g.addColorStop(1, '#333');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#000';
        for (let i = 0; i < 4; i++) {
            ctx.save();
            ctx.rotate(i * Math.PI / 2 + Math.PI/4);
            ctx.fillRect(-w*0.045, -h*0.35, w*0.09, h*0.14);
            ctx.restore();
        }
    } else if (style === 2) {
        const g = ctx.createRadialGradient(-r*0.3, -r*0.3, 0, 0, 0, r);
        g.addColorStop(0, '#fff8b0');
        g.addColorStop(0.5, '#ffd700');
        g.addColorStop(1, '#8b6914');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI*2);
        ctx.fill();
        ctx.strokeStyle = '#fff8b0';
        ctx.lineWidth = 1;
        ctx.stroke();
    } else if (style === 3) {
        const g = ctx.createLinearGradient(-w/2, 0, w/2, 0);
        g.addColorStop(0, '#fff');
        g.addColorStop(0.4, '#888');
        g.addColorStop(0.6, '#ddd');
        g.addColorStop(1, '#444');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath();
        ctx.arc(-r*0.3, -r*0.3, r*0.25, 0, Math.PI*2);
        ctx.fill();
    } else {
        ctx.fillStyle = '#0a0a0a';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI*2);
        ctx.fill();
        ctx.strokeStyle = '#ff3355';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-w*0.32, -h*0.18); ctx.lineTo(w*0.32, h*0.18);
        ctx.moveTo(-w*0.32,  h*0.18); ctx.lineTo(w*0.32, -h*0.18);
        ctx.moveTo(0, -h*0.38);       ctx.lineTo(0, h*0.38);
        ctx.stroke();
        ctx.fillStyle = '#ff3355';
        ctx.beginPath();
        ctx.arc(0, 0, r*0.18, 0, Math.PI*2);
        ctx.fill();
    }
    ctx.restore();
}

function shade(hex, amt) {
    const c = hexToRgb(hex);
    return `rgb(${clamp(c.r+c.r*amt,0,255)|0},${clamp(c.g+c.g*amt,0,255)|0},${clamp(c.b+c.b*amt,0,255)|0})`;
}
function hexToRgb(hex) {
    const h = hex.replace('#','');
    if (h.length === 3) {
        return {r:parseInt(h[0]+h[0],16), g:parseInt(h[1]+h[1],16), b:parseInt(h[2]+h[2],16)};
    }
    return {
        r: parseInt(h.substring(0,2),16),
        g: parseInt(h.substring(2,4),16),
        b: parseInt(h.substring(4,6),16)
    };
}
function clamp(v,a,b){ return v<a?a:v>b?b:v; }
function roundRect(ctx,x,y,w,h,r){
    r = Math.min(r, Math.abs(w)/2, Math.abs(h)/2);
    ctx.beginPath();
    ctx.moveTo(x+r,y);
    ctx.lineTo(x+w-r,y);
    ctx.quadraticCurveTo(x+w,y,x+w,y+r);
    ctx.lineTo(x+w,y+h-r);
    ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    ctx.lineTo(x+r,y+h);
    ctx.quadraticCurveTo(x,y+h,x,y+h-r);
    ctx.lineTo(x,y+r);
    ctx.quadraticCurveTo(x,y,x+r,y);
    ctx.closePath();
}
