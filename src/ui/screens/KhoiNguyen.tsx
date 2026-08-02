/**
 * Màn Khởi Nguyên — Phần 78.5, bốn chế độ.
 *
 * ── Vì sao bốn chứ không phải một form dài có nút "bỏ qua" ──
 *
 * 78.5 đòi đúng bốn: `Nhanh | Gợi ý | Đầy đủ | Bỏ qua`. Một form dài kèm nút bỏ
 * qua nhìn thì giống, nhưng nó bắt người chơi **nhìn thấy** mọi ô họ đang không
 * điền — và cảm giác "mình đang bỏ dở cái gì đó" là đúng thứ khiến người ta điền
 * bừa. Bốn chế độ nói rõ: chế độ này chỉ có ngần này ô, và ngần ấy là đủ.
 *
 * ── Bảng riêng tư ──
 *
 * [BB] 78.11 + cổng Phase 11 "không ép dữ liệu thật". `diffCongBo()` chia mọi thứ
 * người chơi vừa gõ thành ba cột: **chỉ mình bạn thấy · gửi Narrator · thành
 * canon**. Nó cập nhật ngay khi gõ, không đợi bấm nút, vì một bảng privacy chỉ
 * hiện lúc cuối là một bảng người ta bấm qua.
 *
 * [BB] `Bỏ qua` phải vào game được ngay, không màn hình chặn nào.
 * [BB] Không hỏi email, tuổi, giới tính hay ngày sinh — schema không có chỗ chứa.
 * [BB] Dùng được hoàn toàn bằng bàn phím.
 */
import { useMemo, useState } from 'react';
import { useGame } from '../../store/game.js';
import type { CuaVao } from '../../core/world/khoiTao.js';
import { PlayerProfileSchema, CreatorIdentitySchema, hoSoToiThieu } from '../../core/schema/player.js';
import type { PlayerProfile, CreatorIdentity } from '../../core/schema/player.js';
import { diffCongBo } from '../../core/privacy/project.js';
import { nut as nutChung } from '../design/kieu.js';

const o: React.CSSProperties = {
  background: 'var(--nen-2)',
  color: 'var(--chu-1)',
  border: '1px solid var(--vien)',
  borderRadius: 8,
  padding: '9px 12px',
  font: 'inherit',
  width: '100%',
};

const nut = (chinh: boolean): React.CSSProperties => ({
  background: chinh ? 'var(--mau-ngoc)' : 'transparent',
  color: chinh ? '#0d0c0f' : 'var(--chu-1)',
  border: `1px solid ${chinh ? 'var(--mau-ngoc)' : 'var(--vien)'}`,
  borderRadius: 8,
  padding: '10px 18px',
  font: 'inherit',
  fontWeight: chinh ? 600 : 400,
  cursor: 'pointer',
});

const nhanMuc: React.CSSProperties = {
  fontSize: 13,
  letterSpacing: '0.1em',
  color: 'var(--chu-3)',
  textTransform: 'uppercase',
};

/**
 * Bốn chế độ — [BB] 78.5.
 *
 * `Gợi ý` khác `Nhanh` ở chỗ nó ĐỀ XUẤT sẵn giá trị chứ không thêm ô trống: đây
 * là chế độ cho người chưa biết mình muốn gì, và đưa họ thêm ô trống thì không
 * giúp được gì.
 */
const CHE_DO = [
  { id: 'bo_qua', ten: 'Bỏ qua', moTa: 'Vào thẳng. Hồ sơ trống, hoàn thiện lúc nào cũng được.' },
  { id: 'nhanh', ten: 'Nhanh', moTa: 'Một cái tên và một cửa vào. Ba mươi giây.' },
  { id: 'goi_y', ten: 'Gợi ý', moTa: 'Thêm đại từ và cách kể — đã điền sẵn, bạn chỉ sửa chỗ không vừa.' },
  { id: 'day_du', ten: 'Đầy đủ', moTa: 'Thêm danh tính Sáng Thế và phần bạn chọn công bố cho thế giới.' },
] as const;

type CheDo = (typeof CHE_DO)[number]['id'];

const CUA: { id: CuaVao; ten: string; moTa: string }[] = [
  { id: 'hu_vo', ten: 'Hư Vô', moTa: 'Không nói gì. Nhịp đầu tiên diễn ra trong cái chưa có tên.' },
  { id: 'mot_cau', ten: 'Một Câu', moTa: 'Viết một câu. Nó là toàn bộ tiền đề, và thế giới lớn lên từ đó.' },
  {
    id: 'day_du',
    ten: 'Đầy Đủ',
    moTa: 'Thêm nguyên mẫu sáng thế — vẫn chỉ là tiền đề, không phải nội dung.',
  },
];

function Muc({ id, ten, children }: { id: string; ten: string; children: React.ReactNode }): JSX.Element {
  return (
    <section aria-labelledby={id} style={{ marginTop: 28 }}>
      <h2 id={id} style={nhanMuc}>
        {ten}
      </h2>
      {children}
    </section>
  );
}

function O({
  nhan,
  giaTri,
  onDoi,
  goiY,
  dai,
}: {
  nhan: string;
  giaTri: string;
  onDoi: (v: string) => void;
  goiY?: string;
  dai?: number;
}): JSX.Element {
  return (
    <label style={{ display: 'grid', gap: 5, marginTop: 10 }}>
      <span style={{ color: 'var(--chu-2)', fontSize: 14 }}>{nhan}</span>
      <input
        style={o}
        value={giaTri}
        maxLength={dai ?? 200}
        placeholder={goiY}
        onChange={(e) => onDoi(e.target.value)}
      />
    </label>
  );
}

function Chon<T extends string>({
  nhan,
  giaTri,
  ds,
  onDoi,
}: {
  nhan: string;
  giaTri: T;
  ds: readonly { id: T; ten: string }[];
  onDoi: (v: T) => void;
}): JSX.Element {
  return (
    <label style={{ display: 'grid', gap: 5, marginTop: 10 }}>
      <span style={{ color: 'var(--chu-2)', fontSize: 14 }}>{nhan}</span>
      <select style={o} value={giaTri} onChange={(e) => onDoi(e.target.value as T)}>
        {ds.map((x) => (
          <option key={x.id} value={x.id}>
            {x.ten}
          </option>
        ))}
      </select>
    </label>
  );
}

export function KhoiNguyen({ onQuayLai }: { onQuayLai?: () => void } = {}) {
  const batDau = useGame((s) => s.batDau);
  const batDauBoQua = useGame((s) => s.batDauBoQua);

  const [cheDo, setCheDo] = useState<CheDo>('nhanh');
  const [cua, setCua] = useState<CuaVao>('hu_vo');
  const [motCau, setMotCau] = useState('');

  // ── hồ sơ ──
  const [ten, setTen] = useState('');
  const [xungHo, setXungHo] = useState('bạn');
  const [tuXung, setTuXung] = useState('ta');
  const [pov, setPov] = useState<'tu_dong' | 'thu_nhat' | 'thu_ba' | 'toan_canh'>('tu_dong');
  const [doDay, setDoDay] = useState<'gon' | 'vua' | 'day'>('vua');
  const [thoai, setThoai] = useState<'it' | 'vua' | 'nhieu'>('vua');
  const [giamChuyenDong, setGiamChuyenDong] = useState(false);
  const [chuDeAn, setChuDeAn] = useState('');
  const [ghiChuRieng, setGhiChuRieng] = useState('');

  // ── danh tính Sáng Thế ──
  const [danhXung, setDanhXung] = useState('');
  const [hienThan, setHienThan] = useState('');
  const [gtri, setGtri] = useState('');
  const [loDanhXung, setLoDanhXung] = useState(false);
  const [loHinhDang, setLoHinhDang] = useState(false);
  const [loGiaTri, setLoGiaTri] = useState(false);

  const hoSo: PlayerProfile = useMemo(() => {
    const nen = hoSoToiThieu('pf_local', 0);
    if (cheDo === 'bo_qua') return nen;
    return PlayerProfileSchema.parse({
      ...nen,
      displayName: ten.trim() || 'Người Chơi',
      ...(cheDo === 'nhanh'
        ? {}
        : {
            pronouns: {
              self: tuXung.trim() || 'ta',
              subject: xungHo.trim() || 'bạn',
              object: xungHo.trim() || 'bạn',
            },
            narrativePreferences: { pov, proseDensity: doDay, dialogueAmount: thoai, showSuggestions: true },
          }),
      ...(cheDo === 'day_du'
        ? {
            accessibility: { ...nen.accessibility, reducedMotion: giamChuyenDong },
            contentPreferences: {
              ...nen.contentPreferences,
              sensitiveTopicsHidden: chuDeAn
                .split(',')
                .map((s) => s.trim())
                .filter((s) => s !== ''),
            },
            privateNotes: ghiChuRieng.slice(0, 4_000),
          }
        : {}),
    });
  }, [cheDo, ten, tuXung, xungHo, pov, doDay, thoai, giamChuyenDong, chuDeAn, ghiChuRieng]);

  const danhTinh: CreatorIdentity | null = useMemo(() => {
    if (cheDo !== 'day_du') return null;
    if (danhXung.trim() === '' && hienThan.trim() === '' && gtri.trim() === '') return null;
    return CreatorIdentitySchema.parse({
      id: 'ci_local',
      saveId: 'w1',
      title: danhXung.trim() || 'Kẻ Không Tên',
      manifestationDescription: hienThan.trim(),
      values: gtri
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s !== '')
        .slice(0, 12),
      worldDisclosure: { revealTitle: loDanhXung, revealForm: loHinhDang, revealValues: loGiaTri },
    });
  }, [cheDo, danhXung, hienThan, gtri, loDanhXung, loHinhDang, loGiaTri]);

  /**
   * Bảng riêng tư, tính lại mỗi lần gõ.
   *
   * `diffCongBo()` là hàm của `core/privacy`, cùng hàm mà cổng Phase 0 đã kiểm
   * bằng 29 test rò rỉ. Màn này không tự phân loại lấy — tự phân loại nghĩa là
   * có hai nguồn chân lý, và cái ở giao diện sẽ là cái sai.
   */
  const diff = useMemo(
    () => diffCongBo({ profile: hoSo, creator: danhTinh, mode: 'sang_the', currentEntityId: null }),
    [hoSo, danhTinh],
  );

  const chay = (): void => {
    if (cheDo === 'bo_qua') {
      void batDauBoQua();
      return;
    }
    void batDau({ hoSo, danhTinh, cua, motCau });
  };

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '56px 20px 80px' }}>
      {onQuayLai !== undefined && (
        <button style={{ ...nutChung(false), marginBottom: 18 }} onClick={onQuayLai}>
          Quay lại Sảnh Vào
        </button>
      )}
      <p style={{ color: 'var(--chu-3)', margin: 0, letterSpacing: '0.12em', fontSize: 12 }}>THIÊN DIỄN</p>
      <h1 style={{ fontSize: 32, margin: '6px 0 8px', fontWeight: 600 }}>Khởi Nguyên</h1>
      <p style={{ color: 'var(--chu-2)', marginTop: 0 }}>
        Thế giới mở ra rỗng: không đất, không luật, không thần, không người. Mọi thứ chỉ tồn tại sau khi được
        kể ra trong lúc chơi.
      </p>

      <Muc id="h-chedo" ten="Bạn muốn thiết lập bao nhiêu">
        <div role="radiogroup" aria-labelledby="h-chedo" style={{ display: 'grid', gap: 8 }}>
          {CHE_DO.map((c) => (
            <label
              key={c.id}
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
                border: `1px solid ${cheDo === c.id ? 'var(--mau-ngoc)' : 'var(--vien)'}`,
                borderRadius: 8,
                padding: '10px 12px',
                cursor: 'pointer',
                background: 'var(--nen-1)',
              }}
            >
              <input
                type="radio"
                name="chedo"
                checked={cheDo === c.id}
                onChange={() => setCheDo(c.id)}
                style={{ marginTop: 4 }}
              />
              <span>
                <span style={{ fontWeight: 600 }}>{c.ten}</span>
                <span style={{ display: 'block', color: 'var(--chu-2)', fontSize: 14 }}>{c.moTa}</span>
              </span>
            </label>
          ))}
        </div>
      </Muc>

      {cheDo !== 'bo_qua' && (
        <>
          <Muc id="h-hoso" ten="Hồ sơ của bạn">
            <O nhan="Tên hiển thị (tùy chọn)" giaTri={ten} onDoi={setTen} goiY="Người Chơi" dai={80} />
            <p style={{ color: 'var(--chu-3)', fontSize: 13, marginTop: 8 }}>
              Tên này chỉ để giao diện gọi bạn. Nó <strong>không</strong> tự trở thành danh xưng của Sáng Thế
              Thần, và thế giới sẽ không biết tới nó cho tới khi bạn công bố.
            </p>

            {cheDo !== 'nhanh' && (
              <>
                <O nhan="Thế giới gọi bạn là" giaTri={xungHo} onDoi={setXungHo} goiY="bạn" dai={40} />
                <O nhan="Bạn tự xưng là" giaTri={tuXung} onDoi={setTuXung} goiY="ta" dai={40} />
                <Chon
                  nhan="Ngôi kể"
                  giaTri={pov}
                  onDoi={setPov}
                  ds={[
                    { id: 'tu_dong', ten: 'Tự động — theo tầng đang chơi' },
                    { id: 'thu_nhat', ten: 'Thứ nhất' },
                    { id: 'thu_ba', ten: 'Thứ ba' },
                    { id: 'toan_canh', ten: 'Toàn cảnh' },
                  ]}
                />
                <Chon
                  nhan="Độ dày văn"
                  giaTri={doDay}
                  onDoi={setDoDay}
                  ds={[
                    { id: 'gon', ten: 'Gọn' },
                    { id: 'vua', ten: 'Vừa' },
                    { id: 'day', ten: 'Dày' },
                  ]}
                />
                <Chon
                  nhan="Lượng đối thoại"
                  giaTri={thoai}
                  onDoi={setThoai}
                  ds={[
                    { id: 'it', ten: 'Ít' },
                    { id: 'vua', ten: 'Vừa' },
                    { id: 'nhieu', ten: 'Nhiều' },
                  ]}
                />
              </>
            )}

            {cheDo === 'day_du' && (
              <>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12, fontSize: 14 }}>
                  <input
                    type="checkbox"
                    checked={giamChuyenDong}
                    onChange={(e) => setGiamChuyenDong(e.target.checked)}
                  />
                  <span style={{ color: 'var(--chu-2)' }}>Giảm chuyển động trong giao diện</span>
                </label>
                <O
                  nhan="Chủ đề muốn ẩn (cách nhau bằng dấu phẩy)"
                  giaTri={chuDeAn}
                  onDoi={setChuDeAn}
                  goiY="bạo lực với trẻ em, tra tấn"
                  dai={400}
                />
                <O
                  nhan="Ghi chú riêng — không bao giờ rời khỏi máy này"
                  giaTri={ghiChuRieng}
                  onDoi={setGhiChuRieng}
                  goiY="chỉ mình bạn đọc"
                  dai={600}
                />
              </>
            )}
          </Muc>

          {cheDo === 'day_du' && (
            <Muc id="h-danhtinh" ten="Danh tính Sáng Thế">
              <p style={{ color: 'var(--chu-3)', fontSize: 13, margin: 0 }}>
                Đây là lớp khác hẳn hồ sơ. Thế giới chỉ biết những gì bạn <strong>chủ động công bố</strong> —
                phần còn lại là chuyện riêng giữa bạn và màn hình.
              </p>
              <O nhan="Danh xưng" giaTri={danhXung} onDoi={setDanhXung} goiY="Kẻ Không Tên" dai={120} />
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6, fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={loDanhXung}
                  onChange={(e) => setLoDanhXung(e.target.checked)}
                />
                <span style={{ color: 'var(--chu-2)' }}>Công bố danh xưng cho thế giới</span>
              </label>

              <O
                nhan="Bạn hiện ra thế nào"
                giaTri={hienThan}
                onDoi={setHienThan}
                goiY="một vệt sáng không có hình"
                dai={400}
              />
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6, fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={loHinhDang}
                  onChange={(e) => setLoHinhDang(e.target.checked)}
                />
                <span style={{ color: 'var(--chu-2)' }}>Công bố hình dạng</span>
              </label>

              <O
                nhan="Điều bạn coi trọng (cách nhau bằng dấu phẩy)"
                giaTri={gtri}
                onDoi={setGtri}
                goiY="cân bằng, không can thiệp"
                dai={400}
              />
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6, fontSize: 14 }}>
                <input type="checkbox" checked={loGiaTri} onChange={(e) => setLoGiaTri(e.target.checked)} />
                <span style={{ color: 'var(--chu-2)' }}>Công bố những điều ấy</span>
              </label>
              <p style={{ color: 'var(--chu-3)', fontSize: 13, marginTop: 10 }}>
                Công bố một lời thề <strong>không</strong> làm nó ràng buộc engine. Chỉ lời thề đã được ban
                thành Luật mới ràng buộc — và ban luật là việc bạn làm trong lúc chơi.
              </p>
            </Muc>
          )}

          <Muc id="h-cua" ten="Ba cách khởi đầu">
            <div role="radiogroup" aria-labelledby="h-cua" style={{ display: 'grid', gap: 8 }}>
              {CUA.map((c) => (
                <label
                  key={c.id}
                  style={{
                    display: 'flex',
                    gap: 10,
                    alignItems: 'flex-start',
                    border: `1px solid ${cua === c.id ? 'var(--mau-ngoc)' : 'var(--vien)'}`,
                    borderRadius: 8,
                    padding: '10px 12px',
                    cursor: 'pointer',
                    background: 'var(--nen-1)',
                  }}
                >
                  <input
                    type="radio"
                    name="cua"
                    checked={cua === c.id}
                    onChange={() => setCua(c.id)}
                    style={{ marginTop: 4 }}
                  />
                  <span>
                    <span style={{ fontWeight: 600 }}>{c.ten}</span>
                    <span style={{ display: 'block', color: 'var(--chu-2)', fontSize: 14 }}>{c.moTa}</span>
                  </span>
                </label>
              ))}
            </div>

            {cua === 'mot_cau' && (
              <O
                nhan="Một câu về thế giới của bạn"
                giaTri={motCau}
                onDoi={setMotCau}
                goiY="Một thế giới nơi máu đã đổ thì không rửa được."
                dai={2_000}
              />
            )}
          </Muc>

          <Muc id="h-riengtu" ten="Dữ liệu đi đâu">
            <div
              style={{
                display: 'grid',
                gap: 12,
                gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))',
                marginTop: 10,
              }}
            >
              {(
                [
                  [
                    'Chỉ mình bạn thấy',
                    diff.riengTu,
                    'Không rời khỏi máy này. Không vào prompt, không vào file xuất mặc định.',
                  ],
                  ['Gửi cho Narrator', diff.guiNarrator, 'Đi vào prompt để model kể đúng giọng bạn muốn.'],
                  ['Thành canon', diff.thanhCanon, 'Trở thành sự thật của thế giới. Thế giới nhớ nó.'],
                ] as const
              ).map(([tieuDe, ds, giaiThich]) => (
                <div
                  key={tieuDe}
                  style={{
                    border: '1px solid var(--vien)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    background: 'var(--nen-1)',
                  }}
                >
                  <div style={{ ...nhanMuc, fontSize: 11 }}>{tieuDe}</div>
                  {ds.length === 0 ? (
                    <p style={{ margin: '6px 0 0', color: 'var(--chu-3)', fontSize: 13 }}>— không có gì —</p>
                  ) : (
                    <ul style={{ margin: '6px 0 0', paddingLeft: 16, color: 'var(--chu-2)', fontSize: 13 }}>
                      {ds.map((x, i) => (
                        <li key={i}>{x}</li>
                      ))}
                    </ul>
                  )}
                  <p style={{ margin: '8px 0 0', color: 'var(--chu-3)', fontSize: 12 }}>{giaiThich}</p>
                </div>
              ))}
            </div>
          </Muc>
        </>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 32, flexWrap: 'wrap' }}>
        <button style={nut(true)} onClick={chay}>
          {cheDo === 'bo_qua' ? 'Vào thẳng' : 'Bắt đầu'}
        </button>
        {cheDo !== 'bo_qua' && (
          <button style={nut(false)} onClick={() => setCheDo('bo_qua')}>
            Bỏ qua tất cả
          </button>
        )}
      </div>
      <p style={{ color: 'var(--chu-3)', fontSize: 13, marginTop: 14 }}>
        Mọi thứ ở đây sửa lại được sau khi bắt đầu, và sửa nó không làm thế giới đổi.
      </p>
    </main>
  );
}
