import { useEffect, useRef } from "react";
import { useAlbumStore } from "../store/albumStore.js";
import { SPACING, SPACING_MOBILE } from "../constants/layout.js";

/**
 * Browse 滚动 Hook：鼠标滚轮 + 触摸滑动（含惯性衰减）
 * 完全对齐你原来 App.jsx 的「clamp 系数 0.45 / 触摸 coef 0.006-手机 0.0045-桌面 / 惯性 velocity *=0.92 / 滚轮 0.003」
 *
 * @param {boolean} isMobile     当前是否手机布局
 * @param {number}  totalAlbums  专辑总数（算 clamp 边界用）
 */
export default function useScrollTouch(isMobile, totalAlbums) {
  const status = useAlbumStore((s) => s.status);

  const touchX = useRef(0);
  const touchLastX = useRef(0);
  const touchLastTime = useRef(0);
  const inertiaRaf = useRef(null);

  // 边界：±(len-1) * sp * 0.45 —— 跟你原来 getLimit / clampOffset 100% 一样
  const sp = isMobile ? SPACING_MOBILE : SPACING;
  const limit = Math.max(0, (totalAlbums - 1) * sp * 0.45);
  const clampOffset = (val) => Math.max(-limit, Math.min(limit, val));

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    // -----------------------------------
    // ① 触摸开始
    // -----------------------------------
    function onTouchStart(e) {
      if (useAlbumStore.getState().status !== "browse") return;
      if (inertiaRaf.current) cancelAnimationFrame(inertiaRaf.current);
      const t = e.touches?.[0];
      if (!t) return;
      touchX.current = t.clientX;
      touchLastX.current = t.clientX;
      touchLastTime.current = performance.now();
    }

    // -----------------------------------
    // ② 触摸移动（跟手）
    // -----------------------------------
    function onTouchMove(e) {
      if (useAlbumStore.getState().status !== "browse") return;
      const t = e.touches?.[0];
      if (!t) return;
      const dx = t.clientX - touchX.current;
      touchX.current = t.clientX;
      touchLastX.current = t.clientX;
      touchLastTime.current = performance.now();
      const { scrollOffset } = useAlbumStore.getState();
      const coef = isMobile ? 0.006 : 0.0045;
      const newOffset = clampOffset(scrollOffset + dx * coef);
      useAlbumStore.setState({ scrollOffset: newOffset });
    }

    // -----------------------------------
    // ③ 触摸结束（惯性：velocity *= 0.92 衰减）
    // -----------------------------------
    function onTouchEnd(e) {
      if (useAlbumStore.getState().status !== "browse") return;
      const dt = Math.max(16, performance.now() - touchLastTime.current);
      const prev = e.changedTouches?.[0]?.clientX ?? touchLastX.current;
      const dxEst = prev - touchLastX.current;
      let velocity = (dxEst / dt) * 16 * (isMobile ? 0.35 : 0.22);
      const { scrollOffset } = useAlbumStore.getState();
      let last = scrollOffset;
      const step = () => {
        velocity *= 0.92;
        if (Math.abs(velocity) < 0.002) {
          inertiaRaf.current = null;
          return;
        }
        last = clampOffset(last + velocity);
        useAlbumStore.setState({ scrollOffset: last });
        inertiaRaf.current = requestAnimationFrame(step);
      };
      if (Math.abs(velocity) >= 0.002) {
        inertiaRaf.current = requestAnimationFrame(step);
      }
    }
    function onTouchCancel() {
      if (inertiaRaf.current) cancelAnimationFrame(inertiaRaf.current);
      inertiaRaf.current = null;
      touchX.current = 0;
      touchLastX.current = 0;
    }

    // -----------------------------------
    // ④ 滚轮（桌面 / 触控板）—— 系数 0.003 负号方向跟你原来完全一致
    // -----------------------------------
    function onWheel(e) {
      if (useAlbumStore.getState().status !== "browse") return;
      e.preventDefault();
      e.stopPropagation();
      const { scrollOffset } = useAlbumStore.getState();
      const delta = (e.deltaY || e.deltaX || 0) * 0.003;
      const newOffset = clampOffset(scrollOffset - delta);
      useAlbumStore.setState({ scrollOffset: newOffset });
    }

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("touchcancel", onTouchCancel);
    window.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchCancel);
      window.removeEventListener("wheel", onWheel);
      if (inertiaRaf.current) cancelAnimationFrame(inertiaRaf.current);
      inertiaRaf.current = null;
    };
    // 依赖里放 status 就够了，其他都是 ref 不会变；isMobile/sp/limit 变了（窗口拉伸）会重新绑事件，没问题
  }, [status, isMobile, limit, clampOffset]);

  return null; // 纯副作用，scrollOffset 直接写 store，不需要 return
}
