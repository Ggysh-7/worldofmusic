import { useEffect, useState } from "react";
import * as THREE from "three";
import { TEX_SPINE_ANISOTROPY } from "../constants/layout.js";

/**
 * 自定义 Hook：生成「书脊」贴图 —— 封面图拉伸+模糊当背景，叠加竖排白字(title / artist)
 *
 * 等价替换 Albums.jsx 里原来那块 ~70 行的「书脊贴图 useEffect」。
 *
 * @param {{title:string, artist:string, cover:string, color:string}} album  单张专辑对象（用解构也行，我直接全传方便你未来加字段）
 * @param {number} [W=256]  书脊画布宽（和 BOX_D 比例一致）
 * @param {number} [H=1024] 书脊画布高（和 BOX_H 比例一致）
 * @returns {[THREE.CanvasTexture|null, number]} [纹理实例, 更新 tick]
 */
export default function useSpineTexture(album, W = 256, H = 1024) {
  const { title, artist, cover, color } = album ?? {};

  const [texture, setTexture] = useState(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    // 步骤 1：创建画布，先铺满专辑主色
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d");
    ctx.fillStyle = color || "#333333";
    ctx.fillRect(0, 0, W, H);

    // 步骤 2：先写文字（不管图加载成不成功，文字最后都要能看到）
    const drawText = () => {
      if (cancelled) return;
      ctx.save();
      // 画布逆时针转 90°，文字沿 Y 轴从下往上读
      ctx.translate(0, H);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(0,0,0,0.85)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      // 上半（底部侧）：歌名 title 粗体
      ctx.font = "bold 52px sans-serif";
      ctx.fillText(title || "", H / 2, W * 0.38);
      // 下半（顶部侧）：作者 artist 常规
      ctx.font = "38px sans-serif";
      ctx.fillText(artist || "", H / 2, W * 0.72);
      ctx.restore();
      spineTex.needsUpdate = true;
      setTick((t) => t + 1);
    };

    // 步骤 3：Image 异步加载封面 → 拉伸铺满 → 模糊（只糊背景）
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.referrerPolicy = "no-referrer";
    img.onload = () => {
      if (cancelled) return;
      try {
        // 先拉伸画到 buffer，不直接画主 canvas（避免 filter 影响后面文字）
        const buf = document.createElement("canvas");
        buf.width = W;
        buf.height = H;
        buf.getContext("2d").drawImage(img, 0, 0, W, H);
        // 再用 filter 模糊后贴到主 canvas（滤镜只作用背景）
        ctx.save();
        ctx.filter = "blur(22px) saturate(1.2) brightness(0.85)";
        ctx.drawImage(buf, 0, 0, W, H);
        ctx.restore();
        drawText();
      } catch (_) {
        drawText();
      }
    };
    img.onerror = () => {
      // 封面图挂了就直接画纯色底 + 文字（不影响使用）
      drawText();
    };
    img.src = cover || "";

    // 步骤 4：创建 THREE.CanvasTexture 并返回
    const spineTex = new THREE.CanvasTexture(c);
    spineTex.colorSpace = THREE.SRGBColorSpace;
    spineTex.anisotropy = TEX_SPINE_ANISOTROPY;
    spineTex.needsUpdate = true;
    if (!cancelled) setTexture(spineTex);

    // 步骤 5：清理
    return () => {
      cancelled = true;
      img.onload = null;
      img.onerror = null;
      try {
        img.src = "";
      } catch (_) {}
    };
  }, [title, artist, cover, color, W, H]);

  return [texture, tick];
}
