import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import useResponsive from "./hooks/useResponsive.js";
import useScrollTouch from "./hooks/useScrollTouch.js";
import Albums from "./components/Albums";
import UIOverlay from "./components/UIOverlay";
import { useAlbumStore } from "./store/albumStore";
import { albums } from "./data/albums";
import { Environment } from "@react-three/drei";

export default function App() {
  // ① 响应式（媒体查询 isMobile，内部自己写回 store）
  const isMobile = useResponsive();

  // ② Browse 滚动（滚轮 + 触摸含惯性，内部直接改 store 的 scrollOffset）
  useScrollTouch(isMobile, albums.length);

  // ③ 启动时把 data/albums.js 的假数据灌进 zustand store
  useEffect(() => {
    useAlbumStore.setState({ albums });
  }, [albums]);

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
        <Albums isMobile={isMobile} />
        <Environment preset="city" />
      </Canvas>
      <UIOverlay isMobile={isMobile} />
    </div>
  );
}
