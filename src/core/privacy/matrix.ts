/**
 * Ma trận riêng tư — Phần 78.2, 78.11 [BB]; Prompt IDE "Cổng kỹ thuật Phase 0".
 *
 * "Lập ma trận dữ liệu private profile → projected persona → world-facing identity;
 *  trường riêng tư phải có test chứng minh không lọt qua từng biên."
 *
 * Đây là NGUỒN CHÂN LÝ cho test rò rỉ. Thêm trường vào PlayerProfile hoặc
 * CreatorIdentity mà quên khai ở đây → `privacy.test.ts` fail.
 */

/** Sáu biên mà dữ liệu có thể đi qua. */
export const BIEN = [
  /** WorldState, Entity, Event, Patch — tức canon. */
  'world',
  'lorebook',
  /** Chunk retrieval + candidate gửi reranker. */
  'rag',
  /** Prompt gửi model, gồm macro {{user}} và personaDescription. */
  'prompt',
  /** Preset pack xuất ra. */
  'preset',
  /** Save export chia sẻ, khi CHƯA opt-in "Kèm hồ sơ riêng tư". */
  'export_mac_dinh',
  /** Log, crash report, URL, search index, debug snapshot. */
  'log',
] as const;

export type Bien = (typeof BIEN)[number];

export const PHAN_LOAI = [
  /** Không bao giờ rời máy người dùng. Cấm ở MỌI biên. */
  'rieng_tu',
  /** Chỉ ứng dụng dùng (accessibility, ngôn ngữ UI). Cấm ở mọi biên trừ log kỹ thuật ẩn danh. */
  'ung_dung',
  /** Được phép vào ProjectedPlayerPersona → prompt/preset. Không tự vào World. */
  'chieu_duoc',
  /** Chỉ thành canon khi người chơi CÔNG BỐ (worldDisclosure). */
  'canon_neu_cong_bo',
] as const;

export type PhanLoai = (typeof PHAN_LOAI)[number];

export type MucMaTran = {
  /** Đường dẫn trong schema, ví dụ 'profile.privateNotes'. */
  readonly duongDan: string;
  readonly phanLoai: PhanLoai;
  /** Biên được phép đi qua. Rỗng = không biên nào. */
  readonly choPhep: readonly Bien[];
  readonly lyDo: string;
};

const CAM_HET: readonly Bien[] = [];

/** PlayerProfile — Phần 78.2. */
export const MA_TRAN_PROFILE: readonly MucMaTran[] = [
  {
    duongDan: 'profile.id',
    phanLoai: 'ung_dung',
    choPhep: CAM_HET,
    lyDo: 'Khóa cục bộ. World chỉ giữ con trỏ playerProfileId trong PlayerState, không giữ nội dung.',
  },
  {
    duongDan: 'profile.displayName',
    phanLoai: 'chieu_duoc',
    choPhep: ['prompt', 'preset'],
    lyDo: '[BB] Display name KHÔNG tự thành danh xưng Sáng Thế; nó chỉ là cách gọi người chơi.',
  },
  {
    duongDan: 'profile.pronouns',
    phanLoai: 'chieu_duoc',
    choPhep: ['prompt', 'preset'],
    lyDo: 'Cách xưng hô cần cho Narrator viết đúng.',
  },
  {
    duongDan: 'profile.language',
    phanLoai: 'ung_dung',
    choPhep: CAM_HET,
    lyDo: 'Ngôn ngữ UI. Narrator lấy ngôn ngữ từ cấu hình game, không từ hồ sơ.',
  },
  {
    duongDan: 'profile.addressPreference',
    phanLoai: 'chieu_duoc',
    choPhep: ['prompt'],
    lyDo: 'Chỉ đi vào prompt khi thật sự cần để xưng hô đúng.',
  },
  {
    duongDan: 'profile.accessibility',
    phanLoai: 'ung_dung',
    choPhep: CAM_HET,
    lyDo: '[BB] 78.2 — accessibility không vào World, lorebook, RAG, preset export hay model.',
  },
  {
    duongDan: 'profile.narrativePreferences',
    phanLoai: 'chieu_duoc',
    choPhep: ['prompt'],
    lyDo: '78.2 — chỉ trường narrative preference đã bật và thật sự cần mới gửi model.',
  },
  {
    duongDan: 'profile.contentPreferences',
    phanLoai: 'rieng_tu',
    choPhep: CAM_HET,
    lyDo: '[BB] Tùy chọn nội dung là dữ liệu nhạy cảm. Engine lọc trước, không kể lại cho model.',
  },
  {
    duongDan: 'profile.privateNotes',
    phanLoai: 'rieng_tu',
    choPhep: CAM_HET,
    lyDo: '[BB] 78.2 — không vào World, lorebook/RAG, preset export, prompt, hay save chia sẻ.',
  },
  {
    duongDan: 'profile.createdAt',
    phanLoai: 'ung_dung',
    choPhep: CAM_HET,
    lyDo: 'Siêu dữ liệu cục bộ.',
  },
  {
    duongDan: 'profile.updatedAt',
    phanLoai: 'ung_dung',
    choPhep: CAM_HET,
    lyDo: 'Siêu dữ liệu cục bộ.',
  },
  {
    duongDan: 'profile.version',
    phanLoai: 'ung_dung',
    choPhep: CAM_HET,
    lyDo: 'Siêu dữ liệu cục bộ.',
  },
];

/** CreatorIdentity — Phần 78.3. Canon hóa CHỈ khi worldDisclosure bật. */
export const MA_TRAN_CREATOR: readonly MucMaTran[] = [
  { duongDan: 'creator.id', phanLoai: 'ung_dung', choPhep: CAM_HET, lyDo: 'Khóa cục bộ theo save.' },
  { duongDan: 'creator.saveId', phanLoai: 'ung_dung', choPhep: CAM_HET, lyDo: 'Khóa cục bộ theo save.' },
  {
    duongDan: 'creator.title',
    phanLoai: 'canon_neu_cong_bo',
    choPhep: ['prompt', 'preset'],
    lyDo: 'Vào World chỉ khi worldDisclosure.revealTitle = true và có Event công bố.',
  },
  {
    duongDan: 'creator.aliases',
    phanLoai: 'canon_neu_cong_bo',
    choPhep: ['prompt'],
    lyDo: 'Alias thật phải được người chơi duyệt trước khi thành lore.',
  },
  {
    duongDan: 'creator.pronouns',
    phanLoai: 'chieu_duoc',
    choPhep: ['prompt', 'preset'],
    lyDo: 'Cần cho Narrator.',
  },
  {
    duongDan: 'creator.selfDescription',
    phanLoai: 'canon_neu_cong_bo',
    choPhep: CAM_HET,
    lyDo: 'Lời tự nhận. Chưa công bố thì thế giới chưa biết.',
  },
  {
    duongDan: 'creator.manifestationDescription',
    phanLoai: 'canon_neu_cong_bo',
    choPhep: CAM_HET,
    lyDo: 'Vào World chỉ khi revealForm = true.',
  },
  {
    duongDan: 'creator.sigilDescription',
    phanLoai: 'canon_neu_cong_bo',
    choPhep: CAM_HET,
    lyDo: 'Vào World chỉ khi revealForm = true.',
  },
  {
    duongDan: 'creator.voiceDescription',
    phanLoai: 'canon_neu_cong_bo',
    choPhep: CAM_HET,
    lyDo: 'Vào World chỉ khi revealForm = true.',
  },
  {
    duongDan: 'creator.values',
    phanLoai: 'canon_neu_cong_bo',
    choPhep: CAM_HET,
    lyDo: 'Vào World chỉ khi revealValues = true.',
  },
  {
    duongDan: 'creator.vows',
    phanLoai: 'canon_neu_cong_bo',
    choPhep: CAM_HET,
    lyDo: '[BB] Chỉ lời thề đã ban thành Event/Law mới ràng buộc engine.',
  },
  {
    duongDan: 'creator.taboos',
    phanLoai: 'canon_neu_cong_bo',
    choPhep: CAM_HET,
    lyDo: 'Như vows.',
  },
  {
    duongDan: 'creator.relationToWorld',
    phanLoai: 'canon_neu_cong_bo',
    choPhep: CAM_HET,
    lyDo: 'Quan hệ tự nhận với thế giới; chưa công bố thì chưa là sự thật.',
  },
  {
    duongDan: 'creator.worldDisclosure',
    phanLoai: 'ung_dung',
    choPhep: CAM_HET,
    lyDo: 'Chính sách công bố, không phải nội dung được công bố.',
  },
  { duongDan: 'creator.source', phanLoai: 'ung_dung', choPhep: CAM_HET, lyDo: 'Siêu dữ liệu.' },
  { duongDan: 'creator.version', phanLoai: 'ung_dung', choPhep: CAM_HET, lyDo: 'Siêu dữ liệu.' },
];

export const MA_TRAN: readonly MucMaTran[] = [...MA_TRAN_PROFILE, ...MA_TRAN_CREATOR];

const theoDuongDan = new Map(MA_TRAN.map((m) => [m.duongDan, m]));

export function mucMaTran(duongDan: string): MucMaTran | undefined {
  return theoDuongDan.get(duongDan);
}

export function duocPhep(duongDan: string, bien: Bien): boolean {
  const m = theoDuongDan.get(duongDan);
  if (!m) return false; // Chưa khai = cấm. Mặc định an toàn.
  return m.choPhep.includes(bien);
}

/** Trường tuyệt đối riêng tư — dùng cho test rò rỉ và cho secret stripping khi export. */
export const TRUONG_RIENG_TU: readonly string[] = MA_TRAN.filter(
  (m) => m.phanLoai === 'rieng_tu' || m.phanLoai === 'ung_dung',
).map((m) => m.duongDan);

/** Tên khóa (không phải đường dẫn) bị cấm xuất hiện trong payload gửi ra biên ngoài. */
export const KHOA_CAM_RA_NGOAI: readonly string[] = [
  'privateNotes',
  'contentPreferences',
  'sensitiveTopicsHidden',
  'fadeToBlackTopics',
  'adultContentOptIn',
  'accessibility',
  'reducedMotion',
  'highContrast',
  'textScale',
  'screenReaderHints',
  'addressPreference',
  'worldDisclosure',
];

export type ViPhamRoRi = { khoa: string; duongDan: string };

/**
 * Quét một payload sắp đi qua `bien` tìm khóa riêng tư.
 * Trả danh sách vi phạm; rỗng nghĩa là sạch.
 */
export function quetRoRi(payload: unknown, bien: Bien): ViPhamRoRi[] {
  const viPham: ViPhamRoRi[] = [];
  const seen = new WeakSet<object>();
  const camKhoa = new Set(
    KHOA_CAM_RA_NGOAI.filter((k) => {
      // addressPreference được phép vào prompt (xem ma trận).
      if (k === 'addressPreference' && bien === 'prompt') return false;
      return true;
    }),
  );

  const di = (v: unknown, p: string): void => {
    if (v === null || typeof v !== 'object') return;
    if (seen.has(v)) return;
    seen.add(v);
    if (Array.isArray(v)) {
      v.forEach((item, i) => di(item, `${p}[${i}]`));
      return;
    }
    for (const k of Object.keys(v)) {
      const duongDan = p ? `${p}.${k}` : k;
      if (camKhoa.has(k)) viPham.push({ khoa: k, duongDan });
      di((v as Record<string, unknown>)[k], duongDan);
    }
  };

  di(payload, '');
  return viPham;
}
