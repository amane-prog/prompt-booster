'use client';
const orig = String.prototype.repeat;
String.prototype.repeat = function (count: any) {
    const n = Number(count);
    if (!Number.isFinite(n) || n < 0) {
        // ここで犯人を特定できる
        console.error('[repeat] bad count =', count, 'string =', String(this));
        console.error(new Error().stack);
        return '';
    }
    return orig.call(this, Math.floor(n));
};
export default function ClientInit() { return null; }
