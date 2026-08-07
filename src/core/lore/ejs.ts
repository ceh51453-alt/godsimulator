/**
 * EJS Lorebook an toàn.
 *
 * Lorebook là dữ liệu không tin cậy nên không được đưa vào `eval`/`Function` hay renderer EJS
 * đầy đủ. Tầng này hỗ trợ phần hữu ích cho prompt động: `<%= duong.dan %>`, `<%- duong.dan %>`,
 * comment `<%# ... %>` và macro `{{user}}`. Mọi câu lệnh JavaScript khác bị loại bỏ và báo lỗi.
 */
import type { WorldState } from '../engine/state.js';
import type { Lorebook, LorebookEntry } from './schema.js';

export type NguCanhEjsLore = Readonly<{
  world: Readonly<{ tick: number; year: number; phase: number; phaseLabel: string }>;
  user: Readonly<{ id: string; name: string; mode: string }>;
  lore: Readonly<{
    bookName: string;
    activeEntryCount: number;
    realizedNames: string;
    gravity: number;
  }>;
  entry: Readonly<{ id: string; name: string; keys: string; group: string; phase: number }>;
  /**
   * Thang kết tinh — thần thoại nguồn đã ăn vào thế giới tới đâu.
   *
   * Renderer chỉ nội suy đường dẫn nên entry không tự rẽ nhánh theo giai đoạn
   * được. Khối này để engine tính sẵn "lúc này được phép hiện ra tới đâu", còn
   * nội dung cụ thể thì entry tự khai bằng văn bản của nó. Nhờ vậy tầng này
   * không biết mình đang phục vụ thần thoại nào, và sách nào cũng dùng lại được.
   *
   * `khoaLai` quan trọng ngang `chiDan`: một chỉ dẫn không kèm điều bị cấm sẽ
   * được đọc thành "cứ kể hết", và một lorebook kể hết ở lượt đầu thì không còn
   * là lực hấp dẫn nữa — nó thành một bài tóm tắt Wikipedia.
   */
  dien: Readonly<{
    tang: number;
    nhan: string;
    tyLe: number;
    chiDan: string;
    tenGoi: string;
    khoaLai: string;
  }>;
}>;

export type KetQuaEjsLore = Readonly<{ text: string; errors: readonly string[] }>;

const CAM = new Set(['__proto__', 'prototype', 'constructor']);
const THE_EJS = /<%([_=#-]?)([\s\S]*?)%>/g;
const TRAN_KY_TU = 100_000;

export function giaiDoanLore(lorebook: Lorebook, tick: number): number {
  const tu = lorebook.tickBat ?? 0;
  return Math.max(0, Math.min(9, Math.floor(Math.max(0, tick - tu) / lorebook.nhipMoGiaiDoan)));
}

function nhanGiaiDoan(n: number): string {
  return [
    'mầm luật và dấu hiệu',
    'cõi giới và trật tự',
    'thần linh bước vào lịch sử',
    'thần tích và bảo vật',
    'sử thi phân nhánh',
  ][Math.min(4, n)] as string;
}

/**
 * Năm tầng kết tinh, và thứ tự của chúng là một lập luận.
 *
 * Dấu hiệu trước, vì một thế giới trống rỗng chỉ cảm thấy được trước khi gọi
 * tên được. Tên sau, vì đặt tên là hành vi đầu tiên biến nỗi sợ thành tôn giáo.
 * Luật thứ ba, vì chỉ khi lời thề thật sự trói được thì thần thoại mới thôi là
 * chuyện kể. Cõi giới thứ tư, vì địa lý thiêng chỉ dựng lên nổi khi đã có luật
 * giữ nó đứng. Sử thi cuối cùng, vì một sự kiện cấp thế giới kể ở lượt ba thì
 * không còn gì để mất về sau.
 *
 * Đảo thứ tự này là cách hỏng thường gặp nhất của lorebook: Zeus bước ra chào
 * ở lượt đầu, và hai mươi lượt sau không còn gì để thế giới lớn thêm.
 */
const THANG_DIEN: readonly Readonly<{ nhan: string; chiDan: string; tenGoi: string; khoaLai: string }>[] =
  Object.freeze([
    Object.freeze({
      nhan: 'tiếng vọng',
      chiDan:
        'Thần thoại nguồn CHƯA có mặt. Nó chỉ được hiện ra như dấu hiệu: một giấc mơ lặp lại, một kiêng kỵ mà ' +
        'người ta giữ trước khi giải thích được, một hướng mà lữ khách tránh đi mà không nói vì sao.',
      tenGoi:
        'Chưa tên nào là chính thức. Ai gọi tên thì gọi sai, và cái sai ấy phải được giữ nguyên trong lời kể.',
      khoaLai:
        'Cấm cho bất kỳ vị thần nào xuất hiện trực tiếp, cấm nói ra thần chức, cấm dựng đền, cấm dùng địa danh của sách.',
    }),
    Object.freeze({
      nhan: 'danh xưng',
      chiDan:
        'Thế giới bắt đầu ĐẶT TÊN cho điều nó đã sợ sẵn. Tín ngưỡng đầu tiên, tên gọi đầu tiên, tranh cãi đầu tiên ' +
        'về việc gọi thế đúng hay sai. Thần được nói tới, chưa được thấy.',
      tenGoi:
        'Tên của sách đã dùng được, nhưng còn tranh chấp: mỗi vùng một biến thể, và chưa vùng nào thắng.',
      khoaLai:
        'Cấm thần hiện thân trước mặt phàm nhân. Quy luật của sách chưa được phép cho ra kết quả đo được trong cảnh.',
    }),
    Object.freeze({
      nhan: 'luật thành',
      chiDan:
        'Quy luật của thần thoại nguồn bắt đầu THẬT SỰ CHẠY: lời thề trói được, điềm báo ứng nghiệm, thần chức cho ' +
        'ra quyền năng đo được. Thần tác động qua hệ quả, qua sứ giả và qua giấc mơ — chưa qua thân xác.',
      tenGoi: 'Tên đã ổn định ở phần lớn nơi. Biến thể còn lại thành phương ngữ, không còn là tranh chấp.',
      khoaLai: 'Bản đồ thiêng chưa dựng. Cấm sử thi cấp thế giới và cấm bảo vật định mệnh xuất hiện.',
    }),
    Object.freeze({
      nhan: 'cõi giới',
      chiDan:
        'Địa lý thiêng dựng lên trên nền luật đã đứng vững: núi thánh, cõi chết, dòng sông ranh giới. Các thế lực ' +
        'xếp thành một thần điện có tôn ti, có phe và có mâu thuẫn — tức là có chính trị.',
      tenGoi:
        'Tên của sách là tên chính thức. Nơi nào người chơi đã đặt tên khác thì tên của người chơi thắng.',
      khoaLai: 'Cấm kết thúc bất kỳ tuyến sử thi nào. Ở tầng này chúng mới được phép bắt đầu.',
    }),
    Object.freeze({
      nhan: 'sử thi',
      chiDan:
        'Thần thoại nguồn đã là lịch sử của thế giới này — nhưng là một DỊ BẢN của nó, mang vết của người chơi. ' +
        'Các sử thi chạy được, và chúng chạy theo tình thế đã có chứ không theo nguyên tác.',
      tenGoi: 'Tên đã thành Sử. Không đổi lại, kể cả khi nguyên tác gọi khác.',
      khoaLai:
        'Cấm coi nguyên tác là bản đúng. Chỗ nào ván này đi khác thì chỗ ấy MỚI là canon của thế giới này.',
    }),
  ]);

function docDuongDan(root: NguCanhEjsLore, raw: string): unknown {
  const path = raw.trim();
  if (!/^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*$/.test(path)) return undefined;
  let value: unknown = root;
  for (const part of path.split('.')) {
    if (CAM.has(part) || value === null || typeof value !== 'object') return undefined;
    value = (value as Record<string, unknown>)[part];
  }
  return value;
}

function thanhChu(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')
    return String(value);
  if (Array.isArray(value)) return value.map(thanhChu).join(', ');
  return '';
}

export function taoNguCanhEjsLore(s: WorldState, lorebook: Lorebook, entry: LorebookEntry): NguCanhEjsLore {
  const chuTheId = s.world.playerState.chuTheId;
  const chuThe = chuTheId === null ? null : s.entities.get(chuTheId);
  const tenDaThanh = new Set<string>();
  const tenEntity = new Set([...s.entities.values()].map((e) => e.ten.trim().toLowerCase()));
  for (const e of lorebook.entries) {
    const ten = (e.keys[0] ?? e.ten).trim();
    if (ten !== '' && tenEntity.has(ten.toLowerCase())) tenDaThanh.add(ten);
    if (tenDaThanh.size >= 12) break;
  }
  const phase = giaiDoanLore(lorebook, s.world.tick);
  const tang = Math.min(THANG_DIEN.length - 1, phase);
  const bac = THANG_DIEN[tang] as (typeof THANG_DIEN)[number];
  return {
    world: { tick: s.world.tick, year: s.world.year, phase, phaseLabel: nhanGiaiDoan(phase) },
    user: {
      id: chuTheId ?? 'nguoi_choi',
      name: chuThe?.ten ?? 'Người Chơi',
      mode: s.world.playerState.mode,
    },
    lore: {
      bookName: lorebook.ten,
      activeEntryCount: lorebook.entries.filter((e) => e.trangThai === 'hoat_dong').length,
      realizedNames: [...tenDaThanh].join(', ') || 'chưa có neo nào thành lịch sử',
      gravity: lorebook.lucHapDan,
    },
    entry: {
      id: entry.id,
      name: entry.ten,
      keys: entry.keys.join(', '),
      group: entry.nhomKichHoat,
      phase: entry.giaiDoanMo,
    },
    /*
     * `lucHapDan` là TRẦN chứ không phải tốc độ: một sách lực hút 40 đi hết năm
     * tầng vẫn chỉ kết tinh tới 40%, tức thế giới không bao giờ trùng khít với
     * nguyên tác. Đó là cách 35.4 "điểm hút, không phải kịch bản" thành một con
     * số mà template đọc được — và là chỗ người chơi luôn còn phần của mình.
     */
    dien: {
      tang,
      nhan: bac.nhan,
      tyLe: Math.round(((tang + 1) / THANG_DIEN.length) * lorebook.lucHapDan),
      chiDan: bac.chiDan,
      tenGoi: bac.tenGoi,
      khoaLai: bac.khoaLai,
    },
  };
}

export function renderEjsLore(template: string, context: NguCanhEjsLore): KetQuaEjsLore {
  if (template.length > TRAN_KY_TU) {
    return { text: template.slice(0, TRAN_KY_TU), errors: [`EJS Lorebook vượt trần ${TRAN_KY_TU} ký tự.`] };
  }
  const errors: string[] = [];
  const text = template
    .replace(THE_EJS, (_all, sigil: string, body: string) => {
      if (sigil === '#') return '';
      if (sigil !== '=' && sigil !== '-') {
        errors.push(
          `EJS Lorebook chỉ cho phép nội suy đường dẫn; đã bỏ câu lệnh: ${body.trim().slice(0, 80)}`,
        );
        return '';
      }
      const value = docDuongDan(context, body);
      if (value === undefined) {
        errors.push(`Biến EJS Lorebook không tồn tại hoặc không an toàn: ${body.trim()}`);
        return '';
      }
      return thanhChu(value);
    })
    .replace(/\{\{user\}\}/gi, context.user.name)
    .trim();
  return { text, errors };
}
