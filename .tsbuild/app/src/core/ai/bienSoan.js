import { phanBoSauTang, catTheoTran, uocLuong } from './nganSach.js';
/** Bảy quy tắc của 29.2 — [BB] tầng lõi bất biến, người dùng KHÔNG xóa được. */
export const BAY_QUY_TAC_NARRATOR = Object.freeze([
    'Nhân vật phải có mục tiêu không liên quan gì tới người chơi. Phần lớn động cơ trong cảnh phải là của họ.',
    'Cảnh được phép kết thúc mà người chơi không làm gì. Không đợi.',
    'Không bao giờ hỏi "bạn làm gì?". Không kết cảnh bằng câu hỏi hướng về người chơi. Kể tiếp, hoặc dừng ở một nhịp tự nhiên.',
    'NPC không giải thích thế giới cho người chơi nghe. Họ nói với nhau, theo cách người trong cuộc nói với nhau — nghĩa là bỏ qua những gì cả hai đều đã biết.',
    'Khi ống kính không ở chỗ người chơi, không nhắc tới người chơi, kể cả gián tiếp.',
    'Nhân vật người chơi có thể là vai phụ trong mạch truyện của người khác, và phải được đối xử như vai phụ.',
    'Ở tầng Sáng Thế Thần, người chơi không có mặt trong cảnh. Cảnh là chuyện xảy ra trong thế giới, được quan sát từ trên xuống.',
]);
/**
 * [BB] 71.5 — LLM không giữ sổ.
 *
 * Đây là luật khó giữ nhất khi AI trở thành bắt buộc, vì một model đang viết văn
 * rất muốn nói "ba trăm người chết". Nên nó được viết thành mệnh lệnh riêng, đứng
 * ngay sau bảy quy tắc, và `bocTach()` từ chối mọi patch không thuộc bảng trắng.
 */
export const LUAT_KHONG_GIU_SO = Object.freeze([
    'Engine giữ sổ, không phải bạn. Đừng bịa số dân, số của cải, số năm, hay tên riêng chưa có trong dữ liệu dưới đây.',
    'Nếu dữ liệu không nói một điều gì đó, hãy kể quanh nó hoặc để nhân vật đoán sai — đừng điền vào.',
    'Bạn viết văn. Thay đổi trạng thái thế giới chỉ xảy ra qua khối <CapNhat> và engine có quyền từ chối nó.',
]);
const NHAN_TANG = Object.freeze({
    sang_the: 'Sáng Thế Thần',
    than: 'Thần',
    pham_nhan: 'Phàm Nhân',
});
const MUC_RO_LOI = Object.freeze({
    ro: 'thấy rõ',
    mo: 'thấy mờ',
    tin_don: 'chỉ nghe đồn',
});
function motDong(e) {
    const meo = e.daBopMeo ? ' [tên và mô tả đã méo qua lời đồn]' : '';
    const mo = e.moTa.trim() === '' ? '' : ` — ${e.moTa.trim()}`;
    return `- ${e.ten} (${e.kind}, ${MUC_RO_LOI[e.mucRo] ?? e.mucRo})${mo}${meo}`;
}
/** Tầng 1 — lõi bất biến. Không phụ thuộc thế giới, nên cache được vĩnh viễn. */
function tang1(mode) {
    const quyTac = BAY_QUY_TAC_NARRATOR.map((q, i) => `${i + 1}. ${q}`).join('\n');
    const so = LUAT_KHONG_GIU_SO.map((q) => `- ${q}`).join('\n');
    return [
        'Bạn là người kể chuyện của Thiên Diễn, một thế giới thần thoại do một engine mô phỏng giữ sổ.',
        'Viết bằng tiếng Việt. Văn xuôi, không markdown, không tiêu đề, không gạch đầu dòng.',
        'Độ dài: hai tới năm đoạn ngắn.',
        '',
        'BẢY QUY TẮC KHÔNG ĐƯỢC VI PHẠM:',
        quyTac,
        '',
        'ENGINE GIỮ SỔ:',
        so,
        '',
        'LIÊN KẾT TỰ SỰ:',
        '- Mỗi cảnh phải nối mạch từ cảnh trước: nhắc lại ít nhất một chi tiết, nhân vật hoặc sự kiện đã xảy ra trong phần VÀI NHỊP TRƯỚC.',
        '- Khi người chơi hành động ([Ngươi]), phản hồi phải có hậu quả trực tiếp trong cảnh — không bỏ qua, không diễn đạt lại ý người chơi bằng giọng bình luận.',
        '- Nhân vật phải phản ứng với những gì đã xảy ra, không kể một cảnh hoàn toàn mới như chưa có gì trước đó.',
        '',
        `Ống kính lượt này đặt ở tầng ${NHAN_TANG[mode]}.`,
        mode === 'sang_the'
            ? 'Người chơi KHÔNG có mặt trong cảnh. Kể chuyện của thế giới, nhìn từ trên xuống.'
            : mode === 'than'
                ? 'Người chơi là một vị thần. Họ thấy lãnh địa mình rõ, thấy phần còn lại mờ hoặc chỉ qua lời đồn.'
                : 'Người chơi là một con người. Họ không biết luật của vũ trụ, không đọc được con số nào của engine.',
    ].join('\n');
}
/**
 * Thế giới chưa có gì cả — [BB] ADR-0055.
 *
 * Ở nhịp 0 của một ván mới, `view` rỗng theo đúng nghĩa đen. Không nói ra điều
 * đó thì model đọc một prompt không có mục nào và tự lấp bằng thần thoại nó
 * thuộc lòng — rồi engine từ chối những patch trỏ vào các thực thể nó vừa tưởng
 * tượng, và người chơi thấy một cảnh không để lại dấu vết nào.
 */
function laHuVo(view) {
    return view.entities.size === 0 && view.laws.length === 0 && view.concepts.length === 0;
}
const KHOI_HU_VO = [
    'TRẠNG THÁI THẾ GIỚI: HƯ VÔ.',
    'Chưa có gì tồn tại. Không đất, không trời, không luật, không khái niệm, không thần, không người.',
    'Đây không phải dữ liệu bị thiếu — đây là sự thật của nhịp này.',
    'Đừng nhắc tên một nơi chốn, một vị thần hay một dân tộc nào như thể chúng đã có sẵn.',
    'Thứ gì được kể ra trong cảnh này mà đáng tồn tại thì phải được TẠO ở khối <CapNhat>,',
    'bằng một phần tử op "link" vào bảng "entities" với id mới và kind hợp lệ',
    '(law, concept, deity, mortal, place). Không tạo ở khối thì nó chỉ là lời văn và sẽ biến mất.',
].join('\n');
/** Tầng 2 — chân lý thế giới ở mức tầng này được biết. Đổi chậm. */
function tang2(view) {
    const dong = [];
    if (laHuVo(view))
        return KHOI_HU_VO;
    if (view.laws.length > 0) {
        dong.push('LUẬT ĐANG CHI PHỐI (theo đúng mức người chơi được biết):');
        for (const l of view.laws.slice(0, 12)) {
            // `vanBan` là null ở tầng phàm nhân — `chieu()` đã xóa nó. Ở đây chỉ đọc lại.
            const goc = l.vanBan === null ? '' : ` Văn bản gốc: "${l.vanBan}".`;
            const hieu = l.dienGiai.trim() === ''
                ? ''
                : ` Người ở đây hiểu nó là: "${l.dienGiai}"${l.doLech > 20 ? ' (đã lệch khá xa bản gốc)' : ''}.`;
            dong.push(`- ${l.ten}: phạm vi ${l.phamVi}.${goc}${hieu}`);
        }
        dong.push('');
    }
    if (view.concepts.length > 0) {
        dong.push('KHÁI NIỆM ĐÃ CÓ TÊN:');
        for (const c of view.concepts.slice(0, 12)) {
            const gd = c.giaiDoan === null ? '' : ` (${c.giaiDoan})`;
            dong.push(`- ${c.ten}${gd}`);
        }
        dong.push('');
    }
    return dong.join('\n').trimEnd();
}
/** Tầng 3 — bối cảnh chủ thể. Đổi khi chuyển tầng hoặc đổi chủ thể. */
function tang3(view, tenNguoiChoi) {
    const chuThe = view.chuTheId ? view.entities.get(view.chuTheId) : undefined;
    const dong = [];
    dong.push(`Nhịp thời gian: ${view.nhipThoiGian}. Nhịp hiện tại: ${view.tick}.`);
    if (chuThe) {
        dong.push(`Nhân vật người chơi: ${chuThe.ten}${chuThe.moTa.trim() === '' ? '' : ` — ${chuThe.moTa.trim()}`}.`);
    }
    else {
        dong.push(`Người chơi (${tenNguoiChoi}) không có thân xác trong cảnh.`);
    }
    dong.push(`Tầm nhìn: ${view.suongMu.ro.length} rõ, ${view.suongMu.mo.length} mờ, ` +
        `${view.suongMu.tinDon.length} qua lời đồn, ${view.suongMu.mu.length} chưa biết tới.`);
    return dong.join('\n');
}
/**
 * Tầng 4 — mạch truyện đang chiếu + những gì đang ở trong tầm mắt.
 *
 * [BB] 33.1 xếp "mạch truyện đang chiếu" là tầng 4, ngay sau ranh giới cache:
 * `kyUcMach`, nút thắt chưa gỡ, vai trò nhân vật. Đây là tầng làm nên truyện
 * dài — nó nhớ DIỄN TIẾN, không nhớ trạng thái (30.1).
 */
function tang4(view, mach, oChoNguoiChoi, tomTatPhien) {
    const dong = [];
    if (mach) {
        dong.push(`MẠCH TRUYỆN ĐANG CHIẾU — "${mach.ten}" (${mach.loai}, giai đoạn ${mach.giaiDoan}):`);
        if (mach.kyUcMach.trim() !== '')
            dong.push(mach.kyUcMach);
        if (mach.nhanVat.length > 0) {
            // [BB] 29.3 — người chơi cũng chỉ là một dòng ở đây, không có nhãn riêng.
            dong.push(`Người trong cuộc: ${mach.nhanVat.map((n) => `${n.ten} (${n.vaiTro})`).join(', ')}.`);
        }
        if (mach.nutThatChuaGo.length > 0) {
            dong.push(`Chưa gỡ: ${mach.nutThatChuaGo.join(' | ')}`);
        }
        if (!oChoNguoiChoi) {
            dong.push('Ống kính lượt này KHÔNG ở chỗ người chơi. Không nhắc tới họ, kể cả gián tiếp. ' +
                'Đây là chuyện của những người trên.');
        }
        dong.push('');
    }
    else if (tomTatPhien && tomTatPhien.trim() !== '') {
        /**
         * Tóm tắt phiên — khi không có mạch truyện đang chiếu, đây là nguồn duy
         * nhất giúp model nối mạch tự sự. Không có nó thì mỗi lượt là một cảnh
         * rời, và "nhập vai" trở thành "diễn đạt".
         */
        dong.push('DIỄN BIẾN GẦN ĐÂY (tóm tắt từ các cảnh đã kể — dùng để nối mạch, đừng lặp nguyên văn):');
        dong.push(tomTatPhien.trim());
        dong.push('');
    }
    const ds = [...view.entities.values()];
    const ro = ds.filter((e) => e.mucRo === 'ro' && e.id !== view.chuTheId).slice(0, 18);
    const xa = ds.filter((e) => e.mucRo !== 'ro').slice(0, 10);
    if (ro.length > 0) {
        dong.push('TRONG TẦM MẮT:');
        for (const e of ro)
            dong.push(motDong(e));
        dong.push('');
    }
    if (xa.length > 0) {
        dong.push('NGHE NÓI CÓ (đừng kể như thể chắc chắn):');
        for (const e of xa)
            dong.push(motDong(e));
    }
    return dong.join('\n').trimEnd();
}
/**
 * Nội dung truy hồi — kết quả của chuỗi 54.9, chèn vào tầng 5.
 *
 * Chunk đã đi qua `chieu()` và `bopMeo()` ở `locTamNhin()`, nên ở đây không còn
 * phép lọc nào: thứ tới được đây là thứ chủ thể được biết, và phần nào là tin
 * đồn thì đã méo sẵn — model không cần phải "cố gắng không dùng" gì cả.
 */
function tangTruyHoi(ds) {
    if (ds.length === 0)
        return '';
    const dong = ['ĐIỀU CHỦ THỂ NHỚ HOẶC BIẾT (đã truy hồi theo tiêu điểm):'];
    for (const c of ds) {
        const nguon = c.nguon === 'lorebook' ? '[THẦN THOẠI NGUỒN — điểm hút, chưa phải lịch sử đã xảy ra] ' : '';
        dong.push(`- ${nguon}${c.text}${c.daBopMeo ? ' [nghe kể lại, đã sai đi ít nhiều]' : ''}`);
    }
    if (ds.some((c) => c.nguon === 'lorebook')) {
        dong.push('Nếu một nhân vật, nơi chốn hoặc yếu tố từ THẦN THOẠI NGUỒN bước vào cảnh và chưa có trong Chân Lý Thế Giới, hãy tạo nó bằng <CapNhat>. Không được chỉ nhắc tên rồi để nó biến mất khỏi sổ.');
    }
    return dong.join('\n');
}
/** Tầng 5 — chuyện thế giới vừa làm, cộng nội dung truy hồi. */
function tang5(banTin, truyHoi) {
    const khoi = [];
    if (banTin && banTin.muc.length > 0) {
        const dong = ['CHUYỆN VỪA XẢY RA (engine đã quyết — kể lại, đừng phán lại):'];
        for (const m of banTin.muc.slice(0, 10)) {
            const nghe = m.duong === 'nghe_ke' ? ' [nghe kể lại, có thể sai]' : '';
            dong.push(`- ${m.loiKe}${nghe}`);
        }
        khoi.push(dong.join('\n'));
    }
    const th = tangTruyHoi(truyHoi);
    if (th !== '')
        khoi.push(th);
    return khoi.join('\n\n');
}
/**
 * Tầng 6 — lượt này. [BB] 33.1 bắt lời cầu đang treo và kết quả engine nằm CUỐI.
 */
function tang6(ng) {
    const dong = [];
    if (ng.canhGanDay.length > 0) {
        dong.push('VÀI NHỊP TRƯỚC:');
        for (const c of ng.canhGanDay.slice(-10)) {
            const nhan = c.loai === 'nguoi_choi' ? '[Ngươi] ' : c.loai === 'ket_qua' ? '[Kể] ' : '';
            dong.push(`- ${nhan}${c.noiDung}`);
        }
        dong.push('');
    }
    const treo = ng.loiCau.filter((p) => !p.daTraLoi).slice(0, 6);
    if (treo.length > 0) {
        dong.push('LỜI CẦU ĐANG TREO (chưa được trả lời — nhắc tới được, nhưng đừng tự trả lời thay):');
        for (const p of treo)
            dong.push(`- ${p.noiDung}${p.soNguoi > 1 ? ` (${p.soNguoi} người cùng cầu)` : ''}`);
        dong.push('');
    }
    /**
     * [BB] 30.2 + 33.1 — Sổ Phục Bút nằm CUỐI, và mục quá hạn lên trước.
     *
     * "AI không nhớ; engine ép nó nhớ." Dòng dưới đây là toàn bộ chỗ ép ấy hiện
     * ra: engine đã giữ danh sách suốt năm trăm lượt, và nó đặt danh sách vào đúng
     * chỗ model còn nhìn rõ.
     */
    const pb = ng.phucButChuaTra ?? [];
    if (pb.length > 0) {
        dong.push('SỔ PHỤC BÚT — ĐÃ GIEO, CHƯA TRẢ (đừng quên chúng; trả được thì trả):');
        for (const f of [...pb].sort((a, b) => Number(b.quaHan) - Number(a.quaHan)).slice(0, 8)) {
            dong.push(`- ${f.noiDung}${f.quaHan ? ' [QUÁ HẠN — đã gieo quá lâu mà chưa ai nhắc lại]' : ''}`);
        }
        dong.push('');
    }
    if (ng.cauNguoiChoi.trim() !== '') {
        dong.push(`NGƯỜI CHƠI VỪA LÀM: ${ng.cauNguoiChoi.trim()}`);
    }
    if (ng.ketQuaEngine.length > 0) {
        dong.push('ENGINE ĐÃ QUYẾT KẾT QUẢ (đây là sự thật, kể theo nó):');
        for (const k of ng.ketQuaEngine)
            dong.push(`- ${k}`);
    }
    dong.push('');
    dong.push('Kể tiếp cảnh. Đừng lặp lại nguyên văn những dòng trên.');
    dong.push('Nếu cảnh bạn vừa kể làm đổi một điều gì đó trong thế giới, thêm khối sau ở CUỐI, ngoài văn xuôi:');
    dong.push('<CapNhat>{"patches":[]}</CapNhat>');
    dong.push('Không có gì đổi thì bỏ hẳn khối đó. Đừng giải thích khối đó bằng lời.');
    // [BB] 30.2 — Updater được yêu cầu trả khối này khi Narrator GIEO thứ gì có vẻ
    // quan trọng. Engine kiểm hạn; model chỉ cần khai đã gieo cái gì.
    dong.push('Nếu bạn vừa gieo một điều sẽ phải trả về sau (một lời hứa, một điềm báo, một vật lạ, ' +
        'một bí mật), khai nó ở khối:');
    dong.push('<Foreshadow>{"muc":[{"noiDung":"...","loai":"dieu_bao"}]}</Foreshadow>');
    // [BB] 54.10 — khẳng định về quá khứ không truy được KHÔNG bị xóa; nó thành
    // ứng viên Term và ứng viên gap `nhan_qua`. Thế giới biến chỗ bịa thành câu hỏi.
    dong.push('Nếu bạn có nói một điều về QUÁ KHỨ mà dữ liệu trên không chứng thực, hãy tự khai nó ở khối:');
    dong.push('<Unverified>{"muc":["..."]}</Unverified>');
    return dong.join('\n');
}
/**
 * Dựng prompt cho một lượt kể.
 *
 * [BB] Tham số là `WorldView` — không có đường nào từ đây tới `World` thô.
 */
export function bienSoanPromptKe(ng) {
    const oChoNguoiChoi = ng.ongKinhOChoNguoiChoi ?? true;
    const tho = [
        { so: 1, ten: 'Lõi bất biến', onDinh: true, noiDung: tang1(ng.view.mode) },
        { so: 2, ten: 'Chân lý thế giới', onDinh: true, noiDung: tang2(ng.view) },
        { so: 3, ten: 'Bối cảnh chủ thể', onDinh: true, noiDung: tang3(ng.view, ng.tenNguoiChoi) },
        {
            so: 4,
            ten: 'Mạch truyện và tầm mắt',
            onDinh: false,
            noiDung: tang4(ng.view, ng.machDangChieu ?? null, oChoNguoiChoi, ng.tomTatPhien),
        },
        {
            so: 5,
            ten: 'Bản tin và truy hồi',
            onDinh: false,
            noiDung: tang5(ng.banTin, ng.chunkTruyHoi ?? []),
        },
        { so: 6, ten: 'Lượt này', onDinh: false, noiDung: tang6(ng) },
    ];
    /**
     * Cắt theo trần từng tầng, và GHI LẠI vết cắt.
     *
     * Không truyền `nganSachToken` thì không cắt: lời gọi cũ (và mọi test của
     * Phase 6b) giữ nguyên hành vi, còn đường chơi thật thì luôn truyền.
     */
    const { tang, vetCat } = ng.nganSachToken === undefined
        ? { tang: tho, vetCat: [] }
        : catTheoTran(tho, phanBoSauTang(ng.nganSachToken), ng.tyLeToken);
    const daySo = tang.map((t, i) => ({ ...tho[i], noiDung: t.noiDung }));
    const noi = (loc) => daySo
        .filter(loc)
        .map((t) => t.noiDung)
        .filter((s) => s.trim() !== '')
        .join('\n\n');
    const heThong = noi((t) => t.onDinh);
    const nguoiDung = noi((t) => !t.onDinh);
    const soKyTu = heThong.length + nguoiDung.length;
    return Object.freeze({
        heThong,
        nguoiDung,
        tang: Object.freeze(daySo),
        soKyTu,
        uocToken: uocLuong(`${heThong}${nguoiDung}`, ng.tyLeToken),
        vetCat: Object.freeze(vetCat),
        chunkBiCat: Object.freeze([...(ng.chunkBiCat ?? [])]),
    });
}
/**
 * Prompt thử đường — cố tình rẻ và cố tình có một yêu cầu cấu trúc nhỏ.
 *
 * Nếu chỉ hỏi "chào", một endpoint trả về HTML lỗi 200 cũng đếm là thông. Bắt nó
 * trả về đúng một từ cho ta biết cả ba thứ: đường đi, model tồn tại, và model có
 * nghe lệnh không.
 */
export const PROMPT_THU_DUONG = Object.freeze({
    heThong: 'Bạn đang được kiểm tra kết nối. Trả lời đúng một từ, không dấu câu, không giải thích.',
    nguoiDung: 'Trả lời đúng chữ: THONG',
    tuKhoa: 'THONG',
});
export function thuDuongDatKhong(traVe) {
    return traVe.toUpperCase().includes(PROMPT_THU_DUONG.tuKhoa);
}
