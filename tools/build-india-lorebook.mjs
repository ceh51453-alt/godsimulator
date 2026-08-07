/**
 * Dựng `public/lorebooks/than-thoai-an-do.json`.
 *
 * ── Vì sao script này chạy được trên chính đầu ra của nó ──
 *
 * Worldbook gốc của sách Ấn Độ không còn nằm trong repo, nhưng file đã dựng thì
 * còn — và nó chứa đủ mọi thứ: nội dung gốc cộng thêm một khối EJS ở đầu do bản
 * script cũ gắn vào. `boVoCu()` gỡ đúng khối ấy ra trước khi gắn khối mới, nên
 * chạy script trên `public/lorebooks/than-thoai-an-do.json` cho ra cùng kết quả
 * với chạy nó trên worldbook gốc. Idempotent, và không cần giữ một file nguồn
 * mà rồi sẽ lạc mất.
 *
 * ── Vì sao nhóm ở đây làm NGƯỢC với sách Hy Lạp ──
 *
 * Cả hai script dùng chung một quy tắc — "nhóm = một chủ đề" — nhưng quy tắc ấy
 * cho ra hai kết quả trái ngược, vì hai sách có hình dạng khác nhau:
 *
 *   Hy Lạp   Hera có 7 entry (ngoại hình, tâm lý, quan hệ…) → GỘP lại thành một
 *            nguồn, để một cảnh lấy đúng một mặt của Hera thay vì bảy đoạn mô tả
 *            chồng lên nhau.
 *   Ấn Độ    35 vị thần, mỗi vị đúng một entry, nhưng bản cũ nhét cả 35 vào một
 *            nhóm `nhan_vat_than_thoai` → TÁCH ra 35 nhóm. Shiva và Kali không
 *            phải hai mặt của cùng một thứ, và để MMR coi chúng là "trùng mạnh"
 *            nghĩa là một cảnh có cả hai sẽ mất một trong hai.
 *
 * Cái được giữ nguyên nhóm là những họ thật sự thay thế được nhau: mười bốn cõi
 * Loka, hai mươi khái niệm luật, các chủng tộc. Ở đó "một trọng tâm mỗi lượt"
 * đúng là điều mình muốn.
 *
 * Cách dùng:
 *   node tools/build-india-lorebook.mjs public/lorebooks/than-thoai-an-do.json
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const source = process.argv[2];
const output = resolve(process.argv[3] ?? 'public/lorebooks/than-thoai-an-do.json');
if (!source)
  throw new Error('Cách dùng: node tools/build-india-lorebook.mjs <nguồn.json> [đích.json]');

const raw = JSON.parse(readFileSync(resolve(source), 'utf8'));
const sourceEntries = Array.isArray(raw.entries) ? raw.entries : Object.values(raw.entries ?? {});

// ─────────────────────────────────────────── gỡ vỏ EJS của lần dựng trước

/**
 * Hai mốc kết thúc, vì đã có hai đời khối đầu.
 *
 * Dò bằng mốc cụ thể chứ không bằng "cắt tới dòng trống đầu tiên": nội dung gốc
 * của nhiều entry cũng có dòng trống, và một lần cắt nhầm sẽ ăn mất đoạn mở đầu
 * của entry mà không ai phát hiện — file vẫn hợp lệ, chỉ thiếu chữ.
 */
const MOC_HET_VO = [
  '- Nếu một entry khác cùng nhóm đang hiện diện, hãy bổ sung hoặc nối quan hệ; không tạo bản sao và không viết lại điều đã thành lịch sử.\n\n',
  '- Khóa: <%= dien.khoaLai %>\n\n',
];

function boVoCu(noiDung) {
  if (!noiDung.startsWith('<%#')) return noiDung;
  for (const moc of MOC_HET_VO) {
    const vi = noiDung.indexOf(moc);
    if (vi >= 0) return noiDung.slice(vi + moc.length);
  }
  return noiDung;
}

// ─────────────────────────────────────────── đọc nhãn của entry

const nhanCua = (e) => String(e.comment ?? e.name ?? '');
const loaiCua = (e) => /^\[([^\]]+)\]/.exec(nhanCua(e))?.[1]?.trim() ?? 'Khác';

/** `[Nhân vật] Shiva` → `Shiva`; `[Khái niệm] Samsara and Karma` → `Samsara and Karma`. */
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

/** Chỉ nhân vật mới tách theo chủ đề; xem đầu file về việc vì sao chỉ có nhân vật. */
const LOAI_THEO_CHU_DE = new Set(['Nhân vật']);

const NHOM_THEO_LOAI = {
  'Bối cảnh': 'nen_vu_tru',
  'Khái niệm': 'quy_luat',
  'Tổ chức': 'the_luc',
  'Chủng tộc': 'chung_toc',
  'Vũ khí': 'than_khi',
  'Vật phẩm': 'than_vat',
  'Địa danh': 'coi_gioi',
  'Thực thể': 'nguoi_choi',
  'Lịch sử': 'than_tich',
};

function nhomCua(e) {
  if (LOAI_THEO_CHU_DE.has(loaiCua(e))) return `nv_${slug(chuDeCua(e)) || slug(nhanCua(e)).slice(0, 24)}`;
  return NHOM_THEO_LOAI[loaiCua(e)] ?? 'bo_sung';
}

// ─────────────────────────────────────────── giai đoạn mở

const KHAI_NIEM_NEN = new Set(['Brahman', 'Rta', 'Dharma', 'Samsara and Karma']);
const TAM_THAN = new Set(['Brahma', 'Vishnu', 'Shiva']);

function giaiDoanCua(e) {
  const loai = loaiCua(e);
  const chuDe = chuDeCua(e);
  if (loai === 'Bối cảnh' || loai === 'Thực thể') return 0;
  if (loai === 'Khái niệm') return KHAI_NIEM_NEN.has(chuDe) ? 0 : 1;
  if (loai === 'Tổ chức' || loai === 'Chủng tộc' || loai === 'Địa danh') return 1;
  if (loai === 'Nhân vật') return TAM_THAN.has(chuDe) ? 1 : 2;
  if (loai === 'Vũ khí' || loai === 'Vật phẩm') return 3;
  if (loai === 'Lịch sử') return 4;
  return 2;
}

// ─────────────────────────────────────────── đường vào: cách một thứ nhập thế

/**
 * Không có dòng này, model mặc định cho mọi thứ nhập thế theo một kiểu duy nhất
 * — nó MÔ TẢ. Một vị thần được mô tả thì đã có mặt rồi, và thế giới mất luôn
 * quãng đường từ "chưa ai biết" tới "ai cũng biết", tức mất đúng phần mà một ván
 * chơi về thần thoại đang lớn lên có để chơi.
 */
const DUONG_VAO = {
  'Nhân vật':
    'Một vị thần nhập thế qua ba nấc và không được nhảy cóc: HỆ QUẢ trước (mùa lệch, dịch bệnh, một giấc mơ ' +
    'lặp lại ở nhiều người), rồi TÊN VÀ TÍN NGƯỠNG (có kẻ gọi đúng, có kẻ gọi sai, có kẻ cãi nhau về cách gọi), ' +
    'rồi mới tới THÂN XÁC. Và ở thần thoại này còn một lối thứ tư đi vòng qua cả ba: GIÁNG PHÀM — vị ấy đã ở ' +
    'trong cảnh từ lâu dưới một thân phận không ai ngờ, kể cả chính thân phận ấy.',
  'Khái niệm':
    'Một khái niệm nhập thế bằng chỗ nó GIẢI THÍCH ĐƯỢC một chuyện vừa xảy ra. Không giảng nó ra — cho chuyện ' +
    'xảy ra trước, rồi để một người trong thế giới gọi tên chuyện ấy, và gọi chưa chuẩn. Bản chuẩn tới sau, qua ' +
    'tranh cãi giữa những kẻ đều tin là mình đúng.',
  'Địa danh':
    'Một cõi nhập thế bằng KẺ ĐI TỪ ĐÓ TỚI, hoặc bằng kẻ mơ thấy nó rồi tỉnh dậy mang theo một thứ không thuộc ' +
    'về đây — không bằng một tấm bản đồ. Mười bốn cõi không hiện ra cùng lúc; mỗi lần chỉ một tầng, và tầng ấy ' +
    'phải liên quan tới chuyện đang xảy ra.',
  'Tổ chức':
    'Một tập thể nhập thế bằng DẤU VẾT PHỐI HỢP: hai nơi cách xa nhau làm cùng một lễ, một phán quyết mà nhiều ' +
    'kẻ cùng tuân dù không ai ra lệnh. Cái tên chung tới sau cùng.',
  'Chủng tộc':
    'Một giống loài nhập thế theo thứ tự: lời đồn của kẻ sống sót → một cái xác hoặc một dấu vết → một cuộc gặp. ' +
    'Bỏ qua hai nấc đầu là biến chúng thành mục từ trong sách tra cứu.',
  'Vũ khí':
    'Một astra nhập thế bằng LỜI CHÚ triệu nó và CÁI GIÁ phải trả để dùng, không bằng sức công phá. Thứ đáng sợ ' +
    'ở đây không phải nó mạnh tới đâu mà là ai được phép biết câu chú, và người ấy đã hứa gì để đổi lấy.',
  'Vật phẩm':
    'Một bảo vật nhập thế bằng CÁI NÓ LÀM ĐƯỢC, không bằng cái nó là. Ai cũng biết có một thứ làm được điều đó ' +
    'từ lâu trước khi có ai biết nó tên gì và nằm ở đâu.',
  'Bối cảnh':
    'Nền vũ trụ hiện ra qua chỗ nó GIỚI HẠN người ta — qua điều không làm được, không qua bản mô tả. Không bao ' +
    'giờ kể nền vũ trụ bằng giọng người biết hết.',
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
 * Model đọc một entry mô tả Indra là vua chư thiên sẽ mặc định Indra là vua chư
 * thiên mãi mãi, vì entry viết ở thì hiện tại và không có gì trong đó nói rằng
 * điều ấy CÓ THỂ THÔI ĐÚNG. Dòng này là chỗ nói điều ấy, và nó phải CỤ THỂ.
 */
const DI_BAN = {
  Brahman:
    'Brahman không có ý muốn, không phe, không can thiệp. Đây là TRẦN của thế giới: mọi tham vọng dừng lại ở ' +
    'chỗ chạm vào nó. Đừng cho nó hành động, đừng cho nó nói.',
  Brahma:
    'Brahma tạo ra tất cả và gần như không ai lập đền thờ ông. Một đấng sáng tạo bị chính tạo vật của mình quên ' +
    'đi là chỗ nứt lớn nhất trong tôn ti của thần điện — và ông biết mình đang bị quên.',
  Vishnu:
    'Vishnu giữ thế giới bằng cách GIÁNG XUỐNG nó, và chín lần đã xong. Lần thứ mười còn để trống. Ở ván này, ' +
    'ai lấp chỗ trống ấy và lấp bằng cách nào là câu hỏi mở — kể cả khi câu trả lời không phải Kalki.',
  Shiva:
    'Shiva ban ơn cho BẤT KỲ AI tu khổ hạnh đủ sâu, kể cả asura, kể cả kẻ định dùng ơn ấy để giết chính ông. ' +
    'Đây là lỗ hổng lớn nhất trong thế thượng phong của chư thiên, và nó không phải sơ suất — ông biết và vẫn ban.',
  Indra:
    'Indra làm vua bằng CHỨC VỤ chứ không bằng dòng dõi, và ông đã mất ngôi nhiều lần — vì lời nguyền, vì tội của ' +
    'chính mình, vì khổ hạnh của một kẻ phàm. Ông sợ mọi người đang tu, và nỗi sợ ấy khiến ông làm những việc ' +
    'khiến ông đáng mất ngôi hơn.',
  Yama:
    'Yama là NGƯỜI CHẾT ĐẦU TIÊN, và vì thế mới thành kẻ phán xử người chết. Ông không giữ ai lại — ông cân rồi ' +
    'trả về. Cõi của ông là một cửa khẩu có sổ sách, không phải một nhà tù, nên "ta sẽ giết ngươi" ở thế giới này ' +
    'là một lời đe dọa yếu.',
  Kali:
    'Kali sinh ra từ cơn giận của Durga và không tự dừng lại được — phải có kẻ nằm xuống dưới chân bà thì bà mới ' +
    'tỉnh. Bà không phải cái ác; bà là sức mạnh đúng đắn KHÔNG CÓ PHANH. Ai gọi bà ra phải tính trước ai sẽ nằm xuống.',
  Durga:
    'Durga được tạo ra bằng cách gộp vũ khí của tất cả các thần, vì không vị nào một mình làm nổi. Bà là bằng ' +
    'chứng sống rằng thần điện có những việc phải cần tới một kẻ đứng ngoài nó.',
  Krishna:
    'Krishna là vị thần CHỌN PHE, cầm cương xe cho một người, và tranh luận giữa trận. Thần tính ở đây là sự ' +
    'tham dự chứ không phải sự siêu việt — và một vị thần đã chọn phe thì cũng chịu hậu quả của phe mình.',
  Rama:
    'Rama đúng dharma tới mức tàn nhẫn: ông đày Sita vì lời đồn của dân, dù biết bà vô tội. Ở ván này đó là câu ' +
    'hỏi mở chứ không phải một kết cục — cái giá của việc luôn luôn đúng là chỗ Rama vỡ ra được.',
  Sita:
    'Sita phải bước qua lửa để chứng minh mình trong sạch, rồi vẫn bị nghi. Bà kết thúc bằng cách tự xin đất nứt ' +
    'ra nuốt mình — một lời từ chối, không phải một bi kịch thụ động. Chỗ ấy trong ván này mở.',
  Ravana:
    'Ravana là bậc bác học, nhạc sĩ, và tín đồ trung thành của Shiva. Ơn huệ của ông chừa loài người ra vì ông ' +
    'khinh họ tới mức không buồn tính. Khuyết điểm duy nhất của ông là kiêu — và đó là khuyết điểm chữa được.',
  Karna:
    'Karna đúng ở mọi thước đo trừ thân phận lúc sinh, và ông thua vì SỔ NỢ chứ không vì cung kém. Ông là chỗ ' +
    'thần thoại này tự vấn về chính hệ đẳng cấp của nó, và ván này được phép đẩy câu tự vấn ấy đi xa hơn.',
  Arjuna:
    'Arjuna là người dừng lại giữa trận để HỎI. Toàn bộ trọng lượng đạo đức của sử thi nằm ở câu hỏi ấy, không ở ' +
    'mũi tên nào. Nếu ván này có một trận lớn, phải có một người hỏi — và người ấy không nhất thiết là Arjuna.',
  Hanuman:
    'Hanuman bị nguyền quên mất sức mạnh của mình cho tới khi có người nhắc. Sức mạnh lớn nhất trong thế giới ' +
    'này đang ngủ trong một kẻ không biết mình có nó, và ai đánh thức nó là chuyện của ván này.',
  Ganesha:
    'Ganesha dẹp chướng ngại và cũng ĐẶT chướng ngại — cùng một chức năng, hai chiều. Ông quyết định ai được đi ' +
    'qua, và quyết định ấy không phải lúc nào cũng theo lẽ công bằng.',
  Kalki:
    'Kalki CHƯA tới. Kết thúc của Kali Yuga là một chỗ trống trong lịch, không phải một sự kiện đã đóng đinh. ' +
    'Ván này có thể lấp nó bằng một hình dạng khác, hoặc đẩy nó xa ra, hoặc kéo nó tới sớm.',
  Ganga:
    'Ganga dìm bảy đứa con mình để giải thoát cho chúng, rồi bỏ chồng khi ông ngăn bà. Lòng thương ở thần thoại ' +
    'này có thể trông giống hệt tội ác, và không ai ngoài cuộc phân biệt nổi.',
  Parvati:
    'Parvati giành được Shiva bằng khổ hạnh, không bằng sắc đẹp — bà tu tới mức chư thiên phải can thiệp. Đó là ' +
    'bằng chứng rằng kiên trì thắng được cả sự thờ ơ của một vị thần.',
  Saraswati:
    'Saraswati là tri thức, và tri thức trong thần thoại này không đứng về phe nào — bà dạy cả kẻ sẽ dùng điều ' +
    'học được để phá thế giới. Đó là thiết kế, không phải sơ suất.',
  Lakshmi:
    'Lakshmi BỎ ĐI khỏi nơi mất đức, và bà đã bỏ đi nhiều lần. Thịnh vượng ở đây là một vị khách có điều kiện, ' +
    'không phải một tài sản.',
  Mohini:
    'Mohini là Vishnu trong hình dạng nữ, dùng để LỪA — và lừa thành công cả asura lẫn Shiva. Ở thần thoại này, ' +
    'kẻ đáng tin nhất cũng gian lận khi cần, và điều đó không làm ông thôi đáng tin.',

  // ── luật nền ──
  Dharma:
    'Dharma không phải một bộ luật viết sẵn: nó phụ thuộc vào ANH LÀ AI và ĐANG Ở GIAI ĐOẠN NÀO. Cùng một hành ' +
    'động là đúng với người này và sai với người kia. Vì vậy hai bên trong một cuộc chiến đều có thể đúng dharma ' +
    'của mình — và đó là bi kịch trung tâm của cả thần thoại.',
  'Samsara and Karma':
    'Nghiệp là SỔ NỢ do chính mình ghi, không phải sợi chỉ người khác dệt: trả sớm được, hoãn được, trả bằng khổ ' +
    'hạnh được, chuyển sang kiếp sau được. Mọi lời đe dọa và mọi lời hứa trong thế giới này đều nên đọc như một ' +
    'khoản nợ có kỳ hạn.',
  Tapasya:
    'Khổ hạnh sinh ra quyền năng THẬT và đo được, và nó không hỏi anh là ai. Một kẻ phàm tu đủ lâu vượt được một ' +
    'vị thần lười. Đây là cửa lớn nhất mở ra cho <%= user.name %>, và cũng là thứ khiến cả thiên giới mất ngủ.',
  Vardaan:
    'Ơn huệ đã ban thì KHÔNG RÚT LẠI ĐƯỢC, kể cả khi kẻ nhận dùng nó để giết chính người ban. Vì vậy cách duy ' +
    'nhất để thắng một kẻ có ơn huệ là tìm chỗ hở trong CÂU CHỮ của lời ban — và thần thoại này thắng bằng cách ' +
    'ấy nhiều hơn bằng vũ lực.',
  Shapa:
    'Lời nguyền trói được cả thần, và một rishi giận dữ nguy hiểm hơn một đạo quân. Đây là vũ khí của kẻ yếu, và ' +
    'nó phải luôn có hiệu lực THẤY ĐƯỢC — một lời nguyền không ứng nghiệm sẽ làm hỏng cả bốn luật còn lại.',
  Maya:
    'Maya nghĩa là cảnh đang diễn ra có thể không phải cái nó trông như. Dùng điều này TIẾT CHẾ: một thế giới mà ' +
    'mọi thứ đều có thể là ảo thì không còn gì đáng quan tâm. Maya phải tốn kém, phải có kẻ dựng ra nó, và phải ' +
    'vỡ được.',
  Avatar:
    'Giáng phàm nghĩa là bất kỳ ai trong cảnh cũng có thể đang mang một phần của thần mà chính họ không biết. ' +
    'Điều này áp cho cả <%= user.name %> — nhưng phải được KHÁM PHÁ qua sự kiện, không được tuyên bố sẵn.',
  Moksha:
    'Giải thoát là lối ra duy nhất khỏi vòng, và nó nằm NGOÀI bàn cờ chính trị: kẻ đạt được nó thôi tham gia. ' +
    'Vì vậy nó vừa là phần thưởng cao nhất vừa là nước đi từ bỏ mọi thứ khác.',
  Yuga:
    'Thời gian ở đây là VÒNG, không phải đường thẳng: mọi thứ đã xảy ra rồi và sẽ xảy ra lại. Điều đó khiến bi ' +
    'kịch nặng hơn chứ không nhẹ đi — người ta biết trước và vẫn không tránh được.',
  Rna:
    'Ba món nợ — với tổ tiên, với hiền triết, với thần linh — là thứ mọi người sinh ra đã mang. Không ai trong ' +
    'thế giới này bắt đầu từ số không, kể cả <%= user.name %>.',
  Varna:
    'Đẳng cấp quyết định dharma của một người, và đó là chỗ thần thoại này tự mâu thuẫn nặng nhất: Karna giỏi hơn ' +
    'tất cả và vẫn thua vì sinh ra sai chỗ. Ván này được phép đẩy vào đúng vết nứt ấy.',
  Yajna:
    'Lễ tế là HỢP ĐỒNG có điều khoản, không phải lời cầu xin. Một vị vua tế đủ trăm lễ ngựa đe dọa được cả ngôi ' +
    'vua trời — nên mỗi đàn tế lớn trong thế giới là một động thái chính trị, và Indra luôn cử người tới phá.',

  // ── thế lực và giống loài ──
  Asura:
    'Asura KHÔNG phải cái ác. Họ cùng cha với Deva, họ tu khổ hạnh giỏi hơn, và họ đã thắng nhiều lần. Cuộc chiến ' +
    'ở đây là nội chiến tuần hoàn, không phải chiến thắng vĩnh viễn của bên tốt — và tính chính danh của thiên ' +
    'giới mỏng hơn thiên giới muốn thừa nhận.',
  Deva:
    'Deva mất quyền theo chu kỳ và BIẾT mình sẽ mất. Điều đó khiến họ hành xử như chính trị gia sắp hết nhiệm kỳ ' +
    'chứ không như chủ sở hữu vĩnh viễn.',
  Rakshasa:
    'Rakshasa có thể là bậc bác học, có vương quốc, có tôn giáo. Gọi tên giống loài không nói lên phẩm chất của ' +
    'một cá thể — đó là quy tắc áp cho cả bảng chúng sinh của thần thoại này.',
  Amrita:
    'Trước khi Amrita trồi lên thì độc Halahala trồi lên trước, và phải có kẻ chịu nuốt nó. Cái giá luôn tới ' +
    'TRƯỚC phần thưởng, và ai không chịu trả trước thì không tới được phần sau.',
  Halahala:
    'Halahala là cái giá của Amrita, và người nuốt nó không chết nhưng mang vết mãi mãi. Trong thế giới này, cứu ' +
    'được tất cả thường nghĩa là một người hỏng vĩnh viễn.',
  'The Anomaly':
    'Đây là chỗ của <%= user.name %> trong thần thoại. Nó là một chỗ TRỐNG hình người, không phải một thân phận ' +
    'được trao: sách không cho <%= user.name %> dòng dõi, quyền năng, ơn huệ hay quan hệ nào. Mọi thứ ấy phải ' +
    'giành được qua sự kiện trong ván, và khi giành được rồi thì nó là Sử, không ai lấy lại được.',
  Timeline:
    'Dòng thời gian là NHỊP ĐỘ để biết cái gì chưa tới lượt, không phải lịch trình phải chạy cho hết. Sự kiện ' +
    'trong đó chỉ xảy ra khi nguyên nhân của nó đã có mặt trong ván này.',
  Cosmology:
    'Nền vũ trụ là trần và sàn của mọi chuyện xảy ra sau. Nó không được kể ra một lần cho xong — nó lộ dần qua ' +
    'chỗ nó chặn người ta lại.',
};

const DI_BAN_MAC_DINH =
  'Nguyên tác cho nhân vật/sự vật này một kết cục. Kết cục ấy là ĐIỂM HÚT, không phải hợp đồng: nếu ván này đi ' +
  'khác thì chỗ đi khác MỚI là sự thật của thế giới, còn nguyên tác lùi xuống thành "bản mà người ta hay kể".';

const diBanCua = (e) => DI_BAN[chuDeCua(e)] ?? DI_BAN_MAC_DINH;
const duongVaoCua = (e) => DUONG_VAO[loaiCua(e)] ?? DUONG_VAO_MAC_DINH;

// ─────────────────────────────────────────── khối EJS gắn đầu mỗi entry

/**
 * Khối này cố tình NGẮN. Mọi quy tắc bất biến nằm ở bốn entry điều phối
 * `lop: 'loi'` — chúng luôn có mặt, nên nhắc lại ở đây là trả tiền token cho
 * cùng một câu chín mươi lần.
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
    uid: 'india.director',
    comment: '[Bối cảnh] Đạo diễn — thế giới kết tinh dần thành Bharata',
    key: ['Thần thoại Ấn Độ', 'Bharata', 'kết tinh', 'Biến Số'],
    group: 'dieu_phoi',
    phase: 0,
    order: 0,
    content: `${NEN}
[ĐẠO DIỄN · THẾ GIỚI ĐANG TRỞ THÀNH THẦN THOẠI ẤN ĐỘ]
Giai đoạn <%= world.phase %> — <%= world.phaseLabel %>. Tầng kết tinh <%= dien.tang %> "<%= dien.nhan %>", mức <%= dien.tyLe %>%. Người chơi: <%= user.name %>.
Neo đã thành lịch sử: <%= lore.realizedNames %>.

1. Thế giới KHÔNG bắt đầu là Bharata. Nó bắt đầu trống và kết tinh dần qua năm tầng: dấu hiệu → danh xưng → luật → cõi giới → sử thi. Đích đến là một DỊ BẢN của thần thoại Ấn Độ, không phải bản sao của nó.
2. Mức kết tinh <%= dien.tyLe %>% là TRẦN, không phải chỉ tiêu. <%= dien.chiDan %>
3. Không đảo thứ tự năm tầng. Mười bốn cõi Loka bày ra hết ở lượt đầu là mất trắng phần còn lại của ván; một vị trong Trimurti bước ra chào sớm cũng vậy.
4. Mỗi lượt gieo nhiều nhất MỘT yếu tố mới của sách. Ưu tiên phát triển thứ đã gieo hơn là gọi thêm tên mới. Thế giới lớn lên bằng chiều sâu, không bằng danh sách.
5. Trần kết tinh không bao giờ chạm 100 vì lực hút chỉ có <%= lore.gravity %>/100. Phần còn thiếu ấy KHÔNG phải thiếu sót — nó là phần của <%= user.name %>, và phải được lấp bằng chuyện xảy ra trong ván chứ không bằng nguyên tác.
6. <%= user.name %> ở BÊN TRONG thần thoại này, không phải khán giả. Việc <%= user.name %> làm quyết định thần thoại kết tinh theo hướng nào — nhưng KHÔNG được tự trao cho <%= user.name %> thân phận, dòng dõi, ơn huệ hay quyền năng nào. Mọi thứ phải giành được qua sự kiện trong game.
7. Các thần và nhân vật giữ động cơ riêng. Không ai tự yêu, tự phục tùng hay tự trao đặc quyền cho <%= user.name %> chỉ vì đó là người chơi.
8. Sử thi Ramayana và Mahabharata KHÔNG phải kịch bản phải chạy cho hết. Chúng chỉ được khởi động khi nguyên nhân của chúng đã có mặt trong chính ván này, và <%= user.name %> phải kịp can thiệp trước khi chúng không còn ngăn được nữa.
9. Khi sách bị TẮT, không dùng bất kỳ entry, quy luật, lời tiên tri hay tên gọi nào của sách để dẫn dắt lượt mới. Những gì đã xảy ra vẫn là lịch sử của thế giới; những gì sách mới chỉ hứa thì thôi.`,
  },
  {
    uid: 'india.chongxungdot',
    comment: '[Bối cảnh] Quy tắc chống xung đột khi nhiều entry cùng bật',
    key: ['xung đột entry', 'nhiều entry', 'trọng tâm cảnh'],
    group: 'dieu_phoi',
    phase: 0,
    order: 1,
    content: `${NEN}
[CHỐNG XUNG ĐỘT · áp cho MỌI entry của sách này]
Sách đang có <%= lore.activeEntryCount %> entry hoạt động. Nhiều entry cùng vào một cảnh là chuyện bình thường và KHÔNG được xử lý bằng cách nói hết.

1. MỘT TRỌNG TÂM MỘT LƯỢT. Trong các entry cùng nhóm, chỉ một entry được làm trọng tâm; các entry còn lại nhiều nhất là một câu nền. Mười bốn cõi Loka là một nhóm — một cảnh lấy một tầng, không lấy cả thang.
2. ENTRY LÀ ỨNG VIÊN, KHÔNG PHẢI DÀN Ý. Không có nghĩa vụ dùng hết những gì được đưa vào ngữ cảnh. Một entry không dùng tới thì im — không cần nhắc để chứng tỏ đã đọc.
3. SỬ THẮNG NGUỒN. Nếu entry nói khác điều đã xảy ra trong ván, điều đã xảy ra thắng. Không sửa lại quá khứ và không giả vờ entry đã tiên đoán đúng.
4. HAI ENTRY MÂU THUẪN NHAU thì kể mâu thuẫn ấy như hai truyền thống khác nhau trong thế giới — thần thoại này vốn có nhiều dị bản của cùng một chuyện, và sự vênh ấy là đặc điểm chứ không phải lỗi. Đừng chọn bừa một bên rồi giấu bên kia.
5. TRÙNG LẶP thì gộp, không nói hai lần bằng hai giọng.
6. Entry được người chơi GỌI ĐÍCH DANH luôn thắng entry do engine gợi ý, kể cả khi nó chưa tới giai đoạn mở.
7. Entry không đủ chỗ trong lượt này KHÔNG mất — nó là ứng viên của lượt sau. Không dồn nội dung của nó vào một câu tóm tắt cho kịp.`,
  },
  {
    uid: 'india.bonluat',
    comment: '[Khái niệm] Bốn luật nền — nghiệp, khổ hạnh, luân hồi, ảo ảnh',
    key: ['dharma', 'karma', 'nghiệp', 'khổ hạnh', 'tapasya', 'luân hồi', 'samsara', 'maya', 'quy luật'],
    group: 'quy_luat',
    phase: 0,
    order: 2,
    content: `${NEN}
[BỐN LUẬT NỀN · tầng <%= dien.tang %> "<%= dien.nhan %>" · <%= dien.tyLe %>%]
Thần thoại này kết tinh bằng LUẬT trước khi kết tinh bằng nhân vật. Bốn luật dưới đây là bộ xương; mỗi luật chỉ được cho ra kết quả đo được từ tầng 2 "luật thành" trở lên. Trước đó chúng chỉ là kiêng kỵ mà người ta giữ nhưng chưa giải thích nổi.

1. DHARMA VÀ KARMA. Bổn phận phụ thuộc vào anh LÀ AI và đang ở GIAI ĐOẠN NÀO của đời — nên hai bên trong một cuộc chiến đều có thể đúng dharma của mình, và đó là bi kịch trung tâm. Nghiệp là sổ nợ do chính mình ghi: trả sớm được, hoãn được, chuyển sang kiếp sau được. Mọi lời hứa và mọi lời đe dọa trong thế giới này đều là khoản nợ có kỳ hạn.
2. KHỔ HẠNH, ƠN HUỆ VÀ LỜI NGUYỀN. Tapasya sinh ra quyền năng THẬT và không hỏi anh là ai — kẻ phàm tu đủ lâu vượt được một vị thần lười. Ơn huệ đã ban thì không rút lại được, kể cả khi kẻ nhận dùng nó để giết người ban; thắng một kẻ có ơn huệ phải bằng chỗ hở trong CÂU CHỮ. Lời nguyền trói được cả thần, nên một rishi giận dữ nguy hiểm hơn một đạo quân. Đây là cửa của <%= user.name %>, và cũng là thứ khiến thiên giới mất ngủ.
3. LUÂN HỒI VÀ GIẢI THOÁT. Chết là bị cân rồi trả về một kiếp khác, nên cõi chết là cửa khẩu chứ không phải nhà tù, và "ta sẽ giết ngươi" là lời đe dọa yếu. Lối ra duy nhất khỏi vòng là moksha — và kẻ đạt được nó thôi tham gia mọi cuộc chơi, nên nó vừa là phần thưởng cao nhất vừa là nước đi từ bỏ tất cả.
4. ẢO ẢNH VÀ GIÁNG PHÀM. Cảnh đang diễn ra có thể không phải cái nó trông như, và bất kỳ ai cũng có thể đang mang một phần của thần mà chính họ không biết — kể cả <%= user.name %>. Dùng cả hai TIẾT CHẾ: maya phải tốn kém, phải có kẻ dựng ra, và phải vỡ được; giáng phàm phải được khám phá qua sự kiện, không được tuyên bố sẵn.

RÀNG BUỘC: <%= dien.khoaLai %>
Bốn luật này áp cho CẢ <%= user.name %>. Không có ngoại lệ cho người chơi; nếu có ngoại lệ, nó phải được giành lấy và phải có người chứng kiến.`,
  },
  {
    uid: 'india.diadanh',
    comment: '[Địa danh] Thang mười bốn cõi và thứ tự nó được phép hiện ra',
    key: ['loka', 'cõi giới', 'Swarga', 'Naraka', 'Patala', 'Kailash', 'Vaikuntha', 'Meru'],
    group: 'coi_gioi',
    phase: 1,
    order: 3,
    content: `${NEN}
[THANG MƯỜI BỐN CÕI · tầng <%= dien.tang %> · <%= dien.tyLe %>%]
Vũ trụ này có mười bốn cõi xếp thành thang, và cả thang KHÔNG được bày ra một lần. Một bản đồ đầy đủ giao cho người chơi ở lượt đầu là một bản đồ không ai còn muốn đi.

Thứ tự được phép hiện ra:
· Tầng 0–1 — chỉ là HƯỚNG và CẢM GIÁC: một ngọn núi không ai lên tới, một hang thở ra hơi lạnh, một khúc sông người ta không dám lội. Chưa tên, chưa tầng, chưa biết trên hay dưới.
· Tầng 2 — có TÊN nhưng còn tranh chấp: mỗi vùng gọi một kiểu và xếp thứ tự khác nhau. Người kể chuyện không được chốt hộ thang nào đúng.
· Tầng 3 — thang ĐỨNG. Bhuloka là trần gian; Swarga là cõi Indra; Naraka là nơi trả nghiệp CÓ KỲ HẠN; bảy tầng Patala ở dưới là vương quốc của asura và naga, giàu hơn thiên giới; Kailash của Shiva và Vaikuntha của Vishnu đứng ngoài tôn ti của Indra. Các cõi bắt đầu có cư dân, có lối đi lại, có kẻ canh.
· Tầng 4 — cõi gắn với sử thi và với giải thoát: Satya Loka, Tapoloka, Janaloka. Chúng chỉ hiện ra khi có người trong ván thật sự đang đi về phía đó.

RÀNG BUỘC: mỗi cảnh nhiều nhất MỘT tầng cõi. Đi giữa các cõi phải TỐN — thời gian, ơn huệ, hoặc một cái giá.
CÁCH DÙNG: <%= dien.tenGoi %>
KHÓA: <%= dien.khoaLai %>
Nơi nào <%= user.name %> đã đặt tên hoặc đã làm nên lịch sử ở đó thì tên ấy THẮNG tên trong sách.`,
  },
];

// ─────────────────────────────────────────── ráp sách

const BO_UID = new Set(DIEU_PHOI.map((d) => d.uid));

const noiDungEntries = sourceEntries
  .filter((e) => e.enabled !== false && e.disable !== true)
  .filter((e) => !BO_UID.has(String(e.uid ?? '')));

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
  ...noiDungEntries.map((e, i) => {
    const nhom = nhomCua(e);
    const giaiDoan = giaiDoanCua(e);
    const uidGoc = String(e.uid ?? e.id ?? i + 1);
    return {
      // Chạy lại script trên đầu ra của chính nó không được đẻ ra `india.india.7`.
      uid: uidGoc.startsWith('india.') ? uidGoc : `india.${uidGoc}`,
      comment: nhanCua(e) || `Entry ${i + 1}`,
      key: Array.isArray(e.key) ? e.key : Array.isArray(e.keys) ? e.keys : [],
      keysecondary: Array.isArray(e.keysecondary)
        ? e.keysecondary
        : Array.isArray(e.secondary_keys)
          ? e.secondary_keys
          : [],
      // Chỉ bốn entry điều phối được luôn-bật; xem `build-greek-lorebook.mjs`.
      constant: false,
      selective: true,
      selectiveLogic: e.selectiveLogic ?? 0,
      order: DIEU_PHOI.length + i,
      depth: e.depth ?? 2,
      probability: e.probability ?? 100,
      group: nhom,
      phase: giaiDoan,
      // Bật sách KHÔNG được đẻ ra hàng loạt thực thể. Narrator hiện thực hóa dần.
      deferMaterialization: true,
      content: khoiDau(e, nhom, giaiDoan) + boVoCu(String(e.content ?? '')),
    };
  }),
];

const built = {
  _format: 'thien_dien_lore',
  name: 'Thần thoại Ấn Độ',
  description:
    'Thế giới bắt đầu trống và kết tinh dần thành Bharata qua năm tầng: dấu hiệu, danh xưng, luật, cõi giới, sử thi. ' +
    'Đích đến là một dị bản chứ không phải bản sao — trần kết tinh chỉ tới 72/100, và phần còn thiếu là phần của ' +
    'người chơi. Nghiệp, khổ hạnh, luân hồi và ảo ảnh là bốn luật nền; mười bốn cõi Loka mở dần chứ không bày ra ' +
    'một lượt.',
  thanHe: 'Ấn Độ · Hindu',
  version: '2.0.0',
  uuTien: 90,
  lucHapDan: 72,
  conflictPolicy: 'song_song',
  nhipMoGiaiDoan: 8,
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
const macDinh = noiDungEntries.filter((e) => DI_BAN[chuDeCua(e)] === undefined).length;

console.log(`Đã tạo ${output}`);
console.log(`  ${entries.length} entry · ${theoNhom.size} nhóm · luôn-bật: ${DIEU_PHOI.length}`);
console.log(
  `  giai đoạn: ${[...theoGiaiDoan.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([p, n]) => `${p}→${n}`)
    .join(' ')}`,
);
console.log(`  entry dùng dòng dị bản mặc định: ${macDinh}/${noiDungEntries.length}`);
