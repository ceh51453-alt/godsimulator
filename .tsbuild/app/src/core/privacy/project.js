import { ProjectedPlayerPersonaSchema, PronounSetSchema } from '../schema/player.js';
/**
 * Dựng `publicDescription` CHỈ từ phần người chơi đã công bố.
 * Không công bố gì → chuỗi rỗng, và thế giới gọi họ là "Kẻ Không Tên".
 */
function moTaCongKhai(creator) {
    if (!creator)
        return '';
    const d = creator.worldDisclosure;
    const phan = [];
    if (d.revealTitle && creator.title)
        phan.push(creator.title);
    if (d.revealForm && creator.manifestationDescription)
        phan.push(creator.manifestationDescription);
    if (d.revealValues && creator.values.length > 0)
        phan.push(creator.values.join(', '));
    return phan.join(' — ');
}
/**
 * [BB] Danh sách trắng. Không spread, không delete.
 * Trường không có tên ở đây thì không có đường ra.
 */
export function chieuPersona(nguon) {
    const { profile, creator, mode, currentEntityId } = nguon;
    // Ở tầng Thần/Phàm, thế giới gọi bằng tên NHÂN VẬT, không phải tên tài khoản.
    const displayName = mode === 'sang_the'
        ? (profile?.displayName ?? 'Người Chơi')
        : (nguon.entityLabel ?? profile?.displayName ?? 'Người Chơi');
    return ProjectedPlayerPersonaSchema.parse({
        displayName,
        // Ưu tiên đại từ của danh tính Sáng Thế khi đang ở tầng Sáng Thế.
        pronouns: PronounSetSchema.parse(mode === 'sang_the' ? (creator?.pronouns ?? profile?.pronouns ?? {}) : (profile?.pronouns ?? {})),
        currentMode: mode,
        currentEntityId,
        publicDescription: moTaCongKhai(creator),
    });
}
export function phanCongBo(creator) {
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
export function diffCongBo(nguon) {
    const persona = chieuPersona(nguon);
    const canon = phanCongBo(nguon.creator);
    const p = nguon.profile;
    const riengTu = [];
    if (p) {
        if (p.privateNotes)
            riengTu.push('Ghi chú riêng');
        if (p.contentPreferences.sensitiveTopicsHidden.length > 0 ||
            p.contentPreferences.fadeToBlackTopics.length > 0 ||
            p.contentPreferences.adultContentOptIn) {
            riengTu.push('Tùy chọn nội dung');
        }
        if (p.accessibility.reducedMotion ||
            p.accessibility.highContrast ||
            p.accessibility.textScale !== 1 ||
            !p.accessibility.screenReaderHints) {
            riengTu.push('Thiết lập truy cập');
        }
    }
    const c = nguon.creator;
    if (c) {
        if (!c.worldDisclosure.revealTitle && c.title)
            riengTu.push('Danh xưng (chưa công bố)');
        if (!c.worldDisclosure.revealForm && c.manifestationDescription) {
            riengTu.push('Hình tướng (chưa công bố)');
        }
        if (!c.worldDisclosure.revealValues && c.values.length > 0) {
            riengTu.push('Giá trị (chưa công bố)');
        }
        if (c.vows.length > 0)
            riengTu.push('Lời thề (chưa ban thành luật)');
    }
    const guiNarrator = [`Tên gọi: ${persona.displayName}`, `Xưng hô: ${persona.pronouns.subject}`];
    if (persona.publicDescription)
        guiNarrator.push(`Mô tả công khai: ${persona.publicDescription}`);
    const thanhCanon = [];
    if (canon.title)
        thanhCanon.push(`Thế giới sẽ biết danh xưng: ${canon.title}`);
    if (canon.manifestation)
        thanhCanon.push('Thế giới sẽ thấy hình tướng đã mô tả');
    if (canon.values.length > 0)
        thanhCanon.push(`Thế giới sẽ đồn về giá trị: ${canon.values.join(', ')}`);
    if (canon.knownRegionIds.length > 0) {
        thanhCanon.push(`${canon.knownRegionIds.length} vùng biết tới sự tồn tại này`);
    }
    return { riengTu, guiNarrator, thanhCanon };
}
