import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import Albums from "./components/Albums";
import UIOverlay from "./components/UIOverlay";
import { useAlbumStore } from "./store/albumStore";
import { albums } from "./data/albums";
import { Environment } from "@react-three/drei";

// 桌面盒子间距 / 手机盒子间距
const SPACING = 1.8;
const SPACING_MOBILE = 1.35;
const MOBILE_BP = 768; // <=768px 判定为手机

export { SPACING, SPACING_MOBILE, MOBILE_BP };

export default function App() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= MOBILE_BP : false,
  );
  const touchX = useRef(0);
  const touchLastX = useRef(0);
  const touchLastTime = useRef(0);
  const inertiaRaf = useRef(null);

  // 屏幕尺寸变化 → 自动切 isMobile
  useEffect(() => {
    function onResize() {
      setIsMobile(window.innerWidth <= MOBILE_BP);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // 把 isMobile 塞进 Store 全局（Albums 也能用）
  useEffect(() => {
    useAlbumStore.setState({ isMobile });
  }, [isMobile]);

  useEffect(() => {
    useAlbumStore.setState({ albums });
  }, []);

  // 统一边界计算（桌面/手机间距不同）
  const getLimit = () => {
    const { albums: als } = useAlbumStore.getState();
    const sp = isMobile ? SPACING_MOBILE : SPACING;
    return (als.length - 1) * sp * 0.45;
  };
  const clampOffset = (val) => {
    const limit = getLimit();
    return Math.max(-limit, Math.min(limit, val));
  };

  // 触摸滑动（含惯性）
  function onTouchStart(e) {
    if (useAlbumStore.getState().status !== "browse") return;
    if (inertiaRaf.current) cancelAnimationFrame(inertiaRaf.current);
    const t = e.touches[0];
    touchX.current = t.clientX;
    touchLastX.current = t.clientX;
    touchLastTime.current = performance.now();
  }
  function onTouchMove(e) {
    if (useAlbumStore.getState().status !== "browse") return;
    const t = e.touches[0];
    const dx = t.clientX - touchX.current;
    touchX.current = t.clientX;
    touchLastX.current = t.clientX;
    touchLastTime.current = performance.now();
    const { scrollOffset } = useAlbumStore.getState();
    // 手指向右滑 → 看更左边的专辑 → scrollOffset 增加
    const coef = isMobile ? 0.006 : 0.0045;
    const newOffset = clampOffset(scrollOffset + dx * coef);
    useAlbumStore.setState({ scrollOffset: newOffset });
  }
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
    if (Math.abs(velocity) >= 0.002)
      inertiaRaf.current = requestAnimationFrame(step);
  }

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#ffffff",
        position: "relative",
        touchAction: "pan-y",
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <Canvas
        camera={{ position: [0, 0, isMobile ? 7.2 : 6], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
        style={{ width: "100%", height: "100%" }}
        onWheel={(e) => {
          if (useAlbumStore.getState().status !== "browse") return;
          e.stopPropagation();
          const { scrollOffset } = useAlbumStore.getState();
          const delta = e.deltaY * 0.003;
          const newOffset = clampOffset(scrollOffset - delta);
          useAlbumStore.setState({ scrollOffset: newOffset });
        }}
      >
        <color attach="background" args={["#ffffff"]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 8, 5]} intensity={1} />
        <pointLight position={[-5, 3, 2]} intensity={0.3} color="#d4a574" />
        <pointLight position={[5, -2, 3]} intensity={0.2} color="#4a6fa5" />
        <Albums isMobile={isMobile} />
        <Environment preset="city" />
      </Canvas>
      <UIOverlay isMobile={isMobile} />
    </div>
  );
}
