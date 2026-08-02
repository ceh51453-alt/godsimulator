/**
 * Sáu động từ dựng sẵn — Phần 1.4 [MR].
 *
 * Ba cặp: PHAN↔HOP, HIEN↔THU, DINH↔BUONG.
 * Sáu động từ là MẶC ĐỊNH DỰNG SẴN, không phải giới hạn cứng — mở rộng qua R.verb.
 *
 * Chúc phúc và trừng phạt KHÔNG phải động từ riêng: chúng là DINH với phạm vi
 * `ca_the` hoặc `huyet_mach`.
 *
 * Phase 0 khai hợp đồng + manifest. `thucThi` được nối ở Phase 1 qua HandlerCatalog
 * (`handlerId`); tới lúc đó động từ ở trạng thái `can_adapter` và không kích hoạt được.
 */
import { z } from 'zod';
import { manifestCua } from './define.js';
const ThamSoChung = z
    .object({
    mucTieuIds: z.array(z.string()).prefault([]),
    phamVi: z.enum(['vu_tru', 'coi', 'vung', 'chung_loai', 'huyet_mach', 'ca_the']).prefault('vu_tru'),
    ghiChu: z.string().max(2_000).prefault(''),
})
    .strict();
const nguon = [
    {
        id: 'phan',
        ten: 'PHÂN',
        moTa: 'Tách một bản thể, khái niệm, thần hoặc cõi thành nhiều phần.',
        coChatHopLe: ['divisible', 'conceptual', 'deity', 'realm'],
        moTaChoAi: '<%= chuThe.ten %> tách <%= mucTieu.ten %> thành những phần mang ý chí riêng.',
        capDoi: 'hop',
    },
    {
        id: 'hop',
        ten: 'HỢP',
        moTa: 'Gộp các phần đã tách. Trên ngưỡng phân kỳ thì việc gộp tự nó sinh mâu thuẫn.',
        coChatHopLe: ['divisible', 'conceptual', 'deity', 'realm'],
        moTaChoAi: '<%= chuThe.ten %> gọi những phần đã tách của <%= mucTieu.ten %> trở về một mối.',
        capDoi: 'phan',
    },
    {
        id: 'hien',
        ten: 'HIỆN',
        moTa: 'Sinh ra thần, sinh linh, quái vật, thần khí hoặc cõi.',
        coChatHopLe: ['deity', 'mortal', 'monster', 'artifact', 'realm'],
        moTaChoAi: '<%= chuThe.ten %> khiến <%= mucTieu.ten %> có mặt trong thế giới.',
        capDoi: 'thu',
    },
    {
        id: 'thu',
        ten: 'THU',
        moTa: 'Xóa một thực thể. [BB] Luôn để lại VẾT SẸO: tín đồ vẫn nhớ, đền vẫn đứng.',
        coChatHopLe: ['deity', 'mortal', 'monster', 'artifact', 'realm'],
        moTaChoAi: '<%= chuThe.ten %> thu <%= mucTieu.ten %> về, để lại một khoảng trống có hình dạng.',
        capDoi: 'hien',
    },
    {
        id: 'dinh',
        ten: 'ĐỊNH',
        moTa: 'Trói một luật, số phận, quan hệ hoặc hệ thống. Chúc phúc và trừng phạt đều là ĐỊNH.',
        coChatHopLe: ['lawful', 'soul', 'genealogical', 'institutional'],
        moTaChoAi: '<%= chuThe.ten %> định đoạt <%= mucTieu.ten %>; từ nay điều đó là thật.',
        capDoi: 'buong',
    },
    {
        id: 'buong',
        ten: 'BUÔNG',
        moTa: 'Thả một ràng buộc đã đặt. Thứ được thả không quay về nguyên trạng.',
        coChatHopLe: ['lawful', 'soul', 'genealogical', 'institutional'],
        moTaChoAi: '<%= chuThe.ten %> buông <%= mucTieu.ten %>; ràng buộc đứt, nhưng dấu vết ở lại.',
        capDoi: 'dinh',
    },
];
export const VERBS_DUNG_SAN = nguon.map((n) => ({
    id: n.id,
    ten: n.ten,
    moTa: n.moTa,
    coChatHopLe: n.coChatHopLe,
    thamSo: ThamSoChung,
    moTaChoAi: n.moTaChoAi,
    capDoi: n.capDoi,
    manifest: manifestCua('verb', {
        id: n.id,
        ten: n.ten,
        moTa: n.moTa,
        handlerId: `verb.${n.id}`,
        schemaRef: 'params.targets',
        config: {
            coChatHopLe: n.coChatHopLe,
            capDoi: n.capDoi,
            moTaChoAi: n.moTaChoAi,
        },
    }),
}));
export const VERB_IDS = VERBS_DUNG_SAN.map((v) => v.id);
