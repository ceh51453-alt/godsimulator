/**
 * Thông Số Sinh — bảng điều chỉnh tham số sinh (GenParams) cho từng endpoint.
 *
 * ── Vì sao nằm tách khỏi CotEndpoint ──
 *
 * `CotEndpoint` đã dài — thêm bảy slider vào cùng chỗ sẽ vượt 300 dòng, và phần
 * UI tham số là một khối chức năng riêng: nó có preset, có logic phát hiện "tùy
 * chỉnh", và nó không đụng tới probe hay ngắt mạch. Tách ra để một thay đổi ở
 * slider không buộc reviewer đọc lại phần quét model.
 *
 * ── Giá trị max đến TỪ ĐÂU ──
 *
 * [BB] 31.2: "Giá trị max của mọi slider lấy từ Profile đang chọn, không hardcode
 * trong component." File này từng tự nhận điều đó trong chính phần chú thích rồi
 * làm ngược lại: một bảng hằng `contextLimit.max = 1.048.576` và bốn preset đóng
 * cứng `contextLimit: 128.000`. Hệ quả là nâng `contextMax` trong registry lên
 * 2.000.000 **chỉ nâng trần được phép** — người chơi kéo tay vẫn kẹt ở ~1,05M, và
 * bấm một preset là tụt thẳng về 128K trên một model 2M.
 *
 * Giờ `hoSo` quyết bốn trần có trong `ModelProfile` (context, output, temperature,
 * topK); ba tham số còn lại (topP, hai penalty) là hằng của giao thức chứ không
 * phải của model nên vẫn nằm ở bảng dưới. Không truyền `hoSo` thì dùng bảng dự
 * phòng — dùng cho story/preview, không phải đường chơi thật.
 *
 * [BB] 36.1 — không emoji. [BB] luật bất biến #9 — không dấu hiệu nào chỉ bằng màu.
 */
import { useState, useMemo, useCallback } from 'react';
import type { CSSProperties } from 'react';
import type { GenParams, ModelProfile } from '../../core/schema/ai.js';

// ─────────────────────────────────────────── preset

type TenPreset = 'sang_tao' | 'can_bang' | 'chinh_xac' | 'ke_chuyen' | 'tuy_chinh';

type PresetDef = {
  readonly ten: string;
  readonly phu: string;
  readonly params: Partial<GenParams>;
};

/**
 * Bốn preset cộng một lựa chọn "tùy chỉnh" (không áp gì).
 *
 * Thứ tự: sáng tạo nhất → chính xác nhất, rồi kể chuyện (chuyên biệt), rồi
 * tùy chỉnh. Người dùng đọc từ trên xuống, nên đặt mặc định ở giữa.
 *
 * `contextLimit` KHÔNG nằm ở đây: nó không phải nét tính cách của preset mà là
 * trần của model. Preset đặt cứng 128K từng kéo người chơi trên model 2M tụt
 * xuống 1/16 cửa sổ chỉ vì họ bấm "Cân Bằng". `dungPresets()` điền nó theo hồ sơ.
 */
const PRESETS_GOC: Readonly<Record<TenPreset, PresetDef>> = Object.freeze({
  sang_tao: {
    ten: 'Sáng Tạo',
    phu: 'Đa dạng, bất ngờ — phù hợp khám phá',
    params: {
      temperature: 1.5,
      topP: 0.95,
      topK: 64,
      maxOutputTokens: 65_536,
      presencePenalty: 0,
      frequencyPenalty: 0,
    },
  },
  can_bang: {
    ten: 'Cân Bằng',
    phu: 'Mặc định — phù hợp hầu hết ván chơi',
    params: {
      temperature: 1.0,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8_192,
      presencePenalty: 0,
      frequencyPenalty: 0,
    },
  },
  chinh_xac: {
    ten: 'Chính Xác',
    phu: 'Nhất quán, ít biến động — phù hợp thế giới nghiêm',
    params: {
      temperature: 0.3,
      topP: 0.8,
      topK: 20,
      maxOutputTokens: 8_192,
      presencePenalty: 0,
      frequencyPenalty: 0,
    },
  },
  ke_chuyen: {
    ten: 'Kể Chuyện',
    phu: 'Văn phong phong phú, ít lặp',
    params: {
      temperature: 1.2,
      topP: 0.92,
      topK: 50,
      maxOutputTokens: 32_768,
      presencePenalty: 0.3,
      frequencyPenalty: 0.3,
    },
  },
  tuy_chinh: {
    ten: 'Tùy chỉnh',
    phu: 'Chỉnh tay từng tham số',
    params: {},
  },
});

const DS_PRESET = Object.keys(PRESETS_GOC) as TenPreset[];

// ─────────────────────────────────────────── giới hạn

type Khoang = { readonly min: number; readonly max: number; readonly step: number };

/**
 * Bảng dự phòng khi KHÔNG có hồ sơ model.
 *
 * `contextLimit.max` ở đây là trần rộng nhất trong registry (2.000.000), không
 * phải một con số tự nghĩ ra: không hồ sơ nào thì không có gì để kẹp, và kẹp
 * thấp hơn model thật là đúng cái lỗi vừa sửa.
 */
const GIOI_HAN_DU_PHONG: Readonly<Record<string, Khoang>> = Object.freeze({
  maxOutputTokens: { min: 1, max: 65_536, step: 1 },
  contextLimit: { min: 1_024, max: 2_000_000, step: 1_024 },
  temperature: { min: 0, max: 2, step: 0.01 },
  topP: { min: 0, max: 1, step: 0.01 },
  topK: { min: 0, max: 64, step: 1 },
  presencePenalty: { min: -2, max: 2, step: 0.01 },
  frequencyPenalty: { min: -2, max: 2, step: 0.01 },
});

type TenThamSo =
  | 'maxOutputTokens'
  | 'contextLimit'
  | 'temperature'
  | 'topP'
  | 'topK'
  | 'presencePenalty'
  | 'frequencyPenalty';

/** Bốn trần có trong `ModelProfile`; ba tham số còn lại là hằng của giao thức. */
function dungGioiHan(hoSo: ModelProfile | undefined): Readonly<Record<TenThamSo, Khoang>> {
  const dp = GIOI_HAN_DU_PHONG as Readonly<Record<TenThamSo, Khoang>>;
  if (hoSo === undefined) return dp;
  const g = hoSo.gioiHan;
  return {
    ...dp,
    maxOutputTokens: { ...dp.maxOutputTokens, max: g.outputMax },
    contextLimit: { ...dp.contextLimit, max: g.contextMax },
    temperature: { ...dp.temperature, max: g.temperatureMax },
    topK: { ...dp.topK, max: g.topKMax },
  };
}

/**
 * Preset đã kẹp theo hồ sơ, cộng `contextLimit` lấy thẳng từ trần của model.
 *
 * Kẹp chứ không từ chối: một preset xin `maxOutputTokens: 65.536` trên model chỉ
 * cho 8.192 vẫn phải bấm được, chỉ là nhận đúng 8.192.
 */
function dungPresets(gh: Readonly<Record<TenThamSo, Khoang>>): Readonly<Record<TenPreset, PresetDef>> {
  const kep = (ten: TenThamSo, v: number | undefined): number | undefined =>
    v === undefined ? undefined : Math.max(gh[ten].min, Math.min(gh[ten].max, v));
  const ra = {} as Record<TenPreset, PresetDef>;
  for (const id of DS_PRESET) {
    const goc = PRESETS_GOC[id];
    if (id === 'tuy_chinh') {
      ra[id] = goc;
      continue;
    }
    ra[id] = {
      ...goc,
      params: {
        ...goc.params,
        temperature: kep('temperature', goc.params.temperature),
        topK: kep('topK', goc.params.topK),
        maxOutputTokens: kep('maxOutputTokens', goc.params.maxOutputTokens),
        contextLimit: gh.contextLimit.max,
      },
    };
  }
  return ra;
}

const NHAN_THAM_SO: Readonly<Record<TenThamSo, string>> = {
  maxOutputTokens: 'Max Output Tokens',
  contextLimit: 'Context Limit',
  temperature: 'Temperature',
  topP: 'Top P',
  topK: 'Top K',
  presencePenalty: 'Presence Penalty',
  frequencyPenalty: 'Frequency Penalty',
};

const MO_TA_THAM_SO: Readonly<Record<TenThamSo, string>> = {
  maxOutputTokens: 'Số token tối đa model trả về mỗi lượt',
  contextLimit: 'Giới hạn cửa sổ ngữ cảnh (token)',
  temperature: 'Càng cao càng đa dạng, càng thấp càng nhất quán',
  topP: 'Lọc tích luỹ xác suất — 0.95 giữ 95% khả năng nhất',
  topK: 'Chỉ xét K từ có xác suất cao nhất',
  presencePenalty: 'Phạt chủ đề đã xuất hiện — giảm lặp nội dung',
  frequencyPenalty: 'Phạt từ dùng nhiều — giảm lặp cụm từ',
};

// ─────────────────────────────────────────── style

const nhanNho: CSSProperties = { color: 'var(--mo)', fontSize: 11, letterSpacing: '0.08em' };

const oNhap: CSSProperties = {
  background: 'var(--kinh-nen-2)',
  color: 'var(--sang)',
  border: '1px solid var(--kinh-vien)',
  borderRadius: 'var(--r-sm)',
  padding: '9px 12px',
  font: 'inherit',
  fontSize: 13,
  width: '100%',
};

// ─────────────────────────────────────────── phát hiện preset

/**
 * So trạng thái hiện tại với bốn preset để biết đang ở preset nào.
 *
 * [BB] Nếu không khớp preset nào thì trả `tuy_chinh`. Ngưỡng sai số float
 * epsilon = 1e-6 để tránh false mismatch do rounding.
 */
function doPresetHienTai(p: GenParams, presets: Readonly<Record<TenPreset, PresetDef>>): TenPreset {
  const eps = 1e-6;
  for (const ten of DS_PRESET) {
    if (ten === 'tuy_chinh') continue;
    const preset = presets[ten].params;
    let khop = true;
    for (const [k, v] of Object.entries(preset)) {
      const hienTai = p[k as TenThamSo];
      if (typeof v === 'number' && typeof hienTai === 'number') {
        if (Math.abs(hienTai - v) > eps) {
          khop = false;
          break;
        }
      }
    }
    if (khop) return ten;
  }
  return 'tuy_chinh';
}

// ─────────────────────────────────────────── slider row

function DongSlider({
  ten,
  gh,
  giaTri,
  tat,
  onChange,
}: {
  ten: TenThamSo;
  gh: Khoang;
  giaTri: number;
  tat: boolean;
  onChange: (ten: TenThamSo, giaTri: number) => void;
}): JSX.Element {
  // Tính phần trăm vị trí slider cho thanh tiến trình (visual feedback)
  const phanTram = ((giaTri - gh.min) / (gh.max - gh.min)) * 100;
  const laFloat = gh.step < 1;
  /*
   * `input[type=number]` chỉ nhận số thuần.
   *
   * Trước đây chỗ này đưa `giaTri.toLocaleString()` vào ô số, nên mọi giá trị từ
   * 1.000 trở lên thành "2.000.000" — không parse được và trình duyệt render ô
   * RỖNG. Hệ quả: hai tham số quan trọng nhất (Context Limit, Max Output Tokens)
   * không hiện số và không gõ tay được; cách duy nhất còn lại là kéo slider, mà
   * slider thì đang kẹt ở trần hardcode. Dấu phân cách vẫn còn ở nhãn min/max
   * bên dưới, nơi nó là chữ chứ không phải giá trị của input.
   */
  const hienThi = laFloat ? giaTri.toFixed(2) : String(giaTri);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: '4px 10px',
        alignItems: 'center',
        padding: '6px 0',
      }}
    >
      {/* Hàng 1: nhãn + giá trị input */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span style={{ fontSize: 12, color: 'var(--tro)', fontWeight: 500 }}>{NHAN_THAM_SO[ten]}</span>
        <span style={{ fontSize: 10, color: 'var(--mo)', lineHeight: 1.3 }}>{MO_TA_THAM_SO[ten]}</span>
      </div>
      <input
        type="number"
        disabled={tat}
        value={hienThi}
        min={gh.min}
        max={gh.max}
        step={gh.step}
        style={{
          ...oNhap,
          width: 90,
          textAlign: 'right',
          padding: '5px 8px',
          fontSize: 12,
          fontVariantNumeric: 'tabular-nums',
        }}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (!Number.isNaN(v)) {
            onChange(ten, Math.max(gh.min, Math.min(gh.max, v)));
          }
        }}
      />

      {/* Hàng 2: slider chiếm toàn bộ */}
      <div
        style={{
          gridColumn: '1 / -1',
          position: 'relative',
          height: 24,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {/* Track nền */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            height: 3,
            borderRadius: 2,
            background: 'var(--kinh-vien)',
          }}
        />
        {/* Track tô màu */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            height: 3,
            borderRadius: 2,
            width: `${Math.max(0, Math.min(100, phanTram))}%`,
            background: tat ? 'var(--mo)' : 'var(--dong)',
            transition: 'width 0.12s ease-out',
          }}
        />
        <input
          type="range"
          disabled={tat}
          min={gh.min}
          max={gh.max}
          step={gh.step}
          value={giaTri}
          /*
           * Kéo hết sang phải phải ra ĐÚNG max.
           *
           * `input[type=range]` chỉ nhận giá trị dạng `min + n*step`, mà bước
           * 1.024 không chia hết cho mọi trần: với trần 2.000.000 thì mép phải
           * dừng ở 1.999.872. Thiếu 128 token thì vô hại, nhưng người dùng kéo
           * kịch mà số không khớp trần đang ghi ngay bên dưới là một mâu thuẫn
           * hiện rõ trên màn hình.
           */
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            onChange(ten, gh.max - v < gh.step ? gh.max : v);
          }}
          style={{
            position: 'relative',
            width: '100%',
            height: 24,
            margin: 0,
            appearance: 'none',
            WebkitAppearance: 'none',
            background: 'transparent',
            cursor: tat ? 'not-allowed' : 'pointer',
            opacity: tat ? 0.5 : 1,
          }}
        />
      </div>

      {/* Hàng 3: min — max labels */}
      <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, color: 'var(--mo)' }}>
          {laFloat ? gh.min.toFixed(2) : gh.min.toLocaleString()}
        </span>
        <span style={{ fontSize: 10, color: 'var(--mo)' }}>
          {laFloat ? gh.max.toFixed(2) : gh.max.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────── component chính

export function ThongSoSinh({
  params,
  tat,
  onThayDoi,
  moMacDinh = false,
  hoSo,
}: {
  params: GenParams;
  tat: boolean;
  onThayDoi: (thayDoi: Partial<GenParams>) => void;
  /** Màn cấu hình chính có thể mở sẵn; trong cột endpoint vẫn gập để tiết kiệm chỗ. */
  moMacDinh?: boolean;
  /** [BB] 31.2 — nguồn của mọi giá trị max. Vắng nó thì rơi về bảng dự phòng. */
  hoSo?: ModelProfile;
}): JSX.Element {
  const [moRong, setMoRong] = useState(moMacDinh);
  const gioiHan = useMemo(() => dungGioiHan(hoSo), [hoSo]);
  const presets = useMemo(() => dungPresets(gioiHan), [gioiHan]);
  const presetHienTai = useMemo(() => doPresetHienTai(params, presets), [params, presets]);

  const doiPreset = useCallback(
    (ten: TenPreset) => {
      if (ten === 'tuy_chinh') return;
      onThayDoi(presets[ten].params);
    },
    [onThayDoi, presets],
  );

  const doiThamSo = useCallback(
    (ten: TenThamSo, giaTri: number) => {
      onThayDoi({ [ten]: giaTri });
    },
    [onThayDoi],
  );

  const THU_TU: TenThamSo[] = [
    'maxOutputTokens',
    'contextLimit',
    'temperature',
    'topP',
    'topK',
    'presencePenalty',
    'frequencyPenalty',
  ];

  return (
    <div
      style={{
        borderTop: '1px solid var(--kinh-vien)',
        marginTop: 8,
        paddingTop: 10,
      }}
    >
      {/* Tiêu đề + nút mở/gập */}
      <button
        type="button"
        onClick={() => setMoRong((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          width: '100%',
          background: 'transparent',
          border: 'none',
          padding: '4px 0',
          cursor: 'pointer',
          font: 'inherit',
          color: 'var(--tro)',
          fontSize: 12,
          fontWeight: 500,
          letterSpacing: '0.04em',
          textAlign: 'left',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            transition: 'transform 0.2s ease',
            transform: moRong ? 'rotate(90deg)' : 'rotate(0deg)',
            fontSize: 10,
            lineHeight: 1,
          }}
        >
          ▶
        </span>
        THÔNG SỐ SINH
        <span style={{ flex: 1 }} />
        <span style={{ ...nhanNho, fontWeight: 400, textTransform: 'none' }}>
          {presets[presetHienTai].ten}
        </span>
      </button>

      {/* Nội dung mở rộng */}
      {moRong && (
        <div
          style={{
            paddingTop: 10,
            display: 'grid',
            gap: 6,
            animation: 'fadeIn 0.18s ease-out',
          }}
        >
          {/* Dropdown preset */}
          <div style={{ display: 'grid', gap: 4 }}>
            <span style={nhanNho}>PRESET</span>
            <select
              style={{ ...oNhap, width: '100%' }}
              disabled={tat}
              value={presetHienTai}
              onChange={(e) => doiPreset(e.target.value as TenPreset)}
            >
              {DS_PRESET.map((id) => (
                <option key={id} value={id}>
                  {presets[id].ten} — {presets[id].phu}
                </option>
              ))}
            </select>
          </div>

          <label
            className="kinh--cap2"
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
              padding: '10px 12px',
              cursor: tat ? 'not-allowed' : 'pointer',
              opacity: tat ? 0.55 : 1,
            }}
          >
            <input
              type="checkbox"
              disabled={tat}
              checked={params.streaming}
              onChange={(e) => onThayDoi({ streaming: e.currentTarget.checked })}
            />
            <span style={{ display: 'grid', gap: 2 }}>
              <span style={{ fontSize: 12, color: 'var(--tro)', fontWeight: 500 }}>Streaming</span>
              <span style={{ fontSize: 10, color: 'var(--mo)', lineHeight: 1.35 }}>
                Hiện lời kể dần theo từng đoạn model gửi, thay vì chờ sinh xong toàn bộ.
              </span>
            </span>
          </label>

          {/* Các slider */}
          <div
            style={{
              display: 'grid',
              gap: 2,
              marginTop: 4,
            }}
          >
            {THU_TU.map((ten) => (
              <DongSlider
                key={ten}
                ten={ten}
                gh={gioiHan[ten]}
                giaTri={params[ten] as number}
                tat={tat}
                onChange={doiThamSo}
              />
            ))}
          </div>

          {/* Ghi chú — nói RÕ trần đến từ hồ sơ nào, để con số kiểm được. */}
          <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--mo)', lineHeight: 1.5 }}>
            {hoSo === undefined
              ? 'Chưa xác định được hồ sơ model — đang dùng trần dự phòng.'
              : `Trần lấy từ hồ sơ ${hoSo.ten}: ngữ cảnh ${gioiHan.contextLimit.max.toLocaleString('vi-VN')} · output ${gioiHan.maxOutputTokens.max.toLocaleString('vi-VN')} · nhiệt độ ${gioiHan.temperature.max}.`}{' '}
            Chỉnh tay bất kỳ tham số nào sẽ chuyển preset về &quot;Tùy chỉnh&quot;.
          </p>
        </div>
      )}
    </div>
  );
}
