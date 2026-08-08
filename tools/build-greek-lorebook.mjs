/**
 * Dựng `public/lorebooks/than-thoai-hy-lap.json` từ worldbook SillyTavern gốc.
 *
 * ── Vì sao lại là một script chứ không phải sửa tay ──
 *
 * Sách gốc có 149 entry và mỗi entry cần cùng một khối EJS ở đầu. Sửa tay nghĩa
 * là 149 cơ hội để một entry lệch khỏi 148 entry kia, và lệch ở đây không hiện
 * ra lúc nhập — nó hiện ra sau hai mươi lượt chơi, khi một entry duy nhất không
 * chịu quy tắc "một trọng tâm mỗi lượt" và bắt đầu lấn cảnh.
 *
 * ── Bài toán ──
 *
 * Thiên Diễn mở ván bằng một thế giới TRỐNG: không đất, không luật, không tên
 * gọi nào. Sách này là lực hút kéo cái trống ấy thành Olympus — nhưng kéo CHẬM,
 * qua năm tầng kết tinh, và không bao giờ kéo tới trùng khít nguyên tác vì trần
 * kết tinh là `lucHapDan` chứ không phải 100. Phần còn thiếu ấy là phần của
 * người chơi.
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
 * Cách dùng:
 *   node tools/build-greek-lorebook.mjs <worldbook-gốc.json> [đích.json]
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const source = process.argv[2];
const output = resolve(process.argv[3] ?? 'public/lorebooks/than-thoai-hy-lap.json');
if (!source)
  throw new Error('Cách dùng: node tools/build-greek-lorebook.mjs <worldbook-gốc.json> [đích.json]');

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

/** `[Nhân vật chính] :: Hera - Thiên hậu kiêu ngạo` → `Hera`. */
function chuDeCua(e) {
  const sau = nhanCua(e).replace(/^\[[^\]]*\]\s*/, '');
  const thanh = sau.split('::').pop() ?? sau;
  return thanh
    .split(/\s+[-–—]\s+/)[0]
    .replace(/^\s*::\s*/, '')
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
 * "một chủ đề", không phải với đơn vị "một thư mục".
 *
 * Hera có bảy entry: ngoại hình, tâm lý, NSFW, quan hệ, năng lực, tiểu sử, phân
 * tích. Xếp chung theo loại "Nhân vật chính" thì bảy entry ấy vẫn là bảy nguồn
 * khác nhau, và một cảnh có Hera sẽ nuốt trọn ngân sách truy hồi rồi kể ra bảy
 * đoạn mô tả chồng lên nhau. Xếp theo CHỦ ĐỀ thì bảy entry thành một nguồn: mỗi
 * cảnh lấy đúng một mặt của Hera, và mặt nào là do liên quan quyết định chứ
 * không do thứ tự trong file.
 */
const LOAI_THEO_CHU_DE = new Set([
  'Nhân vật chính',
  'Nhân vật phụ',
  'Sáng Thế Thần',
  'Thần Titan',
  'Quái vật',
]);

const NHOM_THEO_LOAI = {
  'Quy tắc cốt lõi': 'dieu_phoi',
  'Tham khảo tự sự': 'dieu_phoi',
  'Mục tiêu cốt lõi': 'dieu_phoi',
  'Hệ thống cốt lõi': 'quy_luat',
  'Thiết lập cốt lõi': 'quy_luat',
  'Thiết lập': 'quy_luat',
  'Địa điểm': 'coi_gioi',
  'Thế lực': 'the_luc',
  'Chủng tộc': 'chung_toc',
  'Vật phẩm': 'than_vat',
  'Cốt truyện cốt lõi': 'than_tich',
  'Thực thể': 'nguoi_choi',
};

function nhomCua(e) {
  const loai = loaiCua(e);
  if (LOAI_THEO_CHU_DE.has(loai)) return `nv_${slug(chuDeCua(e)) || slug(nhanCua(e)).slice(0, 24)}`;
  return NHOM_THEO_LOAI[loai] ?? 'bo_sung';
}

// ─────────────────────────────────────────── giai đoạn mở

/**
 * Thứ tự này là thứ tự một thần thoại thật sự lớn lên trong một thế giới trống.
 *
 * Luật và dấu hiệu trước, vì chúng là thứ mọi câu chuyện sau đó phải tuân. Cõi
 * giới và thế lực kế tiếp, vì thần cần một chỗ để ở và một tôn ti để tranh. Thần
 * linh sau đó, vì một vị thần bước ra chào ở lượt đầu thì hai mươi lượt sau
 * không còn gì để thế giới lớn thêm. Bảo vật rồi sử thi cuối cùng.
 *
 * Entry vẫn bắn sớm được nếu người chơi GỌI ĐÍCH DANH — `dungChiMuc()` bỏ qua
 * cổng giai đoạn khi từ khóa nằm trong câu người chơi vừa gõ. Cổng này chặn
 * việc thế giới tự dội, không chặn ý muốn của người chơi.
 */
const THAN_SOM = new Set(['Zeus', 'Hera', 'Cronus', 'Gaia', 'Uranus']);

function giaiDoanCua(e) {
  const loai = loaiCua(e);
  if (loai === 'Quy tắc cốt lõi' || loai === 'Tham khảo tự sự' || loai === 'Mục tiêu cốt lõi') return 0;
  if (loai === 'Hệ thống cốt lõi' || loai === 'Thiết lập cốt lõi') return 0;
  // Chỗ của người chơi phải có mặt từ lượt đầu: nó là câu trả lời cho "kẻ này là
  // ai", và câu hỏi ấy được hỏi ngay lần đầu có NPC nhìn vào người chơi.
  if (loai === 'Sáng Thế Thần' || loai === 'Thực thể') return 0;
  if (loai === 'Thiết lập') return 1;
  if (loai === 'Địa điểm' || loai === 'Thế lực' || loai === 'Chủng tộc' || loai === 'Thần Titan') return 1;
  if (loai === 'Nhân vật chính') return THAN_SOM.has(chuDeCua(e)) ? 1 : 2;
  if (loai === 'Nhân vật phụ' || loai === 'Quái vật') return 2;
  if (loai === 'Vật phẩm') return 3;
  if (loai === 'Cốt truyện cốt lõi') return 4;
  return 2;
}

// ─────────────────────────────────────────── đường vào: cách một thứ nhập thế

/**
 * Mỗi LOẠI có một cách riêng để bước vào một thế giới chưa biết nó tồn tại.
 *
 * Đây là chỗ dễ sai nhất và sai nặng nhất. Không có dòng này, model mặc định
 * cho mọi thứ nhập thế theo một kiểu duy nhất — nó MÔ TẢ. Một vị thần được mô
 * tả thì đã có mặt rồi, và thế giới mất luôn quãng đường từ "chưa ai biết" tới
 * "ai cũng biết" — tức mất đúng phần mà một ván chơi về thần thoại đang lớn lên
 * có để chơi.
 */
const DUONG_VAO = {
  'Nhân vật chính':
    'Một vị thần nhập thế qua ba nấc và không được nhảy cóc: HỆ QUẢ trước (mùa lệch, biển động, một giấc mơ ' +
    'lặp lại ở nhiều người), rồi TÊN VÀ TÍN NGƯỠNG (có kẻ gọi đúng, có kẻ gọi sai, có kẻ cãi nhau về việc gọi ' +
    'thế nào), rồi mới tới THÂN XÁC. Trước nấc ba, vị này chỉ tác động qua điềm, qua sứ giả, qua kẻ tự nhận là ' +
    'đại diện.',
  'Nhân vật phụ':
    'Nhân vật phụ nhập thế bằng chỗ họ CHẠM VÀO chuyện đang xảy ra, không bằng lý lịch. Cảnh này chưa cần tới ' +
    'họ thì họ chưa cần tồn tại; cảnh này cần, thì họ bước vào bằng đúng phần liên quan và giữ phần còn lại ' +
    'trong bóng cho lượt sau.',
  'Thần Titan':
    'Thế hệ thần cũ nhập thế bằng CÁI VẮNG MẶT: một ngôi đền không ai nhận, một tên bị đục khỏi bia, một tục lệ ' +
    'còn được làm mà không ai nhớ để làm gì. Titan có mặt trong thế giới rất lâu trước khi có ai gọi được tên họ.',
  'Sáng Thế Thần':
    'Các đấng nguyên thủy KHÔNG bước vào thế giới — thế giới phát hiện ra mình vốn nằm trong họ. Họ chỉ hiện ra ' +
    'qua quy mô: một khoảng trời, một vực không đáy, một đêm không chịu hết. Không đối thoại, không thân xác, ' +
    'không động cơ giải thích được.',
  'Địa điểm':
    'Một nơi chốn nhập thế bằng HƯỚNG trước, bằng TÊN sau: người ta tránh đi lối ấy, rồi đồn về nó, rồi mới có ' +
    'kẻ tới được và kể lại — và lời kể của kẻ ấy không khớp với lời đồn.',
  'Thế lực':
    'Một thế lực nhập thế bằng DẤU VẾT TỔ CHỨC: hai nơi cách xa nhau làm cùng một lễ, một mệnh lệnh không rõ ' +
    'phát từ đâu, một khoản cống nộp đều đặn. Cái tên chung tới sau cùng.',
  'Chủng tộc':
    'Một giống loài nhập thế theo thứ tự: lời đồn của kẻ sống sót → một cái xác hoặc một dấu chân → một cuộc gặp. ' +
    'Bỏ qua hai nấc đầu là biến chúng thành sinh vật trong sách tra cứu.',
  'Quái vật':
    'Một quái vật nhập thế bằng THIỆT HẠI, không bằng ngoại hình: đàn mất, làng bỏ đi, người không trở về. Hình ' +
    'dạng của nó là điều cuối cùng thế giới biết, và thường là biết sai.',
  'Vật phẩm':
    'Một bảo vật nhập thế bằng CÁI NÓ LÀM ĐƯỢC, không bằng cái nó là. Ai cũng biết có một thứ làm được điều đó ' +
    'từ lâu trước khi có ai biết nó tên gì và nằm ở đâu.',
  'Cốt truyện cốt lõi':
    'Một sử thi nhập thế bằng NGUYÊN NHÂN, không bằng biến cố. Trước khi chiến tranh nổ ra phải thấy được cái ' +
    'làm nó nổ ra, và phải thấy đủ sớm để người chơi còn kịp can thiệp. Một sử thi nổ ra không báo trước là một ' +
    'đoạn phim, không phải một sự kiện.',
  'Quy tắc cốt lõi':
    'Một quy luật nhập thế bằng KIÊNG KỴ trước LÝ LẼ: người ta giữ nó vì đã thấy hậu quả, và rất lâu sau mới có ' +
    'kẻ phát biểu được nó thành lời — thường là phát biểu sai một nửa.',
  'Hệ thống cốt lõi':
    'Một cơ chế nhập thế bằng chỗ nó CHO RA KẾT QUẢ. Chưa có cảnh nào cho thấy nó chạy thì nó chưa tồn tại, dù ' +
    'entry đã mô tả xong.',
  'Thiết lập cốt lõi':
    'Một thiết lập nền nhập thế bằng chỗ nó GIỚI HẠN người ta. Nó được biết tới qua điều không làm được, không ' +
    'qua bản mô tả.',
  'Thiết lập':
    'Nền của thế giới hiện ra qua chỗ nó chặn người ta lại, không qua lời giải thích của người kể chuyện.',
  'Tham khảo tự sự':
    'Đây là tài liệu NHỊP ĐỘ, không phải nội dung để kể. Dùng nó để biết cái gì chưa tới lượt; đừng đọc nó ra.',
  'Mục tiêu cốt lõi':
    'Mục tiêu của thế giới nhập thế bằng chỗ nó khiến các thế lực CƯ XỬ KHÁC ĐI. Không tuyên bố mục tiêu; cho ' +
    'thấy ai đang đi về phía nó và ai đang chặn.',
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
 * Zeus là Thần Vương sẽ mặc định Zeus là Thần Vương mãi mãi — vì entry viết ở
 * thì hiện tại và không có gì trong đó nói rằng điều ấy CÓ THỂ THÔI ĐÚNG.
 *
 * Dòng này là chỗ nói điều ấy, và nó phải CỤ THỂ. "Mọi thứ đều có thể đổi" là
 * một câu không ai làm gì được với nó; "lời tiên tri con-mạnh-hơn-cha chưa hết
 * hiệu lực ở đời thứ ba" thì đổi được cách một lượt được kể.
 */
const DI_BAN = {
  Zeus:
    'Ngôi Thần Vương không phải tài sản. Lời tiên tri "con mạnh hơn cha" đã hạ Uranus rồi hạ Cronus, và chưa có ' +
    'gì cho thấy nó hết hiệu lực ở đời thứ ba. Zeus biết điều đó, nên mọi hành động của ông đều là đề phòng — kể ' +
    'cả những hành động trông như dục vọng. <%= user.name %> là biến số chưa có tên trong lời tiên tri ấy.',
  Hera:
    'Trong nguyên tác cơn ghen của Hera không có lối ra: bà trút giận lên nạn nhân và không bao giờ chạm tới ' +
    'nguyên nhân. Ở ván này lối ra tồn tại — bà là người duy nhất trên Olympus hiểu quyền lực là CẤU TRÚC chứ ' +
    'không phải sức mạnh. Ai chỉ cho bà thấy chỗ ấy sẽ tạo ra đối thủ đáng sợ nhất của Zeus.',
  Athena:
    'Athena sinh ra từ đầu Zeus, tức bà nợ ông sự tồn tại chứ không nợ ông lòng trung thành — và bà biết chuyện ' +
    'đã xảy ra với mẹ mình. Sự phục tùng của bà là một tính toán đang chạy, không phải một bản tính.',
  Hades:
    'Hades không tranh ngôi vì ông đã có thứ hai anh em kia không có: cõi của ông là cõi duy nhất mọi người rồi ' +
    'sẽ tới. Ông không cần thắng, ông chỉ cần đợi. Ai làm ông thôi đợi thì đổi được cán cân của cả thần điện.',
  Poseidon:
    'Poseidon rút thăm được biển và chưa bao giờ hết cay về chuyện ấy. Ông là người duy nhất trong ba anh em ' +
    'từng công khai tham gia một âm mưu chống Zeus mà vẫn còn sống. Ông sẽ làm lại nếu thấy đủ đông người.',
  Demeter:
    'Quyền lực của Demeter là quyền CẮT: bà từng bỏ đói cả thế giới để đòi lại con. Nguyên tác gọi đó là bi kịch ' +
    'của một người mẹ; ở ván này nó còn là bằng chứng rằng một vị thần đơn lẻ bắt bí được cả thần điện.',
  Apollo:
    'Apollo giữ lời sấm, nghĩa là ông biết những điều Zeus không cho phép nói ra và vẫn phải nói ra một phần. ' +
    'Khoảng cách giữa phần ông nói và phần ông giấu là chỗ ván này chen vào được.',
  Artemis:
    'Lời thề trinh nữ của Artemis là một GIAO KÈO với cha, đổi lấy quyền không bị gả đi. Giao kèo thì có điều ' +
    'khoản, và điều khoản thì có chỗ hở. Bà giữ nó vì nó có lợi, không vì nó thiêng.',
  Hestia:
    'Hestia nhường ghế của mình trong mười hai vị và không ai hỏi vì sao. Bà là vị duy nhất không có kẻ thù, ' +
    'nghĩa là bà tới được mọi chỗ mà không ai để ý — kể cả những chỗ không ai được vào.',
  Ares:
    'Cả thần điện coi thường Ares và ông biết. Nguyên tác để ông sống mãi trong sự coi thường ấy; ở đây không có ' +
    'gì bắt buộc như vậy. Một chiến thần bị coi thường là một chiến thần đang tìm kẻ biết dùng mình đúng cách.',
  Aphrodite:
    'Aphrodite bị gả cho Hephaestus như một món đồ để dàn xếp chính trị và chưa từng tha thứ cho việc ấy. Sắc ' +
    'đẹp là thứ duy nhất người ta thấy ở bà; sự thù dai là thứ chưa ai tính tới.',
  Hephaestus:
    'Hephaestus rèn vũ khí cho chính những kẻ đã ném ông xuống. Mỗi món ông rèn là một lựa chọn KHÔNG rèn một ' +
    'món khác — và ở ván này, cái ông chọn không rèn có thể quan trọng hơn cái ông rèn.',
  Hermes:
    'Hermes đi được cả ba cõi, kể cả cõi chết, và không ai kiểm tra ông mang gì theo. Kẻ đưa tin biết nhiều hơn ' +
    'người gửi lẫn người nhận, và đó là một loại quyền lực không ai ghi vào bảng xếp hạng.',
  Prometheus:
    'Prometheus biết một bí mật về việc Zeus sẽ mất ngôi thế nào, và trong nguyên tác ông giữ nó tới lúc được ' +
    'thả. Ở đây, ông nói với AI và nói lúc NÀO là chuyện của ván này. Đó là quân bài mạnh nhất còn nằm ngoài tay ' +
    'Olympus.',
  Cronus:
    'Cronus không điên khi nuốt các con: ông đang làm đúng điều lời tiên tri buộc ông phải sợ, và ông thất bại y ' +
    'như cha ông. Ông là bằng chứng sống rằng biết trước không cứu được ai — trừ khi có kẻ đổi được luật chơi.',
  Gaia:
    'Gaia đã lật đổ hai đời Thần Vương và chưa từng đứng về phía kẻ đang cầm quyền. Bà không tấn công; bà chỉ ' +
    'đưa vũ khí cho kẻ chịu cầm.',
  Uranus:
    'Uranus vẫn còn đó — bầu trời không chết được. Cái ông mất là quyền, không phải sự tồn tại, và một vị thần ' +
    'mất quyền mà không mất mạng là một vị thần có rất nhiều thời gian.',
  Medusa:
    'Medusa bị biến thành quái vật vì là NẠN NHÂN, và cả thần điện đồng ý với bản án ấy. Đó là chỗ hở đạo đức ' +
    'lớn nhất của Olympus. Ai chỉ ra nó, và chỉ ra trước mặt ai, là chuyện của ván này.',
  'Lời tiên tri':
    'ĐÂY LÀ TRỤC QUAN TRỌNG NHẤT CỦA SÁCH. Lời tiên tri trong thần thoại này luôn ứng nghiệm, và ứng nghiệm CHÍNH ' +
    'VÌ kẻ nghe cố tránh. Giữ nguyên cơ chế ấy nhưng KHÔNG giữ nguyên nội dung: mọi lời tiên tri trong ván phải ' +
    'chừa chỗ cho <%= user.name %>, và nếu <%= user.name %> làm nó lệch thì phần lệch là Sử còn nguyên tác lùi ' +
    'xuống thành "bản người ta hay kể". Không bao giờ sửa lại quá khứ cho khớp lời sấm.',
  'Thần cách':
    'Thần cách là lõi quyết định một vị thần mạnh tới đâu, và nguyên tác coi nó là thứ sinh ra đã có. Ở ván này ' +
    'nó CHUYỂN ĐƯỢC: giành, cướp, chia, tự nguyện trao. Đây là cửa để một kẻ không sinh ra làm thần đi vào, và ' +
    'là cửa để một vị thần mất tất cả.',
  'Thần huyết':
    'Thần huyết làm con lai mạnh hơn người thường nhưng không đủ để thành thần — đó là thiết kế, không phải tình ' +
    'cờ. Ai tìm ra cách vượt cái trần ấy sẽ phá vỡ trật tự mà cả Olympus dựa vào.',
  'Tín ngưỡng nhân gian':
    'Tín ngưỡng là nguồn sức mạnh MỚI, nghĩa là bảng xếp hạng cũ của thần điện đang lỗi thời mà phần lớn chưa ' +
    'nhận ra. Vị thần nào hiểu ra trước sẽ vượt lên bằng cách không ai kịp phản ứng — và một kẻ phàm hiểu ra ' +
    'trước thì còn nguy hiểm hơn.',
  'Ngôi vị Thần Vương':
    'Ngôi Thần Vương là MỤC TIÊU của ván chơi, không phải bối cảnh của nó. Nó đã đổi chủ hai lần và cả hai lần ' +
    'đều do người trong nhà. Ai ngồi lên đó ở cuối ván là câu hỏi mở — kể cả khi câu trả lời vẫn là Zeus.',
  'Thần tộc Titan':
    'Titan thua chứ không sai, và họ vẫn còn sống dưới đáy. Một thế lực bị giam mà không bị diệt là một thế lực ' +
    'đang chờ. Ở ván này họ có thể được thả, được liên minh, hoặc được dùng làm đòn bẩy — cả ba đều đổi bản đồ ' +
    'quyền lực.',
  'Sáng Thế Thần':
    'Các đấng nguyên thủy đứng trên cả Thần Vương và không quan tâm tới chính trị của ông. Họ là TRẦN của thế ' +
    'giới này: mọi tham vọng dừng ở chỗ chạm vào họ. Đừng cho họ hành động vì động cơ — nếu họ động, đó là vì ' +
    'một quy luật bị vi phạm.',
  'Tân thần phổ':
    'Tân thần phổ là một liên minh thắng trận, và liên minh thắng trận nào cũng bắt đầu rạn ngay sau khi hết kẻ ' +
    'thù chung. Vết rạn ấy đã có sẵn; ván này chỉ quyết định ai chạm vào nó trước.',
  'Chiến tranh thành Troy':
    'Troy là sự kiện cấp thế giới, tức nó KHÔNG được xảy ra như một biến cố nền. Nếu ván này đi tới đó thì phải ' +
    'đi tới bằng nguyên nhân đã gieo trong chính ván này, và <%= user.name %> phải có cơ hội can thiệp trước khi ' +
    'nó không còn ngăn được nữa.',
  'Trận chiến Titan':
    'Trận Titan là quá khứ, không phải cảnh để kể lại. Nó có mặt trong thế giới qua vết thương: kẻ còn sống, kẻ ' +
    'bị đày, và những ân oán chưa ai trả xong.',
  'Núi Olympus':
    'Olympus là nơi ở của thần điện, nghĩa là nó cũng là nơi mọi mâu thuẫn của thần điện dồn vào. Một tòa nhà mà ' +
    'tất cả kẻ thù của nhau cùng sống là một tòa nhà luôn sắp cháy.',
  'Biến Số':
    'Đây là chỗ của <%= user.name %> trong thần thoại. Nó là một chỗ TRỐNG hình người, không phải một thân phận ' +
    'được trao: sách không cho <%= user.name %> dòng dõi, thần khí, lời sấm hay quan hệ nào. Mọi thứ ấy phải ' +
    'giành được qua sự kiện trong ván, và khi giành được rồi thì nó là Sử, không ai lấy lại được.',
};

const DI_BAN_MAC_DINH =
  'Nguyên tác cho nhân vật/sự kiện này một kết cục. Kết cục ấy là ĐIỂM HÚT, không phải hợp đồng: nếu ván này đi ' +
  'khác thì chỗ đi khác MỚI là sự thật của thế giới, còn nguyên tác lùi xuống thành "bản mà người ta hay kể".';

const diBanCua = (e) => DI_BAN[chuDeCua(e)] ?? DI_BAN_MAC_DINH;
const duongVaoCua = (e) => DUONG_VAO[loaiCua(e)] ?? DUONG_VAO_MAC_DINH;

// ─────────────────────────────────────────── khối EJS gắn đầu mỗi entry

/**
 * Khối này cố tình NGẮN.
 *
 * Mọi quy tắc bất biến nằm ở bốn entry điều phối `lop: 'loi'` — chúng luôn có
 * mặt, nên nhắc lại ở đây là trả tiền token cho cùng một câu 149 lần. Cái duy
 * nhất phải nằm cạnh từng entry là thứ chỉ đúng cho riêng entry ấy: đường vào
 * của nó, chỗ nó lệch được, nhóm của nó, và mức kết tinh engine vừa tính cho
 * lượt này.
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

/**
 * Điều phối tách làm bốn entry thay vì một, vì bốn entry ấy trả lời bốn câu hỏi
 * khác nhau và người chơi có thể muốn che một trong bốn. Gộp lại thành một khối
 * thì che một quy tắc là che cả bốn — và 51.3 nói che phải là thao tác có mục
 * tiêu, không phải một cái công tắc tổng.
 */
const DIEU_PHOI = [
  {
    uid: 'greek.director',
    comment: '[Bối cảnh] Đạo diễn — thế giới kết tinh dần thành Olympus',
    key: ['Thần thoại Hy Lạp', 'Olympus', 'kết tinh', 'Biến Số'],
    group: 'dieu_phoi',
    phase: 0,
    order: 0,
    content: `${NEN}
[ĐẠO DIỄN · THẾ GIỚI ĐANG TRỞ THÀNH THẦN THOẠI HY LẠP]
Giai đoạn <%= world.phase %> — <%= world.phaseLabel %>. Tầng kết tinh <%= dien.tang %> "<%= dien.nhan %>", mức <%= dien.tyLe %>%. Người chơi: <%= user.name %>.
Neo đã thành lịch sử: <%= lore.realizedNames %>.

[ĐA THẦN THOẠI] <%= daThan.khungCanh %>
<%= daThan.giaoUoc %>

1. Thế giới KHÔNG bắt đầu là Olympus. Nó bắt đầu trống và kết tinh dần thành Olympus qua năm tầng: dấu hiệu → danh xưng → luật → cõi giới → sử thi. Đích đến là một DỊ BẢN của thần thoại Hy Lạp, không phải bản sao của nó. Khi khối ĐA THẦN THOẠI ở trên báo có nhiều hơn một hệ đang bật, câu này đọc thành: Olympus là MỘT trong các lực hút của thế giới, không phải đích đến duy nhất của nó.
2. Mức kết tinh <%= dien.tyLe %>% là TRẦN, không phải chỉ tiêu. <%= dien.chiDan %>
3. Không đảo thứ tự năm tầng. Một địa danh của sách xuất hiện trước khi luật ở đó đứng vững là lỗi thấy được ngay; một vị thần bước ra chào ở lượt đầu là tiêu mất hai mươi lượt còn lại.
4. Mỗi lượt gieo nhiều nhất MỘT yếu tố mới của sách. Ưu tiên phát triển thứ đã gieo hơn là gọi thêm tên mới. Thế giới lớn lên bằng chiều sâu, không bằng danh sách.
5. Trần kết tinh không bao giờ chạm 100 vì lực hút chỉ có <%= lore.gravity %>/100. Phần còn thiếu ấy KHÔNG phải thiếu sót — nó là phần của <%= user.name %>, và phải được lấp bằng chuyện xảy ra trong ván chứ không bằng nguyên tác.
6. <%= user.name %> ở BÊN TRONG thần thoại này, không phải khán giả. Việc <%= user.name %> làm quyết định thần thoại kết tinh theo hướng nào — nhưng KHÔNG được tự trao cho <%= user.name %> thân phận, quan hệ, vật phẩm hay quyền năng nào. Mọi thứ phải giành được qua sự kiện trong game.
7. Các thần và nhân vật giữ động cơ riêng. Không ai tự yêu, tự phục tùng hay tự trao đặc quyền cho <%= user.name %> chỉ vì đó là người chơi.
8. Khi sách bị TẮT, không dùng bất kỳ entry, quy luật, lời tiên tri hay tên gọi nào của sách để dẫn dắt lượt mới. Những gì đã xảy ra vẫn là lịch sử của thế giới; những gì sách mới chỉ hứa thì thôi.`,
  },
  {
    uid: 'greek.chongxungdot',
    comment: '[Bối cảnh] Quy tắc chống xung đột khi nhiều entry cùng bật',
    key: ['xung đột entry', 'nhiều entry', 'trọng tâm cảnh'],
    group: 'dieu_phoi',
    phase: 0,
    order: 1,
    content: `${NEN}
[CHỐNG XUNG ĐỘT · áp cho MỌI entry của sách này]
Sách đang có <%= lore.activeEntryCount %> entry hoạt động. Nhiều entry cùng vào một cảnh là chuyện bình thường và KHÔNG được xử lý bằng cách nói hết.

1. MỘT TRỌNG TÂM MỘT LƯỢT. Trong các entry cùng nhóm, chỉ một entry được làm trọng tâm; các entry còn lại nhiều nhất là một câu nền. Bảy entry về Hera là bảy MẶT của Hera, không phải bảy điều phải nói về Hera.
2. ENTRY LÀ ỨNG VIÊN, KHÔNG PHẢI DÀN Ý. Không có nghĩa vụ dùng hết những gì được đưa vào ngữ cảnh. Một entry không dùng tới thì im — không cần nhắc để chứng tỏ đã đọc.
3. SỬ THẮNG NGUỒN. Nếu entry nói khác điều đã xảy ra trong ván, điều đã xảy ra thắng. Không sửa lại quá khứ và không giả vờ entry đã tiên đoán đúng.
4. HAI ENTRY MÂU THUẪN NHAU thì kể mâu thuẫn ấy như hai lời truyền khác nhau trong thế giới, đừng chọn bừa một bên rồi giấu bên kia. Chỗ hai lời truyền vênh nhau là chỗ thế giới còn sống.
5. TRÙNG LẶP thì gộp, không nói hai lần bằng hai giọng.
6. Entry được người chơi GỌI ĐÍCH DANH luôn thắng entry do engine gợi ý, kể cả khi nó chưa tới giai đoạn mở.
7. Entry không đủ chỗ trong lượt này KHÔNG mất — nó là ứng viên của lượt sau. Không dồn nội dung của nó vào một câu tóm tắt cho kịp.`,
  },
  {
    uid: 'greek.bonluat',
    comment: '[Quy tắc cốt lõi] Bốn luật nền — số phận, thần cách, lời thề, tín ngưỡng',
    key: ['số phận', 'lời tiên tri', 'thần cách', 'lời thề', 'sông Styx', 'tín ngưỡng', 'quy luật'],
    group: 'quy_luat',
    phase: 0,
    order: 2,
    content: `${NEN}
[BỐN LUẬT NỀN · tầng <%= dien.tang %> "<%= dien.nhan %>" · <%= dien.tyLe %>%]
Thần thoại này kết tinh bằng LUẬT trước khi kết tinh bằng nhân vật. Bốn luật dưới đây là bộ xương; mỗi luật chỉ được cho ra kết quả đo được từ tầng 2 "luật thành" trở lên. Trước đó chúng chỉ là kiêng kỵ mà người ta giữ nhưng chưa giải thích nổi.

1. SỐ PHẬN. Cái đã được định sẽ tới, và nó tới CHÍNH VÌ kẻ nghe cố tránh. Lời tiên tri không mô tả tương lai — nó tạo ra tương lai bằng cách khiến người ta hành động. Nhưng nội dung lời tiên tri trong ván này phải chừa chỗ cho <%= user.name %>, và nếu <%= user.name %> làm nó lệch thì phần lệch là Sử.
2. THẦN CÁCH. Quyền năng có lõi, và lõi ấy chuyển được: giành được, cướp được, chia được, trao được. Một vị thần mất thần cách thì mất tất cả; một kẻ không sinh ra làm thần mà có được thần cách thì thành thần. Đây là cửa của <%= user.name %>.
3. LỜI THỀ. Lời thề trên dòng sông ranh giới trói được cả Thần Vương. Đây là thứ duy nhất trong thế giới này mạnh hơn quyền lực, và vì thế nó là vũ khí của kẻ yếu. Ai bội thề phải chịu hậu quả THẤY ĐƯỢC, không phải một lời rủa suông.
4. TÍN NGƯỠNG. Người phàm tin thì thần mạnh lên, người phàm quên thì thần yếu đi. Đây là nguồn sức mạnh MỚI mà phần lớn thần điện chưa nhận ra là đang làm lỗi thời bảng xếp hạng cũ. Ai hiểu ra trước — thần hay người — đều nguy hiểm.

RÀNG BUỘC: <%= dien.khoaLai %>
Bốn luật này áp cho CẢ <%= user.name %>. Không có ngoại lệ cho người chơi; nếu có ngoại lệ, nó phải được giành lấy và phải có người chứng kiến.`,
  },
  {
    uid: 'greek.diadanh',
    comment: '[Thiết lập cốt lõi] Bản đồ thiêng và thứ tự nó được phép hiện ra',
    key: ['địa danh', 'bản đồ', 'Olympus', 'Minh phủ', 'Tartarus', 'sông Styx', 'Crete', 'Atlantis'],
    group: 'coi_gioi',
    phase: 1,
    order: 3,
    content: `${NEN}
[BẢN ĐỒ THIÊNG · tầng <%= dien.tang %> · <%= dien.tyLe %>%]
Địa lý thiêng dựng lên SAU luật, không trước. Một nơi chốn mang tên của sách trong khi luật ở đó chưa đứng vững là lỗi thấy ngay: người chơi sẽ thấy một cái tên đẹp không có gì đỡ.

Thứ tự được phép hiện ra:
· Tầng 0–1 — chỉ là HƯỚNG: một dãy núi không ai lên tới, một hang không ai vào lại, một khúc sông người ta không uống nước. Chưa có tên.
· Tầng 2 — có TÊN nhưng còn tranh chấp: mỗi vùng gọi một kiểu, và người kể chuyện không được chốt hộ.
· Tầng 3 — bản đồ thiêng ĐỨNG: Olympus là nơi ở của thần điện; Minh phủ là cõi người chết; Tartarus là đáy giam thế hệ cũ; dòng sông ranh giới là chỗ để thề. Các nơi này bắt đầu có cư dân, có lối vào, có kẻ canh.
· Tầng 4 — địa danh gắn với sử thi: đảo trú ẩn, thành bị vây, thành phố dưới biển. Chúng chỉ hiện ra khi sử thi tương ứng đã có nguyên nhân trong ván.

CÁCH DÙNG: <%= dien.tenGoi %>
KHÓA: <%= dien.khoaLai %>
Nơi nào <%= user.name %> đã đặt tên hoặc đã làm nên lịch sử ở đó thì tên ấy THẮNG tên trong sách. Bảng này không được ghi đè lên Sử.`,
  },
];

// ─────────────────────────────────────────── chỗ của người chơi trong thần thoại

/**
 * Vì sao sách cần một entry riêng cho người chơi, và vì sao nó KHÔNG luôn-bật.
 *
 * Entry đạo diễn đã nói "không tự trao thân phận cho người chơi", nhưng đó là
 * một lệnh cấm. Cấm không đủ: model vẫn phải trả lời câu hỏi "kẻ này là ai" mỗi
 * lần một NPC nhìn vào người chơi, và nếu sách không trả lời thì model tự bịa —
 * thường bịa theo hướng dễ nhất, là cho người chơi một xuất thân sang trọng.
 *
 * Entry này trả lời bằng một chỗ TRỐNG có hình dạng rõ ràng: không gia phả, không
 * lời sấm, không phận để mà vượt. Ba cái "không" ấy là ba cơ chế chơi được trong
 * đúng thần thoại này, chứ không phải ba lời từ chối.
 *
 * Không đặt `constant` vì bốn entry điều phối đã chiếm phần luôn-bật, và entry
 * này chỉ có việc để làm khi cảnh thật sự nhìn vào người chơi. Bộ keyword bên
 * dưới lo phần bắn đúng lúc.
 */
const BIEN_SO = {
  uid: 'greek.bienso',
  comment: '[Thực thể] Biến Số — chỗ trống hình người trong thần thoại',
  key: [
    'Biến Số',
    'Kẻ Nhập Cuộc',
    'Người chơi',
    'kẻ lạ',
    'kẻ không gia phả',
    'kẻ ngoại lai',
    'con của ai',
    'xuất thân',
  ],
  keysecondary: [],
  constant: false,
  selective: true,
  selectiveLogic: 0,
  depth: 2,
  probability: 100,
  content: `## Sợi chỉ không ai xe
Ba Moirai xe, đo và cắt chỉ số phận của mọi sinh linh — kể cả của thần. Trong búi chỉ của họ không có sợi nào là của Biến Số. Không phải vì Biến Số mạnh hơn họ, mà vì họ chưa từng nhận nguyên liệu để xe nó. Các nữ thần biết mình thiếu một sợi và chưa biết thiếu ở chỗ nào.

## Trạng thái khởi nguyên
- KHÔNG GIA PHẢ. Ở thế giới này ai cũng là "con của ai đó": thân phận, quyền thừa kế, và cả mức độ được đối xử tử tế đều đọc ra từ gia phả. Biến Số không có dòng nào. Nghĩa là không ai nợ Biến Số gì — và cũng không ai biết xếp Biến Số vào đâu, nên họ sẽ tự gán cho một xuất thân. Cái họ gán sai đôi khi có ích hơn sự thật.
- TRẮNG TAY. Không hào quang định mệnh, không thần khí, không thân phận cao quý. Ngoại hình, xuất thân, năng lực đều là giấy trắng, chờ được định hình bằng lựa chọn và hành động.
- VẪN CHỊU LUẬT. Biến Số bị thương được, đói được, chết được. Bốn luật nền — số phận, thần cách, lời thề, tín ngưỡng — áp cho Biến Số đúng như áp cho mọi kẻ khác. Riêng lời thề trên dòng sông ranh giới trói Biến Số y hệt cách nó trói Thần Vương.
- KHÔNG ĐẶC QUYỀN NGUYÊN TÁC. Không thừa hưởng tài sản, kỹ năng, danh tiếng hay quan hệ của bất kỳ nhân vật nào trong dòng lịch sử gốc.

## Quyền năng của Biến Số
- LỜI SẤM CÂM. Các nhà tiên tri không đọc được Biến Số. Hỏi về Biến Số thì lời sấm im, hoặc trả về hai câu trái ngược nhau, hoặc làm kẻ hỏi ngất. Với một thế giới vận hành bằng lời sấm, đây vừa là lá chắn vừa là lý do mọi thế lực đều muốn mổ Biến Số ra xem bên trong có gì.
- KẺ LÀM LỆCH. Lời tiên tri ở đây luôn ứng nghiệm CHÍNH VÌ kẻ nghe cố tránh. Biến Số là chỗ duy nhất vòng lặp ấy đứt được — không phải bằng cách chống lại lời sấm, mà bằng cách đứng ở chỗ lời sấm không tính tới. Cứu được kẻ đã bị định là phải chết; đoạt được cơ duyên vốn thuộc về người khác; thắng được kẻ được định sẵn là sẽ thắng.
- CHƯA CÓ MỨC HUBRIS. Kiêu ngạo vượt phận thì bị trừng phạt, và "phận" đo bằng gia phả. Biến Số không có phận, nên không ai — kể cả thần — biết Biến Số vượt quá từ đâu. Ranh giới ấy chỉ được vẽ ra bằng lần đầu tiên có kẻ ra tay trừng phạt Biến Số, và trước lần ấy thì chưa ai chắc mình đúng.
- QUYỀN CỦA KHÁCH. Luật hiếu khách buộc chủ nhà phải tiếp kẻ lạ, cho ăn và cho ngủ TRƯỚC khi hỏi tên, và Thần Vương đích thân bảo trợ luật ấy. Đây là chỗ dựa duy nhất của một kẻ không gia phả — và cũng là chỗ Biến Số phản bội được, nếu chịu trả cái giá tương xứng.
- TỰ DO TUYỆT ĐỐI. Không phe, không sứ mệnh, không đạo lý nào ràng buộc sẵn. Biến Số chọn làm cứu tinh, bạo chúa, kẻ đứng nhìn, hay thế lực thứ ba giật dây từ trong bóng — cả bốn đều mở.

## Ràng buộc
- Các thực thể trong thế giới giữ nguyên bản ngã và trí tuệ của họ. Họ phản ứng với Biến Số một cách hợp lý — nghi ngờ, thăm dò, lợi dụng, hoặc phớt lờ — chứ không phục tùng vô lý và không đổi tính cách chỉ vì Biến Số có mặt.
- Mọi thứ Biến Số có được đều phải đổi bằng hành động CÓ NGƯỜI CHỨNG KIẾN. Sách này không trao gì cả; nó chỉ nói rằng chỗ trống ấy tồn tại và chưa ai đứng vào.`,
};

// ─────────────────────────────────────────── ráp sách

/** Entry do script tự viết bị loại khỏi nguồn để chạy lại không nhân đôi chúng. */
const BO_UID = new Set([...DIEU_PHOI.map((d) => d.uid), BIEN_SO.uid]);

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
  ...[BIEN_SO, ...sourceEntries.filter((e) => !BO_UID.has(String(e.uid ?? '')))]
    .filter((e) => e.enabled !== false && e.disable !== true)
    .map((e, i) => {
      const nhom = nhomCua(e);
      const giaiDoan = giaiDoanCua(e);
      const uidGoc = String(e.uid ?? e.id ?? i + 1);
      return {
        // Chạy lại script trên đầu ra của chính nó không được đẻ ra `greek.greek.7`.
        uid: uidGoc.startsWith('greek.') ? uidGoc : `greek.${uidGoc}`,
        comment: nhanCua(e) || `Entry ${i + 1}`,
        key: Array.isArray(e.key) ? e.key : Array.isArray(e.keys) ? e.keys : [],
        keysecondary: Array.isArray(e.keysecondary)
          ? e.keysecondary
          : Array.isArray(e.secondary_keys)
            ? e.secondary_keys
            : [],
        /*
         * `constant` của sách gốc bị hạ có chủ ý. Mười ba entry luôn-bật của một
         * card SillyTavern là hợp lý khi card ấy LÀ toàn bộ ngữ cảnh; ở đây sách
         * chỉ là một nguồn trong nhiều nguồn, và mười ba entry luôn-bật sẽ ăn hết
         * ngân sách truy hồi của cả biên niên lẫn ký ức nhân vật. Bốn entry điều
         * phối ở trên là những entry duy nhất được phép luôn-bật.
         */
        constant: false,
        selective: true,
        selectiveLogic: e.selectiveLogic ?? 0,
        order: DIEU_PHOI.length + i,
        depth: e.depth ?? 2,
        probability: e.probability ?? 100,
        group: nhom,
        phase: giaiDoan,
        // Bật sách KHÔNG được đẻ ra 149 thực thể. Narrator hiện thực hóa dần.
        deferMaterialization: true,
        content: khoiDau(e, nhom, giaiDoan) + boVoCu(String(e.content ?? '')),
      };
    }),
];

const built = {
  _format: 'thien_dien_lore',
  name: 'Thần thoại Hy Lạp',
  description:
    'Thế giới bắt đầu trống và kết tinh dần thành Olympus qua năm tầng: dấu hiệu, danh xưng, luật, cõi giới, sử thi. ' +
    'Đích đến là một dị bản của thần thoại Hy Lạp chứ không phải bản sao — trần kết tinh chỉ tới 68/100, và phần còn ' +
    'thiếu là phần của người chơi. Số phận, thần cách, lời thề và tín ngưỡng là bốn luật nền; địa danh chỉ dựng lên ' +
    'sau khi luật ở đó đã đứng vững.',
  thanHe: 'Hy Lạp · Olympus',
  version: '1.0.0',
  uuTien: 90,
  lucHapDan: 68,
  conflictPolicy: 'song_song',
  nhipMoGiaiDoan: 10,
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
const macDinh = sourceEntries.filter((e) => DI_BAN[chuDeCua(e)] === undefined).length;

console.log(`Đã tạo ${output}`);
console.log(`  ${entries.length} entry · ${theoNhom.size} nhóm · luôn-bật: ${DIEU_PHOI.length}`);
console.log(
  `  giai đoạn: ${[...theoGiaiDoan.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([p, n]) => `${p}→${n}`)
    .join(' ')}`,
);
console.log(`  entry dùng dòng dị bản mặc định: ${macDinh}/${sourceEntries.length}`);
