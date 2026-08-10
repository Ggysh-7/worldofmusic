import { useEffect, useState } from "react";
import { useAlbumStore } from "../store/albumStore.js";
import { MOBILE_BP } from "../constants/layout.js";

/**
 * 响应式 Hook：监听 window 宽度，返回 isMobile（<= MOBILE_BP）
 * 同时同步写回 zustand store（让 store 里的 isMobile 也一致，Albums 那边也能用）
 *
 * @param {number} [breakpoint=MOBILE_BP]  手机断点（默认 768，从 layout.js 拿）
 * @returns {boolean} isMobile 当前是否手机布局
 */
export default function useResponsive(breakpoint = MOBILE_BP) {
  const setIsMobile = useAlbumStore((s) => s.setIsMobile);
  const [isMobile, setLocalMobile] = useState(() => {
    // SSR 安全：Node 端跑没有 window，直接 false
    if (typeof window === "undefined") return false;
    return window.innerWidth <= breakpoint;
  });

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    let rafId = 0;

    const calc = () => {
      const mobile = window.innerWidth <= breakpoint;
      setLocalMobile((prev) => {
        // 变了才同步 set 一次，避免 React 18 严格模式重复写
        if (prev !== mobile) setIsMobile(mobile);
        return mobile;
      });
    };

    const onResize = () => {
      // resize 节流到 rAF，防止拖动窗口 60fps 狂刷
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(calc);
    };

    calc(); // 初始化一次
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize); // 手机横屏竖屏切换

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [breakpoint, setIsMobile]);

  return isMobile;
}
