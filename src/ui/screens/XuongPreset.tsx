/**
 * Quản lý Preset.
 *
 * File được nhập thẳng vào thư viện, xung đột nội bộ tự giữ theo prompt_order.
 * Mỗi pack có một bảng cấu hình thống nhất cho prompt, regex, adapter script,
 * thông số sinh và biến — không còn wizard hay một khu script tách rời.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { chonNhatKyScript, usePreset, tinhNangPresetDangBat } from '../../store/preset.js';
import { useGame } from '../../store/game.js';
import { useAi, hoSoCuaEndpoint } from '../../store/ai.js';
import { ThongSoSinh } from './ThongSoSinh.js';
import type {
  HelperScript,
  OmitReason,
  PresetPackRow,
  PromptModule,
  ScriptAdapterDef,
  TransformDef,
} from '../../core/preset/schema.js';
import { MODULE_LANES, OMIT_REASON_NHAN } from '../../core/preset/schema.js';
import { kiemPatternHopLe } from '../../core/preset/chuanHoa.js';
import { bam } from '../../core/engine/hash.js';
import { VIEW_MODES } from '../../core/contracts/primitives.js';
import type { ViewMode } from '../../core/contracts/primitives.js';

const NHAN_TANG: Readonly<Record<ViewMode, string>> = {
  sang_the: 'Sáng Thế Thần',
  than: 'Thần',
  pham_nhan: 'Phàm Nhân',
};

/**
 * Gộp lý do bị bỏ thành một câu nói đúng sự thật.
 *
 * Câu cũ là "bị bỏ vì ngân sách hoặc không tương thích" cho MỌI trường hợp. Với
 * một preset lớn bình thường thì cả hai vế đều sai: phần lớn module chỉ đang tắt
 * trong `prompt_order` của chính preset, hoặc là marker chưa có nguồn native.
 * Người dùng đọc câu ấy rồi tưởng app đang cắt mất preset của mình.
 */
function tomTatLyDoBo(lyDo: Readonly<Record<string, OmitReason>>): string {
  const dem = new Map<OmitReason, number>();
  for (const vi of Object.values(lyDo)) dem.set(vi, (dem.get(vi) ?? 0) + 1);
  if (dem.size === 0) return 'không rõ lý do';
  return [...dem.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([vi, n]) => `${n} ${OMIT_REASON_NHAN[vi]}`)
    .join(', ');
}

const nhan: CSSProperties = {
  color: 'var(--mo)',
  fontSize: 11,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
};
const so: CSSProperties = { fontSize: 13, color: 'var(--tro)' };
const phu: CSSProperties = { fontSize: 12, color: 'var(--mo)' };
const oNhap: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  background: 'var(--kinh-nen-2)',
  color: 'var(--sang)',
  border: '1px solid var(--kinh-vien)',
  borderRadius: 'var(--r-sm)',
  padding: '8px 10px',
  font: 'inherit',
  fontSize: 12,
};

function nut(chinh = false, tat = false): CSSProperties {
  return {
    background: 'transparent',
    color: tat ? 'var(--mo)' : chinh ? 'var(--dong)' : 'var(--tro)',
    border: `1px solid ${chinh && !tat ? 'var(--dong)' : 'var(--kinh-vien)'}`,
    borderRadius: 'var(--r-sm)',
    padding: '7px 13px',
    font: 'inherit',
    fontSize: 13,
    cursor: tat ? 'not-allowed' : 'pointer',
    opacity: tat ? 0.55 : 1,
  };
}

function Khoi({ ten, phuDe, children }: { ten: string; phuDe?: string; children: ReactNode }): JSX.Element {
  return (
    <section style={{ display: 'grid', gap: 9 }}>
      <header>
        <h3 style={{ margin: 0, fontFamily: 'var(--chu-hien)', fontSize: 17, fontWeight: 500 }}>{ten}</h3>
        {phuDe !== undefined && <p style={{ ...phu, margin: '2px 0 0' }}>{phuDe}</p>}
      </header>
      {children}
    </section>
  );
}

function CongTac({
  checked,
  disabled = false,
  nhanChu,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  nhanChu: string;
  onChange(checked: boolean): void;
}): JSX.Element {
  return (
    <label
      style={{ display: 'inline-flex', gap: 7, alignItems: 'center', fontSize: 12, color: 'var(--tro)' }}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.currentTarget.checked)}
      />
      {nhanChu}
    </label>
  );
}

const KHONG_CHAY_DUOC = new Set(['quarantined', 'needs_adapter', 'disabled']);

function moduleMacDinh(m: PromptModule): boolean {
  return m.enabled && !KHONG_CHAY_DUOC.has(m.activation);
}

function nhanAdapter(kind: ScriptAdapterDef['kind']): string {
  if (kind === 'cot_cleanup') return 'Dọn nội dung suy luận';
  if (kind === 'prompt_merge') return 'Ghép prompt và lịch sử';
  if (kind === 'scene_switch') return 'Điều khiển cảnh/module';
  return 'Giao diện lựa chọn';
}

function giaTri(v: unknown): string {
  if (typeof v === 'number') return Number.isInteger(v) ? v.toLocaleString('vi-VN') : v.toFixed(2);
  if (Array.isArray(v)) return v.join(' · ');
  return String(v);
}

export function XuongPreset(): JSX.Element {
  const thuVien = usePreset((s) => s.thuVien);
  const dangBat = usePreset((s) => s.dangBat);
  const bien = usePreset((s) => s.bien);
  const chonChoVanMoi = usePreset((s) => s.chonChoVanMoi);
  const daNap = usePreset((s) => s.daNap);
  const wizard = usePreset((s) => s.wizard);
  const loiBat = usePreset((s) => s.loiBat);
  const napTuDia = usePreset((s) => s.napTuDia);
  const doThu = usePreset((s) => s.doThu);
  const nhapVaoThuVien = usePreset((s) => s.nhapVaoThuVien);
  const datTangApDung = usePreset((s) => s.datTangApDung);
  const xoaKhoiThuVien = usePreset((s) => s.xoaKhoiThuVien);
  const luuChinhSua = usePreset((s) => s.luuChinhSua);
  const datChonChoVanMoi = usePreset((s) => s.datChonChoVanMoi);
  const datTinhNang = usePreset((s) => s.datTinhNang);
  const thamSoHieuLuc = usePreset((s) => s.thamSoHieuLuc);
  const datThamSoHieuLuc = usePreset((s) => s.datThamSoHieuLuc);
  const paramsNen = useAi((s) => s.cfg.narrator.params);
  // Trần slider phải theo model của Tường Thuật — [BB] 31.2. Theo dõi modelId và
  // profileId để đổi model xong là trần đổi theo, không phải tải lại màn.
  const narratorModelId = useAi((s) => s.cfg.narrator.modelId);
  const narratorProfileId = useAi((s) => s.cfg.narrator.profileId);
  const hoSoNarrator = useMemo(() => hoSoCuaEndpoint('narrator'), [narratorModelId, narratorProfileId]);

  const regexCham = usePreset((s) => s.regexCham);
  const msCham = useMemo(
    () => Object.fromEntries(regexCham.map((c) => [c.id, c.ms])) as Record<string, number>,
    [regexCham],
  );

  const state = useGame((s) => s.state);
  const presetTrace = useGame((s) => s.presetTrace);
  const branchId = state?.world.branchId ?? '';
  const tick = state?.world.tick ?? 0;
  const saveId = state?.world.id ?? '';
  const tangHienTai = state?.world.playerState.mode ?? 'sang_the';

  const oFile = useRef<HTMLInputElement>(null);
  const [dangDoc, setDangDoc] = useState(false);
  const [tin, setTin] = useState('');
  const [moRong, setMoRong] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!daNap) void napTuDia(branchId);
  }, [branchId, daNap, napTuDia]);

  const packs = useMemo(() => {
    const daCo = new Set<string>();
    return thuVien.filter((row) => {
      if (daCo.has(row.packId)) return false;
      daCo.add(row.packId);
      return true;
    });
  }, [thuVien]);

  const chonFile = async (file: File | undefined): Promise<void> => {
    if (file === undefined) return;
    setDangDoc(true);
    setTin('');
    try {
      const noiDung = await file.text();
      doThu(file.name, noiDung, tick);
      const kq = usePreset.getState().wizard.ketQua;
      if (!kq?.ok || kq.row === null) {
        setTin(`Không nhập được “${file.name}”. Mở phần lỗi bên dưới để xem chi tiết.`);
        return;
      }
      await nhapVaoThuVien();
      setTin(
        `Đã nhập “${file.name}”: ${kq.row.pack.modules.length} module, ` +
          `${kq.row.transformDefs.length} regex, ${(kq.row.scripts ?? []).length} script Tavern Helper.`,
      );
    } finally {
      setDangDoc(false);
    }
  };

  const doiMoRong = (packId: string): void => {
    setMoRong((cu) => {
      const moi = new Set(cu);
      if (moi.has(packId)) moi.delete(packId);
      else moi.add(packId);
      return moi;
    });
  };

  const loiNhap = wizard.ketQua?.issues.filter((i) => i.severity === 'error') ?? [];
  const paramsHieuLuc = thamSoHieuLuc(paramsNen);
  const tenPresetDangBat = packs
    .filter((row) => {
      const act = dangBat[row.packId];
      return act?.packVersion === row.version && act.viewModes.includes(tangHienTai);
    })
    .map((row) => row.pack.envelope.sourceName);

  return (
    <main style={{ padding: '22px 24px 60px', maxWidth: 1080, margin: '0 auto', display: 'grid', gap: 18 }}>
      <header>
        <p style={{ ...nhan, margin: 0 }}>Cấu hình · Preset</p>
        <h1 className="chu-hien" style={{ margin: '4px 0 5px', fontSize: 28, fontWeight: 500 }}>
          Quản lý Preset
        </h1>
        <p style={{ ...phu, margin: 0, maxWidth: 720 }}>
          Preset được nhập thẳng vào thư viện. Các phần cùng tác động được ghép theo thứ tự của chính file;
          bạn không còn phải chọn thủ công một bên xung đột.
        </p>
      </header>

      <section className="kinh" style={{ padding: 18, display: 'grid', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            style={nut(true, dangDoc)}
            disabled={dangDoc}
            onClick={() => oFile.current?.click()}
          >
            {dangDoc ? 'Đang nhập…' : 'Nhập preset (.json)'}
          </button>
          <input
            ref={oFile}
            type="file"
            accept=".json,application/json"
            style={{ position: 'absolute', left: -9999 }}
            onChange={(e) => {
              const file = e.currentTarget.files?.[0];
              e.currentTarget.value = '';
              void chonFile(file);
            }}
          />
          <span style={phu}>Hỗ trợ preset SillyTavern và định dạng Thiên Diễn.</span>
        </div>
        {tin !== '' && (
          <p role="status" style={{ ...so, margin: 0 }}>
            {tin}
          </p>
        )}
        {loiNhap.length > 0 && (
          <div role="alert" style={{ display: 'grid', gap: 3 }}>
            {loiNhap.slice(0, 8).map((i, n) => (
              <span key={`${i.code}:${n}`} style={{ ...phu, color: 'var(--hoi)' }}>
                {i.message}
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="kinh" style={{ padding: 18, display: 'grid', gap: 8 }}>
        <div>
          <h2 style={{ margin: 0, fontFamily: 'var(--chu-hien)', fontSize: 21 }}>Thông số sinh đang dùng</h2>
          <p style={{ ...phu, margin: '5px 0 0', lineHeight: 1.5 }}>
            {tenPresetDangBat.length > 0
              ? `Đã áp thông số từ ${tenPresetDangBat.join(', ')}. Chỉnh tại đây sẽ được lưu cho preset đang ưu tiên trên nhánh này.`
              : 'Chưa có preset đang bật. Thay đổi tại đây dùng chung với Tường Thuật và được lưu trên máy.'}
          </p>
        </div>
        <ThongSoSinh
          params={paramsHieuLuc}
          tat={false}
          moMacDinh
          hoSo={hoSoNarrator}
          onThayDoi={(thayDoi) => void datThamSoHieuLuc(thayDoi)}
        />
      </section>

      <section style={{ display: 'grid', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontFamily: 'var(--chu-hien)', fontSize: 21 }}>Preset đã nhập</h2>
          <span style={phu}>{packs.length} preset trên máy</span>
        </div>

        {!daNap ? (
          <p style={phu}>Đang đọc thư viện preset…</p>
        ) : packs.length === 0 ? (
          <div className="kinh" style={{ padding: 18 }}>
            <p style={{ ...phu, margin: 0 }}>
              Chưa có preset. Trò chơi đang dùng cấu hình và prompt mặc định.
            </p>
          </div>
        ) : (
          packs.map((row) => {
            const act = dangBat[row.packId];
            const daBat = act?.packVersion === row.version;
            const dangMo = moRong.has(row.packId);
            const bienPack = bien[row.packId] ?? {};
            const tangDaChon =
              state === null
                ? VIEW_MODES.filter((tang) => chonChoVanMoi[tang].includes(row.packId))
                : daBat
                  ? act.viewModes
                  : [];
            const dangDungOTangNay = tangDaChon.includes(tangHienTai);
            const soBan = thuVien.filter((x) => x.packId === row.packId).length;
            return (
              <article key={row.packId} className="kinh" style={{ padding: 16, display: 'grid', gap: 12 }}>
                <header style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 210 }}>
                    <h2
                      className="ten-rieng"
                      style={{ margin: 0, fontFamily: 'var(--chu-hien)', fontSize: 19 }}
                    >
                      {row.pack.envelope.sourceName}
                    </h2>
                    <div style={{ ...phu, marginTop: 3 }}>
                      bản {row.version}
                      {soBan > 1 ? ` · ${soBan} phiên bản` : ''} · {row.pack.modules.length} module ·{' '}
                      {row.transformDefs.length} regex · {(row.scripts ?? []).length} script
                    </div>
                  </div>
                  <span
                    style={{
                      ...so,
                      color: dangDungOTangNay ? 'var(--ngoc)' : 'var(--mo)',
                    }}
                  >
                    {state === null
                      ? tangDaChon.length > 0
                        ? `Sẽ bật ở ${tangDaChon.length} tầng`
                        : 'Chưa chọn cho ván mới'
                      : daBat && dangDungOTangNay
                        ? `Đang dùng ở tầng ${NHAN_TANG[tangHienTai]}`
                        : daBat
                          ? 'Đã gán cho tầng khác'
                          : act
                            ? `Đang dùng bản ${act.packVersion}`
                            : 'Đang tắt'}
                  </span>
                </header>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    style={nut()}
                    onClick={() => doiMoRong(row.packId)}
                    aria-expanded={dangMo}
                  >
                    {dangMo ? 'Thu gọn cấu hình' : 'Mở cấu hình'}
                  </button>
                  <button
                    type="button"
                    style={{ ...nut(), color: 'var(--hoi)' }}
                    onClick={() => {
                      if (
                        window.confirm(
                          `Xóa “${row.pack.envelope.sourceName}” và mọi phiên bản khỏi thư viện?`,
                        )
                      ) {
                        void xoaKhoiThuVien(row.packId);
                      }
                    }}
                  >
                    Xóa
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <span style={nhan}>{state === null ? 'Dùng trong ván mới' : 'Áp dụng cho'}</span>
                  {VIEW_MODES.map((tang) => {
                    const checked = tangDaChon.includes(tang);
                    return (
                      <CongTac
                        key={tang}
                        checked={checked}
                        nhanChu={`${NHAN_TANG[tang]}${state !== null && tang === tangHienTai ? ' · đang ở đây' : ''}`}
                        onChange={(chon) => {
                          if (state === null) void datChonChoVanMoi(row.packId, tang, chon);
                          else void datTangApDung(row.packId, tang, chon, saveId, tick);
                        }}
                      />
                    );
                  })}
                </div>

                {state === null && (
                  <p style={{ ...phu, margin: 0 }}>
                    Preset sẽ chỉ tự bật ở những tầng được chọn trước lời kể đầu tiên. Công tắc module, regex
                    và script vẫn được giữ riêng cho từng ván.
                  </p>
                )}

                {dangMo && (
                  <div
                    style={{
                      borderTop: '1px solid var(--kinh-vien)',
                      paddingTop: 14,
                      display: 'grid',
                      gap: 20,
                    }}
                  >
                    <ThongSo row={row} />
                    <Khoi
                      ten="Prompt và module"
                      phuDe="Bật/tắt từng phần; thứ tự trong file luôn được giữ nguyên."
                    >
                      <div
                        style={{ display: 'grid', gap: 6, maxHeight: 640, overflow: 'auto', paddingRight: 4 }}
                      >
                        {row.pack.modules.map((m) => (
                          <PromptDong
                            key={m.id}
                            row={row}
                            module={m}
                            bienPack={bienPack}
                            coVan={state !== null}
                            tick={tick}
                            datTinhNang={datTinhNang}
                            luuChinhSua={luuChinhSua}
                          />
                        ))}
                      </div>
                    </Khoi>

                    <Khoi
                      ten="Regex"
                      phuDe="Chạy đúng ngữ nghĩa SillyTavern: placement, độ sâu, markdownOnly/promptOnly."
                    >
                      <div style={{ display: 'grid', gap: 8 }}>
                        {row.transformDefs.map((t) => (
                          <RegexDong
                            key={t.id}
                            row={row}
                            transform={t}
                            bienPack={bienPack}
                            coVan={state !== null}
                            tick={tick}
                            msCham={msCham[t.id]}
                            datTinhNang={datTinhNang}
                            luuChinhSua={luuChinhSua}
                          />
                        ))}
                        {row.transformDefs.length === 0 && (
                          <p style={{ ...phu, margin: 0 }}>Preset này không khai regex nào.</p>
                        )}
                      </div>
                    </Khoi>

                    <Khoi
                      ten="Script"
                      phuDe="Mã nguồn Tavern Helper chạy thật trong ứng dụng: biến, sự kiện, khung kể và giao diện."
                    >
                      <div style={{ display: 'grid', gap: 8 }}>
                        {(row.scripts ?? []).map((s) => (
                          <ScriptDong
                            key={s.id}
                            row={row}
                            script={s}
                            bienPack={bienPack}
                            coVan={state !== null}
                            tick={tick}
                            datTinhNang={datTinhNang}
                            luuChinhSua={luuChinhSua}
                          />
                        ))}
                        {(row.scripts ?? []).length === 0 && (
                          <p style={{ ...phu, margin: 0 }}>Preset này không kèm script Tavern Helper.</p>
                        )}
                        {row.scriptAdapters.length > 0 && (
                          <details>
                            <summary style={{ ...phu, cursor: 'pointer' }}>
                              {row.scriptAdapters.length} bản port native (dùng khi script nguồn tắt)
                            </summary>
                            <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
                              {row.scriptAdapters.map((a) => {
                                const checked =
                                  state === null
                                    ? a.batONguon
                                    : tinhNangPresetDangBat(bienPack, 'adapter', a.id, a.batONguon);
                                return (
                                  <div
                                    key={a.id}
                                    className="kinh--cap2"
                                    style={{
                                      padding: '9px 11px',
                                      display: 'flex',
                                      gap: 10,
                                      alignItems: 'center',
                                      flexWrap: 'wrap',
                                    }}
                                  >
                                    <CongTac
                                      checked={checked}
                                      nhanChu={a.ten}
                                      onChange={(v) => {
                                        if (state !== null) {
                                          void datTinhNang(row.packId, 'adapter', a.id, v, tick);
                                          return;
                                        }
                                        void luuChinhSua({
                                          ...row,
                                          scriptAdapters: row.scriptAdapters.map((x) =>
                                            x.id === a.id ? { ...x, batONguon: v } : x,
                                          ),
                                        });
                                      }}
                                    />
                                    <span style={{ ...phu, marginLeft: 'auto', color: 'var(--ngoc)' }}>
                                      {nhanAdapter(a.kind)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </details>
                        )}
                      </div>
                    </Khoi>

                    {Object.keys(bienPack).filter((k) => !k.startsWith('__')).length > 0 && (
                      <Khoi ten="Biến preset" phuDe="Dữ liệu riêng của preset trên nhánh hiện tại.">
                        <pre
                          className="chu-so"
                          style={{
                            ...phu,
                            margin: 0,
                            whiteSpace: 'pre-wrap',
                            maxHeight: 220,
                            overflow: 'auto',
                          }}
                        >
                          {JSON.stringify(
                            Object.fromEntries(Object.entries(bienPack).filter(([k]) => !k.startsWith('__'))),
                            null,
                            2,
                          )}
                        </pre>
                      </Khoi>
                    )}
                  </div>
                )}
              </article>
            );
          })
        )}
      </section>

      {loiBat.length > 0 && (
        <section className="kinh" role="alert" style={{ padding: 16, display: 'grid', gap: 4 }}>
          <h2 style={{ ...nhan, margin: 0, color: 'var(--hoi)' }}>Cần chú ý</h2>
          {loiBat.slice(-12).map((i, n) => (
            <span
              key={`${i.code}:${n}`}
              style={{ ...phu, color: i.severity === 'error' ? 'var(--hoi)' : 'var(--tro)' }}
            >
              {i.message}
            </span>
          ))}
        </section>
      )}

      <section className="kinh" style={{ padding: 16, display: 'grid', gap: 7 }}>
        <h2 style={{ ...nhan, margin: 0 }}>Lượt kể gần nhất</h2>
        {presetTrace.packDaDung.length === 0 ? (
          <span style={phu}>Đang dùng prompt mặc định; chưa có preset góp mặt.</span>
        ) : (
          <>
            <span style={so}>Preset đã dùng: {presetTrace.packDaDung.join(', ')}</span>
            {presetTrace.moduleBiBo.length > 0 && (
              <span style={phu}>
                {presetTrace.moduleBiBo.length} module không vào prompt: {tomTatLyDoBo(presetTrace.lyDoBiBo)}.
              </span>
            )}
            {presetTrace.macroChuaGiai.length > 0 && (
              <span style={{ ...phu, color: 'var(--hoi)' }}>
                Macro chưa ánh xạ: {presetTrace.macroChuaGiai.join(', ')}
              </span>
            )}
          </>
        )}
      </section>
    </main>
  );
}

function PromptDong({
  row,
  module,
  bienPack,
  coVan,
  tick,
  datTinhNang,
  luuChinhSua,
}: {
  row: PresetPackRow;
  module: PromptModule;
  bienPack: Readonly<Record<string, unknown>>;
  coVan: boolean;
  tick: number;
  datTinhNang: ReturnType<typeof usePreset.getState>['datTinhNang'];
  luuChinhSua: ReturnType<typeof usePreset.getState>['luuChinhSua'];
}): JSX.Element {
  const [dangSua, setDangSua] = useState(false);
  const [ten, setTen] = useState(module.name);
  const [role, setRole] = useState(module.role);
  const [lane, setLane] = useState(module.lane);
  const [order, setOrder] = useState(module.order);
  const [depth, setDepth] = useState(module.depth);
  const [content, setContent] = useState(module.content);
  const [dangLuu, setDangLuu] = useState(false);
  const duocChay = !KHONG_CHAY_DUOC.has(module.activation);
  const checked = coVan
    ? tinhNangPresetDangBat(bienPack, 'module', module.sourceIdentifier, moduleMacDinh(module))
    : moduleMacDinh(module);

  const datBat = (bat: boolean): void => {
    if (coVan) {
      void datTinhNang(row.packId, 'module', module.sourceIdentifier, bat, tick);
      return;
    }
    void luuChinhSua({
      ...row,
      pack: {
        ...row.pack,
        modules: row.pack.modules.map((m) => (m.id === module.id ? { ...m, enabled: bat } : m)),
      },
    });
  };

  const luu = async (): Promise<void> => {
    setDangLuu(true);
    const moi: PromptModule = { ...module, name: ten, role, lane, order, depth, content };
    const ok = await luuChinhSua({
      ...row,
      pack: { ...row.pack, modules: row.pack.modules.map((m) => (m.id === module.id ? moi : m)) },
    });
    setDangLuu(false);
    if (ok) setDangSua(false);
  };

  return (
    <div className="kinh--cap2" style={{ padding: '9px 11px', display: 'grid', gap: 9 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <CongTac checked={checked && duocChay} disabled={!duocChay} nhanChu={module.name} onChange={datBat} />
        <span style={{ ...phu, marginLeft: 'auto' }}>
          {module.role} · {module.lane} · #{module.order}
        </span>
        <button type="button" style={nut()} onClick={() => setDangSua((v) => !v)}>
          {dangSua ? 'Đóng' : 'Chỉnh prompt'}
        </button>
        {!duocChay && (
          <span style={{ ...phu, color: 'var(--hoi)' }}>không tương thích: {module.activation}</span>
        )}
      </div>

      {dangSua && (
        <div style={{ display: 'grid', gap: 8, borderTop: '1px solid var(--kinh-vien)', paddingTop: 9 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(180px, 2fr) repeat(4, minmax(90px, 1fr))',
              gap: 7,
            }}
          >
            <label style={phu}>
              Tên
              <input
                style={{ ...oNhap, marginTop: 3 }}
                value={ten}
                onChange={(e) => setTen(e.currentTarget.value)}
              />
            </label>
            <label style={phu}>
              Vai trò
              <select
                style={{ ...oNhap, marginTop: 3 }}
                value={role}
                onChange={(e) => setRole(e.currentTarget.value as PromptModule['role'])}
              >
                <option value="system">system</option>
                <option value="user">user</option>
                <option value="assistant">assistant</option>
              </select>
            </label>
            <label style={phu}>
              Vị trí
              <select
                style={{ ...oNhap, marginTop: 3 }}
                value={lane}
                onChange={(e) => setLane(e.currentTarget.value as PromptModule['lane'])}
              >
                {MODULE_LANES.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label style={phu}>
              Thứ tự
              <input
                type="number"
                style={{ ...oNhap, marginTop: 3 }}
                value={order}
                onChange={(e) => setOrder(Number(e.currentTarget.value))}
              />
            </label>
            <label style={phu}>
              Độ sâu
              <input
                type="number"
                min={0}
                style={{ ...oNhap, marginTop: 3 }}
                value={depth}
                onChange={(e) => setDepth(Math.max(0, Number(e.currentTarget.value)))}
              />
            </label>
          </div>
          <label style={phu}>
            Nội dung prompt
            <textarea
              className="chu-so"
              rows={12}
              style={{ ...oNhap, marginTop: 3, resize: 'vertical', lineHeight: 1.5 }}
              value={content}
              onChange={(e) => setContent(e.currentTarget.value)}
            />
          </label>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" style={nut(true, dangLuu)} disabled={dangLuu} onClick={() => void luu()}>
              {dangLuu ? 'Đang lưu…' : 'Lưu prompt'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ThongSo({ row }: { row: PresetPackRow }): JSX.Element {
  const gen = row.pack.generation;
  const tatCa: [string, unknown][] =
    gen === undefined
      ? []
      : [
          ['Temperature', gen.temperature],
          ['Top P', gen.topP],
          ['Top K', gen.topK],
          ['Min P', gen.minP],
          ['Max Output', gen.maxOutputTokens],
          ['Context', gen.maxContext],
          ['Presence', gen.presencePenalty],
          ['Frequency', gen.frequencyPenalty],
          ['Stop', gen.stopSequences],
          ['Streaming', gen.streaming],
        ];
  const ds = tatCa.filter(([, v]) => v !== undefined);
  return (
    <Khoi ten="Thông số sinh" phuDe="Các giá trị được áp vào model Tường Thuật khi preset đang bật.">
      {ds.length === 0 ? (
        <p style={{ ...phu, margin: 0 }}>Preset không ghi đè thông số sinh.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 7 }}>
          {ds.map(([ten, v]) => (
            <div key={ten} className="kinh--cap2" style={{ padding: '8px 10px' }}>
              <div style={nhan}>{ten}</div>
              <div className="chu-so" style={so}>
                {giaTri(v)}
              </div>
            </div>
          ))}
        </div>
      )}
    </Khoi>
  );
}

function RegexDong({
  row,
  transform,
  bienPack,
  coVan,
  tick,
  msCham,
  datTinhNang,
  luuChinhSua,
}: {
  row: PresetPackRow;
  transform: TransformDef;
  bienPack: Readonly<Record<string, unknown>>;
  coVan: boolean;
  tick: number;
  msCham: number | undefined;
  datTinhNang: ReturnType<typeof usePreset.getState>['datTinhNang'];
  luuChinhSua: ReturnType<typeof usePreset.getState>['luuChinhSua'];
}): JSX.Element {
  /*
   * Chỉ còn MỘT lý do một regex không bật được: engine `RegExp` không biên được
   * pattern. Mọi lý do cũ — hình dạng quay lui, chạy chậm, `disabled` trong file
   * — đều không còn khoá công tắc này.
   */
  const chayDuoc = transform.activation !== 'needs_adapter';
  const checked = coVan
    ? tinhNangPresetDangBat(bienPack, 'regex', transform.id, transform.batONguon)
    : transform.batONguon;
  const [dangSua, setDangSua] = useState(false);
  const [ten, setTen] = useState(transform.ten);
  const [pattern, setPattern] = useState(transform.pattern);
  const [thayThe, setThayThe] = useState(transform.thayThe);
  const [co, setCo] = useState(transform.co);
  const [dangLuu, setDangLuu] = useState(false);

  const datBat = (bat: boolean): void => {
    if (coVan) {
      void datTinhNang(row.packId, 'regex', transform.id, bat, tick);
      return;
    }
    void luuChinhSua({
      ...row,
      transformDefs: row.transformDefs.map((t) => (t.id === transform.id ? { ...t, batONguon: bat } : t)),
    });
  };

  const luu = async (): Promise<void> => {
    setDangLuu(true);
    const moi: TransformDef = {
      ...transform,
      ten,
      pattern,
      thayThe,
      co,
      activation: kiemPatternHopLe(pattern)
        ? transform.activation === 'needs_adapter'
          ? 'native'
          : transform.activation
        : 'needs_adapter',
      lyDo: kiemPatternHopLe(pattern) ? '' : 'Pattern chỉnh cục bộ không biên dịch được.',
    };
    const ok = await luuChinhSua({
      ...row,
      transformDefs: row.transformDefs.map((t) => (t.id === transform.id ? moi : t)),
    });
    setDangLuu(false);
    if (ok) setDangSua(false);
  };
  return (
    <div className="kinh--cap2" style={{ padding: '9px 11px', display: 'grid', gap: 9 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <CongTac
          checked={checked && chayDuoc}
          disabled={!chayDuoc}
          nhanChu={transform.ten}
          onChange={datBat}
        />
        <span style={{ ...phu, marginLeft: 'auto' }}>
          {transform.promptOnlyNguon
            ? 'prompt'
            : transform.markdownOnlyNguon
              ? 'hiển thị markdown'
              : 'prompt/hiển thị'}{' '}
          · vị trí {transform.placement.join(', ')}
        </span>
        {msCham !== undefined && (
          <span style={{ ...phu, color: 'var(--dong)' }}>chạy {Math.round(msCham)} ms</span>
        )}
        <button type="button" style={nut()} onClick={() => setDangSua((v) => !v)}>
          {dangSua ? 'Đóng' : 'Chỉnh regex'}
        </button>
        {!chayDuoc && <span style={{ ...phu, color: 'var(--hoi)' }}>RegExp không biên được pattern</span>}
      </div>
      {dangSua && (
        <div style={{ display: 'grid', gap: 8, borderTop: '1px solid var(--kinh-vien)', paddingTop: 9 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 7 }}>
            <label style={phu}>
              Tên
              <input
                style={{ ...oNhap, marginTop: 3 }}
                value={ten}
                onChange={(e) => setTen(e.currentTarget.value)}
              />
            </label>
            <label style={phu}>
              Cờ
              <input
                style={{ ...oNhap, marginTop: 3 }}
                value={co}
                onChange={(e) => setCo(e.currentTarget.value)}
                placeholder="gimsuy"
              />
            </label>
          </div>
          <label style={phu}>
            Pattern
            <textarea
              className="chu-so"
              rows={4}
              style={{ ...oNhap, marginTop: 3, resize: 'vertical' }}
              value={pattern}
              onChange={(e) => setPattern(e.currentTarget.value)}
            />
          </label>
          <label style={phu}>
            Thay thế
            <textarea
              className="chu-so"
              rows={4}
              style={{ ...oNhap, marginTop: 3, resize: 'vertical' }}
              value={thayThe}
              onChange={(e) => setThayThe(e.currentTarget.value)}
            />
          </label>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" style={nut(true, dangLuu)} disabled={dangLuu} onClick={() => void luu()}>
              {dangLuu ? 'Đang lưu…' : 'Lưu regex'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const NHAN_TRANG_THAI: Readonly<Record<string, string>> = Object.freeze({
  dang_chay: 'đang chạy',
  loi: 'có lỗi',
  da_dung: 'đã dừng',
});

/**
 * Một script Tavern Helper: công tắc, trạng thái thật, nút của script, và lỗi.
 *
 * Bốn thứ ấy đi cùng nhau có lý do. Một công tắc không kèm trạng thái nói dối:
 * bật xong mà script ném lỗi ở dòng đầu thì công tắc vẫn "bật" trong khi chẳng
 * có gì chạy. Trạng thái không kèm lỗi thì người dùng biết nó hỏng mà không biết
 * hỏng ở đâu — và với preset tự viết, thông báo lỗi CHÍNH LÀ thứ họ cần.
 */
function ScriptDong({
  row,
  script,
  bienPack,
  coVan,
  tick,
  datTinhNang,
  luuChinhSua,
}: {
  row: PresetPackRow;
  script: HelperScript;
  bienPack: Readonly<Record<string, unknown>>;
  coVan: boolean;
  tick: number;
  datTinhNang: ReturnType<typeof usePreset.getState>['datTinhNang'];
  luuChinhSua: ReturnType<typeof usePreset.getState>['luuChinhSua'];
}): JSX.Element {
  const dangChay = usePreset((s) => s.scriptDangChay.find((x) => x.id === script.id));
  const nhatKy = usePreset((s) => chonNhatKyScript(s, script.id));
  const bamNut = usePreset((s) => s.bamNutScript);
  const checked = coVan
    ? tinhNangPresetDangBat(bienPack, 'script', script.id, script.batONguon)
    : script.batONguon;
  const nutHien = script.buttons.filter((b) => b.visible);
  const [dangSua, setDangSua] = useState(false);
  const [ten, setTen] = useState(script.ten);
  const [info, setInfo] = useState(script.info);
  const [noiDung, setNoiDung] = useState(script.noiDung);
  const [dangLuu, setDangLuu] = useState(false);

  const datBat = (bat: boolean): void => {
    if (coVan) {
      void datTinhNang(row.packId, 'script', script.id, bat, tick);
      return;
    }
    void luuChinhSua({
      ...row,
      scripts: (row.scripts ?? []).map((s) => (s.id === script.id ? { ...s, batONguon: bat } : s)),
    });
  };

  const luu = async (): Promise<void> => {
    setDangLuu(true);
    const moi: HelperScript = {
      ...script,
      ten,
      info,
      noiDung,
      soKyTu: noiDung.length,
      hash: bam(noiDung),
    };
    const ok = await luuChinhSua({
      ...row,
      scripts: (row.scripts ?? []).map((s) => (s.id === script.id ? moi : s)),
    });
    setDangLuu(false);
    if (ok) setDangSua(false);
  };

  return (
    <div className="kinh--cap2" style={{ padding: '9px 11px', display: 'grid', gap: 7 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <CongTac checked={checked} nhanChu={script.ten} onChange={datBat} />
        <span style={{ ...phu, marginLeft: 'auto' }}>
          {script.soKyTu.toLocaleString('vi-VN')} ký tự
          {script.coTaiTuXa ? ' · nạp mã từ mạng' : ''}
        </span>
        <span
          style={{
            ...phu,
            color:
              dangChay?.trangThai === 'loi'
                ? 'var(--hoi)'
                : dangChay?.trangThai === 'dang_chay'
                  ? 'var(--ngoc)'
                  : 'var(--mo)',
          }}
        >
          {dangChay === undefined ? 'chưa nạp' : (NHAN_TRANG_THAI[dangChay.trangThai] ?? '')}
        </span>
        <button type="button" style={nut()} onClick={() => setDangSua((v) => !v)}>
          {dangSua ? 'Đóng' : 'Chỉnh script'}
        </button>
      </div>

      {script.info !== '' && <p style={{ ...phu, margin: 0 }}>{script.info}</p>}

      {dangChay !== undefined && nutHien.length > 0 && (
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {nutHien.map((b) => (
            <button key={b.name} type="button" style={nut()} onClick={() => void bamNut(script.id, b.name)}>
              {b.name}
            </button>
          ))}
        </div>
      )}

      {(dangChay?.loi.length ?? 0) > 0 && (
        <div role="alert" style={{ display: 'grid', gap: 3 }}>
          {(dangChay?.loi ?? []).slice(-3).map((l, i) => (
            <span key={`${l}:${i}`} style={{ ...phu, color: 'var(--hoi)' }}>
              {l}
            </span>
          ))}
        </div>
      )}

      {nhatKy.length > 0 && (
        <details>
          <summary style={{ ...phu, cursor: 'pointer' }}>Nhật ký ({nhatKy.length} dòng)</summary>
          <pre
            className="chu-so"
            style={{ ...phu, margin: '6px 0 0', whiteSpace: 'pre-wrap', maxHeight: 180, overflow: 'auto' }}
          >
            {nhatKy
              .slice(-30)
              .map((d) => `[${d.muc}] ${d.dong}`)
              .join('\n')}
          </pre>
        </details>
      )}

      {dangSua && (
        <div style={{ display: 'grid', gap: 8, borderTop: '1px solid var(--kinh-vien)', paddingTop: 9 }}>
          <label style={phu}>
            Tên
            <input
              style={{ ...oNhap, marginTop: 3 }}
              value={ten}
              onChange={(e) => setTen(e.currentTarget.value)}
            />
          </label>
          <label style={phu}>
            Ghi chú
            <textarea
              rows={3}
              style={{ ...oNhap, marginTop: 3, resize: 'vertical' }}
              value={info}
              onChange={(e) => setInfo(e.currentTarget.value)}
            />
          </label>
          <label style={phu}>
            Mã nguồn
            <textarea
              className="chu-so"
              rows={16}
              style={{ ...oNhap, marginTop: 3, resize: 'vertical', lineHeight: 1.45 }}
              value={noiDung}
              onChange={(e) => setNoiDung(e.currentTarget.value)}
            />
          </label>
          <p style={{ ...phu, margin: 0, color: 'var(--hoi)' }}>
            Script có thể tác động giao diện và chạy mã JavaScript. Chỉ bật mã bạn tin cậy.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" style={nut(true, dangLuu)} disabled={dangLuu} onClick={() => void luu()}>
              {dangLuu ? 'Đang lưu…' : 'Lưu và nạp lại'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
