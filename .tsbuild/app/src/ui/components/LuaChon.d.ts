type Props = {
    /** Danh sách text lựa chọn. */
    readonly luaChon: readonly string[];
    /** Gọi khi user chọn một lựa chọn. */
    readonly onChon: (text: string) => void;
    /** Đang gửi — khóa buttons. */
    readonly dangKe: boolean;
};
export default function LuaChon({ luaChon, onChon, dangKe }: Props): JSX.Element | null;
export {};
