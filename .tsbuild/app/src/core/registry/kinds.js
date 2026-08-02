import { manifestCua } from './define.js';
const P = (than, phamNhan) => ({
    sangThe: 'day_du',
    than,
    phamNhan,
});
/** Mười bốn kind của bảng Phần 4.3. Danh sách này ĐÓNG. */
const nguon43 = [
    {
        id: 'concept',
        ten: 'Khái Niệm',
        moTa: 'Ý niệm đang tích trọng số trong thế giới.',
        aspects: ['conceptual'],
        icon: 'KhaiNiem',
        mau: 'van',
        // [BB] Phàm nhân chỉ biết khái niệm đã có TÊN trong văn hóa vùng mình.
        phanChieu: P('trong_domain', 'qua_van_hoa'),
    },
    {
        id: 'law',
        ten: 'Định Luật',
        moTa: 'Quy luật vận hành. Văn bản gốc không bao giờ đến tầng phàm nhân.',
        aspects: ['lawful'],
        icon: 'DinhLuat',
        mau: 'lam',
        phanChieu: P('trong_domain', 'qua_van_hoa'),
    },
    {
        id: 'deity',
        ten: 'Thần',
        moTa: 'Một vị thần với domain, tín đồ và bản tính riêng.',
        aspects: ['soul', 'domain', 'venerable', 'divisible', 'genealogical'],
        icon: 'Than',
        mau: 'dong',
        tangMacDinh: 't3',
        phanChieu: P('day_du', 'tin_don'),
    },
    {
        id: 'mortal',
        ten: 'Phàm Nhân',
        moTa: 'Một con người có thân thể, nghề, hộ và một đời.',
        aspects: ['soul', 'mortal', 'genealogical'],
        icon: 'PhamNhan',
        mau: 'ngoc',
        tangMacDinh: 't1',
        phanChieu: P('trong_domain', 'day_du'),
    },
    {
        id: 'monster',
        ten: 'Quái Vật',
        moTa: 'Sinh ra từ vết sẹo và lỗ hổng của thế giới.',
        aspects: ['soul', 'spatial'],
        icon: 'QuaiVat',
        mau: 'hoi',
        tangMacDinh: 't1',
        phanChieu: P('trong_domain', 'tin_don'),
    },
    {
        id: 'artifact',
        ten: 'Thần Khí',
        moTa: 'Vật mang khái niệm, nhớ mọi bàn tay đã cầm nó.',
        aspects: ['carrier'],
        icon: 'ThanKhi',
        mau: 'dong',
        phanChieu: P('trong_domain', 'tin_don'),
    },
    {
        id: 'realm',
        ten: 'Cõi',
        moTa: 'Một cõi có bộ luật cục bộ riêng.',
        aspects: ['spatial', 'divisible'],
        icon: 'Coi',
        mau: 'van',
        phanChieu: P('day_du', 'tin_don'),
    },
    {
        id: 'pantheon',
        ten: 'Thần Hệ',
        moTa: 'Hội đồng thần, có mô hình cai trị và kế vị.',
        aspects: ['institutional'],
        icon: 'ThanHe',
        mau: 'dong',
        phanChieu: P('day_du', 'qua_van_hoa'),
    },
    {
        id: 'nemesis',
        ten: 'Kẻ Thù Vĩnh Cửu',
        moTa: 'Thứ phủ định một luật, một trật tự, một thần, hoặc chính sự tồn tại.',
        aspects: ['soul', 'adversarial'],
        icon: 'KeThu',
        mau: 'hoi',
        tangMacDinh: 't3',
        phanChieu: P('tin_don', 'tin_don'),
    },
    {
        id: 'cult',
        ten: 'Giáo Phái',
        moTa: 'Cộng đồng thờ phụng, mang giáo lý có thể sai lệch.',
        aspects: ['institutional', 'spatial'],
        icon: 'GiaoPhai',
        mau: 'ngoc',
        phanChieu: P('trong_domain', 'day_du'),
    },
    {
        id: 'nation',
        ten: 'Quốc Gia',
        moTa: 'Thiết chế cai trị một vùng lãnh thổ.',
        aspects: ['institutional', 'spatial'],
        icon: 'QuocGia',
        mau: 'lam',
        phanChieu: P('trong_domain', 'day_du'),
    },
    {
        id: 'ritual',
        ten: 'Nghi Lễ',
        moTa: 'Hành vi lặp lại được văn hóa đóng băng, dù có tác dụng thật hay không.',
        aspects: ['conceptual'],
        icon: 'NghiLe',
        mau: 'van',
        phanChieu: P('trong_domain', 'day_du'),
    },
    {
        id: 'bloodline',
        ten: 'Huyết Mạch',
        moTa: 'Dòng họ mang đặc tính được truyền lại, thường không ai nhớ lý do.',
        aspects: ['genealogical'],
        icon: 'HuyetMach',
        mau: 'ngoc',
        phanChieu: P('trong_domain', 'qua_van_hoa'),
    },
    {
        id: 'place',
        ten: 'Nơi Chốn',
        moTa: 'Một vùng, một làng, một địa danh có dân số và luật cục bộ.',
        aspects: ['spatial'],
        icon: 'NoiChon',
        mau: 'tro',
        phanChieu: P('trong_domain', 'day_du'),
    },
];
/**
 * Kind nền — Phase 5 (ADR-0021). Địa lý và hộ gia đình là hai thứ mà mười hai
 * tiến trình của 71.2 cần dưới dạng thực thể tra được, không phải dưới dạng số rời.
 */
const nguonNen = [
    {
        id: 'route',
        ten: 'Tuyến Đường',
        moTa: 'Con đường giữa hai nơi. Người, hàng và tin đều đi trên nó và mất thời gian.',
        aspects: ['duong'],
        icon: 'TuyenDuong',
        mau: 'tro',
        // Người sống ở đây biết rõ đường làng mình; thần nhìn từ trên, thấy mờ.
        phanChieu: P('trong_domain', 'day_du'),
    },
    {
        id: 'household',
        ten: 'Hộ',
        moTa: 'Một nhà: người ở chung, ăn chung kho, chịu chung nghĩa vụ.',
        aspects: ['spatial', 'kinh_te'],
        icon: 'Ho',
        mau: 'ngoc',
        tangMacDinh: 't0',
        phanChieu: P('trong_domain', 'day_du'),
    },
];
/** Kind tầng Thần — Phase 6. */
const nguonThan = [
    {
        id: 'covenant',
        ten: 'Giao Ước',
        moTa: 'Một lời thề có hai đầu. Nó tồn tại riêng vì phá nó phải để lại dấu.',
        aspects: ['giao_uoc'],
        icon: 'GiaoUoc',
        mau: 'ngoc',
        // Người trong cuộc biết rõ mình đã thề gì; người ngoài chỉ nghe kể.
        phanChieu: P('day_du', 'day_du'),
    },
];
const nguon = [...nguon43, ...nguonNen, ...nguonThan];
export const KINDS_DUNG_SAN = nguon.map((n) => ({
    ...n,
    manifest: manifestCua('kind', {
        id: n.id,
        ten: n.ten,
        moTa: n.moTa,
        config: {
            aspects: [...n.aspects],
            icon: n.icon,
            mau: n.mau,
            ...(n.tangMacDinh ? { tangMacDinh: n.tangMacDinh } : {}),
            phanChieu: { ...n.phanChieu },
        },
    }),
}));
export const KIND_IDS = KINDS_DUNG_SAN.map((k) => k.id);
/** Mười bốn kind của Phần 4.3 — cổng Phase 0 kiểm đúng danh sách này. */
export const KIND_IDS_43 = nguon43.map((k) => k.id);
/** Kind nền của Phase 5. */
export const KIND_IDS_NEN = nguonNen.map((k) => k.id);
/** Kind tầng Thần của Phase 6. */
export const KIND_IDS_THAN = nguonThan.map((k) => k.id);
