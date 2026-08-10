import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";

/**
 * 自定义 Vite 插件：打包后删除 dist/covers 和 dist/music
 * 双保险：
 *   1) 任何环境下 build 产物都不含本地素材（即便你本地磁盘有）
 *   2) 代码层面 albums.js 在 PROD 也会强制用远程 URL，即使有人手工放文件进去也不会读到本地路径
 */
function purgeLocalMedia() {
  return {
    name: "purge-local-media",
    // 打包写入磁盘完成后执行
    closeBundle() {
      const targets = [
        path.resolve(process.cwd(), "dist", "covers"),
        path.resolve(process.cwd(), "dist", "music"),
      ];
      targets.forEach((p) => {
        if (fs.existsSync(p)) {
          fs.rmSync(p, { recursive: true, force: true });
          console.log(
            "[vite-plugin] 已从 dist 移除本地素材目录:",
            path.relative(process.cwd(), p),
          );
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), purgeLocalMedia()],
  server: {
    port: 5173,
    host: true,
  },
});
