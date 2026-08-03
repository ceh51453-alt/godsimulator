const TEN_TANG_TRONG_PROMPT = Object.freeze({
    LOI_BAT_BIEN: 1,
    CHAN_LY: 2,
    BOI_CANH_CHU_THE: 3,
    MACH_VA_TAM_MAT: 4,
    BAN_TIN_TRUY_HOI: 5,
    LUOT_NAY: 6,
});
function tang(prompt, so) {
    return prompt.tang.find((t) => t.so === so)?.noiDung.trim() ?? '';
}
/**
 * Chia prompt native thành lõi + slot.
 *
 * Ánh xạ dưới đây không tùy tiện: nó theo đúng ý nghĩa của từng marker trong
 * SillyTavern, chỉ khác ở chỗ nguồn là `WorldView` chứ không phải một character
 * card. `charPersonality` và `dialogueExamples` cố ý để trống — engine không có
 * "personality sheet" và không có ví dụ hội thoại duyệt sẵn, nên nội dung của
 * module gốc trong preset được giữ nguyên ở hai chỗ ấy (63.4: slot rỗng thì
 * dùng nội dung module).
 */
export function dungLoiNative(prompt, ng = {}) {
    const lichSu = ng.lichSuDaDinhDang ??
        (ng.canhGanDay ?? [])
            .slice(-8)
            .map((c) => (c.loai === 'nguoi_choi' ? `Ngươi: ${c.noiDung}` : c.noiDung))
            .join('\n\n');
    const slot = {
        worldinfobefore: tang(prompt, TEN_TANG_TRONG_PROMPT.BAN_TIN_TRUY_HOI),
        chardescription: tang(prompt, TEN_TANG_TRONG_PROMPT.BOI_CANH_CHU_THE),
        scenario: tang(prompt, TEN_TANG_TRONG_PROMPT.MACH_VA_TAM_MAT),
        chathistory: lichSu,
        personadescription: (ng.moTaPersona ?? '').trim(),
    };
    return Object.freeze({
        loiCoreHeThong: [
            tang(prompt, TEN_TANG_TRONG_PROMPT.LOI_BAT_BIEN),
            tang(prompt, TEN_TANG_TRONG_PROMPT.CHAN_LY),
        ]
            .filter((s) => s !== '')
            .join('\n\n'),
        loiLuotNay: tang(prompt, TEN_TANG_TRONG_PROMPT.LUOT_NAY),
        slot: Object.freeze(slot),
    });
}
