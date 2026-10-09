/* =========================================================
   WebAudio: двигатель, нитро, взрыв, монета, музыка
   ========================================================= */

class GameAudio {
    constructor() {
        this.enabled = true;
        this.volume = 0.6;
        this.musicOn = true;
        this.ctx = null;
        this.engineOsc = null;
        this.engineGain = null;
        this.engineFilter = null;
        this.nitroNoise = null;
        this.nitroGain = null;
        this.musicTimer = null;
    }

    init() {
        if (this.ctx) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch { this.enabled = false; }
    }

    ensureResume() {
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    }

    /* --- Двигатель --- */
    startEngine() {
        if (!this.enabled || !this.ctx) return;
        this.stopEngine();

        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = 60;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;

        const gain = this.ctx.createGain();
        gain.gain.value = 0;

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();

        this.engineOsc = osc;
        this.engineGain = gain;
        this.engineFilter = filter;
    }

    updateEngine(speed, maxSpeed) {
        if (!this.engineOsc) return;
        const t = Math.min(1, speed / maxSpeed);
        this.engineOsc.frequency.setTargetAtTime(60 + t*220, this.ctx.currentTime, 0.1);
        this.engineGain.gain.setTargetAtTime(this.enabled ? 0.05 + t*0.06 : 0, this.ctx.currentTime, 0.15);
        this.engineFilter.frequency.setTargetAtTime(400 + t*1800, this.ctx.currentTime, 0.15);
    }

    stopEngine() {
        if (this.engineOsc) {
            try { this.engineOsc.stop(); } catch {}
            this.engineOsc = null;
            this.engineGain = null;
            this.engineFilter = null;
        }
    }

    /* --- Нитро (белый шум) --- */
    startNitro() {
        if (!this.enabled || !this.ctx || this.nitroNoise) return;
        const bufferSize = this.ctx.sampleRate * 0.5;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random()*2-1);

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 2000;
        filter.Q.value = 2;

        const gain = this.ctx.createGain();
        gain.gain.value = 0;
        gain.gain.setTargetAtTime(0.18 * this.volume, this.ctx.currentTime, 0.05);

        noise.connect(filter); filter.connect(gain); gain.connect(this.ctx.destination);
        noise.start();
        this.nitroNoise = noise;
        this.nitroGain = gain;
    }

    stopNitro() {
        if (!this.nitroNoise) return;
        const n = this.nitroNoise;
        this.nitroGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
        setTimeout(() => { try { n.stop(); } catch {} }, 300);
        this.nitroNoise = null;
        this.nitroGain = null;
    }

    /* --- Точечные эффекты --- */
    coin() {
        if (!this.enabled || !this.ctx) return;
        const o = this.ctx.createOscillator();
        o.type = 'square';
        const g = this.ctx.createGain();
        o.connect(g); g.connect(this.ctx.destination);
        const t = this.ctx.currentTime;
        o.frequency.setValueAtTime(880, t);
        o.frequency.setValueAtTime(1320, t + 0.06);
        g.gain.setValueAtTime(0.12 * this.volume, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        o.start(t); o.stop(t + 0.15);
    }

    crash() {
        if (!this.enabled || !this.ctx) return;
        const bufferSize = this.ctx.sampleRate * 1.0;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random()*2-1) * (1 - i/bufferSize);

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.8);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.5 * this.volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.9);

        noise.connect(filter); filter.connect(gain); gain.connect(this.ctx.destination);
        noise.start();
    }

    click() {
        if (!this.enabled || !this.ctx) return;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sine';
        const t = this.ctx.currentTime;
        o.frequency.setValueAtTime(600, t);
        o.frequency.exponentialRampToValueAtTime(300, t + 0.06);
        g.gain.setValueAtTime(0.08 * this.volume, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        o.connect(g); g.connect(this.ctx.destination);
        o.start(t); o.stop(t + 0.08);
    }

    levelUp() {
        if (!this.enabled || !this.ctx) return;
        const notes = [523, 659, 784, 1046];
        notes.forEach((f, i) => {
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            o.type = 'triangle';
            o.frequency.value = f;
            const t = this.ctx.currentTime + i * 0.08;
            g.gain.setValueAtTime(0.12 * this.volume, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
            o.connect(g); g.connect(this.ctx.destination);
            o.start(t); o.stop(t + 0.25);
        });
    }

    purchase() {
        if (!this.enabled || !this.ctx) return;
        const notes = [523, 784, 1046];
        notes.forEach((f, i) => {
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            o.type = 'sine';
            o.frequency.value = f;
            const t = this.ctx.currentTime + i * 0.09;
            g.gain.setValueAtTime(0.15 * this.volume, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
            o.connect(g); g.connect(this.ctx.destination);
            o.start(t); o.stop(t + 0.3);
        });
    }

    /* --- Музыка (простой секвенсор) --- */
    startMusic() {
        if (!this.musicOn || !this.ctx || this.musicTimer) return;
        const bass = [55, 55, 82.4, 73.4, 55, 55, 65.4, 73.4];
        let i = 0;
        const playBeat = () => {
            if (!this.enabled || !this.ctx || this.ctx.state !== 'running') return;
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            o.type = 'triangle';
            o.frequency.value = bass[i % bass.length];
            const t = this.ctx.currentTime;
            g.gain.setValueAtTime(0.06 * this.volume, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
            o.connect(g); g.connect(this.ctx.destination);
            o.start(t); o.stop(t + 0.4);
            i++;
        };
        playBeat();
        this.musicTimer = setInterval(playBeat, 400);
    }

    stopMusic() {
        if (this.musicTimer) { clearInterval(this.musicTimer); this.musicTimer = null; }
    }

    setVolume(v) { this.volume = v; }
    setEnabled(v) {
        this.enabled = v;
        if (!v) { this.stopEngine(); this.stopNitro(); this.stopMusic(); }
    }
}

const AUDIO = new GameAudio();
