/**
 * Rãnh Lỗi — cái lưới cuối cùng dưới cây React.
 *
 * ── Vì sao nó phải có ──
 *
 * Trước file này, mọi ngoại lệ ném ra trong lúc React vẽ đều gỡ TOÀN BỘ cây và
 * để lại một trang trắng. Người chơi gọi đó là "văng game", và họ mô tả đúng:
 * thanh trạng thái, khung kể, ván đang chơi — mọi thứ biến mất cùng một lúc, và
 * không có câu nào nói vì sao. Một lỗi ở một ô đếm số cũng đủ, vì React coi
 * "không vẽ được một nhánh" là "không vẽ được cả cây".
 *
 * Điều đáng nói là `WorldState` KHÔNG mất trong tình huống ấy: nó nằm trong
 * store, ngoài React. Trang trắng là một sự cố hiển thị được trình bày như một
 * sự cố mất dữ liệu — và khoảng cách giữa hai điều đó là toàn bộ giá trị của
 * file này.
 *
 * ── Ba việc nó làm, theo thứ tự ──
 *
 * 1. **Ghi ván xuống đĩa ngay.** Trước cả khi vẽ gì. Nếu cái vỡ này là dấu hiệu
 *    của một cái vỡ lớn hơn sắp tới, ván phải ở trên đĩa trước lúc đó.
 * 2. **Nói ra.** Nguyên văn lỗi, không phải "đã có lỗi xảy ra". Người dùng của
 *    dự án này chép được một dòng lỗi vào một issue.
 * 3. **Cho một lối ra.** Vẽ lại (lỗi tạm thời), hoặc tải lại trang (lỗi dai).
 *
 * ── Vì sao là class component ──
 *
 * `getDerivedStateFromError` và `componentDidCatch` không có bản hook. Đây là
 * chỗ duy nhất trong dự án còn dùng class, và nó dùng vì React chưa cho cách
 * khác, không vì phong cách.
 */
import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { useGame } from '../store/game.js';

type Props = { readonly children: ReactNode };
type State = { readonly loi: Error | null; readonly noi: string; readonly daLuu: boolean };

const khungNgoai: React.CSSProperties = {
  maxWidth: 680,
  margin: '0 auto',
  padding: '56px 22px',
  fontFamily: 'var(--chu-than)',
  color: 'var(--tro)',
  display: 'grid',
  gap: 16,
};

const nutPhu: React.CSSProperties = {
  background: 'transparent',
  color: 'var(--sang)',
  border: '1px solid var(--kinh-vien)',
  borderRadius: 'var(--r-sm)',
  padding: '9px 16px',
  font: 'inherit',
  fontSize: 13,
  cursor: 'pointer',
};

export class RanhLoi extends Component<Props, State> {
  override state: State = { loi: null, noi: '', daLuu: false };

  static getDerivedStateFromError(loi: unknown): Partial<State> {
    return { loi: loi instanceof Error ? loi : new Error(String(loi)) };
  }

  /*
   * Nguyên văn lỗi đã được `getDerivedStateFromError` giữ, nên tham số đầu ở đây
   * không dùng tới — chỉ `componentStack` mới là thứ nói cho biết NHÁNH nào vỡ.
   */
  override componentDidCatch(_loi: Error, tin: ErrorInfo): void {
    /*
     * Ghi ván TRƯỚC khi làm bất cứ việc gì khác, và nuốt mọi lỗi của chính phép
     * ghi ấy: `luuVan()` hỏng ở đây thì cái ta đang cố cứu là màn hình, không
     * phải cái đĩa — và ném thêm một lỗi trong `componentDidCatch` sẽ gỡ luôn
     * cả rãnh lỗi này.
     */
    let daLuu = false;
    try {
      const g = useGame.getState();
      if (g.state !== null) {
        void g.luuVan();
        daLuu = true;
      }
    } catch {
      daLuu = false;
    }
    this.setState({ noi: (tin.componentStack ?? '').split('\n').slice(0, 4).join('\n').trim(), daLuu });
  }

  private veLai = (): void => {
    this.setState({ loi: null, noi: '', daLuu: false });
  };

  override render(): ReactNode {
    const { loi, noi, daLuu } = this.state;
    if (loi === null) return this.props.children;

    return (
      <main style={khungNgoai} role="alert">
        <h1
          style={{
            fontFamily: 'var(--chu-than)',
            fontSize: 24,
            fontWeight: 500,
            letterSpacing: '-0.02em',
            margin: 0,
            color: 'var(--sang)',
          }}
        >
          Màn hình vừa vỡ, thế giới thì không
        </h1>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6 }}>
          Một phần giao diện ném ra lỗi trong lúc vẽ, nên React gỡ cả trang. Ván của bạn nằm ngoài React và
          vẫn còn nguyên
          {daLuu ? ' — và nó vừa được ghi xuống đĩa ngay lúc lỗi xảy ra.' : '.'}
        </p>

        <pre
          style={{
            margin: 0,
            padding: '12px 14px',
            background: 'var(--kinh-nen-2)',
            border: '1px solid var(--kinh-vien)',
            borderRadius: 'var(--r-sm)',
            fontFamily: 'var(--chu-so)',
            fontSize: 11.5,
            lineHeight: 1.7,
            whiteSpace: 'pre-wrap',
            overflowX: 'auto',
            color: 'var(--hoi)',
          }}
        >
          {[loi.message, noi].filter((x) => x !== '').join('\n\n')}
        </pre>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" style={nutPhu} onClick={this.veLai}>
            Thử vẽ lại
          </button>
          <button type="button" style={nutPhu} onClick={() => window.location.reload()}>
            Tải lại trang
          </button>
        </div>

        <p style={{ margin: 0, fontSize: 11.5, color: 'var(--mo)', lineHeight: 1.6 }}>
          &quot;Thử vẽ lại&quot; đủ cho một lỗi nhất thời. Nếu nó vỡ lại ngay, hãy tải lại trang — ván được
          đọc lên từ đĩa, và bạn mất nhiều nhất là những gì xảy ra sau lần lưu cuối.
        </p>
      </main>
    );
  }
}
