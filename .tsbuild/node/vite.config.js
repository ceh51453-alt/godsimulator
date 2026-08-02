import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
const r = (p) => fileURLToPath(new URL(p, import.meta.url));
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@core': r('./src/core'),
            '@db': r('./src/db'),
            '@ui': r('./src/ui'),
            '@store': r('./src/store'),
            '@test': r('./src/test'),
        },
    },
    /**
     * Cổng lấy từ biến môi trường `PORT` khi có.
     *
     * Không hardcode 5173: mở hai phiên làm việc trên cùng máy là chuyện thường,
     * và phiên thứ hai sẽ im lặng nhảy sang một cổng khác mà công cụ bên ngoài
     * không biết. Đọc `PORT` cho phép người gọi quyết, và vẫn về 5173 khi không ai
     * nói gì.
     */
    server: {
        port: Number(process.env['PORT'] ?? 5173),
        strictPort: process.env['PORT'] !== undefined,
    },
    build: {
        target: 'es2022',
        sourcemap: false,
        rollupOptions: {
            output: {
                /**
                 * Tách thư viện ngoài khỏi mã ứng dụng.
                 *
                 * Không phải để làm nhỏ tổng số byte — tổng không đổi. Để **cache**: mã
                 * ứng dụng đổi mỗi lần phát hành, còn React/Zod/Dexie thì không, và gộp
                 * chung nghĩa là người chơi tải lại cả hai mỗi lần sửa một dòng.
                 *
                 * `ejs` đứng riêng vì nó chỉ cần khi có preset dùng template — nhưng nó
                 * hiện vẫn nằm trong đường import tĩnh của bộ biên dịch preset, nên tách
                 * ở đây mới chỉ giúp cache. Đưa nó thành import động là việc còn lại,
                 * ghi ở sổ nợ.
                 */
                manualChunks(id) {
                    if (!id.includes('node_modules'))
                        return undefined;
                    if (id.includes('ejs'))
                        return 'ejs';
                    if (id.includes('react'))
                        return 'react';
                    if (id.includes('dexie'))
                        return 'dexie';
                    if (id.includes('zod'))
                        return 'zod';
                    return 'vendor';
                },
            },
        },
    },
});
