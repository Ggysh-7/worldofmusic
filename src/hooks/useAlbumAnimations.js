import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import gsap from "gsap";
import { BOX_W, BOX_D, SPACING, SPACING_MOBILE } from "../constants/layout.js";

/**
 * 自定义 Hook：专辑 3D 场景全部 GSAP 动画 + 光碟旋转 useFrame
 * （全部用普通 useEffect 写，不用任何外部辅助函数 → 彻底避免闭包锁旧值的坑）
 *
 * 包含 6 块：
 *   1. 入场：每个盒子从 y=1.2 scale=0 依次 back.out 弹出来（仅一次）
 *   2. Browse 滚动：scrollOffset 变化 → 所有盒子 x 轴平移
 *   3. Reset → Browse：status 切回 browse 时，所有盒子复位角度/位置/光碟收回
 *   4. Focus：activeAlbum 变化时，当前盒子放大推到 z=1.5 正面，其他缩到 z=-2.5 后面
 *   5. Open/Playing：status=open 时内页白卡显示 + 光碟滑出
 *   6. useFrame：playing 状态下当前光碟 2rad/s 逆时针转
 */
export default function useAlbumAnimations({
  albumRefs,
  storeAlbums,
  status,
  activeAlbum,
  scrollOffset,
  isMobile,
}) {
  const isEntering = useRef(false);
  const sp = isMobile ? SPACING_MOBILE : SPACING;

  // ======================================================
  // ① 入场动画（仅执行一次：albums 从 0 → 有值时触发）
  // ======================================================
  useEffect(() => {
    if (storeAlbums.length === 0 || isEntering.current) return;
    isEntering.current = true;
    const tl = gsap.timeline();
    storeAlbums.forEach((_, i) => {
      const ref = albumRefs.current[i];
      if (!ref?.group) return;
      gsap.killTweensOf([ref.group.position, ref.group.scale]);
      ref.group.scale.set(0, 0, 0);
      ref.group.position.y = 1.2;
      tl.to(
        ref.group.scale,
        { x: 1, y: 1, z: 1, duration: 0.55, ease: "back.out(1.7)" },
        i * 0.06,
      );
      tl.to(
        ref.group.position,
        { y: 0, duration: 0.55, ease: "power2.out" },
        i * 0.06,
      );
    });
  }, [storeAlbums.length, albumRefs, storeAlbums]);

  // ======================================================
  // ② Browse 滚动：scrollOffset → 所有盒子 x 平移（仅 browse 时才跑）
  // ======================================================
  useEffect(() => {
    if (status !== "browse") return;
    storeAlbums.forEach((_, i) => {
      const ref = albumRefs.current[i];
      if (!ref?.group) return;
      const base = i * sp - ((storeAlbums.length - 1) * sp) / 2;
      gsap.killTweensOf(ref.group.position, { x: true });
      gsap.to(ref.group.position, {
        x: base + scrollOffset,
        duration: 0.3,
        ease: "power2.out",
      });
    });
  }, [status, scrollOffset, sp, storeAlbums.length, albumRefs, storeAlbums]);

  // ======================================================
  // ③ Reset → Browse：status 切到 browse 时，所有盒子全复位
  // ======================================================
  useEffect(() => {
    if (status !== "browse") return;
    storeAlbums.forEach((_, i) => {
      const ref = albumRefs.current[i];
      if (!ref?.group) return;
      const base = i * sp - ((storeAlbums.length - 1) * sp) / 2;
      gsap.killTweensOf(ref.group.rotation, true);
      gsap.to(ref.group.position, {
        x: base + scrollOffset,
        y: 0,
        z: 0,
        duration: 0.6,
        ease: "power2.inOut",
      });
      gsap.to(ref.group.rotation, {
        x: 0,
        y: Math.PI / 2,
        z: 0,
        duration: 0.6,
        ease: "power2.inOut",
      });
      gsap.to(ref.group.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.6,
        ease: "power2.inOut",
      });
      if (ref.inner) ref.inner.visible = false;
      if (ref.disc) {
        gsap.killTweensOf(ref.disc.position, true);
        gsap.to(ref.disc.position, {
          x: 0,
          y: 0,
          z: -BOX_D / 2 - 0.008,
          duration: 0.5,
          ease: "power2.inOut",
        });
        ref.disc.visible = false;
      }
    });
  }, [status, sp, storeAlbums.length, scrollOffset, albumRefs, storeAlbums]);

  // ======================================================
  // ④ Focus：status === "focus" + 有 activeAlbum 时跑
  // ======================================================
  useEffect(() => {
    if (status !== "focus" || !activeAlbum) return;
    const focusZ = isMobile ? 0.7 : 1.5;
    const focusScale = isMobile ? 0.88 : 1.2;
    const otherZ = isMobile ? -1.8 : -2.5;
    const otherScale = isMobile ? 0.7 : 0.8;
    storeAlbums.forEach((album, i) => {
      const ref = albumRefs.current[i];
      if (!ref?.group) return;
      if (album.id === activeAlbum.id) {
        gsap.killTweensOf(ref.group.rotation, true);
        gsap.to(ref.group.position, {
          x: 0,
          y: 0,
          z: focusZ,
          duration: 0.7,
          ease: "power3.inOut",
        });
        gsap.to(ref.group.rotation, {
          x: 0,
          y: 0,
          z: 0,
          duration: 0.7,
          ease: "power3.inOut",
        });
        gsap.to(ref.group.scale, {
          x: focusScale,
          y: focusScale,
          z: focusScale,
          duration: 0.7,
          ease: "power3.inOut",
        });
      } else {
        const base = i * sp - ((storeAlbums.length - 1) * sp) / 2;
        gsap.killTweensOf(ref.group.rotation, true);
        gsap.to(ref.group.position, {
          x: base,
          y: 0,
          z: otherZ,
          duration: 0.7,
          ease: "power3.inOut",
        });
        gsap.to(ref.group.rotation, {
          x: 0,
          y: Math.PI / 2,
          z: 0,
          duration: 0.7,
          ease: "power3.inOut",
        });
        gsap.to(ref.group.scale, {
          x: otherScale,
          y: otherScale,
          z: otherScale,
          duration: 0.7,
          ease: "power3.inOut",
        });
        if (ref.inner) ref.inner.visible = false;
        if (ref.disc) {
          gsap.killTweensOf(ref.disc.position, true);
          gsap.to(ref.disc.position, {
            x: 0,
            y: 0,
            z: -BOX_D / 2 - 0.008,
            duration: 0.45,
            ease: "power2.inOut",
          });
          setTimeout(() => {
            if (ref.disc) ref.disc.visible = false;
          }, 420);
        }
      }
    });
  }, [status, activeAlbum, sp, isMobile, albumRefs, storeAlbums]);

  // ======================================================
  // ⑤ Open / Playing：内页白卡 + 光碟滑出
  // ======================================================
  useEffect(() => {
    if ((status !== "open" && status !== "playing") || !activeAlbum) return;
    const idx = storeAlbums.findIndex((a) => a.id === activeAlbum.id);
    const ref = albumRefs.current[idx];
    if (!ref?.group) return;
    if (ref.inner) ref.inner.visible = true;
    if (ref.disc) {
      gsap.killTweensOf(ref.disc.position, true);
      const discOutX = isMobile ? BOX_W / 2 - 0.1 : BOX_W / 2 + 0.15;
      gsap.to(ref.disc.position, {
        x: discOutX,
        y: 0,
        z: -BOX_D / 2 - 0.008 + 0.1,
        duration: 0.6,
        ease: "power2.out",
        delay: 0.1,
      });
      ref.disc.visible = true;
    }
  }, [status, activeAlbum, storeAlbums, isMobile, albumRefs]);

  // ======================================================
  // ⑥ 播放时：光碟逆时针 2rad/s 旋转
  // ======================================================
  useFrame((_, delta) => {
    if (status !== "playing" || !activeAlbum) return;
    const idx = storeAlbums.findIndex((a) => a.id === activeAlbum.id);
    const ref = albumRefs.current[idx];
    if (ref?.disc?.visible) ref.disc.rotation.z -= delta * 2;
  });
}
