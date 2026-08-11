import { useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import useResponsive from "./hooks/useResponsive.js";
import useScrollTouch from "./hooks/useScrollTouch.js";
import useSplashTimer from "./utils/useSplashTimer.js";
import Albums from "./components/Albums";
import UIOverlay from "./components/UIOverlay";
import SplashScreen from "./components/ui/SplashScreen.jsx";
import { useAlbumStore } from "./store/albumStore";
import { albums } from "./data/albums";
import {
  SAFE_RX_WEB,
  SAFE_RY_WEB,
  SAFE_RX_MOBILE,
  SAFE_RY_MOBILE,
  SAFE_OFFSET_X_WEB,
  SAFE_OFFSET_Y_WEB,
  SAFE_OFFSET_X_MOBILE,
  SAFE_OFFSET_Y_MOBILE,
  MOBILE_BP,
} from "./constants/layout.js";
import { Environment } from "@react-three/drei";

export default function App() {
  // ① 开屏动画（脚本 B 黑胶仪式感，最短 1s 展示）
  //   showSplash: 蒙层显示 / splashProgress: 0~1 假进度条 / canStartScene: 总开关（全部好了才 true）
  const [showSplash, splashProgress, canStartScene] = useSplashTimer(1000);

  // ② 响应式（媒体查询 isMobile）
  const isMobile = useResponsive();

  // ③ Browse 滚动（滚轮 + 触摸）
  useScrollTouch(isMobile, albums.length);

  // ④ 启动时灌 albums 数据
  useEffect(() => {
    useAlbumStore.setState({ albums });
  }, [albums]);
  // —— 删掉了原来 markSplashDone 那个 useEffect（已经整合进 useSplashTimer 了）——

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#ffffff",
        position: "relative",
        touchAction: "pan-y",
      }}
    >
      {/* 开屏动画（fixed z-9999 盖最上层） */}
      <SplashScreen show={showSplash} progress={splashProgress} />

      {/* ✅ Canvas 外面包一层 div：canStartScene=true 才 200ms 淡入出来（绝不在 Splash 期间显示任何盒子） */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: canStartScene ? 1 : 0,
          transition: "opacity 200ms ease",
          pointerEvents: canStartScene ? "auto" : "none",
        }}
      >
        <Canvas
          camera={{ position: [0, 0, isMobile ? 7.2 : 6], fov: 45 }}
          gl={{ antialias: true, alpha: false }}
          style={{ width: "100%", height: "100%" }}
        >
          <color attach="background" args={["#ffffff"]} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 8, 5]} intensity={1} />
          <pointLight position={[-5, 3, 2]} intensity={0.3} color="#d4a574" />
          <pointLight position={[5, -2, 3]} intensity={0.2} color="#4a6fa5" />
          <Albums isMobile={isMobile} canStartScene={canStartScene} />
          <Environment preset="city" />
        </Canvas>
      </div>

      <UIOverlay isMobile={isMobile} />
      {/* ✅ 调试用：安全区域红框（useAlbumClick.js 第185~199行的2D矩形，调试完直接删这段） */}
      {/* <div
        style={{
          position: "fixed",
          pointerEvents: "none", // 不挡点击
          zIndex: 9998,
          left: "50%",
          top: "50%",
          transform: `translate(calc(-50% + ${isMobile ? SAFE_OFFSET_X_MOBILE : SAFE_OFFSET_X_WEB}px), calc(-50% + ${isMobile ? SAFE_OFFSET_Y_MOBILE : SAFE_OFFSET_Y_WEB}px))`,
          // ✅ 100% 和 useAlbumClick.js 判定同步（都读 layout.js 的常量）
          width: `calc(${(isMobile ? SAFE_RX_MOBILE : SAFE_RX_WEB) * 2 * 100}vw)`,
          height: `calc(${(isMobile ? SAFE_RY_MOBILE : SAFE_RY_WEB) * 2 * 100}vh)`,
          border: "3px dashed #ff0000",
          boxSizing: "border-box",
          boxShadow: "0 0 0 9999px rgba(255,0,0,0.05)", // 红框外轻微染红，一眼看到区外
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -32,
            left: "50%",
            transform: "translateX(-50%)",
            color: "#ff0000",
            fontWeight: 900,
            fontSize: 14,
            whiteSpace: "nowrap",
            background: "#fff",
            padding: "2px 10px",
            borderRadius: 4,
            border: "1px solid #ff0000",
            pointerEvents: "none",
          }}
        >
          🔴 红框内 = 点盒子 (toggleAlbum) | 红框外 = 点空白 (collapse)
        </div>
        <div
          style={{
            position: "absolute",
            bottom: -32,
            left: "50%",
            transform: "translateX(-50%)",
            color: "#00aa00",
            fontWeight: 800,
            fontSize: 12,
            whiteSpace: "nowrap",
            background: "#fff",
            padding: "2px 10px",
            borderRadius: 4,
            border: "1px solid #00aa00",
            pointerEvents: "none",
          }}
        >
          调大小：去 useAlbumClick.js 第 190~191 行改 RX/RY 的
          0.22/0.3（web）/0.4/0.34（手机），数字越大红框越大
        </div>
      </div> */}
    </div>
  );
}
