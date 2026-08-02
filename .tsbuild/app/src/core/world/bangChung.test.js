/**
 * Bằng chứng số cho `docs/IMPLEMENTATION_STATUS.md`.
 *
 * Không phải bài kiểm tra hành vi — nó IN ra những con số mà tài liệu trích dẫn,
 * để không ai phải chép tay một cái hash rồi để nó mục đi.
 */
import { describe, it, expect } from 'vitest';
import { taoState, taoEventLog, hashState } from '../engine/state.js';
import { apDungChuoi, apDungEvent } from '../engine/transaction.js';
import { motTick } from '../engine/tick.js';
import { chayInvariantToanBo, datLaiInvariant, danhSachInvariant } from '../engine/invariant.js';
import { moThuGioi, KhoiTaoWorldSchema } from './khoiTao.js';
import { eventGieoNen } from './gieoNen.js';
import { napBatBienTheGioiSong } from './batBien.js';
import { chayTienTrinhNen, chiaGiaiDoan } from './process/scheduler.js';
import { moiTienTrinh } from './process/index.js';
import { docAspect, tongCohort } from './process/tienIch.js';
import { TUNING_MAC_DINH } from '../tuning/schema.js';
import { TICK_MOI_NAM } from '../schema/aspect/substrate.js';
describe('bằng chứng Phase 5', () => {
    it('in số liệu cho tài liệu sống', () => {
        datLaiInvariant();
        napBatBienTheGioiSong();
        const ct = KhoiTaoWorldSchema.parse({
            cua: 'hu_vo',
            seed: 'cong-phase-5',
            worldId: 'w1',
            branchId: 'br_goc',
        });
        const { world, events } = moThuGioi(ct);
        const state = taoState(world);
        const log = taoEventLog();
        apDungChuoi(state, events, log);
        const evNen = eventGieoNen(state);
        apDungEvent(state, evNen, log);
        const danSoDau = [...state.entities.keys()].reduce((t, id) => t + tongCohort(docAspect(state.entities.get(id), 'dan_cu')?.cohort), 0);
        const SO_TICK = 100 * TICK_MOI_NAM;
        let soSuKien = 0;
        let soLon = 0;
        for (let i = 0; i < SO_TICK; i++) {
            const r = motTick(state, { tuning: TUNING_MAC_DINH, tienTrinhNen: chayTienTrinhNen });
            for (const ev of r.events)
                apDungEvent(state, ev, log);
            soSuKien += r.suKien.length;
            soLon += r.suKien.filter((s) => s.mucDo !== 'thuong').length;
        }
        const danSoCuoi = [...state.entities.keys()].reduce((t, id) => t + tongCohort(docAspect(state.entities.get(id), 'dan_cu')?.cohort), 0);
        const kho = [...state.entities.keys()].reduce((t, id) => t + (docAspect(state.entities.get(id), 'kinh_te')?.kho.luongThuc ?? 0), 0);
        const { giaiDoan, chuTrinh } = chiaGiaiDoan(moiTienTrinh());
        const inv = chayInvariantToanBo(state);
        console.log([
            '',
            '── BẰNG CHỨNG PHASE 5 ──',
            `seed                 ${world.seed}`,
            `số tick              ${SO_TICK} (100 năm, ${TICK_MOI_NAM} tick/năm)`,
            `năm cuối             ${state.world.year}`,
            `entity cuối          ${state.entities.size}`,
            `dòng tri thức        ${state.knowledge.size}`,
            `dòng nợ              ${state.debts.size}`,
            `dân số đầu → cuối    ${danSoDau} → ${danSoCuoi}`,
            `kho lương thực cuối  ${Math.round(kho)}`,
            `sự kiện sinh ra      ${soSuKien} (lớn/trọng đại: ${soLon})`,
            `event log            ${log.soLuong()}`,
            `state hash           ${hashState(state)}`,
            `giai đoạn scheduler  ${giaiDoan.length}`,
            `cụm phụ thuộc vòng   ${chuTrinh.map((c) => `[${c.join(', ')}]`).join(' ') || 'không có'}`,
            `bất biến đã đăng ký  ${danhSachInvariant().length}`,
            `invariant toàn cục   ${inv.dat ? 'PASS' : 'FAIL'}`,
            '',
        ].join('\n'));
        expect(inv.dat).toBe(true);
    });
});
