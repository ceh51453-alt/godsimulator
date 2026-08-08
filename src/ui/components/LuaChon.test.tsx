import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import LuaChon from './LuaChon.js';

describe('LuaChon', () => {
  it('hiện nút thu gọn khi preset có lựa chọn hành động', () => {
    const html = renderToStaticMarkup(
      <LuaChon luaChon={['Đi tiếp', 'Quay lại']} dangKe={false} onChon={() => undefined} />,
    );

    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain('Thu gọn');
    expect(html).toContain('Đi tiếp');
  });

  it('không dựng khối thu gọn khi preset không có lựa chọn', () => {
    const html = renderToStaticMarkup(<LuaChon luaChon={[]} dangKe={false} onChon={() => undefined} />);

    expect(html).toBe('');
  });
});
