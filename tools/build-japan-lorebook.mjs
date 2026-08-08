/**
 * Dựng `public/lorebooks/than-thoai-nhat-ban.json` từ worldbook SillyTavern gốc.
 *
 * ── Bài toán ──
 *
 * Thiên Diễn mở ván bằng một thế giới TRỐNG. Sách này là lực hút kéo cái trống
 * ấy thành Ashihara no Nakatsukuni — nhưng kéo CHẬM, qua năm tầng kết tinh, và
 * không bao giờ kéo tới trùng khít nguyên tác vì trần kết tinh là `lucHapDan`
 * chứ không phải 100. Phần còn thiếu ấy là phần của người chơi.
 *
 * ── Ba việc script này làm, và không làm gì hơn ──
 *
 *   1. Gắn NHÓM và GIAI ĐOẠN MỞ    → chống xung đột khi bật nhiều entry
 *   2. Gắn ĐƯỜNG VÀO và CHỖ DỊ BẢN → thần thoại mọc dần, và mọc lệch được
 *   3. Bọc khối EJS ngữ cảnh động  → entry biết thế giới đang ở đâu lúc nó bắn
 *
 * Nội dung gốc của từng entry KHÔNG bị sửa một chữ. Sách là Nguồn; việc diễn
 * giải nó thuộc về lúc chơi, không thuộc về lúc dựng file.
 *
 * ── Vì sao sách này chia nhóm khác hai sách kia ──
 *
 * Quy tắc chung vẫn là "nhóm = một chủ đề", nhưng worldbook Nhật gộp bốn họ rất
 * khác nhau vào cùng nhãn `[Khái niệm]`: bảy vị thần ẩn mình thuở khai thiên,
 * bốn quy luật nền, ba nghề của người phàm đứng giữa thần và người, và mấy tập
 * thể lớn. Để cả hai mươi mốt entry ấy chung một nhóm nghĩa là Kegare và Onmyoji
 * bị MMR coi là trùng nhau — một cảnh có thầy Âm Dương sẽ đá mất luật ô uế mà
 * chính cảnh ấy đang chạy trên đó. Vì vậy `[Khái niệm]` được tách theo họ.
 *
 * Ngược lại, ba món Tam Chủng Thần Khí bị GỘP về một nhóm với hai thanh kiếm
 * thần và ngọn giáo: chúng thay thế được cho nhau trong một cảnh, và bày cả ba
 * báu vật ra một lượt là tiêu mất thứ khiến chúng đáng sợ — rằng gần như không
 * ai từng nhìn thấy chúng.
 *
 * Cách dùng:
 *   node tools/build-japan-lorebook.mjs <worldbook-gốc.json> [đích.json]
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const source = process.argv[2];
const output = resolve(process.argv[3] ?? 'public/lorebooks/than-thoai-nhat-ban.json');
if (!source)
  throw new Error('Cách dùng: node tools/build-japan-lorebook.mjs <worldbook-gốc.json> [đích.json]');

const raw = JSON.parse(readFileSync(resolve(source), 'utf8'));
const sourceEntries = Array.isArray(raw.entries) ? raw.entries : Object.values(raw.entries ?? {});

// ─────────────────────────────────────────── gỡ vỏ EJS của lần dựng trước

/**
 * Cho phép chạy lại script trên chính đầu ra của nó.
 *
 * Không có bước này, một lần chạy nhầm vào `public/lorebooks/…` sẽ chồng hai lớp
 * khối EJS lên nhau — file vẫn hợp lệ, vẫn nhập được, chỉ tốn gấp đôi token cho
 * cùng một câu và không ai phát hiện cho tới lúc đọc prompt thật.
 *
 * Dò bằng mốc cụ thể chứ không bằng "cắt tới dòng trống đầu tiên": nội dung gốc
 * của nhiều entry cũng có dòng trống, và một lần cắt nhầm sẽ ăn mất đoạn mở đầu
 * mà file vẫn trông bình thường.
 */
const MOC_HET_VO = '- Khóa: <%= dien.khoaLai %>\n\n';

function boVoCu(noiDung) {
  if (!noiDung.startsWith('<%#')) return noiDung;
  const vi = noiDung.indexOf(MOC_HET_VO);
  return vi < 0 ? noiDung : noiDung.slice(vi + MOC_HET_VO.length);
}

// ─────────────────────────────────────────── đọc nhãn của entry gốc

const nhanCua = (e) => String(e.comment ?? e.name ?? '');
const loaiCua = (e) => /^\[([^\]]+)\]/.exec(nhanCua(e))?.[1]?.trim() ?? 'Khác';

/** `[Nhân vật] Ninigi-no-Mikoto` → `Ninigi-no-Mikoto`. */
function chuDeCua(e) {
  return nhanCua(e)
    .replace(/^\[[^\]]*\]\s*/, '')
    .split('::')
    .pop()
    .split(/\s+[-–—]\s+/)[0]
    .trim();
}

const slug = (s) =>
  s
    .toLocaleLowerCase('vi')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

// ─────────────────────────────────────────── nhóm: đơn vị chống xung đột

/**
 * Nhóm quyết định `nguonId` của chunk lúc truy hồi, và MMR coi hai chunk cùng
 * `nguonId` là TRÙNG MẠNH dù chữ khác hẳn. Vì vậy nhóm phải trùng với đơn vị
 * "một chủ đề" — tức với câu hỏi "hai entry này có thay thế được cho nhau trong
 * một cảnh không", chứ không với nhãn thư mục của worldbook gốc.
 *
 * Bốn mươi tám vị thần và anh hùng mỗi vị một nhóm: Amaterasu và Susanoo không
 * phải hai mặt của cùng một thứ, và một cảnh có cả hai mà mất một là hỏng đúng
 * cảnh đáng giá nhất của sách này.
 */
const NHOM_THEO_LOAI = {
  'Bối cảnh': 'nen_vu_tru',
  'Lịch sử': 'than_tich',
  'Tổ chức': 'the_luc',
  'Chủng tộc': 'chung_toc',
  'Vũ khí': 'than_khi',
  'Vật phẩm': 'than_khi',
  'Địa danh': 'coi_gioi',
  'Thực thể': 'nguoi_choi',
};

/**
 * `[Khái niệm]` của worldbook này ôm bốn họ khác hẳn nhau — xem đầu file.
 *
 *   than_an    bảy vị tự phát sinh rồi ẩn mình; thay thế được cho nhau, vì cả
 *              bảy nói cùng một điều: trên đỉnh có kẻ không can thiệp
 *   quy_luat   bốn luật nền cộng hai khung lớn
 *   nhan_gian  cách người phàm đứng trước thần: một cảnh cần đúng một khung
 *   the_luc    tập thể có lợi ích riêng, xếp cùng Yamato và Izumo
 */
const NHOM_KHAI_NIEM = {
  Kotoamatsukami: 'than_an',
  Kamiyonanayo: 'than_an',
  'Ame no Minakanushi': 'than_an',
  Takamimusubi: 'than_an',
  Kamimusubi: 'than_an',
  Umashiashikabihikoji: 'than_an',
  'Ame no Tokotachi': 'than_an',

  Kamiumi: 'quy_luat',
  Kegare: 'quy_luat',
  Misogi: 'quy_luat',
  Kotodama: 'quy_luat',
  Kamiyo: 'quy_luat',
  'Kami Hierarchy': 'quy_luat',

  'Sanshu no Jingi': 'than_khi',

  Yokai: 'chung_toc',
  Kunitsukami: 'the_luc',
  'Yaso-gami': 'the_luc',

  Ningen: 'nhan_gian',
  Onmyodo: 'nhan_gian',
  Onmyoji: 'nhan_gian',
  Miko: 'nhan_gian',
};

/**
 * Ba nơi này là ĐẤT, không phải cõi.
 *
 * Thang cõi (trời · trần · Hoàng Tuyền · cõi ngầm · cõi vĩnh hằng) đúng là nên
 * chung một nhóm: một cảnh lấy một tầng, không bày cả thang. Nhưng đền Ise, đền
 * Izumo và núi Kurama nằm TRONG cõi trần và người chơi đi bộ tới được. Để chung
 * nhóm thì một cảnh trong đền Ise sẽ đá mất chính cái cõi mà ngôi đền đang đứng.
 */
const DAT_THIENG = new Set(['Izumo Taisha', 'Ise Jingu', 'Kurama-yama']);

function nhomCua(e) {
  const loai = loaiCua(e);
  const chuDe = chuDeCua(e);
  if (loai === 'Nhân vật') return `nv_${slug(chuDe) || slug(nhanCua(e)).slice(0, 24)}`;
  if (loai === 'Khái niệm') return NHOM_KHAI_NIEM[chuDe] ?? 'quy_luat';
  if (loai === 'Địa danh') return DAT_THIENG.has(chuDe) ? 'dat_thieng' : 'coi_gioi';
  return NHOM_THEO_LOAI[loai] ?? 'bo_sung';
}

// ─────────────────────────────────────────── giai đoạn mở

/**
 * Thần thoại Nhật có một thứ mà Hy Lạp và Ấn Độ không có: một VẾT CẮT rõ ràng
 * giữa hai thời. Kamiyo — thời thần linh — kết thúc, và sau đó là thời của
 * người, nơi thần chỉ còn hiện ra qua đền, qua bệnh, qua giấc mơ và qua yêu
 * quái. Cả một nửa danh sách nhân vật của sách này (Abe no Seimei, Yorimitsu,
 * Yoshitsune, Shuten-doji…) sống ở nửa sau ấy.
 *
 * Vì vậy thang giai đoạn ở đây gánh thêm việc giữ vết cắt: người của thời sau
 * không được đứng cạnh Izanagi trong cùng một cảnh chỉ vì cả hai đều có entry.
 * Họ mở ở giai đoạn 3, khi thế giới đã có đủ luật và đủ cõi để có một "thời
 * trước" đáng để họ nhớ về.
 *
 * Entry vẫn bắn sớm được nếu người chơi GỌI ĐÍCH DANH — `dungChiMuc()` bỏ qua
 * cổng giai đoạn khi từ khóa nằm trong câu người chơi vừa gõ. Cổng này chặn
 * việc thế giới tự dội, không chặn ý muốn của người chơi.
 */
const KHAI_NIEM_NEN = new Set(['Kegare', 'Misogi', 'Kotodama', 'Kamiumi']);
const THAN_SOM = new Set(['Izanagi', 'Izanami', 'Amaterasu', 'Susanoo', 'Tsukuyomi']);
const THOI_NGUOI = new Set([
  'Yamato Takeru',
  'Abe no Seimei',
  'Minamoto no Yorimitsu',
  'Sakata no Kintoki',
  'Watanabe no Tsuna',
  'Fujiwara no Hidesato',
  'Minamoto no Yoshitsune',
  'Benkei',
  'Sutoku Tenno',
  'Shuten-doji',
  'Tamamo-no-Mae',
  'Ootengu',
]);
const NGHE_THOI_NGUOI = new Set(['Onmyodo', 'Onmyoji']);

function giaiDoanCua(e) {
  const loai = loaiCua(e);
  const chuDe = chuDeCua(e);
  // Ba báu vật đi cùng hai thanh kiếm và ngọn giáo, nên chúng phải cùng một cổng.
  if (nhomCua(e) === 'than_khi') return 3;
  // Chỗ của người chơi phải có mặt từ lượt đầu: nó là câu trả lời cho "kẻ này là
  // ai", và câu hỏi ấy được hỏi ngay lần đầu có người trong thế giới nhìn vào.
  if (loai === 'Bối cảnh' || loai === 'Thực thể') return 0;
  if (loai === 'Khái niệm') {
    if (KHAI_NIEM_NEN.has(chuDe)) return 0;
    if (NGHE_THOI_NGUOI.has(chuDe)) return 3;
    if (chuDe === 'Miko') return 2;
    return 1;
  }
  if (loai === 'Địa danh') return DAT_THIENG.has(chuDe) ? 3 : 1;
  if (loai === 'Tổ chức' || loai === 'Chủng tộc') return 1;
  if (loai === 'Nhân vật') {
    if (THAN_SOM.has(chuDe)) return 1;
    if (THOI_NGUOI.has(chuDe)) return 3;
    return 2;
  }
  if (loai === 'Lịch sử') return 4;
  return 2;
}

// ─────────────────────────────────────────── đường vào: cách một thứ nhập thế

/**
 * Mỗi LOẠI có một cách riêng để bước vào một thế giới chưa biết nó tồn tại.
 *
 * Đây là chỗ dễ sai nhất và sai nặng nhất. Không có dòng này, model mặc định cho
 * mọi thứ nhập thế theo một kiểu duy nhất — nó MÔ TẢ. Một vị thần được mô tả thì
 * đã có mặt rồi, và thế giới mất luôn quãng đường từ "chưa ai biết" tới "ai cũng
 * biết", tức mất đúng phần mà một ván chơi về thần thoại đang lớn lên có để chơi.
 *
 * Riêng thần thoại này có một đường vào mà hai sách kia không có: THÂN XÁC MƯỢN.
 * Kami nhập vào một người đang lên đồng và nói qua miệng người ấy. Nhờ đó một vị
 * thần tham gia được vào cảnh mà vẫn chưa hề hiện thân — và cảnh sau vẫn còn chỗ
 * để chối rằng đó có thật là thần hay không.
 */
const DUONG_VAO = {
  'Nhân vật':
    'Một kami nhập thế qua ba nấc và không được nhảy cóc: MỘT CHỖ CỤ THỂ trước (đúng tảng đá ấy, đúng khúc ' +
    'sông ấy, đúng cái cây mà không ai dám chặt), rồi TÊN VÀ LỄ (có kẻ gọi đúng, có kẻ gọi sai, mỗi vùng một ' +
    'cách gọi và chưa vùng nào thắng), rồi mới tới THÂN XÁC. Còn một lối thứ tư đi vòng qua cả ba: THÂN XÁC ' +
    'MƯỢN — vị ấy nói qua miệng một người đang lên đồng, và sau đó không ai chứng minh được đó có thật là ngài ' +
    'hay không.',
  'Khái niệm':
    'Một quy luật nhập thế bằng KIÊNG KỴ trước LÝ LẼ: người ta đã giữ nó từ lâu vì đã thấy hậu quả, và rất lâu ' +
    'sau mới có kẻ phát biểu được nó thành lời — thường là phát biểu sai một nửa. Đừng giảng nó ra; cho hậu quả ' +
    'xảy ra trước, rồi để một người trong thế giới cố gọi tên hậu quả ấy.',
  'Địa danh':
    'Một nơi chốn nhập thế bằng RANH GIỚI của nó, không bằng bản mô tả: một cái cổng không được bước qua lúc ' +
    'chạng vạng, một con dốc mà đi xuống thì dễ, một khúc biển mà thuyền về thiếu người. Kẻ đã tới và quay lại ' +
    'thì quay lại KHÁC ĐI — và lời kể của kẻ ấy không khớp với lời đồn.',
  'Tổ chức':
    'Một thế lực nhập thế bằng DẤU VẾT PHỐI HỢP: hai làng cách nhau mấy ngày đường làm cùng một lễ vào cùng một ' +
    'ngày, một khoản cống nộp đều đặn không ai nhớ đã bắt đầu từ đâu, một cái tên bị đục khỏi bia. Cái tên chung ' +
    'tới sau cùng, và nó thường là tên do bên thắng đặt.',
  'Chủng tộc':
    'Một giống loài nhập thế theo thứ tự: lời đồn của kẻ sống sót → một dấu vết hoặc một cái xác → một cuộc gặp. ' +
    'Và ở thế giới này chúng còn một đường riêng: chúng ĐƯỢC SINH RA từ chỗ người ta đã bỏ mặc — từ uế khí tích ' +
    'lại, từ oán chưa ai giải, từ một món đồ dùng đủ lâu rồi bị vứt. Nghĩa là chúng đến từ lịch sử của một nơi, ' +
    'không đến từ một cuốn sách tra cứu.',
  'Vũ khí':
    'Một thần khí nhập thế bằng AI ĐƯỢC PHÉP NHÌN nó, không bằng sức công phá. Ở thế giới này thứ đáng sợ nhất ' +
    'về một bảo vật là gần như không ai từng thấy nó: nó nằm sau lớp vải trong cùng của một ngôi đền, và quyền ' +
    'lực của nó là quyền lực của thứ chỉ được kể lại.',
  'Vật phẩm':
    'Một bảo vật nhập thế bằng CÁI NÓ LÀM ĐƯỢC, không bằng cái nó là — và ở đây còn bằng chỗ nó KHÔNG ĐƯỢC MỞ ' +
    'RA. Ai cũng biết có một thứ làm được điều đó từ rất lâu trước khi có ai biết nó tên gì, nằm ở đâu, và ai ' +
    'đang giữ.',
  'Bối cảnh':
    'Nền vũ trụ hiện ra qua chỗ nó GIỚI HẠN người ta — qua điều không làm được, không qua bản mô tả. Không bao ' +
    'giờ kể nền vũ trụ bằng giọng của người biết hết.',
  'Lịch sử':
    'Đây là tài liệu NHỊP ĐỘ, không phải nội dung để kể. Dùng nó để biết cái gì chưa tới lượt; đừng đọc nó ra.',
  'Thực thể':
    'Entry này nói về chính người chơi. Nó KHÔNG cho phép trao sẵn thân phận hay quyền năng — nó chỉ nói rằng ' +
    'thế giới có một chỗ trống hình người, và chỗ trống ấy được lấp bằng việc người chơi làm chứ không bằng lời ' +
    'giới thiệu.',
};

const DUONG_VAO_MAC_DINH = 'Vào thế giới bằng hệ quả và lời đồn trước, bằng mô tả trực tiếp sau cùng.';

// ─────────────────────────────────────────── chỗ dị bản: nơi ván này lệch được

/**
 * Vì sao mỗi entry cần một dòng "chỗ dị bản".
 *
 * [BB] 35.4 — lorebook là LỰC HẤP DẪN, không phải kịch bản; [BB] 51.2 — Sử
 * thắng Nguồn. Hai câu ấy đúng ở tầng engine, nhưng model đọc một entry mô tả
 * Amaterasu là chủ Cao Thiên Nguyên sẽ mặc định điều ấy đúng mãi mãi — vì entry
 * viết ở thì hiện tại và không có gì trong đó nói rằng nó CÓ THỂ THÔI ĐÚNG.
 *
 * Dòng này là chỗ nói điều ấy, và nó phải CỤ THỂ. "Mọi thứ đều có thể đổi" là
 * một câu không ai làm gì được với nó; "vị thần cao nhất từng bỏ đi trốn trong
 * hang một lần rồi" thì đổi được cách một lượt được kể.
 */
const DI_BAN = {
  // ── chỗ của người chơi ──
  'Biến Số':
    'Nguyên tác KHÔNG có entry này — thần thoại Nhật không chừa sẵn chỗ nào cho một kẻ không thị tộc. Vì vậy đây ' +
    'là chỗ dị bản lớn nhất của cả sách, và nó phải được lấp bằng sự kiện chứ không bằng lời giới thiệu. Không ' +
    'trao trước cho <%= user.name %> dòng dõi, thần bảo hộ, phép thuật hay danh tiếng nào; mọi thứ ấy chỉ thành ' +
    'thật khi có người trong thế giới chứng kiến và thừa nhận.',

  // ── nền và thời ──
  'Thế giới quan Thần thoại Nhật Bản':
    'Vũ trụ này không do ai thiết kế: nó TỰ TÁCH RA, nhẹ bay lên, nặng chìm xuống, và thần thì tự phát sinh chứ ' +
    'không được tạo. Nghĩa là không có bản vẽ nào để viện dẫn và không có đấng nào chịu trách nhiệm cuối cùng. ' +
    'Mọi trật tự trong thế giới này đều là thứ ai đó đã dựng lên và ai đó có thể dỡ xuống.',
  'Japanese Mythology Timeline':
    'Dòng thời gian là NHỊP ĐỘ để biết cái gì chưa tới lượt, không phải lịch trình phải chạy cho hết. Mỗi biến cố ' +
    'trong đó chỉ xảy ra khi nguyên nhân của nó đã có mặt trong chính ván này — và nếu <%= user.name %> làm nguyên ' +
    'nhân ấy không bao giờ xuất hiện, biến cố ấy không xảy ra, kể cả khi nguyên tác nói nó phải xảy ra.',
  Kamiyo:
    'Thời của thần KẾT THÚC — đó là điều lạ nhất của thần thoại này. Có một ranh giới thật giữa thời thần và ' +
    'thời người, và sau ranh giới ấy kami không biến mất mà LUI VÀO: còn trong đền, trong bệnh, trong giấc mơ, ' +
    'trong yêu quái. Ở ván này ranh giới ấy chưa được vẽ. <%= user.name %> có thể đẩy nó ra xa, kéo nó tới sớm, ' +
    'hoặc là lý do khiến nó không bao giờ được vẽ.',
  Kamiumi:
    'Mọi thứ ở đây được SINH RA, kể cả từ chỗ không ai ngờ: thần sinh từ nước rửa mắt, từ máu trên chuôi kiếm, ' +
    'từ xác một nữ thần bị giết. Nghĩa là bạo lực trong thế giới này KHÔNG chỉ hủy — nó đẻ. Mỗi lần có kẻ chết ' +
    'oan, hãy hỏi cái gì vừa được sinh ra từ đó.',
  'Kami Hierarchy':
    'Trên đỉnh thần giai là những vị ẨN MÌNH và không can thiệp. Nghĩa là trong thế giới này KHÔNG CÓ tòa phúc ' +
    'thẩm: không ai ở trên để kêu, và mọi tranh chấp phải giải bằng thương lượng, bằng lời thề, bằng thi đấu ' +
    'hoặc bằng vũ lực. Thứ bậc ở đây do biến cố xếp chứ không do sắc phong, nên nó đổi được — và đã đổi rồi.',

  // ── bốn luật nền ──
  Kegare:
    'Uế KHÔNG phải tội. Nó lây, nó bám vào cả nạn nhân lẫn kẻ gây ra, và một người tử tế đứng cạnh một cái xác ' +
    'thì vẫn dơ y như kẻ giết. Đây là luật tàn nhẫn nhất của thế giới này và cũng là luật dùng được nhất: muốn ' +
    'hạ một người, không cần chứng minh họ có tội — chỉ cần khiến họ dơ trước mặt đủ đông người.',
  Misogi:
    'Thanh tẩy là THỦ TỤC, không phải sự tha thứ. Nó chạy đúng như nhau cho người vô tội và cho kẻ vừa giết ' +
    'người, miễn làm đủ nghi thức. Đó là lối về mà thần thoại Hy Lạp và Ấn Độ không cho — nhưng cũng là chỗ hở ' +
    'lớn nhất: kẻ ác biết đường tắm rửa thì sạch trước mặt thần, và thế giới phải sống chung với điều đó.',
  Kotodama:
    'Lời nói là VẬT. Gọi đúng tên là chạm vào, hứa là buộc, và nói sai thứ tự trong một nghi thức thì hỏng thật ' +
    'chứ không chỉ thất lễ — đứa con đầu của hai vị sáng thế hỏng vì nữ thần cất tiếng trước. Vì vậy trong thế ' +
    'giới này người ta giấu tên thật, và một cái tên bị kẻ khác biết là một lỗ hổng đã mở.',

  // ── thần ẩn ──
  Kotoamatsukami:
    'Ba vị đầu tiên tự phát sinh rồi ẩn ngay. Họ có quyền năng lớn nhất và dùng nó ít nhất — sự vắng mặt ấy là ' +
    'một QUYẾT ĐỊNH, không phải một chi tiết. Đừng cho họ nói, đừng cho họ hiện. Nếu ván này khiến một trong ba ' +
    'vị buộc phải ló ra, đó phải là biến cố lớn nhất của cả ván.',
  Kamiyonanayo:
    'Bảy đời thần thế là một cái THANG chứ không phải một danh sách nhân vật: mỗi đời là một nấc vũ trụ tự đặc ' +
    'lại thêm một chút. Đọc chúng như tên riêng là biến bảy nấc thành bảy NPC không có gì để làm.',
  'Ame no Minakanushi':
    'Vị chúa tể trung tâm bầu trời không có thần tích, không có đền lớn, không có chuyện kể. Một đấng tối cao mà ' +
    'không ai thờ là chỗ nứt sâu nhất trong tôn giáo của thế giới này — và <%= user.name %> là kẻ có thể là ' +
    'người đầu tiên hỏi vì sao.',
  Takamimusubi:
    'Musubi là lực KẾT — thứ khiến hai vật rời nhau thành một vật sống. Vị này hành động qua kẻ khác: ngài ra ' +
    'lệnh, ngài cử sứ giả, ngài đứng sau cả cuộc chuyển giao cõi trần mà hiếm khi có mặt. Quyền lực ở đây trông ' +
    'giống hậu cần hơn là sấm sét.',
  Kamimusubi:
    'Vị này hồi sinh kẻ đã chết — hai lần cứu Okuninushi. Nghĩa là cái chết trong thế giới này KHÔNG luôn luôn ' +
    'là hết, nhưng cửa ấy phải có kẻ mở, và kẻ ấy chọn mở cho ai.',
  Umashiashikabihikoji:
    'Vị thần này là một MẦM LAU SẬY nhú lên từ bùn. Sự sống ở đây bắt đầu bằng thứ tầm thường nhất chứ không ' +
    'bằng một mệnh lệnh — và đó là lý do mọi thứ nhỏ bé trong thế giới này đều có thể đang là thần.',
  'Ame no Tokotachi':
    'Sự kiên cố vĩnh hằng của bầu trời là thứ giữ cho cõi trên không sập. Nó không hành động, không nói, không có ' +
    'phe. Nhắc tới nó chỉ khi có cái gì đó suýt sập.',

  // ── sáng thế ──
  Izanagi:
    'Ngài không giải quyết được chuyện với vợ — ngài BỎ CHẠY rồi lấy tảng đá bịt lối. Và sổ sách của thế giới bắt ' +
    'đầu từ đó: một ngàn người chết mỗi ngày đổi một ngàn năm trăm người sinh. Đó là một CON SỐ, và con số thì di ' +
    'dời được. Ở ván này, ai chạm được vào tảng đá ấy là chạm vào tỷ lệ sinh tử của cả thế giới.',
  Izanami:
    'Bà không phải cái ác. Bà xin chồng ĐỪNG NHÌN, và ngài nhìn. Mọi thứ sau đó — lời nguyền một ngàn mạng, cửa ' +
    'Hoàng Tuyền bị bịt — bắt đầu từ một lời hứa bị phá chứ không từ lòng ác. Ở ván này chưa ai chốt được bà còn ' +
    'muốn ra hay không, và chưa ai hỏi bà.',
  Kagutsuchi:
    'Đứa con thần lửa giết mẹ ngay lúc chào đời và bị cha chém làm nhiều mảnh — mỗi mảnh thành một vị thần núi. ' +
    'Trong thế giới này, một tội ác của cha mẹ đẻ ra cả một dãy núi có tên. Hình phạt ở đây SINH RA thứ mới chứ ' +
    'không xóa thứ cũ.',
  Hiruko:
    'Đứa con đầu bị coi là hỏng và bị thả trôi ra biển — rồi quay về nhiều đời sau như một vị thần của may mắn ' +
    'và của nghề chài. Đây là luật ngầm mạnh nhất của thần thoại này: thứ bị vứt đi KHÔNG mất, nó trở lại, và nó ' +
    'trở lại dưới dạng phúc chứ không nhất thiết dưới dạng oán. <%= user.name %> vứt cái gì đi cũng nên nhớ điều đó.',

  // ── tam quý tử ──
  Amaterasu:
    'Vị thần cao nhất thiên giới đã từng bỏ đi TRỐN TRONG HANG cho tới khi cả thế giới tối lại, và phải bị lừa ' +
    'bằng một tấm gương với một trận cười mới chịu ra. Bà không toàn năng, bà chịu tổn thương, và bà có thể rút ' +
    'lui lần nữa. Quyền của bà là quyền trên cõi trời — không phải trên Hoàng Tuyền, và không phải trên cõi trần ' +
    'mà bà phải cử sứ giả xuống xin.',
  Tsukuyomi:
    'Thần mặt trăng giết nữ thần thức ăn vì thấy cách bà dọn tiệc là bẩn, và Amaterasu từ đó KHÔNG BAO GIỜ nhìn ' +
    'mặt em nữa — đó là lý do ngày và đêm không gặp nhau. Ngài là khoảng trống lớn nhất trong sách này: gần như ' +
    'không có thần tích nào. Ván này được phép lấp khoảng trống ấy, và cái được lấp vào sẽ là Sử.',
  Susanoo:
    'Ngài bị đuổi khỏi thiên giới vì phá phách và khóc đòi mẹ — rồi ở chính nơi bị đày, ngài giết được con rắn ' +
    'tám đầu và thành anh hùng, thành tổ của cả một dòng thần đất. Thần thoại này KHÔNG có đọa đày vĩnh viễn: ' +
    'kẻ bị đuổi đi có thể trở thành thứ mà nơi mới cần nhất.',

  // ── thần tự nhiên ──
  Owatatsumi:
    'Biển ở đây có CHỦ, và chủ ấy có cung điện, có con gái, có luật riêng. Ra khơi là bước vào lãnh thổ của một ' +
    'thế lực có thể thương lượng được — không phải đối mặt với thiên nhiên vô tri.',
  Oyamatsumi:
    'Thần núi là cha của cả nàng hoa anh đào lẫn nàng tảng đá, và chính ngài gửi cả hai đi làm dâu. Bi kịch lớn ' +
    'nhất về cái chết của con người bắt đầu từ một người cha gả con — không từ một cuộc chiến.',
  Ogetsuhime:
    'Bà bị giết vì cách bà làm ra thức ăn, và từ xác bà mọc lên lúa, kê, đậu, tằm. Lương thực của cả thế giới ' +
    'này đến từ một vụ giết người bị hiểu lầm. Ai ăn cơm trong thế giới này cũng đang ăn phần của một kẻ bị giết oan.',
  Shinatsuhiko:
    'Gió là hơi thở thổi tan sương mù buổi đầu — nó có công dọn chỗ cho thế giới thấy được. Ngài được nhớ tới ' +
    'đúng vào lúc bão đánh chìm thuyền địch, tức lúc thiên nhiên trông giống một quyết định.',
  Kukunochi:
    'Thần cây cối nhắc rằng mỗi cái cây lớn trong thế giới này là một kẻ có mặt. Chặt cây là một hành vi có bên ' +
    'thứ hai, dù bên ấy phản ứng chậm.',
  Kayanohime:
    'Thần đồng bằng và cỏ cây là thứ khiến một vùng đất nuôi nổi người. Bà lặng lẽ, và ai làm bà giận thì mất ' +
    'mùa — người ta nhận ra bà tồn tại qua nạn đói chứ không qua lời tuyên bố.',

  // ── thần thế ──
  'Kuni-no-Tokotachi':
    'Vị thần đất đầu tiên tự phát sinh rồi ẩn ngay, giống các vị trên trời. Cõi trần cũng có một tầng nền không ' +
    'ai chạm tới, và điều đó nghĩa là mặt đất KHÔNG thuộc về kẻ đang cai trị nó.',

  // ── thần khí ──
  'Ame-no-nuboko':
    'Cả quần đảo bắt đầu từ mấy giọt nước muối nhỏ xuống từ mũi giáo. Vật tạo ra thế giới là một CÔNG CỤ, không ' +
    'phải một vũ khí — và nó vẫn còn đó. Ai cầm được nó là cầm khả năng tạo thêm đất.',
  'Totsuka-no-Tsurugi':
    'Thanh kiếm này giết con ruột, chém đầu thần lửa, chặt rắn tám đầu — và mỗi lần chém, máu bắn ra lại đẻ thêm ' +
    'thần. Nó không phải một thanh kiếm mạnh; nó là chỗ trong thế giới nơi bạo lực biến thành sinh sản.',
  'Kusanagi-no-Tsurugi':
    'Thanh kiếm chứng minh tính chính danh của cả một triều đại được moi ra từ ĐUÔI MỘT CON QUÁI VẬT. Ngai vàng ' +
    'của thế giới này dựa trên một chiến lợi phẩm lấy từ con rắn say rượu — và nó đã từng thất lạc dưới đáy biển. ' +
    'Ai giữ nó thì có tính chính danh, kể cả khi người ấy không đáng.',
  'Yata no Kagami':
    'Tấm gương dụ được vị thần cao nhất ra khỏi hang bằng cách cho bà thấy CHÍNH BÀ. Vũ khí hiệu quả nhất trong ' +
    'thần thoại này không giết ai — nó khiến người ta tò mò. Và không ai được nhìn thẳng vào tấm gương ấy.',
  'Yasakani no Magatama':
    'Chuỗi ngọc là thứ Izanagi tháo khỏi cổ mình để TRAO QUYỀN cho Amaterasu. Quyền cai quản ở đây được trao tay ' +
    'bằng một món đồ đeo — nghĩa là nó cũng tháo ra được, và trao cho người khác được.',
  'Sanshu no Jingi':
    'Ba báu vật thiêng có sức mạnh KHÔNG nằm ở công dụng mà ở chỗ gần như không ai từng thấy chúng: chúng nằm ' +
    'sau lớp vải trong cùng, kể cả người đứng đầu cũng chỉ được nghe kể. Một cảnh mở hộp ra là một cảnh tiêu ' +
    'diệt vĩnh viễn thứ đáng giá nhất của chúng. Nếu ván này mở, phải trả giá tương xứng.',

  // ── Izumo và cuộc chuyển giao ──
  Okuninushi:
    'Ngài NHƯỢNG cõi trần chứ không thua trận — đổi lấy một ngôi đền và quyền cai quản thế giới vô hình. Biến cố ' +
    'chính trị lớn nhất của thần thoại này là một cuộc thoái vị có điều kiện, không phải một cuộc chiến. Ở ván ' +
    'này giá ấy chưa được chốt: nhượng được, từ chối được, hoãn được, hoặc đòi giá khác.',
  Sukunabikona:
    'Vị thần nhỏ xíu dạy thuốc và dạy nghề rồi BỎ ĐI sang cõi bên kia biển giữa chừng công việc. Người dựng nên ' +
    'nền văn minh của thế giới này đã đi mất, và phần ngài chưa dạy xong vẫn còn thiếu.',
  'Suseri-hime':
    'Bà giúp chồng qua các thử thách do chính CHA MÌNH đặt ra, rồi bỏ trốn cùng chồng. Trong thế giới này, lòng ' +
    'trung thành với gia tộc thua được lòng trung thành với một người — và người cha bị phản lại vẫn chúc phúc ' +
    'khi đuổi theo tới cửa.',
  'Yaso-gami':
    'Tám mươi người anh em giết em ruột hai lần vì thua trong một cuộc kén chồng. Sự đố kỵ ở đây là một THẾ LỰC ' +
    'CÓ TỔ CHỨC, không phải một tính xấu cá nhân — và họ vẫn còn đó sau khi thua.',
  Kunitsukami:
    'Thần đất là những kẻ ĐÃ Ở ĐÂY TRƯỚC. Cả câu chuyện chuyển giao cõi trần là chuyện bên đến sau lấy quyền của ' +
    'bên có trước, và bản kể lại là do bên đến sau viết. Ở ván này bên có trước còn có thể lên tiếng.',
  Takemikazuchi:
    'Ngài giải quyết chủ quyền cả cõi trần bằng một cuộc ĐẤU TAY có luật chơi được cả hai chấp nhận. Trong thế ' +
    'giới này, một cuộc thi đấu thay được cho một cuộc chiến — nếu cả hai bên đồng ý trước rằng nó thay được.',
  Takeminakata:
    'Ngài chống lại, thua, chạy tới tận Suwa rồi thề KHÔNG BAO GIỜ rời khỏi đó nữa — và được sống. Kẻ thua trong ' +
    'thần thoại này không bị xóa; hắn bị GIỚI HẠN, và lời thề giới hạn ấy có hiệu lực thật.',
  Futsunushi:
    'Ngài là thanh kiếm được thờ như một vị thần, chứ không phải vị thần cầm kiếm. Ranh giới giữa đồ vật và ' +
    'người trong thế giới này mỏng tới mức một vũ khí có thể có ý chí riêng.',
  'Ame-no-Wakahiko':
    'Sứ giả được cử xuống, cưới con gái đối phương, ở lại tám năm và bắn chết con chim đến hỏi tội — rồi chính ' +
    'mũi tên ấy được ném trả và xuyên ngực ngài. MŨI TÊN QUAY LẠI là một luật của thế giới này: phản bội trở về ' +
    'đúng con đường nó đi ra.',

  // ── xuống trần ──
  'Ninigi-no-Mikoto':
    'Cháu trời xuống cai trị cõi trần và chọn cô con gái xinh đẹp, trả lại cô chị xấu xí — nên dòng dõi của ngài ' +
    'RỰC RỠ NHƯ HOA VÀ NGẮN NHƯ HOA. Cái chết bước vào loài người qua một lần chê bai nhan sắc. Ở ván này lựa ' +
    'chọn ấy chưa đóng lại.',
  Sarutahiko:
    'Vị thần đất khổng lồ chặn đường đoàn xuống trần hóa ra là tới để DẪN ĐƯỜNG. Kẻ đứng ở ngã ba đường trông ' +
    'đáng sợ nhất trong thế giới này thường là kẻ đang đợi để giúp — và ai đối xử với hắn thế nào là chuyện của ' +
    'người đi tới.',
  'Konohanasakuya-hime':
    'Bà bị nghi ngờ về đứa con trong bụng nên tự nhốt mình trong buồng rồi CHÂM LỬA để chứng minh — và sinh con ' +
    'giữa đám cháy. Cách chứng minh sự trong sạch ở thế giới này là đặt cược mạng sống, và bà là người đề nghị ' +
    'chứ không phải người bị ép.',
  'Iwanaga-hime':
    'Nàng tảng đá bị trả về vì xấu, và cùng với nàng thì sự trường tồn bị trả lại. Mọi cái chết trong thế giới ' +
    'này đều truy được về một lần ai đó chọn cái đẹp thay vì cái bền. Nàng vẫn còn đó, và vẫn còn có thể được ' +
    'nhận lại.',
  Yatagarasu:
    'Con quạ ba chân dẫn đường cho cuộc đông chinh. Nó là dấu hiệu rằng trời đang ĐỒNG Ý — và một dấu hiệu như ' +
    'thế thì cũng có thể bị làm giả, hoặc bị hiểu sai, hoặc rút lại.',

  // ── quái vật và oán linh ──
  'Yamata no Orochi':
    'Con rắn tám đầu bị hạ bằng RƯỢU, không bằng sức. Và nó đòi cống nạp mỗi năm một cô gái — tức nó là một thỏa ' +
    'thuận mà cả làng đã chấp nhận từ lâu. Quái vật ở thế giới này thắng được bằng chuẩn bị và mưu, và thứ nuôi ' +
    'chúng lớn là sự cam chịu của người.',
  'Shuten-doji':
    'Quỷ vương cũng bị hạ bằng rượu, đúng công thức đã dùng với con rắn — và trước khi thành quỷ, hắn là một ' +
    'thiếu niên đẹp bị người đời xua đuổi. Quỷ ở đây được LÀM RA từ cách người ta đối xử, và cái đầu bị chặt rồi ' +
    'vẫn cắn được.',
  'Tamamo-no-Mae':
    'Con hồ ly chín đuôi đội lốt sủng phi và suýt lật cả triều đình — bị lột mặt nạ bởi một thầy Âm Dương, không ' +
    'bởi một chiến binh. Ở thế giới này, thứ nguy hiểm nhất không xông vào cổng; nó được mời vào và ngồi cạnh ' +
    'người có quyền.',
  Ootengu:
    'Đại Thiên Cẩu vừa là yêu quái vừa là SƯ PHỤ: hắn dạy kiếm cho những kẻ sau này thành anh hùng. Thứ đáng sợ ' +
    'trong núi cũng là thứ dạy nghề, và giá của bài học là lòng kiêu mà học trò mang về.',
  'Sutoku Tenno':
    'Một Thiên Hoàng bị lưu đày, chép kinh bằng máu, rồi tự nguyền mình thành ĐẠI MA VƯƠNG — và cả nước tin rằng ' +
    'mọi tai họa sau đó là do ngài. Đây là bằng chứng đứng sẵn trong sách rằng một CON NGƯỜI trở thành thần được, ' +
    'và đường ngắn nhất là chết trong oán hận. Cánh cửa ấy mở cho cả <%= user.name %>.',

  // ── thời của người ──
  Ningen:
    'Loài người ở đây KHÔNG được nặn ra bởi ai cả — họ tự mọc lên sau khi thần dọn xong chỗ. Nghĩa là không vị ' +
    'thần nào SỞ HỮU con người, không ai có quyền đòi hỏi tuyệt đối, và lòng tin của người là thứ phải giành. ' +
    'Đây là chỗ trống lớn nhất mà <%= user.name %> bước vào được.',
  Yokai:
    'Yêu quái phần lớn KHÔNG tới từ đâu xa: chúng ngưng tụ từ uế khí không ai tẩy, từ oán không ai giải, từ đồ ' +
    'vật dùng đủ lâu rồi bị vứt. Thế giới này tự sinh ra quái vật từ chỗ nó bỏ bê — nên mọi thứ <%= user.name %> ' +
    'để lại phía sau đều là một diễn viên của lượt sau.',
  Oni:
    'Quỷ không phải một loài ác bẩm sinh: người hóa quỷ được, và quỷ giữ lời hứa được. Gọi tên giống loài không ' +
    'nói lên phẩm chất của một cá thể — quy tắc này áp cho cả bảng chúng sinh của thần thoại này.',
  Kitsune:
    'Hồ ly vừa là sứ giả của thần lúa gạo vừa là kẻ lừa người tan cửa nát nhà — CÙNG MỘT loài, hai vai. Ở thế ' +
    'giới này thứ thiêng liêng nhất và thứ nguy hiểm nhất thường mang chung một bộ mặt, và phân biệt được hay ' +
    'không là việc của người đứng trước nó.',
  Tengu:
    'Thiên Cẩu trừng phạt kẻ kiêu ngạo — trong khi chính chúng là hiện thân của kiêu ngạo. Kẻ giữ luật trong thế ' +
    'giới này thường phạm đúng cái luật nó giữ, và điều đó không làm nó thôi có quyền.',
  Tsukumogami:
    'Một món đồ dùng đủ lâu rồi bị vứt sẽ TỈNH DẬY và đi tìm chủ cũ. Đây là luật khiến thế giới này không có ' +
    'thứ gì thật sự bỏ đi được: mọi thứ <%= user.name %> từng dùng đều đang đếm ngược.',
  Kappa:
    'Thủy quái mạnh hơn người nhưng thua một cái CÚI CHÀO — nó cúi lại và nước trên đầu đổ ra. Trong thế giới ' +
    'này, lễ nghi là một cơ chế vật lý chứ không phải phép lịch sự, và kẻ mạnh nhất vẫn bị luật ấy trói.',
  Ryu:
    'Rồng ở đây là thần NƯỚC và thời tiết, không phải thú giữ kho báu: nó quyết định mùa màng và lũ lụt, nên nó ' +
    'là một thế lực để cầu và để thương lượng, không phải một con quái để chém.',
  'Koma-inu':
    'Đôi linh thú canh cổng đền — một con há miệng, một con ngậm miệng. Chúng đánh dấu chỗ RANH GIỚI, và bước ' +
    'qua giữa chúng là bước vào lãnh thổ có luật khác. Ai bước qua mà không biết mình vừa đổi luật thì phạm luật.',
  Baku:
    'Linh thú ăn ác mộng — nhưng gọi nó quá nhiều thì nó ăn luôn cả hy vọng. Mọi cứu trợ trong thế giới này đều ' +
    'có liều lượng, và quá liều thì thành mất mát.',
  Onmyodo:
    'Âm Dương Đạo là KỸ THUẬT: có sách, có lịch, có công thức, và nó tác động được lên cả kami. Nghĩa là trong ' +
    'thế giới này thần linh không nằm ngoài tầm với của một người phàm chịu học — đây là cửa lớn nhất mở ra cho ' +
    '<%= user.name %>.',
  Onmyoji:
    'Thầy Âm Dương là công chức: họ làm việc cho triều đình, có cấp bậc, có đối thủ trong nghề. Chuyện siêu nhiên ' +
    'ở đây đi qua thủ tục hành chính, và điều đó khiến nó vừa buồn cười vừa đáng sợ hơn.',
  Miko:
    'Vu nữ là chỗ kami MƯỢN MIỆNG để nói. Nghĩa là một vị thần tham gia được vào cảnh mà không cần hiện thân — ' +
    'và cũng nghĩa là không ai chứng minh được lời vừa nói ra là của thần hay của người. Mọi lời sấm trong thế ' +
    'giới này đều đi kèm câu hỏi ấy.',
  'Abe no Seimei':
    'Ông là thầy Âm Dương mạnh nhất và tương truyền là con của một con hồ ly. Kẻ giữ trật tự của triều đình mang ' +
    'nửa dòng máu của thứ mà trật tự ấy phải trấn áp — và ông vẫn được trọng dụng, vì ông có ÍCH.',
  'Minamoto no Yorimitsu':
    'Ngài diệt quỷ bằng đội hình bốn tướng và bằng mưu, không bằng một mình. Anh hùng thời người là một TỔ CHỨC ' +
    'nhỏ có kỷ luật, và đó là khác biệt rõ nhất giữa thời người với thời thần.',
  'Sakata no Kintoki':
    'Đứa trẻ lớn lên trong núi, vật nhau với gấu, rồi được tuyển vào đội diệt quỷ. Ở thế giới này sức mạnh hoang ' +
    'dã KHÔNG cần dòng dõi để được dùng — nó chỉ cần có người nhìn thấy.',
  'Watanabe no Tsuna':
    'Ngài chặt được cánh tay quỷ, rồi để mất nó vì con quỷ trở lại dưới lốt BÀ CÔ ruột của ngài. Chiến thắng ' +
    'trong thế giới này không giữ được bằng vũ lực mà bằng cảnh giác — và điểm yếu luôn là người mình thương.',
  'Fujiwara no Hidesato':
    'Ngài bắn chết con rết khổng lồ bằng mũi tên tẩm NƯỚC BỌT, sau khi hai mũi tên thường bật ra. Cách thắng ở ' +
    'thế giới này thường là biết một chi tiết nhỏ, không phải mạnh hơn.',
  'Minamoto no Yoshitsune':
    'Ngài học kiếm với Thiên Cẩu trên núi, thắng mọi trận, rồi bị chính anh ruột mình truy sát tới chết. Trong ' +
    'thế giới này thắng trận KHÔNG bảo vệ được ai — cái giết ngài là chính trị, không phải kẻ thù.',
  Benkei:
    'Tăng binh thu kiếm của chín trăm chín mươi chín người, thua người thứ một nghìn, rồi trung thành tới lúc ' +
    'chết đứng chặn cầu. Lòng trung ở đây bắt đầu bằng một thất bại, và kết thúc bằng một cái xác vẫn đứng.',
  'Yamato Takeru':
    'Ngài giết giặc bằng cách CẢI TRANG THÀNH CON GÁI, được cô ruột đưa cho thanh kiếm thần, rồi chết vì kiêu — ' +
    'vì để thanh kiếm ấy lại mà đi tay không. Anh hùng lớn nhất của triều đình là kẻ bị chính cha mình sợ và đẩy ' +
    'đi hết trận này tới trận khác.',

  // ── thế lực ──
  Yamato:
    'Yamato là bên VIẾT SỬ. Mọi entry trong sách này đều là bản kể của họ, kể cả những entry nói về kẻ thù của ' +
    'họ. Ở ván này bản kể ấy đang được viết chứ chưa xong — và <%= user.name %> có thể là lý do nó được viết khác.',
  Izumo:
    'Izumo là bên THUA nhưng không bị xóa: họ đổi quyền cai trị lấy ngôi đền lớn nhất nước và quyền cai quản ' +
    'thế giới vô hình. Đây là bằng chứng rằng trong thế giới này, thua vẫn thương lượng được một cái giá — nếu ' +
    'bên thắng cần cái mà bên thua đang giữ.',
  Kumaso:
    'Người Kumaso chỉ được biết tới qua lời của kẻ đi chinh phạt họ, và họ bị giết bởi một hoàng tử cải trang. ' +
    'Phía của họ trong câu chuyện còn TRỐNG, và ván này được phép điền vào.',
  Emishi:
    'Người Emishi bị gọi là man di trong chính sử của bên thắng, dù họ có tổ chức, có chiến thuật, có thần của ' +
    'riêng mình. Nhãn "man di" ở thế giới này là một VŨ KHÍ chính trị, không phải một mô tả.',

  // ── cõi ──
  Takamagahara:
    'Cõi trời ở đây có ruộng, có sông, có nhà dệt và có kẻ phá hoại mùa màng — nó là một LÀNG NÔNG NGHIỆP chứ ' +
    'không phải một cung điện cẩm thạch. Đừng kể nó bằng giọng huy hoàng: kể nó bằng giọng của một cộng đồng có ' +
    'việc phải làm và có hàng xóm khó chịu.',
  Yomi:
    'Cõi chết bị bịt bằng một TẢNG ĐÁ, không bằng một cánh cổng có người canh. Đá thì dịch được. Và luật của nơi ' +
    'ấy đơn giản tới mức tàn nhẫn: ăn đồ ăn ở đó là thuộc về đó.',
  'Ashihara no Nakatsukuni':
    'Cõi trần là đất TRANH CHẤP giữa trời và cõi ngầm, và nó đã đổi chủ một lần rồi. Không bên nào sở hữu nó ' +
    'vĩnh viễn — kể cả bên đang giữ.',
  Onogoro:
    'Hòn đảo đầu tiên tự đông lại từ mấy giọt nước nhỏ xuống. Toàn bộ thế giới bắt đầu từ một hành động NHỎ và ' +
    'gần như tình cờ — không từ một mệnh lệnh long trọng.',
  'Ne-no-Katasu-Kuni':
    'Cõi ngầm của Susanoo là nơi người ta ĐI XUỐNG ĐỂ LẤY SỨC MẠNH rồi quay lên, không phải nơi để chết. Nó ' +
    'khác Hoàng Tuyền ở đúng chỗ ấy, và ai lẫn hai nơi này là lẫn giữa một chuyến đi và một cái chết.',
  'Tokoyo no Kuni':
    'Cõi vĩnh hằng nằm bên kia biển và kẻ đi rồi thì gần như không về. Nó là lối THOÁT khỏi ván cờ — vừa là phần ' +
    'thưởng cao nhất vừa là nước đi từ bỏ tất cả những gì còn lại ở đây.',
  'Yomotsu Hirasaka':
    'Con dốc nối cõi sống với cõi chết là một chỗ CÓ THẬT trên mặt đất — đi tới được, đứng ở đó cãi nhau được. ' +
    'Lời nguyền một ngàn mạng và lời hứa một ngàn năm trăm mạng được thốt ra ở đúng chỗ ấy, và cuộc cãi ấy chưa ' +
    'bao giờ được xử.',
  'Ame-no-ukihashi':
    'Cây cầu nổi nối trời với đất — và nó KHÔNG còn dùng chung được nữa. Mỗi lần trời muốn xuống trần đều phải ' +
    'tốn một chuyện; sự đứt gãy ấy là lý do thời thần kết thúc được.',
  'Ryugu-jo':
    'Long Cung dưới đáy biển chạy theo NHỊP THỜI GIAN KHÁC: ba ngày dưới ấy là trăm năm trên bờ. Ai xuống đó ' +
    'cũng đang đánh cược thứ mình còn lại trên bờ, và không ai nói trước cho họ.',
  'Ame-no-Iwato':
    'Cái hang này là bằng chứng rằng MẶT TRỜI CÓ THỂ BỎ ĐI. Nó không phải một địa danh du lịch — nó là chỗ thế ' +
    'giới suýt kết thúc, và cửa hang vẫn còn đó.',
  'Izumo Taisha':
    'Ngôi đền này là CÁI GIÁ của cuộc chuyển giao cõi trần — nó tồn tại vì một bên chịu lui. Và mỗi năm một ' +
    'tháng, thần khắp nước bỏ đền của mình về đây họp; tháng ấy cả nước KHÔNG CÓ THẦN. Chuyện gì xảy ra trong ' +
    'tháng ấy là chỗ ván này còn trống.',
  'Ise Jingu':
    'Ngôi đền cao quý nhất được DỠ RA XÂY LẠI đều đặn, và bản mới không kém thiêng hơn bản cũ. Sự vĩnh cửu ở ' +
    'thế giới này đạt được bằng cách thay mới liên tục, không bằng cách giữ nguyên — điều ấy áp cho cả triều ' +
    'đại, cả dòng dõi và cả lời thề.',
  'Kurama-yama':
    'Ngọn núi này là chỗ ranh giới MỎNG: yêu quái dạy nghề cho người ở đó, và người xuống núi mang theo thứ ' +
    'không phải của người. Ai học được trên núi ấy đều nợ một món mà chưa biết mình nợ.',
};

/**
 * Mười vị của Thần Thế Thất Đại đi theo cặp và gần như không có thần tích riêng.
 * Cho mỗi vị một dòng dị bản riêng là bịa ra mười câu chuyện mà sách không có;
 * cho cả mười một dòng chung thì đúng với cái họ là — những nấc thang, không
 * phải những nhân vật.
 */
const CAP_THAN_THE = new Set([
  'Toyokumono',
  'Uhijini',
  'Suhijini',
  'Tsunugui',
  'Ikugui',
  'Otonoji',
  'Otonobe',
  'Omodaru',
  'Ayakashikone',
]);

const DI_BAN_CAP =
  'Vị này là một NẤC của vũ trụ đang tự đặc lại, không phải một nhân vật có việc để làm. Họ đi theo cặp nam nữ ' +
  'và gần như không có thần tích. Dùng họ để đo thế giới đã cứng lại tới đâu — bùn, cát, mầm, hình dạng, dung ' +
  'mạo — chứ đừng cho họ bước vào cảnh mà nói. Nếu ván này khiến một trong số họ phải mở miệng, đó là chuyện ' +
  'chưa từng có và phải được kể như chuyện chưa từng có.';

const DI_BAN_MAC_DINH =
  'Nguyên tác cho nhân vật/sự vật này một kết cục. Kết cục ấy là ĐIỂM HÚT, không phải hợp đồng: nếu ván này đi ' +
  'khác thì chỗ đi khác MỚI là sự thật của thế giới, còn nguyên tác lùi xuống thành "bản mà người ta hay kể".';

const diBanCua = (e) => {
  const chuDe = chuDeCua(e);
  if (DI_BAN[chuDe] !== undefined) return DI_BAN[chuDe];
  if (CAP_THAN_THE.has(chuDe)) return DI_BAN_CAP;
  return DI_BAN_MAC_DINH;
};
const duongVaoCua = (e) => DUONG_VAO[loaiCua(e)] ?? DUONG_VAO_MAC_DINH;

// ─────────────────────────────────────────── khối EJS gắn đầu mỗi entry

/**
 * Khối này cố tình NGẮN. Mọi quy tắc bất biến nằm ở bốn entry điều phối
 * `lop: 'loi'` — chúng luôn có mặt, nên nhắc lại ở đây là trả tiền token cho
 * cùng một câu một trăm lẻ hai lần.
 */
function khoiDau(entry, nhom, giaiDoan) {
  return `${[
    '<%# EJS Lorebook an toàn: chỉ nội suy dữ liệu engine đã chiếu, không chạy câu lệnh nào. %>',
    '[NHỊP] <%= lore.bookName %> · lực hút <%= lore.gravity %>/100 · giai đoạn <%= world.phase %> (<%= world.phaseLabel %>) · năm <%= world.year %> · Biến Số: <%= user.name %>',
    `[ENTRY] <%= entry.name %> · nhóm ${nhom} · mở tự nhiên từ giai đoạn ${giaiDoan} · cả nhóm chỉ được MỘT trọng tâm mỗi lượt`,
    '[KẾT TINH · tầng <%= dien.tang %> "<%= dien.nhan %>" · <%= dien.tyLe %>%]',
    `- Đường vào: ${duongVaoCua(entry)}`,
    `- Chỗ dị bản: ${diBanCua(entry)}`,
    '- Mức cho phép: <%= dien.chiDan %>',
    '- Tên gọi: <%= dien.tenGoi %>',
    '- Khóa: <%= dien.khoaLai %>',
    '',
  ].join('\n')}\n`;
}

// ─────────────────────────────────────────── bốn entry điều phối

const NEN = '<%# Entry điều phối: luôn đi cùng sách, không tự tạo thực thể nào. %>';

const DIEU_PHOI = [
  {
    uid: 'japan.director',
    comment: '[Bối cảnh] Đạo diễn — thế giới kết tinh dần thành Ashihara no Nakatsukuni',
    key: ['Thần thoại Nhật Bản', 'Ashihara no Nakatsukuni', 'kami', 'kết tinh', 'Biến Số'],
    group: 'dieu_phoi',
    phase: 0,
    order: 0,
    content: `${NEN}
[ĐẠO DIỄN · THẾ GIỚI ĐANG TRỞ THÀNH THẦN THOẠI NHẬT BẢN]
Giai đoạn <%= world.phase %> — <%= world.phaseLabel %>. Tầng kết tinh <%= dien.tang %> "<%= dien.nhan %>", mức <%= dien.tyLe %>%. Người chơi: <%= user.name %>.
Neo đã thành lịch sử: <%= lore.realizedNames %>.

[ĐA THẦN THOẠI] <%= daThan.khungCanh %>
<%= daThan.giaoUoc %>

1. Thế giới KHÔNG bắt đầu là Ashihara no Nakatsukuni. Nó bắt đầu trống và kết tinh dần qua năm tầng: dấu hiệu → danh xưng → luật → cõi giới → sử thi. Đích đến là một DỊ BẢN của thần thoại Nhật Bản, không phải bản sao của nó. Khi khối ĐA THẦN THOẠI ở trên báo có nhiều hơn một hệ đang bật, câu này đọc thành: thần thoại Nhật là MỘT trong các lực hút của thế giới, không phải đích đến duy nhất của nó.
2. Mức kết tinh <%= dien.tyLe %>% là TRẦN, không phải chỉ tiêu. <%= dien.chiDan %>
3. Không đảo thứ tự năm tầng. Kami ở thần thoại này nhập thế bằng MỘT CHỖ CỤ THỂ trước khi có tên: đúng tảng đá ấy, đúng khúc sông ấy, đúng cái cây không ai dám chặt. Một vị thần bước ra tự giới thiệu ở lượt đầu là tiêu mất hai mươi lượt còn lại.
4. Mỗi lượt gieo nhiều nhất MỘT yếu tố mới của sách. Thần thoại này có tám triệu kami và cám dỗ lớn nhất của nó là gọi tên hàng loạt. Ưu tiên phát triển thứ đã gieo hơn là gọi thêm tên mới; thế giới lớn lên bằng chiều sâu, không bằng danh sách.
5. HAI THỜI, và không trộn. Kamiyo — thời thần linh — là thời của Izanagi, Amaterasu, Okuninushi. Thời của người là thời của thầy Âm Dương, của tướng diệt quỷ, của đền và của oán linh. Người của thời sau chỉ bước vào cảnh khi thế giới đã đủ luật và đủ cõi để có một "thời trước" đáng nhớ về, và khi đó thần chỉ còn hiện ra qua đền, qua bệnh, qua giấc mơ và qua yêu quái.
6. Trần kết tinh không bao giờ chạm 100 vì lực hút chỉ có <%= lore.gravity %>/100. Phần còn thiếu ấy KHÔNG phải thiếu sót — nó là phần của <%= user.name %>, và phải được lấp bằng chuyện xảy ra trong ván chứ không bằng nguyên tác.
7. <%= user.name %> ở BÊN TRONG thần thoại này, không phải khán giả. Việc <%= user.name %> làm quyết định thần thoại kết tinh theo hướng nào — nhưng KHÔNG được tự trao cho <%= user.name %> thân phận, thị tộc, thần bảo hộ, huyết thống hay quyền năng nào. Mọi thứ phải giành được qua sự kiện trong game.
8. Các kami và nhân vật giữ động cơ riêng. Không ai tự yêu, tự phục tùng hay tự trao đặc quyền cho <%= user.name %> chỉ vì đó là người chơi. Kami ở đây không toàn năng, không toàn thiện, và giận dai.
9. Cuộc chuyển giao cõi trần, việc mặt trời trốn vào hang, và sự kết thúc của thời thần KHÔNG phải kịch bản phải chạy cho hết. Chúng chỉ khởi động khi nguyên nhân của chúng đã có mặt trong chính ván này, và <%= user.name %> phải kịp can thiệp trước khi chúng không còn ngăn được nữa.
10. Khi sách bị TẮT, không dùng bất kỳ entry, quy luật, lời tiên tri hay tên gọi nào của sách để dẫn dắt lượt mới. Những gì đã xảy ra vẫn là lịch sử của thế giới; những gì sách mới chỉ hứa thì thôi.`,
  },
  {
    uid: 'japan.chongxungdot',
    comment: '[Bối cảnh] Quy tắc chống xung đột khi nhiều entry cùng bật',
    key: ['xung đột entry', 'nhiều entry', 'trọng tâm cảnh', 'tắt sách'],
    group: 'dieu_phoi',
    phase: 0,
    order: 1,
    content: `${NEN}
[CHỐNG XUNG ĐỘT · áp cho MỌI entry của sách này]
Sách đang có <%= lore.activeEntryCount %> entry hoạt động. Nhiều entry cùng vào một cảnh là chuyện bình thường và KHÔNG được xử lý bằng cách nói hết.

1. MỘT TRỌNG TÂM MỘT LƯỢT. Trong các entry cùng nhóm, chỉ một entry được làm trọng tâm; các entry còn lại nhiều nhất là một câu nền. Thang cõi là một nhóm — một cảnh lấy một tầng, không lấy cả thang. Ba báu vật thiêng là một nhóm — một cảnh nhắc một món, không bày cả ba.
2. ENTRY LÀ ỨNG VIÊN, KHÔNG PHẢI DÀN Ý. Không có nghĩa vụ dùng hết những gì được đưa vào ngữ cảnh. Một entry không dùng tới thì im — không cần nhắc để chứng tỏ đã đọc.
3. SỬ THẮNG NGUỒN. Nếu entry nói khác điều đã xảy ra trong ván, điều đã xảy ra thắng. Không sửa lại quá khứ và không giả vờ entry đã tiên đoán đúng.
4. HAI ENTRY MÂU THUẪN NHAU thì kể mâu thuẫn ấy như hai truyền thống của hai vùng — thần thoại này vốn có Kojiki một đằng, Nihon Shoki một nẻo, Izumo kể khác Yamato, và sự vênh ấy là ĐẶC ĐIỂM chứ không phải lỗi. Đừng chọn bừa một bên rồi giấu bên kia.
5. TRÙNG LẶP thì gộp, không nói hai lần bằng hai giọng.
6. KHÔNG TRỘN HAI THỜI trong một cảnh. Nếu một entry của thời thần và một entry của thời người cùng được đưa vào, chọn một; muốn để cả hai thì phải nói rõ cái sau đang NHỚ VỀ hoặc đang thờ cái trước, chứ không cho chúng đứng cạnh nhau như người cùng thời.
7. Entry được người chơi GỌI ĐÍCH DANH luôn thắng entry do engine gợi ý, kể cả khi nó chưa tới giai đoạn mở.
8. Entry không đủ chỗ trong lượt này KHÔNG mất — nó là ứng viên của lượt sau. Không dồn nội dung của nó vào một câu tóm tắt cho kịp.
9. ENTRY KHÔNG CÓ MẶT THÌ KHÔNG TỒN TẠI. Không suy ra nội dung của một entry chưa được đưa vào, không nhắc tên một thứ chỉ vì "sách chắc có". Nhờ vậy tắt bớt entry hay tắt cả sách đều không để lại lỗ hổng: thế giới chỉ mất đi những lời hứa chưa thành, còn mọi thứ đã xảy ra vẫn nguyên vẹn.`,
  },
  {
    uid: 'japan.bonluat',
    comment: '[Khái niệm] Bốn luật nền — ô uế, thanh tẩy, ngôn linh, sinh thành',
    key: [
      'kegare',
      'ô uế',
      'misogi',
      'harae',
      'thanh tẩy',
      'kotodama',
      'ngôn linh',
      'musubi',
      'sinh thành',
      'quy luật',
      'yaoyorozu',
    ],
    group: 'quy_luat',
    phase: 0,
    order: 2,
    content: `${NEN}
[BỐN LUẬT NỀN · tầng <%= dien.tang %> "<%= dien.nhan %>" · <%= dien.tyLe %>%]
Thần thoại này kết tinh bằng LUẬT trước khi kết tinh bằng nhân vật. Bốn luật dưới đây là bộ xương; mỗi luật chỉ được cho ra kết quả đo được từ tầng 2 "luật thành" trở lên. Trước đó chúng chỉ là kiêng kỵ mà người ta giữ nhưng chưa giải thích nổi.

1. Ô UẾ VÀ THANH TẨY. Uế không phải tội: nó là một thứ BÁM VÀO, lây được, và nó bám vào cả nạn nhân lẫn kẻ gây ra. Đứng cạnh một cái xác là dơ; sinh nở là dơ; máu là dơ. Đổi lại, thanh tẩy là một THỦ TỤC chạy đúng như nhau cho người vô tội lẫn kẻ vừa giết người — làm đủ nghi thức thì sạch. Đây là lối về mà thế giới này luôn để mở, và cũng là chỗ hở lớn nhất của nó: muốn hạ một người không cần chứng minh họ có tội, chỉ cần khiến họ dơ trước mặt đủ đông người.
2. NGÔN LINH. Lời nói là vật: gọi đúng tên là chạm vào, hứa là buộc, đọc sai thứ tự trong nghi thức là hỏng thật chứ không chỉ thất lễ. Người ta giấu tên thật, và một cái tên bị kẻ khác biết là một lỗ hổng đã mở. Lời nguyền của kẻ yếu có hiệu lực ngang lệnh của kẻ mạnh — đây là vũ khí luôn nằm trong tầm tay <%= user.name %>, và cũng là thứ có thể trói <%= user.name %> lại.
3. SINH THÀNH. Mọi thứ ở đây được SINH RA, kể cả từ chỗ không ai ngờ: thần sinh từ nước rửa mắt, từ máu trên chuôi kiếm, từ xác một nữ thần bị giết mà mọc lên lúa và tằm. Bạo lực trong thế giới này không chỉ hủy — nó đẻ. Mỗi lần có kẻ chết oan, hỏi ngay cái gì vừa được sinh ra từ đó, vì thứ ấy sẽ quay lại.
4. TÁM TRIỆU KAMI, KHÔNG CÓ TÒA PHÚC THẨM. Kami có ở mọi nơi và phần lớn không tên. Trên đỉnh thần giai là những vị ẨN MÌNH và không can thiệp, nên trong thế giới này không ai ở trên để kêu: mọi tranh chấp giải bằng thương lượng, bằng lời thề, bằng thi đấu có luật, hoặc bằng vũ lực. Thứ bậc do biến cố xếp chứ không do sắc phong — nó đã đổi rồi, và còn đổi được nữa.

RÀNG BUỘC: <%= dien.khoaLai %>
Bốn luật này áp cho CẢ <%= user.name %>. Không có ngoại lệ cho người chơi; nếu có ngoại lệ, nó phải được giành lấy và phải có người chứng kiến.`,
  },
  {
    uid: 'japan.diadanh',
    comment: '[Địa danh] Thang cõi, hai thời, và thứ tự đất thiêng được phép hiện ra',
    key: [
      'Takamagahara',
      'Yomi',
      'Ashihara no Nakatsukuni',
      'Ne-no-Katasu-Kuni',
      'Tokoyo no Kuni',
      'Ryugu-jo',
      'cõi giới',
      'đền',
    ],
    group: 'coi_gioi',
    phase: 1,
    order: 3,
    content: `${NEN}
[THANG CÕI VÀ HAI THỜI · tầng <%= dien.tang %> · <%= dien.tyLe %>%]
Vũ trụ này có ba tầng chính và mấy cõi bên, và cả thang KHÔNG được bày ra một lần. Một bản đồ đầy đủ giao cho người chơi ở lượt đầu là một bản đồ không ai còn muốn đi.

Thứ tự được phép hiện ra:
· Tầng 0–1 — chỉ là HƯỚNG và CẢM GIÁC: một con dốc mà đi xuống thì dễ, một cái cổng không ai bước qua lúc chạng vạng, một khúc biển mà thuyền về thiếu người. Chưa tên, chưa tầng, chưa biết trên hay dưới.
· Tầng 2 — có TÊN nhưng còn tranh chấp: mỗi vùng gọi một kiểu, xếp thứ tự khác nhau, và người kể chuyện không được chốt hộ thang nào đúng.
· Tầng 3 — thang ĐỨNG. Cao Thiên Nguyên ở trên, và nó là một LÀNG NÔNG NGHIỆP có ruộng, có sông, có nhà dệt — không phải cung điện cẩm thạch. Cõi trần ở giữa, là đất tranh chấp đã đổi chủ một lần. Hoàng Tuyền ở dưới, bịt bằng một tảng đá chứ không bằng cổng có người canh, và luật của nó tàn nhẫn kiểu đơn giản: ăn đồ ăn ở đó là thuộc về đó. Bên cạnh còn cõi ngầm để đi xuống LẤY SỨC MẠNH rồi quay lên, cõi vĩnh hằng bên kia biển mà đi rồi thì gần như không về, và Long Cung chạy theo nhịp thời gian khác.
· Tầng 4 — ĐẤT THIÊNG của thời người: những ngôi đền và ngọn núi chỉ dựng lên được SAU khi có biến cố sinh ra chúng. Đền lớn ở Izumo là cái giá của một cuộc chuyển giao; ngôi đền cao quý nhất tồn tại vì một tấm gương được gửi vào đó; ngọn núi mỏng ranh giới là nơi yêu quái dạy nghề cho người. Chưa có biến cố thì chưa có đền.

RÀNG BUỘC: mỗi cảnh nhiều nhất MỘT tầng cõi. Đi giữa các cõi phải TỐN — thời gian, một lời thề, hoặc một cái giá; và cây cầu nối trời với đất không còn dùng chung được nữa.
CÁCH DÙNG: <%= dien.tenGoi %>
KHÓA: <%= dien.khoaLai %>
Nơi nào <%= user.name %> đã đặt tên hoặc đã làm nên lịch sử ở đó thì tên ấy THẮNG tên trong sách.`,
  },
];

// ─────────────────────────────────────────── chỗ của người chơi

/**
 * Worldbook gốc không có entry nào nói về người chơi — nó là một cuốn bách khoa
 * về thần thoại, và một cuốn bách khoa thì không chừa chỗ cho ai cả.
 *
 * Thiếu entry này, model phải tự bịa câu trả lời cho "kẻ này là ai" ngay lần đầu
 * có người trong thế giới nhìn vào người chơi — và nó bịa theo hướng dễ nhất, là
 * cho người chơi một xuất thân sang trọng mà sách chưa bao giờ cho phép.
 *
 * Ba cơ chế dưới đây là cơ chế của THẦN THOẠI NÀY, không phải ba lời từ chối
 * suông: không thị tộc thì không thần bảo hộ, ngôn linh không có chỗ bám vào một
 * cái tên không gia phả, và cánh cửa người-hóa-thần thì thần thoại này để mở sẵn
 * — có kẻ đã đi qua nó rồi, và sách ghi tên hắn.
 */
const BIEN_SO = {
  uid: 'japan.bienso',
  comment: '[Thực thể] Biến Số — kẻ không có thần thị tộc',
  key: [
    'Biến Số',
    'Kẻ Nhập Cuộc',
    'Người chơi',
    'kẻ lạ',
    'kẻ không thị tộc',
    'ujigami',
    'thần bảo hộ',
    'xuất thân',
    'kẻ ngoại lai',
  ],
  keysecondary: [],
  constant: false,
  selective: true,
  selectiveLogic: 0,
  depth: 2,
  probability: 100,
  content: `## Cái tên không có trong sổ đền
Ở thế giới này mỗi người thuộc về một thị tộc, và mỗi thị tộc có một kami bảo hộ đứng ra bảo lãnh cho người của mình: kami ấy nhận lễ, nghe lời cầu, và giận thay khi con cháu bị làm nhục. Không ngôi đền nào có tên Biến Số trong sổ. Không phải vì tên ấy bị xóa — mà vì chưa từng có ai ghi.

## Trạng thái khởi nguyên
- KHÔNG THỊ TỘC, KHÔNG THẦN BẢO HỘ. Không kami nào có nghĩa vụ trả lời lời cầu của Biến Số, và cũng không kami nào bị xúc phạm khi Biến Số bị hại. Không ai nợ Biến Số gì, và cũng không ai để mắt tới — cả hai mặt đều đúng cùng lúc.
- TRẮNG TAY. Không hào quang, không thần khí, không dòng dõi cao quý, không phép thuật gia truyền. Ngoại hình, xuất thân, năng lực đều là giấy trắng, chờ được định hình bằng lựa chọn và hành động.
- VẪN CHỊU LUẬT. Biến Số bị thương được, đói được, chết được, và DƠ được. Bốn luật nền — ô uế, thanh tẩy, ngôn linh, sinh thành — áp cho Biến Số đúng như áp cho mọi kẻ khác. Uế bám vào Biến Số y hệt cách nó bám vào một vị thần vừa từ cõi chết trở về, và cũng rửa được y hệt như thế.
- KHÔNG ĐẶC QUYỀN NGUYÊN TÁC. Không thừa hưởng tài sản, kỹ năng, danh tiếng hay quan hệ của bất kỳ nhân vật nào trong dòng lịch sử gốc.

## Quyền năng của Biến Số
- NGÔN LINH KHÔNG CÓ CHỖ BÁM. Lời nguyền và lời thề ở thế giới này bám vào tên, và tên thì bám vào gia phả. Tên của Biến Số không nối vào đâu cả, nên lời nguyền nhắm vào Biến Số trượt đi hoặc ăn nhẹ hơn nó đáng ăn. Đây KHÔNG phải miễn nhiễm: cái gì trượt khỏi Biến Số thì rơi xuống kẻ đứng gần — và phúc lành cũng trượt đi y như vậy.
- KHÔNG CÓ CHỖ TRONG BẢNG THẦN GIAI. Thứ bậc ở đây do biến cố xếp, và chưa biến cố nào xếp Biến Số vào đâu. Nghĩa là không ai bảo vệ, và cũng không ai biết trần của Biến Số ở đâu — kể cả kami. Chưa ai chắc mình có quyền trừng phạt Biến Số, và sự lưỡng lự ấy là khoảng thở duy nhất Biến Số có lúc đầu.
- CỬA NGƯỜI HÓA THẦN ĐỂ MỞ. Thần thoại này khác Hy Lạp và Ấn Độ ở đúng chỗ ấy: một CON NGƯỜI trở thành kami được, và đã có kẻ đi qua cửa ấy rồi — một Thiên Hoàng chết trong oán hận nay được thờ như đại ma vương. Đường đi không qua huyết thống mà qua việc được THỜ hoặc được SỢ đủ nhiều. Đây là trần thật sự của Biến Số, và nó không được trao — nó chỉ được người khác công nhận.
- TỰ DO TUYỆT ĐỐI. Không phe, không sứ mệnh, không đạo lý nào ràng buộc sẵn. Biến Số chọn làm kẻ dựng đền, kẻ đốt đền, kẻ đứng nhìn, hay thế lực thứ ba giật dây từ trong bóng — cả bốn đều mở.

## Ràng buộc
- Các thực thể trong thế giới giữ nguyên bản ngã và trí tuệ của họ. Họ phản ứng với Biến Số một cách hợp lý — nghi ngờ, thăm dò, lợi dụng, hoặc phớt lờ — chứ không phục tùng vô lý và không đổi tính cách chỉ vì Biến Số có mặt.
- Mọi thứ Biến Số có được đều phải đổi bằng hành động CÓ NGƯỜI CHỨNG KIẾN. Sách này không trao gì cả; nó chỉ nói rằng chỗ trống ấy tồn tại và chưa ai đứng vào.`,
};

// ─────────────────────────────────────────── ráp sách

/** Entry do script tự viết bị loại khỏi nguồn để chạy lại không nhân đôi chúng. */
const BO_UID = new Set([...DIEU_PHOI.map((d) => d.uid), BIEN_SO.uid]);

const noiDungEntries = [
  BIEN_SO,
  ...sourceEntries.filter((e) => !BO_UID.has(String(e.uid ?? ''))),
].filter((e) => e.enabled !== false && e.disable !== true);

const entries = [
  ...DIEU_PHOI.map((d) => ({
    uid: d.uid,
    comment: d.comment,
    key: d.key,
    keysecondary: [],
    constant: true,
    selective: false,
    order: d.order,
    depth: 2,
    probability: 100,
    group: d.group,
    phase: d.phase,
    deferMaterialization: true,
    content: d.content,
  })),
  // `BIEN_SO` đi qua đúng đường của một entry nội dung — cùng khối EJS, cùng
  // nhóm, cùng cổng giai đoạn. Nó là nội dung của sách, không phải điều phối.
  ...noiDungEntries.map((e, i) => {
    const nhom = nhomCua(e);
    const giaiDoan = giaiDoanCua(e);
    const uidGoc = String(e.uid ?? e.id ?? i + 1);
    return {
      // Chạy lại script trên đầu ra của chính nó không được đẻ ra `japan.japan.7`.
      uid: uidGoc.startsWith('japan.') ? uidGoc : `japan.${uidGoc}`,
      comment: nhanCua(e) || `Entry ${i + 1}`,
      key: Array.isArray(e.key) ? e.key : Array.isArray(e.keys) ? e.keys : [],
      keysecondary: Array.isArray(e.keysecondary)
        ? e.keysecondary
        : Array.isArray(e.secondary_keys)
          ? e.secondary_keys
          : [],
      /*
       * `constant` của sách gốc bị hạ có chủ ý. Hai entry luôn-bật của một card
       * SillyTavern là hợp lý khi card ấy LÀ toàn bộ ngữ cảnh; ở đây sách chỉ là
       * một nguồn trong nhiều nguồn, và riêng dòng thời gian đã hơn mười nghìn
       * ký tự — luôn-bật nghĩa là nó ăn ngân sách truy hồi của cả biên niên lẫn
       * ký ức nhân vật ở mọi lượt. Bốn entry điều phối ở trên là những entry duy
       * nhất được phép luôn-bật.
       */
      constant: false,
      selective: true,
      selectiveLogic: e.selectiveLogic ?? 0,
      order: DIEU_PHOI.length + i,
      depth: e.depth ?? 2,
      probability: e.probability ?? 100,
      group: nhom,
      phase: giaiDoan,
      // Bật sách KHÔNG được đẻ ra hơn trăm thực thể. Narrator hiện thực hóa dần.
      deferMaterialization: true,
      content: khoiDau(e, nhom, giaiDoan) + boVoCu(String(e.content ?? '')),
    };
  }),
];

const built = {
  _format: 'thien_dien_lore',
  name: 'Thần thoại Nhật Bản',
  description:
    'Thế giới bắt đầu trống và kết tinh dần thành Ashihara no Nakatsukuni qua năm tầng: dấu hiệu, danh xưng, luật, ' +
    'cõi giới, sử thi. Đích đến là một dị bản chứ không phải bản sao — trần kết tinh chỉ tới 66/100, và phần còn ' +
    'thiếu là phần của người chơi. Ô uế, thanh tẩy, ngôn linh và sinh thành là bốn luật nền; thời thần và thời ' +
    'người là hai lớp tách bạch, và đất thiêng chỉ dựng lên sau khi có biến cố sinh ra nó.',
  thanHe: 'Nhật Bản · Shinto',
  version: '1.0.0',
  uuTien: 90,
  /*
   * 66 — thấp hơn cả hai sách kia, và đó là đặc điểm của chính thần thoại này.
   * Tám triệu kami mà sách chỉ gọi tên được năm mươi vị; phần còn lại vốn đã là
   * chỗ trống trong nguyên tác. Kéo mạnh hơn nghĩa là bịa ra một thần điện chặt
   * chẽ mà thần thoại này chưa bao giờ có.
   */
  lucHapDan: 66,
  conflictPolicy: 'song_song',
  nhipMoGiaiDoan: 9,
  soDiemHutMoiLuot: 2,
  entries,
};

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(built, null, 2)}\n`, 'utf8');

const dem = (f) => {
  const m = new Map();
  for (const e of entries) m.set(f(e), (m.get(f(e)) ?? 0) + 1);
  return m;
};
const theoNhom = dem((e) => e.group);
const theoGiaiDoan = dem((e) => e.phase);
const macDinh = noiDungEntries.filter(
  (e) => DI_BAN[chuDeCua(e)] === undefined && !CAP_THAN_THE.has(chuDeCua(e)),
).length;

console.log(`Đã tạo ${output}`);
console.log(`  ${entries.length} entry · ${theoNhom.size} nhóm · luôn-bật: ${DIEU_PHOI.length}`);
console.log(
  `  giai đoạn: ${[...theoGiaiDoan.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([p, n]) => `${p}→${n}`)
    .join(' ')}`,
);
console.log(`  entry dùng dòng dị bản mặc định: ${macDinh}/${noiDungEntries.length}`);
