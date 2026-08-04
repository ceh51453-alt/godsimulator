import { describe, expect, it } from 'vitest';
import { ModelProfileSchema, NormalizedGenParamsSchema } from '../schema/ai.js';
import { NormalizedPresetPackSchema, PresetActivationSchema, PresetPackRowSchema } from './schema.js';
import { gopThamSoSinhPreset, KHOA_GHI_DE_THAM_SO } from './thamSo.js';

const PROFILE = ModelProfileSchema.parse({
  id: 'model-test',
  ten: 'Model test',
  gioiHan: {
    contextMax: 200_000,
    outputMax: 8_192,
    temperatureMax: 2,
    topKMax: 64,
  },
});

function packDangBat(ghiDe: Record<string, unknown> = {}) {
  const pack = NormalizedPresetPackSchema.parse({
    envelope: {
      id: 'env.test',
      schemaVersion: 1,
      format: 'sillytavern_openai_preset',
      sourceName: 'test.json',
      sourceHash: 'sha256:TEST',
      sourceBytes: 10,
      importedAt: 0,
      namespace: 'pack.test',
      rawSourceRef: 'sha256:TEST',
    },
    version: 1,
    generation: {
      temperature: 1.1,
      topP: 0.9,
      topK: 500,
      maxContext: 2_000_000,
      maxOutputTokens: 65_000,
    },
  });
  return {
    row: PresetPackRowSchema.parse({ packId: 'pack.test', version: 1, pack }),
    activation: PresetActivationSchema.parse({
      id: 'act.test',
      packId: 'pack.test',
      packVersion: 1,
      saveId: 'save.test',
      branchId: 'branch.test',
      targets: ['narrator'],
      selectedModuleIds: [],
      conflictResolutions: { [KHOA_GHI_DE_THAM_SO]: ghiDe },
      previousActivationId: null,
      activatedAt: 1,
    }),
  };
}

describe('thông số sinh hiệu lực của preset', () => {
  it('áp giá trị preset và giới hạn theo đúng profile model trước khi gửi', () => {
    const nen = NormalizedGenParamsSchema.parse({ temperature: 0.4, presencePenalty: 0.25 });
    const kq = gopThamSoSinhPreset(nen, [packDangBat()], PROFILE);

    expect(kq.temperature).toBe(1.1);
    expect(kq.topP).toBe(0.9);
    expect(kq.topK).toBe(64);
    expect(kq.contextLimit).toBe(200_000);
    expect(kq.maxOutputTokens).toBe(8_192);
    expect(kq.presencePenalty).toBe(0.25);
  });

  it('chỉnh tay trong tab Preset thắng giá trị file nhưng không sửa lớp nền', () => {
    const nen = NormalizedGenParamsSchema.parse({ temperature: 0.4, topP: 0.7 });
    const kq = gopThamSoSinhPreset(nen, [packDangBat({ temperature: 0.65 })], PROFILE);

    expect(kq.temperature).toBe(0.65);
    expect(kq.topP).toBe(0.9);
    expect(nen.temperature).toBe(0.4);
    expect(nen.topP).toBe(0.7);
  });

  it('tắt preset trả về nguyên cấu hình tay', () => {
    const nen = NormalizedGenParamsSchema.parse({ temperature: 0.4, topK: 12 });
    expect(gopThamSoSinhPreset(nen, [], PROFILE)).toEqual(nen);
  });
});
