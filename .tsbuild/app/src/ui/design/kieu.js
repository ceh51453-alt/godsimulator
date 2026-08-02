export const nhanNho = Object.freeze({
    color: 'var(--mo)',
    fontSize: 11,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
});
export const oNhap = Object.freeze({
    background: 'var(--kinh-nen-2)',
    color: 'var(--sang)',
    border: '1px solid var(--kinh-vien)',
    borderRadius: 'var(--r-sm)',
    padding: '9px 12px',
    font: 'inherit',
    fontSize: 13,
    width: '100%',
});
export function nut(chinh = false, tat = false) {
    return {
        background: 'transparent',
        color: tat ? 'var(--mo)' : chinh ? 'var(--dong)' : 'var(--tro)',
        border: `1px solid ${chinh && !tat ? 'var(--dong)' : 'var(--kinh-vien)'}`,
        borderRadius: 'var(--r-sm)',
        padding: '8px 14px',
        font: 'inherit',
        fontSize: 13,
        cursor: tat ? 'not-allowed' : 'pointer',
        opacity: tat ? 0.5 : 1,
    };
}
export const the = Object.freeze({
    background: 'var(--kinh-nen)',
    border: '1px solid var(--kinh-vien)',
    borderRadius: 'var(--r-md)',
    padding: 16,
});
/** Một dòng nhãn — giá trị, dùng cho mọi bảng số nhỏ. */
export const dongSo = Object.freeze({
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    fontSize: 13,
    color: 'var(--tro)',
});
