/**
 * Phép chiếu hồ sơ riêng tư → persona công khai — Phần 78.11 [BB].
 *
 * Đây là CỬA DUY NHẤT giữa PlayerProfile/CreatorIdentity và mọi thứ hướng ra ngoài:
 * prompt, preset macro `{{user}}`, personaDescription.
 *
 * [BB] Hàm này KHÔNG được nhận cả object rồi lọc bằng delete — nó dựng đối tượng mới
 * từ danh sách trắng, nên trường mới thêm vào Profile sẽ KHÔNG tự lọt ra.
 */
import type { ViewMode } from '../contracts/primitives.js';
import { ProjectedPlayerPersonaSchema, PronounSetSchema } from '../schema/player.js';
import type { CreatorIdentity, PlayerProfile, ProjectedPlayerPersona } from '../schema/player.js';

export type NguonChieu = {
  profile: PlayerProfile | null;
  creator: CreatorIdentity | null;
  mode: ViewMode;
  currentEntityId: string | null;
  /** Tên hiển thị của entity đang nhập, nếu có — đã qua WorldView. */
  entityLabel?: string | null;
};

/**
 * Dựng `publicDescription` CHỈ từ phần người chơi đã công bố.
 * Không công bố gì → chuỗi rỗng, và thế giới gọi họ là "Kẻ Không Tên".
 */
function moTaCongKhai(creator: CreatorIdentity | null): string {
  if (!creator) return '';
  const d = creator.worldDisclosure;
  const phan: string[] = [];
  if (d.revealTitle && creator.title) phan.push(creator.title);
  if (d.revealForm && creator.manifestationDescription) phan.push(creator.manifestationDescription);
  if (d.revealValues && creator.values.length > 0) phan.push(creator.values.join(', '));
  return phan.join(' — ');
}

/**
 * [BB] Danh sách trắng. Không spread, không delete.
 * Trường không có tên ở đây thì không có đường ra.
 */
export function chieuPersona(nguon: NguonChieu): ProjectedPlayerPersona {
  const { profile, creator, mode, currentEntityId } = nguon;

  // Ở tầng Thần/Phàm, thế giới gọi bằng tên NHÂN VẬT, không phải tên tài khoản.
  const displayName =
    mode === 'sang_the'
      ? (profile?.displayName ?? 'Người Chơi')
      : (nguon.entityLabel ?? profile?.displayName ?? 'Người Chơi');

  return ProjectedPlayerPersonaSchema.parse({
    displayName,
    // Ưu tiên đại từ của danh tính Sáng Thế khi đang ở tầng Sáng Thế.
    pronouns: PronounSetSchema.parse(
      mode === 'sang_the' ? (creator?.pronouns ?? profile?.pronouns ?? {}) : (profile?.pronouns ?? {}),
    ),
    currentMode: mode,
    currentEntityId,
    publicDescription: moTaCongKhai(creator),
  });
}

/**
 * Phần CreatorIdentity được phép thành canon.
 * Dùng khi sinh Event công bố danh tính — [BB] phải có diff + xác nhận trước.
 */
export type DanhTinhCongBo = {
  title: string | null;
  aliases: readonly string[];
  manifestation: string | null;
  values: readonly string[];
  knownRegionIds: readonly string[];
};

export function phanCongBo(creator: CreatorIdentity | null): DanhTinhCongBo {
  if (!creator) {
    return { title: null, aliases: [], manifestation: null, values: [], knownRegionIds: [] };
  }
  const d = creator.worldDisclosure;
  return {
    title: d.revealTitle ? creator.title : null,
    aliases: d.revealTitle ? creator.aliases : [],
    manifestation: d.revealForm ? creator.manifestationDescription : null,
    values: d.revealValues ? creator.values : [],
    knownRegionIds: d.knownRegionIds,
  };
}

/**
 * Diff riêng tư / canon cho bước xác nhận cuối của Khởi Nguyên (78.5).
 * Trả ba danh sách để UI hiện: "chỉ mình bạn thấy | gửi Narrator | thành canon".
 */
export type DiffCongBo = {
  riengTu: readonly string[];
  guiNarrator: readonly string[];
  thanhCanon: readonly string[];
};

export function diffCongBo(nguon: NguonChieu): DiffCongBo {
  const persona = chieuPersona(nguon);
  const canon = phanCongBo(nguon.creator);
  const p = nguon.profile;

  const riengTu: string[] = [];
  if (p) {
    if (p.privateNotes) riengTu.push('Ghi chú riêng');
    if (
      p.contentPreferences.sensitiveTopicsHidden.length > 0 ||
      p.contentPreferences.fadeToBlackTopics.length > 0 ||
      p.contentPreferences.adultContentOptIn
    ) {
      riengTu.push('Tùy chọn nội dung');
    }
    if (
      p.accessibility.reducedMotion ||
      p.accessibility.highContrast ||
      p.accessibility.textScale !== 1 ||
      !p.accessibility.screenReaderHints
    ) {
      riengTu.push('Thiết lập truy cập');
    }
  }
  const c = nguon.creator;
  if (c) {
    if (!c.worldDisclosure.revealTitle && c.title) riengTu.push('Danh xưng (chưa công bố)');
    if (!c.worldDisclosure.revealForm && c.manifestationDescription) {
      riengTu.push('Hình tướng (chưa công bố)');
    }
    if (!c.worldDisclosure.revealValues && c.values.length > 0) {
      riengTu.push('Giá trị (chưa công bố)');
    }
    if (c.vows.length > 0) riengTu.push('Lời thề (chưa ban thành luật)');
  }

  const guiNarrator: string[] = [`Tên gọi: ${persona.displayName}`, `Xưng hô: ${persona.pronouns.subject}`];
  if (persona.publicDescription) guiNarrator.push(`Mô tả công khai: ${persona.publicDescription}`);

  const thanhCanon: string[] = [];
  if (canon.title) thanhCanon.push(`Thế giới sẽ biết danh xưng: ${canon.title}`);
  if (canon.manifestation) thanhCanon.push('Thế giới sẽ thấy hình tướng đã mô tả');
  if (canon.values.length > 0) thanhCanon.push(`Thế giới sẽ đồn về giá trị: ${canon.values.join(', ')}`);
  if (canon.knownRegionIds.length > 0) {
    thanhCanon.push(`${canon.knownRegionIds.length} vùng biết tới sự tồn tại này`);
  }

  return { riengTu, guiNarrator, thanhCanon };
}
