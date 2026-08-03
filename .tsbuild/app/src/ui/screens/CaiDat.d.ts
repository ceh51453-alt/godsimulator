declare const TAB: readonly [{
    readonly id: "proxy";
    readonly ten: "Proxy AI";
    readonly phu: "Ba kênh kết nối, model, kiểm tra";
}, {
    readonly id: "preset";
    readonly ten: "Preset";
    readonly phu: "Nhập, giải xung đột, bật/tắt";
}, {
    readonly id: "lorebook";
    readonly ten: "Lorebook";
    readonly phu: "Sách, đối soát, dị biệt";
}, {
    readonly id: "workflow";
    readonly ten: "Workflow";
    readonly phu: "Đường ống tác vụ và Diễn Hóa";
}];
type TenTab = (typeof TAB)[number]['id'];
export declare function CaiDat({ tabDau }: {
    tabDau?: TenTab;
}): JSX.Element;
export {};
