/**
 * Cổng Phase 0 — kiểm tra ở mức MÃ NGUỒN, không phải mức tài liệu.
 *
 * Prompt IDE luật bất biến #3, #7, #10; Phần 61 gate:
 *   - "Không có eval/new Function trong core/importer"
 *   - "src/core là TypeScript thuần; không import React, UI, Dexie hook hoặc AI client"
 *   - "Không dùng Math.random(), thời gian máy hoặc locale-dependent sort trong mô phỏng"
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
const GOC = join(process.cwd(), 'src');
const CORE = join(GOC, 'core');
function liet(thuMuc, loc) {
    const out = [];
    const di = (d) => {
        for (const ten of readdirSync(d)) {
            const p = join(d, ten);
            if (statSync(p).isDirectory()) {
                di(p);
                continue;
            }
            if (loc(p))
                out.push(p);
        }
    };
    di(thuMuc);
    return out;
}
const laNguon = (p) => (p.endsWith('.ts') || p.endsWith('.tsx')) && !p.endsWith('.test.ts') && !p.endsWith('.test.tsx');
const FILE_CORE = liet(CORE, laNguon);
const FILE_TEST_HELPER = liet(join(GOC, 'test'), laNguon);
/** Bỏ comment và string literal trước khi soi — tránh báo nhầm ở chú thích/regex chặn. */
function bocVo(src) {
    return src
        .replace(/\/\*[\s\S]*?\*\//g, ' ')
        .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ')
        .replace(/'(?:\\.|[^'\\])*'/g, "''")
        .replace(/"(?:\\.|[^"\\])*"/g, '""')
        .replace(/`(?:\\.|[^`\\])*`/g, '``');
}
const ten = (p) => relative(process.cwd(), p).split(sep).join('/');
describe('src/core không có cửa chạy code tùy ý', () => {
    it('có đủ file nguồn để bài test này có nghĩa', () => {
        expect(FILE_CORE.length).toBeGreaterThan(15);
    });
    it.each([
        ['eval(', /\beval\s*\(/],
        ['new Function', /\bnew\s+Function\s*\(/],
        ['Function(', /(?<!\w)Function\s*\(/],
        ['dynamic import', /(?<!\w)import\s*\(/],
        ['setTimeout với chuỗi', /setTimeout\s*\(\s*""/],
    ])('không file core nào dùng %s', (_nhan, mau) => {
        const pham = FILE_CORE.filter((p) => mau.test(bocVo(readFileSync(p, 'utf8'))));
        expect(pham.map(ten)).toEqual([]);
    });
});
describe('[BB] src/core là TypeScript thuần', () => {
    const CAM_IMPORT = [['react', /from\s+""|require\(\s*""/]];
    void CAM_IMPORT;
    function importCua(src) {
        const out = [];
        const re = /(?:^|\n)\s*(?:import|export)\s[^;]*?from\s+['"]([^'"]+)['"]/g;
        let m;
        while ((m = re.exec(src)) !== null)
            if (m[1])
                out.push(m[1]);
        return out;
    }
    it.each(['react', 'react-dom', 'dexie', 'dexie-react-hooks', 'zustand', 'framer-motion', 'ejs'])("không file core nào import '%s'", (pkg) => {
        const pham = [];
        for (const p of FILE_CORE) {
            const imps = importCua(readFileSync(p, 'utf8'));
            if (imps.some((i) => i === pkg || i.startsWith(`${pkg}/`)))
                pham.push(ten(p));
        }
        expect(pham).toEqual([]);
    });
    it('không file core nào import từ ui/, db/ hay store/', () => {
        const pham = [];
        for (const p of FILE_CORE) {
            const imps = importCua(readFileSync(p, 'utf8'));
            if (imps.some((i) => /(^|\/)(ui|db|store)\//.test(i)))
                pham.push(ten(p));
        }
        expect(pham).toEqual([]);
    });
    it('không file core nào gọi network hay chạm IndexedDB', () => {
        const pham = [];
        for (const p of FILE_CORE) {
            const s = bocVo(readFileSync(p, 'utf8'));
            if (/\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b|\bindexedDB\b|\bnavigator\b/.test(s)) {
                pham.push(ten(p));
            }
        }
        expect(pham).toEqual([]);
    });
});
describe('[BB] mô phỏng deterministic — luật bất biến #7', () => {
    const NGUON_MO_PHONG = [...FILE_CORE, ...FILE_TEST_HELPER];
    it('không dùng Math.random() trong core hay fixture', () => {
        const pham = NGUON_MO_PHONG.filter((p) => /Math\s*\.\s*random/.test(bocVo(readFileSync(p, 'utf8'))));
        expect(pham.map(ten)).toEqual([]);
    });
    it('không dùng thời gian máy (Date.now, new Date, performance.now)', () => {
        const pham = NGUON_MO_PHONG.filter((p) => /Date\s*\.\s*now|new\s+Date\b|performance\s*\.\s*now/.test(bocVo(readFileSync(p, 'utf8'))));
        expect(pham.map(ten)).toEqual([]);
    });
    it('không dùng sort phụ thuộc locale', () => {
        const pham = NGUON_MO_PHONG.filter((p) => /localeCompare|Intl\s*\.\s*Collator|toLocale(?:Date|Time|)String/.test(bocVo(readFileSync(p, 'utf8'))));
        expect(pham.map(ten)).toEqual([]);
    });
});
