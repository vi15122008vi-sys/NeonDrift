/* =========================================================
   ФИЗИКА АВТО — инерция, сцепление, занос, ABS
   ========================================================= */

class CarPhysics {
    constructor(car, tires) {
        this.car = car;
        this.tires = tires || { grip: 1, maxSpeed: 1, nitroRate: 0.35, name: 'MEDIUM', color: '#ffd23a' };

        // Скорость — мировая (1 = ~72 км/ч)
        this.speed = 0;
        // Угол поворота колес: -1..1
        this.steering = 0;
        // Смещение по X в пределах дороги
        this.x = 0;
        // Угловая скорость (для заноса)
        this.angularVel = 0;
        // Визуальный наклон / крен
        this.tilt = 0;
        // Состояния
        this.braking = false;
        this.accelerating = false;
        this.drifting = false;
        this.absActive = false;
    }

    /**
     * Обновление физики.
     * @param {number} dt — дельта времени в секундах
     * @param {object} input — { steer:-1..1, gas:bool, brake:bool, nitro:bool }
     * @param {number} speedFactor — множитель макс. скорости (для уровня/круга)
     */
    update(dt, input, speedFactor = 1) {
        const carStats = this.car.stats;
        const tires = this.tires;

        // Максимальная скорость
        const baseMax = (1.2 + carStats.speed * 0.12) * speedFactor * tires.maxSpeed;
        const nitroBoost = input.nitro ? 1.35 : 1;
        const maxSpeed = baseMax * nitroBoost;

        // Разгон / торможение
        let accel = 0;
        if (input.gas && !input.brake) {
            accel = 1.6 + carStats.handling * 0.05;
            this.accelerating = true;
            this.braking = false;
        } else if (input.brake && !input.gas) {
            accel = -3.2;
            this.braking = true;
            this.accelerating = false;
        } else {
            accel = -0.3; // пассивное замедление
            this.accelerating = false;
            this.braking = false;
        }

        // ABS — снижает эффективность торможения на высокой скорости
        if (this.braking && this.speed > baseMax * 0.7) {
            this.absActive = true;
            accel *= 0.7;
        } else {
            this.absActive = false;
        }

        // Меняем скорость
        this.speed += accel * dt;
        this.speed = Math.max(0, Math.min(this.speed, maxSpeed));

        // Руль: чем выше скорость — тем меньше угол
        const speedRatio = this.speed / Math.max(baseMax, 0.01);
        const steerCap = 0.45 + carStats.handling * 0.04;
        const steerTarget = input.steer * steerCap;
        this.steering += (steerTarget - this.steering) * Math.min(1, dt * 8);

        // Сцепление (grip)
        const grip = tires.grip * (0.85 + carStats.handling * 0.03);

        // Занос: если руль сильно выкручен на скорости
        this.drifting = Math.abs(input.steer) > 0.7 && speedRatio > 0.55;

        // Угловая скорость — инерция поворота
        const targetAngular = this.steering * (this.drifting ? 1.6 : 1) * grip;
        this.angularVel += (targetAngular - this.angularVel) * Math.min(1, dt * 5);

        // Смещение по X
        this.x += this.angularVel * dt * 0.9;

        // Ограничение — не выезжать за пределы дороги
        const limit = this.drifting ? 0.95 : 0.88;
        if (this.x > limit) { this.x = limit; this.angularVel *= 0.6; }
        if (this.x < -limit) { this.x = -limit; this.angularVel *= 0.6; }

        // Визуальный крен
        const targetTilt = this.angularVel * 0.4 - this.x * 0.4 + (this.drifting ? input.steer * 0.3 : 0);
        this.tilt += (targetTilt - this.tilt) * Math.min(1, dt * 7);

        return {
            x: this.x,
            tilt: this.tilt,
            speed: this.speed,
            drifting: this.drifting,
            braking: this.braking,
            abs: this.absActive,
            maxSpeed: baseMax
        };
    }
}

/* =========================================================
   ТИПЫ ШИН — влияют на grip, макс. скорость и скорость нитро
   ========================================================= */
const TIRES = {
    soft:   { name:'SOFT',   grip:1.15, maxSpeed:1.08, nitroRate:0.45, color:'#ff3a3a' },
    medium: { name:'MEDIUM', grip:1.00, maxSpeed:1.00, nitroRate:0.35, color:'#ffd23a' },
    hard:   { name:'HARD',   grip:0.90, maxSpeed:0.94, nitroRate:0.28, color:'#e6eef7' }
};
