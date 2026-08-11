import { useEffect, useState } from "react";
import { useAlbumStore } from "../store/albumStore.js";

/**
 * 开屏动画计时（砍掉所有 zustand flag 写入，纯 state 返回，绝不死循环）
 *  ┌─ showSplash: true          → 显示 Splash 蒙层（正在播动画 or 等待资源）
 *  │  showSplash: false         → Splash 开始 300ms 淡出
 *  └─ canStartScene: true       → 1s 硬等 + 300ms 淡出 + 资源 全部 ready（Canvas 可以淡入、盒子可以开始入场）
 *
 * @param {number} [minDuration=1000] 最短动画时间
 * @returns {[boolean, number, boolean]} [showSplash, progress 0~1, canStartScene]
 */
export default function useSplashTimer(minDuration = 1000) {
  const [showSplash, setShowSplash] = useState(true);
  const [progress, setProgress] = useState(0);
  const [canStartScene, setCanStartScene] = useState(false); // ✅ 新增：总开关

  useEffect(() => {
    let rafId = 0;
    let hideTimer = 0;
    let sceneTimer = 0;
    const start = performance.now();

    // TODO: 后面接接口/预加载封面就替换这个 Promise（现在 albums 有值就算好）
    const resourcesReadyPromise = new Promise((res) => {
      let tick = 0;
      const tm = setInterval(() => {
        const len = useAlbumStore.getState().albums.length;
        if (len > 0 || tick++ > 200) {
          clearInterval(tm);
          res();
        }
      }, 50);
    });

    // 假进度条
    const tickFakeProgress = () => {
      const elapsed = performance.now() - start;
      setProgress(Math.min(1, elapsed / minDuration));
      if (performance.now() - start < minDuration)
        rafId = requestAnimationFrame(tickFakeProgress);
    };
    rafId = requestAnimationFrame(tickFakeProgress);

    // ① 1s 硬等 + 资源 ready → 开始 Splash 淡出（showSplash=false）
    Promise.all([
      resourcesReadyPromise,
      new Promise((res) => {
        hideTimer = setTimeout(res, minDuration);
      }),
    ]).then(() => {
      setShowSplash(false);
      // ② 再等 300ms Splash 淡出完 → 可以让 Canvas 淡入 + 盒子入场了（canStartScene=true）
      sceneTimer = setTimeout(() => setCanStartScene(true), 300);
    });

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(hideTimer);
      clearTimeout(sceneTimer);
    };
  }, [minDuration]);

  return [showSplash, progress, canStartScene]; // ✅ 返回第 3 个值
}
