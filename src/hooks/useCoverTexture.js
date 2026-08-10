import { useEffect, useState } from "react";
import * as THREE from "three";
import { TEX_MAX_ANISOTROPY } from "../constants/layout.js";

/**
 * 自定义 Hook：异步加载一张封面图到 THREE.CanvasTexture
 *
 * 实现细节（就是原来 Albums.jsx 里那坨 useEffect 搬过来，一模一样逻辑）：
 *   1. 先创建 512x512 Canvas，画占位色（方便图加载失败时一眼看到）
 *   2. new Image() 跨域加载参数里传进来的 coverUrl
 *   3. 图片加载成功 → 用 contain 模式（保持比例）缩放到 512 居中画进去
 *      图片加载失败 → 画红色占位（方便调试坏链接）
 *   4. 返回 [texture, tick]：
 *        - texture: THREE.CanvasTexture 实例（可直接丢 meshStandardMaterial.map）
 *        - tick    : 每次加载成功/失败都会变化的数字，给 mesh key 用，确保 R3F 销毁重建材质
 *
 * @param {string} coverUrl  - 封面图地址（本地 /public 路径 or 远程 http 都可以）
 * @param {number} [size=512] - 纹理画布边长（默认 512 够用了，封面不糊）
 * @returns {[THREE.CanvasTexture|null, number]} [纹理实例, 更新 tick]
 */
export default function useCoverTexture(coverUrl, size = 512) {
  const [texture, setTexture] = useState(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    // --- 步骤 1：先创建粉色占位 Canvas 纹理 ---
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ff00ff";
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#000000";
    ctx.font = "bold 32px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("COVER", size / 2, size / 2);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = TEX_MAX_ANISOTROPY;
    tex.needsUpdate = true;
    if (!cancelled) setTexture(tex);

    // --- 步骤 2：异步 Image 加载真实图 ---
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.referrerPolicy = "no-referrer";

    img.onload = () => {
      if (cancelled) return; // 组件卸载 / url 变了 → 丢弃旧结果，绝不写旧 canvas
      try {
        ctx.clearRect(0, 0, size, size);
        // contain：长或宽按最大比例放大，填满一个维度后居中，另一维度留空（和以前一致）
        const scale = Math.max(size / img.width, size / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        ctx.drawImage(img, (size - dw) / 2, (size - dh) / 2, dw, dh);
        tex.needsUpdate = true;
        setTick((t) => t + 1); // tick 加 1 → 外层 mesh key 变化 → 强制重建材质
      } catch (err) {
        console.error("[useCoverTexture] drawImage 失败:", err);
      }
    };

    img.onerror = () => {
      if (cancelled) return;
      // 图片挂了（404 / 跨域）→ 画满红色，方便一眼识别
      ctx.clearRect(0, 0, size, size);
      ctx.fillStyle = "#ff4444";
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 24px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("NO IMAGE", size / 2, size / 2);
      tex.needsUpdate = true;
      setTick((t) => t + 1);
    };

    img.src = coverUrl;

    // --- 步骤 3：组件卸载 / coverUrl 变化时清理，避免内存泄漏 + 写已销毁 canvas ---
    return () => {
      cancelled = true;
      img.onload = null;
      img.onerror = null;
      try {
        img.src = ""; // 强制取消正在进行的网络请求
      } catch (_) {
        /* ignore */
      }
      // 注意：texture 不 dispose！因为 setTexture 把它挂到 React 状态里，
      // 组件会一直持有它，直到 Albums 整体卸载（R3F 会统一处理）
    };
  }, [coverUrl, size]);

  return [texture, tick];
}
