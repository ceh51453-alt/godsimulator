/**
 * Chín regex script của preset "Thiên Diễn · Sáng Thế Thần v1".
 *
 * ── Ràng buộc của sandbox Thiên Diễn (core/preset/sandbox.ts) ──
 *
 * · `placement` chỉ nhận 1 (đầu vào người chơi) và 2 (đầu ra AI). 3/5/6 chưa hỗ trợ.
 * · Pattern viết dạng `/mẫu/cờ` thì cờ do preset khai; viết TRẦN thì `new RegExp`
 *   không cờ, tức thay lần khớp đầu — đúng `regexFromString` của SillyTavern.
 * · Hình dạng quay lui theo hàm mũ bị từ chối trước khi chạy: `(a+)+`, `(a*)*`,
 *   `(x|x)+`, `{4 chữ số,}`. Cả chín pattern dưới đây đã được
 *   `tools/build-preset-sang-the.mjs` kiểm bằng đúng logic của `bienRegex()`.
 * · `minDepth` chỉ có hiệu lực khi ≥ -1; `maxDepth` chỉ có hiệu lực khi ≥ 0.
 *   Khai `maxDepth: -1` là tự tắt chính regex của mình ở mọi tin nhắn.
 * · `substituteRegex` phải là 0: Thiên Diễn không thay macro vào `findRegex`.
 * · Mỗi lần chạy có trần `tuning.preset.maxRegexMs` = 20 ms và trần 200.000 ký tự.
 *
 * ── Vì sao khối tư duy bị xóa ở BA đường ──
 *
 * 1. `cot_cleanup` adapter (khai ở `extensions.tavern_helper`) gọi
 *    `catSuyLuanNoiBo()` TRƯỚC khi bóc tách — nó xử lý được cả thẻ chưa đóng.
 *    Đây là đường chính.
 * 2. Regex `markdownOnly` xóa khối khỏi bản hiển thị.
 * 3. Regex `promptOnly` xóa khối khỏi lịch sử gửi lại model.
 *
 * Ba đường vì ba công tắc độc lập: người dùng tắt adapter thì hai regex còn đỡ,
 * và ngược lại. Kết quả cần đạt là như nhau ở mọi tổ hợp: khối tư duy được viết
 * ra, rồi biến mất sau khi đóng thẻ — không hiển thị, không lưu, không quay lại.
 */

const HTML_BANG = `<details style="margin:1rem 0;border:1px solid rgba(198,168,110,0.28);border-radius:12px;background:linear-gradient(160deg,rgba(22,20,17,0.96),rgba(31,28,23,0.96));overflow:hidden">
<summary style="padding:10px 16px;cursor:pointer;color:#d8cfae;font-weight:600;letter-spacing:0.04em">SỔ BIÊN NIÊN — lượt này</summary>
<pre style="margin:0;padding:12px 18px 16px;color:#cfc7b4;font:13px/1.75 ui-monospace,SFMono-Regular,monospace;white-space:pre-wrap">$1</pre>
</details>`;

/** @typedef {{ id: string, scriptName: string, findRegex: string, replaceString: string, placement: number[], disabled: boolean, markdownOnly: boolean, promptOnly: boolean, minDepth: number|null, maxDepth: number|null, trimStrings?: string[] }} RegexScript */

/** @type {RegexScript[]} */
export const REGEX_SCRIPTS = [
  {
    id: 'td-rx-01-tu-duy-an-hien-thi',
    scriptName: '01 · Khối tư duy — xóa khỏi bản hiển thị',
    findRegex: '/<thinking>[\\s\\S]*?<\\/thinking>/gi',
    replaceString: '',
    placement: [2],
    disabled: false,
    markdownOnly: true,
    promptOnly: false,
    minDepth: null,
    maxDepth: null,
  },
  {
    id: 'td-rx-02-tu-duy-xoa-lich-su',
    scriptName: '02 · Khối tư duy — xóa khỏi lịch sử gửi lại',
    findRegex: '/<thinking>[\\s\\S]*?<\\/thinking>/gi',
    replaceString: '',
    placement: [2],
    disabled: false,
    markdownOnly: false,
    promptOnly: true,
    minDepth: null,
    maxDepth: null,
  },
  {
    id: 'td-rx-03-tu-duy-do-dang',
    scriptName: '03 · Khối tư duy dở dang — cắt phần chưa đóng thẻ',
    findRegex: '/<thinking>[\\s\\S]*$/i',
    replaceString: '',
    placement: [2],
    disabled: false,
    markdownOnly: true,
    promptOnly: true,
    minDepth: null,
    maxDepth: null,
  },
  {
    id: 'td-rx-04-bang-bien-nien',
    scriptName: '04 · Sổ biên niên — dựng bảng gấp gọn',
    findRegex: '/<bien_nien>([\\s\\S]*?)<\\/bien_nien>/i',
    replaceString: HTML_BANG,
    placement: [2],
    disabled: false,
    markdownOnly: true,
    promptOnly: false,
    minDepth: null,
    maxDepth: null,
    trimStrings: [],
  },
  {
    id: 'td-rx-05-bien-nien-xoa-lich-su',
    scriptName: '05 · Sổ biên niên — xóa khỏi lịch sử gửi lại',
    findRegex: '/<bien_nien>[\\s\\S]*?<\\/bien_nien>/gi',
    replaceString: '',
    placement: [2],
    disabled: false,
    markdownOnly: false,
    promptOnly: true,
    minDepth: null,
    maxDepth: null,
  },
  {
    id: 'td-rx-06-lua-chon-xoa-lich-su',
    scriptName: '06 · Bảng lựa chọn — xóa khỏi lịch sử gửi lại',
    findRegex: '/<choices?>[\\s\\S]*?<\\/choices?>/gi',
    replaceString: '',
    placement: [2],
    disabled: false,
    markdownOnly: false,
    promptOnly: true,
    minDepth: null,
    maxDepth: null,
  },
  {
    id: 'td-rx-07-the-content-lac',
    scriptName: '07 · Thẻ bọc lạc — bỏ <content> nếu model tự thêm',
    findRegex: '/<\\/?content>/gi',
    replaceString: '',
    placement: [2],
    disabled: false,
    markdownOnly: true,
    promptOnly: true,
    minDepth: null,
    maxDepth: null,
  },
  {
    id: 'td-rx-08-ooc',
    scriptName: '08 · Ngoặc chú giải OOC — bỏ',
    findRegex: '/\\s*\\((?:OOC|ooc|Ooc)[^)]*\\)/g',
    replaceString: '',
    placement: [1, 2],
    disabled: false,
    markdownOnly: true,
    promptOnly: true,
    minDepth: null,
    maxDepth: null,
  },
  {
    id: 'td-rx-09-hanh-dong-nguoi-choi',
    scriptName: '09 · Đánh dấu hành động người chơi trong lịch sử',
    // Viết TRẦN có chủ ý: `new RegExp(pattern)` không cờ → thay đúng một lần.
    findRegex: '^([\\s\\S]*)$',
    replaceString: '<hanh_dong_nguoi_choi>$1</hanh_dong_nguoi_choi>',
    placement: [1],
    disabled: false,
    markdownOnly: false,
    promptOnly: true,
    minDepth: null,
    maxDepth: 2,
  },
];

/**
 * Một khai báo Tavern Helper duy nhất, và nó KHÔNG chứa JavaScript chạy được.
 *
 * Thiên Diễn cách ly mọi script Tavern Helper (64.2) nhưng nhận diện ý đồ rồi
 * dựng adapter native có schema (`core/preset/scriptAdapter.ts`). Từ khóa
 * `applyReasoningToMessage` là thứ importer dò để bật adapter `cot_cleanup` —
 * bản port native của việc dọn khối tư duy, chạy bằng `catSuyLuanNoiBo()` chứ
 * không bằng mã trong file này.
 *
 * Hệ quả khi nhập: đúng 1 mục ở trạng thái `quarantined` và một issue
 * `SCRIPT_CACH_LY` severity `quarantine` — không phải `error`, không chặn nhập.
 * Đó là cái giá đã biết trước để có adapter, và nó được ghi ở đây thay vì để
 * người dùng tự đoán khi thấy dòng cảnh báo.
 */
export const TAVERN_HELPER = {
  scripts: [
    {
      id: 'td-helper-cot-cleanup',
      name: 'Thiên Diễn · dọn khối tư duy',
      enabled: true,
      content: [
        '/* Khai báo ý đồ cho trình nhập của Thiên Diễn — không phải mã chạy được.',
        ' *',
        ' * applyReasoningToMessage: cắt khối tư duy khỏi văn bản trước khi bóc tách,',
        ' * lưu và hiển thị. Thiên Diễn thực hiện việc này bằng adapter native',
        ' * cot_cleanup; file preset không cần và không được chạy JavaScript.',
        ' */',
      ].join('\n'),
      data: {},
    },
  ],
};
