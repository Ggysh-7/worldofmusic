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
    </div>
  );
}
