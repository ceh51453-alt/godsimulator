/**
 * Quản lý Preset.
 *
 * File được nhập thẳng vào thư viện, xung đột nội bộ tự giữ theo prompt_order.
 * Mỗi pack có một bảng cấu hình thống nhất cho prompt, regex, adapter script,
 * thông số sinh và biến — không còn wizard hay một khu script tách rời.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { usePreset, tinhNangPresetDangBat } from '../../store/preset.js';
import { useGame } from '../../store/game.js';
import { useAi } from '../../store/ai.js';
import { ThongSoSinh } from './ThongSoSinh.js';
import type {
  PresetPackRow,
  PromptModule,
  ScriptAdapterDef,
  TransformDef,
} from '../../core/preset/schema.js';

const nhan: CSSProperties = {
  color: 'var(--mo)',
  fontSize: 11,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
};
const so: CSSProperties = { fontSize: 13, color: 'var(--tro)' };
const phu: CSSProperties = { fontSize: 12, color: 'var(--mo)' };

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
  const bat = usePreset((s) => s.bat);
  const tat = usePreset((s) => s.tat);
  const xoaKhoiThuVien = usePreset((s) => s.xoaKhoiThuVien);
  const datChonChoVanMoi = usePreset((s) => s.datChonChoVanMoi);
  const datTinhNang = usePreset((s) => s.datTinhNang);
  const thamSoHieuLuc = usePreset((s) => s.thamSoHieuLuc);
  const datThamSoHieuLuc = usePreset((s) => s.datThamSoHieuLuc);
  const paramsNen = useAi((s) => s.cfg.narrator.params);

  const state = useGame((s) => s.state);
  const presetTrace = useGame((s) => s.presetTrace);
  const branchId = state?.world.branchId ?? '';
  const tick = state?.world.tick ?? 0;
  const saveId = state?.world.id ?? '';

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
          `${kq.row.transformDefs.length} regex, ${kq.row.scriptAdapters.length} chức năng script đã tích hợp.`,
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
    .filter((row) => dangBat[row.packId]?.packVersion === row.version)
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
            const daChonChoVanMoi = chonChoVanMoi.includes(row.packId);
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
                      {row.transformDefs.length} regex · {row.quarantined.length} script nguồn
                    </div>
                  </div>
                  <span
                    style={{
                      ...so,
                      color: daBat || (state === null && daChonChoVanMoi) ? 'var(--ngoc)' : 'var(--mo)',
                    }}
                  >
                    {state === null
                      ? daChonChoVanMoi
                        ? 'Sẽ bật trong ván mới'
                        : 'Chưa chọn cho ván mới'
                      : daBat
                        ? 'Đang dùng trong ván'
                        : act
                          ? `Đang dùng bản ${act.packVersion}`
                          : 'Đang tắt'}
                  </span>
                </header>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {state === null ? (
                    <button
                      type="button"
                      style={nut(!daChonChoVanMoi)}
                      onClick={() => void datChonChoVanMoi(row.packId, !daChonChoVanMoi)}
                    >
                      {daChonChoVanMoi ? 'Bỏ khỏi ván mới' : 'Bật sẵn cho ván mới'}
                    </button>
                  ) : daBat ? (
                    <button type="button" style={nut()} onClick={() => void tat(row.packId)}>
                      Tắt preset
                    </button>
                  ) : (
                    <button
                      type="button"
                      style={nut(true)}
                      onClick={() => void bat(row.packId, saveId, tick)}
                    >
                      {act ? 'Dùng bản mới nhất' : 'Bật cho ván này'}
                    </button>
                  )}
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

                {state === null && (
                  <p style={{ ...phu, margin: 0 }}>
                    Preset đã chọn sẽ tự bật trước lời kể đầu tiên. Công tắc module, regex và script vẫn được
                    giữ riêng cho từng ván.
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
                        style={{ display: 'grid', gap: 6, maxHeight: 360, overflow: 'auto', paddingRight: 4 }}
                      >
                        {row.pack.modules.map((m) => {
                          const duocChay = !KHONG_CHAY_DUOC.has(m.activation);
                          const checked = tinhNangPresetDangBat(
                            bienPack,
                            'module',
                            m.sourceIdentifier,
                            moduleMacDinh(m),
                          );
                          return (
                            <div
                              key={m.id}
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
                                checked={checked && duocChay}
                                disabled={state === null || !duocChay}
                                nhanChu={m.name}
                                onChange={(v) =>
                                  void datTinhNang(row.packId, 'module', m.sourceIdentifier, v, tick)
                                }
                              />
                              <span style={{ ...phu, marginLeft: 'auto' }}>
                                {m.role} · {m.lane} · #{m.order}
                              </span>
                              {!duocChay && (
                                <span style={{ ...phu, color: 'var(--hoi)' }}>
                                  không tương thích: {m.activation}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </Khoi>

                    <Khoi
                      ten="Regex và script"
                      phuDe="Được quản lý cùng preset và chạy qua bộ tương thích của ứng dụng."
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
                            datTinhNang={datTinhNang}
                          />
                        ))}
                        {row.scriptAdapters.map((a) => {
                          const checked = tinhNangPresetDangBat(bienPack, 'script', a.id, a.batONguon);
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
                                disabled={state === null}
                                nhanChu={a.ten}
                                onChange={(v) => void datTinhNang(row.packId, 'script', a.id, v, tick)}
                              />
                              <span style={{ ...phu, marginLeft: 'auto', color: 'var(--ngoc)' }}>
                                {nhanAdapter(a.kind)} · đã tích hợp
                              </span>
                            </div>
                          );
                        })}
                        {row.transformDefs.length === 0 && row.scriptAdapters.length === 0 && (
                          <p style={{ ...phu, margin: 0 }}>
                            Preset này không khai regex hoặc chức năng script tương thích.
                          </p>
                        )}
                        {row.quarantined.length > row.scriptAdapters.length && (
                          <p style={{ ...phu, margin: 0 }}>
                            Đã giữ nguyên {row.quarantined.length} script nguồn; {row.scriptAdapters.length}{' '}
                            chức năng đã nhận diện và nối vào ứng dụng.
                          </p>
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
                {presetTrace.moduleBiBo.length} module bị bỏ vì ngân sách hoặc không tương thích.
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
  datTinhNang,
}: {
  row: PresetPackRow;
  transform: TransformDef;
  bienPack: Readonly<Record<string, unknown>>;
  coVan: boolean;
  tick: number;
  datTinhNang: ReturnType<typeof usePreset.getState>['datTinhNang'];
}): JSX.Element {
  const tuongThich = transform.activation === 'sandboxed' || transform.activation === 'disabled';
  const checked = tinhNangPresetDangBat(bienPack, 'regex', transform.id, transform.batONguon);
  return (
    <div
      className="kinh--cap2"
      style={{ padding: '9px 11px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}
    >
      <CongTac
        checked={checked && tuongThich}
        disabled={!coVan || !tuongThich}
        nhanChu={transform.ten}
        onChange={(v) => void datTinhNang(row.packId, 'regex', transform.id, v, tick)}
      />
      <span style={{ ...phu, marginLeft: 'auto' }}>
        {transform.promptOnlyNguon
          ? 'prompt'
          : transform.markdownOnlyNguon
            ? 'hiển thị markdown'
            : 'prompt/hiển thị'}{' '}
        · vị trí {transform.placement.join(', ')}
      </span>
      {!tuongThich && <span style={{ ...phu, color: 'var(--hoi)' }}>cú pháp regex chưa tương thích</span>}
    </div>
  );
}
