/** צליל ורטט — מסונתזים ב-Web Audio, ללא קבצים חיצוניים (עובד גם במצב לא מקוון). */
import { settings } from "../state/appState.js";
let ctx = null;
function audio() {
    if (typeof window === 'undefined')
        return null;
    try {
        if (!ctx) {
            const Ctor = window.AudioContext ?? window.webkitAudioContext;
            if (!Ctor)
                return null;
            ctx = new Ctor();
        }
        if (ctx.state === 'suspended')
            void ctx.resume();
        return ctx;
    }
    catch {
        return null;
    }
}
function tone(opts) {
    if (!settings().sound)
        return;
    const ac = audio();
    if (!ac)
        return;
    const start = ac.currentTime + (opts.delay ?? 0);
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = opts.type ?? 'sine';
    osc.frequency.setValueAtTime(opts.freq, start);
    if (opts.sweepTo)
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.sweepTo), start + opts.duration);
    const vol = opts.volume ?? 0.06;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(vol, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + opts.duration);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(start);
    osc.stop(start + opts.duration + 0.02);
}
function noise(duration, volume = 0.05) {
    if (!settings().sound)
        return;
    const ac = audio();
    if (!ac)
        return;
    const frames = Math.floor(ac.sampleRate * duration);
    const buffer = ac.createBuffer(1, frames, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    }
    const src = ac.createBufferSource();
    src.buffer = buffer;
    const gain = ac.createGain();
    gain.gain.value = volume;
    const filter = ac.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1200;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ac.destination);
    src.start();
}
export function vibrate(pattern) {
    if (!settings().haptics)
        return;
    try {
        navigator.vibrate?.(pattern);
    }
    catch {
        /* לא נתמך — ממשיכים */
    }
}
export const sfx = {
    cardDeal() {
        noise(0.07, 0.035);
        vibrate(8);
    },
    cardFlip() {
        noise(0.09, 0.045);
        tone({ freq: 320, duration: 0.06, type: 'triangle', volume: 0.03 });
    },
    chip() {
        tone({ freq: 880, duration: 0.05, type: 'square', volume: 0.03 });
        tone({ freq: 1320, duration: 0.05, type: 'square', volume: 0.02, delay: 0.03 });
        vibrate(10);
    },
    tap() {
        tone({ freq: 520, duration: 0.04, type: 'sine', volume: 0.025 });
        vibrate(6);
    },
    correct() {
        tone({ freq: 660, duration: 0.1, type: 'sine', volume: 0.05 });
        tone({ freq: 880, duration: 0.16, type: 'sine', volume: 0.05, delay: 0.09 });
        vibrate([12, 40, 12]);
    },
    wrong() {
        tone({ freq: 220, duration: 0.18, type: 'sawtooth', volume: 0.04, sweepTo: 140 });
        vibrate([40, 60, 40]);
    },
    win() {
        tone({ freq: 523, duration: 0.12, volume: 0.05 });
        tone({ freq: 659, duration: 0.12, volume: 0.05, delay: 0.1 });
        tone({ freq: 784, duration: 0.22, volume: 0.05, delay: 0.2 });
        vibrate([15, 50, 15, 50, 25]);
    },
    blackjack() {
        tone({ freq: 659, duration: 0.1, volume: 0.05 });
        tone({ freq: 880, duration: 0.1, volume: 0.05, delay: 0.09 });
        tone({ freq: 1046, duration: 0.1, volume: 0.05, delay: 0.18 });
        tone({ freq: 1318, duration: 0.3, volume: 0.05, delay: 0.27 });
        vibrate([20, 40, 20, 40, 60]);
    },
    lose() {
        tone({ freq: 300, duration: 0.25, type: 'triangle', volume: 0.04, sweepTo: 180 });
        vibrate(35);
    },
    push() {
        tone({ freq: 440, duration: 0.14, type: 'sine', volume: 0.035 });
        vibrate(15);
    },
    shuffle() {
        noise(0.35, 0.05);
        vibrate([10, 30, 10, 30, 10]);
    },
    levelUp() {
        tone({ freq: 523, duration: 0.1, volume: 0.05 });
        tone({ freq: 784, duration: 0.1, volume: 0.05, delay: 0.1 });
        tone({ freq: 1046, duration: 0.35, volume: 0.06, delay: 0.2 });
        vibrate([30, 60, 30, 60, 90]);
    },
    tick() {
        tone({ freq: 1200, duration: 0.03, type: 'square', volume: 0.02 });
    },
};
/** הפעלת מנוע השמע לאחר מחווה ראשונה של המשתמש (דרישת דפדפנים ניידים). */
export function primeAudio() {
    audio();
}
//# sourceMappingURL=feedback.js.map