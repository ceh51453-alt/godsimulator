/**
 * EJS Lorebook an toàn.
 *
 * Lorebook là dữ liệu không tin cậy nên không được đưa vào `eval`/`Function` hay renderer EJS
 * đầy đủ. Tầng này hỗ trợ phần hữu ích cho prompt động: `<%= duong.dan %>`, `<%- duong.dan %>`,
 * comment `<%# ... %>` và macro `{{user}}`. Mọi câu lệnh JavaScript khác bị loại bỏ và báo lỗi.
 */
import type { WorldState } from '../engine/state.js';
import type { ConflictPolicy, Lorebook, LorebookEntry } from './schema.js';

export type QuanHeDaThan = ConflictPolicy;

export type NguCanhEjsLore = Readonly<{
  world: Readonly<{ tick: number; year: number; phase: number; phaseLabel: string }>;
  user: Readonly<{ id: string; name: string; mode: string }>;
  lore: Readonly<{
    bookName: string;
    activeEntryCount: number;
    realizedNames: string;
    /**
     * Trần kết tinh CÒN LẠI cho sách này sau khi chia với các sách khác đang
     * bật — không phải con số sách tự khai. Xem `daThan`.
     */
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
  /**
   * Thế giới đang bị kéo bởi mấy thần thoại cùng lúc.
   *
   * Bật hai sách không phải là bật hai sách. Mỗi sách mang một entry đạo diễn
   * nói "thế giới đang trở thành X", nên hai sách nghĩa là hai lời tuyên bố về
   * cùng một bầu trời — và model sẽ xử lý mâu thuẫn ấy theo cách rẻ nhất: chọn
   * đại một bên rồi im lặng bỏ bên kia, hoặc tệ hơn, sáp nhập hai thần điện làm
   * một cho hết mâu thuẫn. Cả hai cách đều xóa mất đúng thứ đáng chơi nhất của
   * một thế giới đa thần thoại, là chỗ hai hệ CHẠM nhau.
   *
   * Khối này để engine trả lời câu ấy một lần cho cả thế giới thay vì để mỗi
   * sách tự trả lời. Nó nói ba việc: thế giới đang thành cái gì (`khungCanh`),
   * các hệ quan hệ với nhau ra sao (`quanHe`, lấy từ `conflictPolicy` của chính
   * các sách), và phần trần kết tinh còn lại của sách này sau khi chia
   * (`phanCua`).
   *
   * `chuTri` giữ cho giao ước xuất hiện ĐÚNG MỘT LẦN. Ba sách cùng in một bản
   * giao ước dài là ba lần trả tiền token cho cùng một đoạn, và là đúng loại
   * lặp mà bản thân giao ước đang cấm.
   */
  daThan: Readonly<{
    soSach: number;
    tenSach: string;
    quanHe: QuanHeDaThan;
    tranChung: number;
    phanCua: number;
    chuTri: boolean;
    khungCanh: string;
    giaoUoc: string;
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

/**
 * Trần kết tinh chung của MỌI thần thoại đang bật cộng lại.
 *
 * Vì sao phải có một trần chung, và vì sao nó không phải 100.
 *
 * Trần của một sách đơn là `lucHapDan` của nó (66–72 ở ba sách dựng sẵn), và
 * phần còn thiếu so với 100 là phần của người chơi. Nếu mỗi sách giữ nguyên
 * trần ấy khi bật chung, ba sách sẽ cộng lại thành hơn hai trăm phần trăm thế
 * giới — nghĩa là không còn chỗ nào cho ván này tự đi, và cái mất đi trước
 * tiên luôn là phần của người chơi.
 *
 * 76 cao hơn trần của bất kỳ sách đơn nào, vì một thế giới ôm hai thần thoại
 * thì ĐÚNG là dày thần thoại hơn một thế giới ôm một. Nhưng nó dừng ở 76 để
 * sàn của người chơi không bao giờ mỏng hơn một phần tư thế giới, dù có bật
 * bao nhiêu sách.
 *
 * Hệ quả cố ý: bật thêm sách KHÔNG cho thêm thế giới, nó cho một thế giới
 * TRỘN hơn. Bật bốn thần thoại thì mỗi hệ chỉ tới được tầng danh xưng — và một
 * thế giới của bốn nguồn tin đồn từ bốn phương là câu trả lời trung thực cho
 * việc bật bốn sách, không phải một lỗi cần che.
 */
export const TRAN_DA_THAN = 76;

/** Hệ nào đòi hỏi nhiều nhất thì hệ ấy quyết định quan hệ chung. */
const THU_TU_QUAN_HE: readonly QuanHeDaThan[] = Object.freeze(['song_song', 'dung_hop', 'tranh_doat']);

/**
 * Các sách đang bật, kể cả sách đang render nếu nó chưa nằm trong state.
 *
 * Người gọi có thể đang render một sách vừa bật mà chưa ghi vào `s.lorebooks`
 * (đường nhập, xem trước, test). Bỏ sót nó ở đây nghĩa là một sách tự coi mình
 * không tồn tại và tự cho mình trần đầy — đúng lỗi mà cả khối này sinh ra để
 * chặn.
 */
function sachDangBat(s: WorldState, lorebook: Lorebook): readonly Lorebook[] {
  const ds = [...s.lorebooks.values()].filter((lb) => lb.bat);
  const day = ds.some((lb) => lb.id === lorebook.id) ? ds : [...ds, lorebook];
  return day.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

/**
 * Chia trần theo tỷ lệ lực hút mỗi sách tự khai.
 *
 * Chia theo tỷ lệ chứ không chia đều: một sách khai lực hút 30 là sách cố ý
 * muốn làm nền, và đẩy nó lên ngang một sách khai 72 là làm hỏng ý của người
 * viết sách. Tổng chưa chạm trần thì không ai bị cắt.
 */
function phanTran(ds: readonly Lorebook[], lorebook: Lorebook): number {
  if (ds.length <= 1) return lorebook.lucHapDan;
  const tong = ds.reduce((t, lb) => t + lb.lucHapDan, 0);
  if (tong <= TRAN_DA_THAN || tong <= 0) return lorebook.lucHapDan;
  return (lorebook.lucHapDan / tong) * TRAN_DA_THAN;
}

function quanHeCua(ds: readonly Lorebook[]): QuanHeDaThan {
  let bac = 0;
  for (const lb of ds) bac = Math.max(bac, THU_TU_QUAN_HE.indexOf(lb.conflictPolicy));
  return THU_TU_QUAN_HE[Math.max(0, bac)] as QuanHeDaThan;
}

/**
 * Câu mở của quan hệ — ba cách hai thần thoại có thể cùng tồn tại.
 *
 * Lấy từ `conflictPolicy` mà chính các sách khai, nên người viết sách quyết
 * định sách của mình chịu đứng cạnh sách khác kiểu gì. Hệ đòi hỏi nhiều nhất
 * thắng: một sách khai `tranh_doat` mà bị các sách `song_song` ép về song song
 * thì lời khai của nó thành vô nghĩa.
 */
const MO_QUAN_HE: Readonly<Record<QuanHeDaThan, string>> = Object.freeze({
  song_song:
    'SONG SONG — mỗi thần thoại đúng ở nơi tín ngưỡng của nó đứng, và hết đúng ở chỗ tín ngưỡng ấy hết. ' +
    'Chúng gặp nhau ở RÌA: biên giới, bến cảng, chiến tuyến, chợ. Không ở tâm.',
  dung_hop:
    'DUNG HỢP — các hệ đang hòa vào nhau: một vị được gọi bằng hai tên, một luật được giải thích bằng hai ' +
    'cách. Nhưng hòa phải TỐN: mỗi lần ghép hai vị làm một là mất đi một điều mà một trong hai vị vốn có, ' +
    'và phải chỉ ra được điều bị mất ấy.',
  tranh_doat:
    'TRANH ĐOẠT — các hệ đang giành cùng một bầu trời. Hệ này mạnh lên ở đâu thì hệ kia yếu đi ở đó, và ' +
    'việc ấy phải ĐO ĐƯỢC: đền đổi chủ, lễ bị bỏ, một cái tên không còn ai gọi.',
});

/**
 * Giao ước — bản đầy đủ, chỉ sách chủ trì mang.
 *
 * Bốn chỗ chạm ở mục 2 là bốn chỗ hai thần thoại KHÔNG thể cùng đúng mà không
 * ai để ý: chúng nói về cùng một vật. Một bầu trời, một cái chết cho mỗi người,
 * một hành vi bị hai luật cùng tính sổ, một dòng thời gian. Bỏ qua bốn chỗ ấy
 * là để hai thần thoại chạy song song mà không bao giờ chạm nhau — tức là chơi
 * hai ván rời trong cùng một cửa sổ.
 */
function giaoUocDaThan(ds: readonly Lorebook[], quanHe: QuanHeDaThan, tenNguoiChoi: string): string {
  return [
    `[GIAO ƯỚC ĐA THẦN THOẠI · ${ds.length} hệ đang bật: ${ds.map((lb) => lb.ten).join(' · ')}]`,
    'Không hệ nào trong số này là đích đến. Cái mọc ra từ ván này là một thế giới LAI mà không sách nào mô tả sẵn, và chỗ các hệ chạm nhau mới là phần đáng chơi nhất của nó.',
    '',
    `1. QUAN HỆ GIỮA CÁC HỆ: ${MO_QUAN_HE[quanHe]} Trong mọi trường hợp, KHÔNG sáp nhập thần điện cho hết mâu thuẫn.`,
    '2. BỐN CHỖ BẮT BUỘC PHẢI XỬ, vì ở đó các hệ nói về cùng một vật:',
    '   · TRỜI — chỉ có MỘT bầu trời trên đầu. Hoặc các cõi trên xếp thành tầng, hoặc chúng là cùng một chỗ mà mỗi bên gọi một tên, hoặc chúng ở hai phương và có khoảng giữa không thuộc về ai. Chọn một, rồi giữ.',
    '   · CÕI CHẾT — mỗi người chỉ chết một lần, nên không ai đi được tới hai cõi chết. Phải có LUẬT PHÂN LOẠI: theo dòng dõi, theo lời thề lúc sống, theo nghi thức lúc chôn, hoặc theo nơi chết. Luật ấy phải nói ra được, và phải có kẻ tranh cãi về nó.',
    '   · LUẬT — hai quy luật cùng nói về một hành vi thì hoặc CHỒNG lên nhau (cả hai cùng tính sổ, kẻ xui trả cả hai), hoặc CHIA lãnh thổ, hoặc một cái ĐÈ cái kia ở nơi tín ngưỡng của nó mạnh hơn. Không được lặng lẽ bỏ qua một trong hai.',
    '   · THỜI — mỗi hệ đếm thời gian một kiểu: vòng lặp, thời đại có kết thúc, các đời suy thoái dần. Chúng không tự khớp. Chỗ lệch giữa hai cách đếm là chỗ sinh ra dị thường, và người trong thế giới nhận ra dị thường ấy trước khi giải thích được nó.',
    '3. ĐƯỜNG GẶP NHAU là BUÔN BÁN, DI CƯ, CHIẾN TRANH và DỊCH SAI: một thủy thủ mang về tên một vị thần lạ, một trận dịch bị đổ cho thần của kẻ ngoại bang, một thầy tế thử nghi thức của hệ khác và nó ứng nghiệm một nửa. KHÔNG BAO GIỜ bằng một cuộc họp giữa hai thần điện.',
    '4. DỊCH SAI LÀ CƠ CHẾ, KHÔNG PHẢI LỖI. Người của hệ này gọi thần của hệ kia bằng cái tên gần nhất trong hệ mình, và gọi sai. Cái tên sai ấy được phép THẮNG nếu đủ người dùng nó — và khi ấy vị bị gọi sai bắt đầu mang tính chất của cái tên mới.',
    '5. MỘT LƯỢT MỘT HỆ LÀM TRỌNG TÂM. Các hệ khác nhiều nhất là một câu nền hoặc một tin đồn từ xa. Cảnh có hai thần điện cùng ra mặt chỉ được xảy ra khi chính cuộc gặp ấy là biến cố của lượt.',
    '6. KHÔNG HỆ NÀO THẮNG SỚM. Trần của mỗi hệ đã bị chia nhỏ — xem dòng [NHỊP] của từng sách. Muốn một hệ nuốt hệ khác thì phải nuốt bằng chuyện xảy ra trong ván, qua nhiều lượt, và phải trả giá thấy được.',
    /*
     * Tên người chơi được ghép THẲNG vào đây, không để lại thẻ EJS.
     *
     * `renderEjsLore()` thay thẻ bằng giá trị và KHÔNG quét lại phần vừa thay —
     * một `<%= user.name %>` nằm trong chuỗi do engine dựng sẽ lọt ra nguyên văn
     * trong lời kể. Đây là cùng một lỗi với `<user>` của SillyTavern mà tầng
     * nhập đang bắt, chỉ khác là nó đến từ phía engine.
     */
    `7. ${tenNguoiChoi} LÀ KẺ DUY NHẤT KHÔNG THUỘC HỆ NÀO. Đó vừa là lợi thế lớn nhất — đi lại được giữa các hệ, thử được nghi thức của cả hai — vừa là chỗ nguy hiểm nhất: cả hai bên đều có lý do nghi ${tenNguoiChoi} là người của bên kia.`,
  ].join('\n');
}

/** Bản rút gọn: sách không chủ trì vẫn phải biết luật, phòng khi bản đầy đủ bị cắt khỏi ngữ cảnh. */
function giaoUocGon(ds: readonly Lorebook[], chuTri: Lorebook): string {
  return (
    `[ĐA THẦN THOẠI · ${ds.length} hệ] Bản đầy đủ đi cùng “${chuTri.ten}”. Rút gọn: KHÔNG sáp nhập thần điện; ` +
    'các hệ chạm nhau ở trời, cõi chết, luật và cách đếm thời gian, và chạm qua buôn bán, di cư, chiến tranh ' +
    'và dịch sai. Mỗi lượt chỉ MỘT hệ làm trọng tâm; không hệ nào được kết tinh tới mức nuốt hệ khác.'
  );
}

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

  const dangBat = sachDangBat(s, lorebook);
  const phanCua = phanTran(dangBat, lorebook);
  const quanHe = quanHeCua(dangBat);
  // Sách id nhỏ nhất chủ trì. Bất kỳ quy tắc ổn định nào cũng được, miễn nó
  // KHÔNG phụ thuộc vào entry đang render — nếu không, cùng một thế giới sẽ có
  // lượt in giao ước và lượt không.
  const chuTri = dangBat[0] as Lorebook;
  const doi = dangBat.length > 1;
  const tenNguoiChoi = chuThe?.ten ?? 'Người Chơi';

  return {
    world: { tick: s.world.tick, year: s.world.year, phase, phaseLabel: nhanGiaiDoan(phase) },
    user: {
      id: chuTheId ?? 'nguoi_choi',
      name: tenNguoiChoi,
      mode: s.world.playerState.mode,
    },
    lore: {
      bookName: lorebook.ten,
      activeEntryCount: lorebook.entries.filter((e) => e.trangThai === 'hoat_dong').length,
      realizedNames: [...tenDaThanh].join(', ') || 'chưa có neo nào thành lịch sử',
      /*
       * Trần đã chia, không phải con số sách tự khai.
       *
       * Mọi entry của cả ba sách dựng sẵn đều in `lore.gravity` ở dòng [NHỊP],
       * và các entry điều phối lập luận trực tiếp trên nó ("phần còn thiếu là
       * phần của người chơi"). Trả về con số đã khai ở đây nghĩa là ba trăm
       * entry cùng nói dối về chỗ mà chúng thật sự được phép chiếm.
       */
      gravity: Math.round(phanCua),
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
      tyLe: Math.round(((tang + 1) / THANG_DIEN.length) * phanCua),
      chiDan: bac.chiDan,
      tenGoi: bac.tenGoi,
      khoaLai: bac.khoaLai,
    },
    daThan: {
      soSach: dangBat.length,
      tenSach: dangBat.map((lb) => lb.ten).join(' · '),
      quanHe,
      tranChung: TRAN_DA_THAN,
      phanCua: Math.round(phanCua),
      chuTri: doi && chuTri.id === lorebook.id,
      khungCanh: doi
        ? `Thế giới này đang bị kéo bởi ${dangBat.length} thần thoại cùng lúc: ${dangBat
            .map((lb) => lb.ten)
            .join(' · ')}. Không hệ nào là đích đến; cái mọc ra là một thế giới LAI. ` +
          `Phần của sách này trong đó là ${Math.round(phanCua)}% (trần chung của mọi hệ: ${TRAN_DA_THAN}%).`
        : 'Chỉ một thần thoại đang bật — mục đa thần thoại không áp dụng cho lượt này.',
      giaoUoc: !doi
        ? ''
        : chuTri.id === lorebook.id
          ? giaoUocDaThan(dangBat, quanHe, tenNguoiChoi)
          : giaoUocGon(dangBat, chuTri),
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
