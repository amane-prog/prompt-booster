'use client';
const orig = String.prototype.repeat;
String.prototype.repeat = function (count: any) {
    const n = Number(count);
    if (!Number.isFinite(n) || n < 0) {
        // 驍ｵ・ｺ髦ｮ蜻ｻ・ｼ繝ｻ・ｸ・ｺ繝ｻ・ｧ髴托ｽ･繝ｻ・ｯ髣費｣ｰ繝ｻ・ｺ驛｢・ｧ陜｣・､鬮ｻ・ｳ髯橸ｽｳ陞｢・ｹ邵ｲ蝣､・ｸ・ｺ鬮ｦ・ｪ繝ｻ繝ｻ
        console.error('[repeat] bad count =', count, 'string =', String(this));
        console.error(new Error().stack);
        return '';
    }
    return orig.call(this, Math.floor(n));
};
export default function ClientInit() { return null; }
