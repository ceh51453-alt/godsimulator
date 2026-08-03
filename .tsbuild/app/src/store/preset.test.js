import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { layDb } from '../db/instance.js';
import { tinhNangPresetDangBat, usePreset } from './preset.js';
describe('quản lý tính năng Preset', () => {
    beforeEach(async () => {
        await layDb().presetVars.clear();
        await layDb().settings.delete('preset.new-game.v1');
        usePreset.setState({
            branchId: 'br_preset_manager',
            bien: {},
            chonChoVanMoi: [],
            daNap: true,
        });
    });
    it('giữ cờ nguồn khi chưa cấu hình và dùng override đúng từng loại', () => {
        expect(tinhNangPresetDangBat(undefined, 'regex', 'rx.1', true)).toBe(true);
        expect(tinhNangPresetDangBat({
            __module_enabled: { intro: false },
            __transform_enabled: { 'rx.1': true },
            __adapter_enabled: { 'script.1': false },
        }, 'module', 'intro', true)).toBe(false);
        expect(tinhNangPresetDangBat({ __transform_enabled: { 'rx.1': true } }, 'regex', 'rx.1', false)).toBe(true);
        expect(tinhNangPresetDangBat({ __adapter_enabled: { 'script.1': false } }, 'script', 'script.1', true)).toBe(false);
    });
    it('công tắc được lưu riêng theo pack và nhánh', async () => {
        await usePreset.getState().datTinhNang('pack.a', 'regex', 'rx.1', false, 12);
        await usePreset.getState().datTinhNang('pack.a', 'script', 'adapter.1', true, 13);
        expect(usePreset.getState().bien['pack.a']).toMatchObject({
            __transform_enabled: { 'rx.1': false },
            __adapter_enabled: { 'adapter.1': true },
        });
        const daLuu = await layDb().presetVars.get(['pack.a', 'br_preset_manager']);
        expect(daLuu?.bien).toMatchObject({
            __transform_enabled: { 'rx.1': false },
            __adapter_enabled: { 'adapter.1': true },
        });
        expect(daLuu?.tickGhi).toBe(13);
    });
    it('lưu lựa chọn preset cho ván mới ngay cả khi chưa có ván', async () => {
        usePreset.setState({
            thuVien: [{ packId: 'pack.a', version: 1 }],
            branchId: '',
            chonChoVanMoi: [],
        });
        await usePreset.getState().datChonChoVanMoi('pack.a', true);
        expect(usePreset.getState().chonChoVanMoi).toEqual(['pack.a']);
        expect((await layDb().settings.get('preset.new-game.v1'))?.value).toEqual(['pack.a']);
        await usePreset.getState().datChonChoVanMoi('pack.a', false);
        expect(usePreset.getState().chonChoVanMoi).toEqual([]);
    });
});
