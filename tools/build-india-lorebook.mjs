import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const source = process.argv[2];
const output = resolve(process.argv[3] ?? 'public/lorebooks/than-thoai-an-do.json');
if (!source)
  throw new Error('Cách dùng: node tools/build-india-lorebook.mjs <worldbook-gốc.json> [đích.json]');

const raw = JSON.parse(readFileSync(resolve(source), 'utf8'));
const sourceEntries = Array.isArray(raw.entries) ? raw.entries : Object.values(raw.entries ?? {});

const categoryOf = (entry) => /^\[([^\]]+)\]/.exec(String(entry.comment ?? entry.name ?? ''))?.[1] ?? 'Khác';

function phaseOf(entry) {
  const category = categoryOf(entry);
  const firstKey = String(entry.key?.[0] ?? entry.keys?.[0] ?? '');
  if (category === 'Bối cảnh' || category === 'Thực thể') return 0;
  if (category === 'Khái niệm') return ['Brahman', 'Samsara', 'Dharma', 'Rta'].includes(firstKey) ? 0 : 1;
  if (category === 'Tổ chức' || category === 'Chủng tộc' || category === 'Địa danh') return 1;
  if (category === 'Nhân vật') return ['Brahma', 'Vishnu', 'Shiva'].includes(firstKey) ? 1 : 2;
  if (category === 'Vũ khí' || category === 'Vật phẩm') return 3;
  if (category === 'Lịch sử') return 4;
  return 2;
}

function groupOf(entry) {
  const category = categoryOf(entry);
  return (
    {
      'Bối cảnh': 'nen_vu_tru',
      'Khái niệm': 'quy_luat',
      'Tổ chức': 'the_luc',
      'Nhân vật': 'nhan_vat_than_thoai',
      'Chủng tộc': 'chung_toc',
      'Vũ khí': 'than_khi',
      'Vật phẩm': 'than_vat',
      'Địa danh': 'coi_gioi',
      'Thực thể': 'nguoi_choi',
      'Lịch sử': 'than_tich',
    }[category] ?? 'bo_sung'
  );
}

const dynamicHeader = (
  entry,
  phase,
  group,
) => `<%# EJS Lorebook an toàn: chỉ nội suy dữ liệu đã chiếu từ engine. %>
[NGỮ CẢNH ĐỘNG]
- Sách: <%= lore.bookName %>; lực hút <%= lore.gravity %>/100.
- Giai đoạn thế giới: <%= world.phase %> — <%= world.phaseLabel %>; năm <%= world.year %>, tick <%= world.tick %>.
- Người chơi/Biến Số: <%= user.name %> (vai trò <%= user.mode %>), là người tham dự có quyền làm lịch sử rẽ nhánh chứ không phải khách đứng ngoài.
- Neo đã thành lịch sử: <%= lore.realizedNames %>.
- Entry: <%= entry.name %>; nhóm ${group}; mở tự nhiên từ giai đoạn ${phase}.

[QUY TẮC HÒA NHẬP]
- Đây là thần thoại nguồn, không phải mệnh lệnh đóng đinh tương lai. Sử đã xảy ra và lựa chọn của <%= user.name %> luôn được ưu tiên.
- Mỗi cảnh chỉ hiện thực hóa tối đa một trọng tâm mới từ nhóm này; dùng dấu hiệu, tín ngưỡng, lời đồn và hệ quả trước khi cho thực thể lớn xuất hiện trực tiếp.
- Không tự trao thân phận, quan hệ, vật phẩm hay quyền năng cho <%= user.name %>. Mọi thứ phải hình thành qua hành động và sự kiện trong game.
- Nếu một entry khác cùng nhóm đang hiện diện, hãy bổ sung hoặc nối quan hệ; không tạo bản sao và không viết lại điều đã thành lịch sử.

`;

const director = {
  uid: 'india.director',
  comment: '[Bối cảnh] Đạo diễn diễn hóa Thần thoại Ấn Độ',
  key: ['Thần thoại Ấn Độ', 'Bharata', 'Biến Số'],
  keysecondary: [],
  constant: true,
  selective: false,
  order: 0,
  depth: 2,
  probability: 100,
  group: 'dieu_phoi',
  phase: 0,
  deferMaterialization: true,
  content: `<%# Entry điều phối luôn đi cùng sách nhưng không tự tạo entity. %>
[ĐẠO DIỄN THẦN THOẠI ẤN ĐỘ]
Thế giới đang ở giai đoạn <%= world.phase %> — <%= world.phaseLabel %>. Người chơi là <%= user.name %>.

1. Phát triển từ từ: quy luật và điềm báo → cõi giới và cộng đồng → thần linh/nhân vật → thần khí và thần tích.
2. Mỗi lượt chỉ gieo một hoặc hai yếu tố mới; ưu tiên phát triển điều đã gieo hơn là gọi thêm tên mới.
3. Dharma, Karma, Samsara và lựa chọn của người chơi tạo hệ quả, nhưng không tước tự do hành động.
4. Các thần và nhân vật giữ động cơ riêng; không tự yêu, phục tùng hoặc trao đặc quyền cho người chơi.
5. Thần thoại nguồn có thể rẽ nhánh. Không ép các sử thi phải lặp lại nguyên tác và không hồi sinh/xóa bỏ sự kiện chỉ để khớp sách.
6. Các entry cùng nhóm là ứng viên cạnh tranh cho một cảnh, không phải danh sách phải xuất hiện đồng thời.
7. Khi sách bị tắt, không dùng bất kỳ entry, quy luật hay lời tiên tri nào của sách để dẫn dắt lượt mới.`,
};

const entries = [
  director,
  ...sourceEntries
    .filter((entry) => entry.enabled !== false && entry.disable !== true)
    .map((entry, index) => {
      const phase = phaseOf(entry);
      const group = groupOf(entry);
      return {
        uid: `india.${entry.uid ?? entry.id ?? index + 1}`,
        comment: String(entry.comment ?? entry.name ?? `Entry ${index + 1}`),
        key: Array.isArray(entry.key) ? entry.key : Array.isArray(entry.keys) ? entry.keys : [],
        keysecondary: Array.isArray(entry.keysecondary)
          ? entry.keysecondary
          : Array.isArray(entry.secondary_keys)
            ? entry.secondary_keys
            : [],
        constant: entry.constant === true,
        selective: entry.selective !== false,
        selectiveLogic: entry.selectiveLogic ?? 0,
        order: index + 1,
        depth: entry.depth ?? 2,
        probability: entry.probability ?? 100,
        group,
        phase,
        deferMaterialization: true,
        content: dynamicHeader(entry, phase, group) + String(entry.content ?? ''),
      };
    }),
];

const built = {
  _format: 'thien_dien_lore',
  name: 'Thần thoại Ấn Độ',
  description:
    'Thần thoại nguồn Ấn Độ được mở theo từng giai đoạn, đặt người chơi vào vai Biến Số. Không ép thế giới lặp nguyên tác; lịch sử và lựa chọn trong game luôn thắng.',
  thanHe: 'Ấn Độ · Hindu',
  version: '1.0.0',
  uuTien: 90,
  lucHapDan: 72,
  conflictPolicy: 'song_song',
  nhipMoGiaiDoan: 8,
  soDiemHutMoiLuot: 2,
  entries,
};

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(built, null, 2)}\n`, 'utf8');
console.log(`Đã tạo ${output}: ${entries.length} entry.`);
