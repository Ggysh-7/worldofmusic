import { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import { useAlbumStore } from "../store/albumStore";
import { albums } from "../data/albums";

const BOX_W = 1.4;
const BOX_H = 1.9;
const BOX_D = 0.15;
const SPACING = 1.8;

function AlbumBox({ album, index, albumRefs }) {
  const groupRef = useRef();
  const discRef = useRef();
  const innerRef = useRef();
  const [coverTexture, setCoverTexture] = useState(null);
  const [coverTick, setCoverTick] = useState(0);

  // 书脊贴图（封面拉伸 + 竖排白色文字 title+artist）
  const [spineTexture, setSpineTexture] = useState(null);
  const [spineTick, setSpineTick] = useState(0);
  useEffect(() => {
    const W = 256,
      H = 1024; // 书脊画布：窄 × 高（比例 BOX_D:BOX_H）
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d");
    // ---- 先画封底：把封面图直接拉伸铺满（不保持比例，直接拉伸）----
    ctx.fillStyle = album.color;
    ctx.fillRect(0, 0, W, H);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.referrerPolicy = "no-referrer";
    const drawText = () => {
      // ---- 再叠竖排白色文字（沿Y轴从下往上写）----
      ctx.save();
      // 画布逆时针转 90°，这样画出来的文字是「沿着 Y 轴从下往上」读
      ctx.translate(0, H);
      ctx.rotate(-Math.PI / 2);
      // 现在坐标系：X 正向 = 原来 Y 正向（从下往上）；Y 正向 = 原来 -X（从右到左）
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(0,0,0,0.85)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      // 上半（离书脊底部近的一侧）：歌名 title（粗体大一点）
      ctx.font = "bold 52px sans-serif";
      ctx.fillText(album.title, H / 2, W * 0.38);
      // 下半（离书脊顶部近的一侧）：作者 artist（常规体小一点）
      ctx.font = "38px sans-serif";
      ctx.fillText(album.artist, H / 2, W * 0.72);
      ctx.restore();
      spineTex.needsUpdate = true;
      setSpineTick((t) => t + 1);
    };
    img.onload = () => {
      try {
        // ---- 先画清晰拉伸图到离屏 canvas ----
        const buf = document.createElement("canvas");
        buf.width = W;
        buf.height = H;
        buf.getContext("2d").drawImage(img, 0, 0, W, H);
        // ---- 再用模糊滤镜画到主 canvas 上（只模糊背景）----
        ctx.save();
        ctx.filter = "blur(22px) saturate(1.2) brightness(0.85)";
        ctx.drawImage(buf, 0, 0, W, H);
        ctx.restore(); // 滤镜只作用于背景，后面文字不模糊
        drawText();
      } catch (_) {
        drawText();
      }
    };
    img.onerror = () => drawText();
    img.src = album.cover;
    const spineTex = new THREE.CanvasTexture(c);
    spineTex.colorSpace = THREE.SRGBColorSpace;
    spineTex.anisotropy = 4;
    spineTex.needsUpdate = true;
    setSpineTexture(spineTex);
    return () => {
      img.onload = img.onerror = null;
      try {
        img.src = "";
      } catch (_) {}
    };
  }, [album.title, album.artist, album.cover, album.color]);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ff00ff";
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = "#000000";
    ctx.font = "bold 32px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("COVER", 256, 256);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.referrerPolicy = "no-referrer";
    img.onload = () => {
      try {
        ctx.clearRect(0, 0, 512, 512);
        const s = Math.max(512 / img.width, 512 / img.height);
        const dw = img.width * s,
          dh = img.height * s;
        ctx.drawImage(img, (512 - dw) / 2, (512 - dh) / 2, dw, dh);
        texture.needsUpdate = true;
        setCoverTick((t) => t + 1);
      } catch (e) {
        console.error(e);
      }
    };
    img.onerror = () => {
      ctx.fillStyle = "#ff4444";
      ctx.fillRect(0, 0, 512, 512);
      texture.needsUpdate = true;
      setCoverTick((t) => t + 1);
    };
    img.src = album.cover;
    setCoverTexture(texture);
    return () => {
      img.onload = img.onerror = null;
      try {
        img.src = "";
      } catch (_) {}
    };
  }, [album.cover]);

  useEffect(() => {
    if (groupRef.current) {
      albumRefs.current[index] = {
        group: groupRef.current,
        disc: discRef.current,
        inner: innerRef.current,
        album,
      };
    }
    return () => {
      if (albumRefs.current[index]?.group === groupRef.current)
        albumRefs.current[index] = null;
    };
  }, [index, album, albumRefs, coverTick]);

  return (
    <group
      ref={groupRef}
      userData={{ album }}
      rotation={[0, Math.PI / 2, 0]}
      position={[
        index * SPACING - ((8 - 1) * SPACING) / 2, // ← 出生就在最终目标 X
        0,
        0,
      ]}
    >
      {/* ① -X 面（窄条·书脊：封面拉伸 + 竖排白字 title+artist）*/}
      <mesh
        key={`xneg-${spineTick}`}
        position={[-BOX_W / 2, 0, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        castShadow
        receiveShadow
      >
        <planeGeometry args={[BOX_D, BOX_H]} />
        <meshStandardMaterial
          map={spineTexture}
          color={0xffffff}
          roughness={0.5}
          metalness={0.0}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ② +X 面（窄条·书脊：封面拉伸 + 竖排白字 title+artist）*/}
      <mesh
        key={`xpos-${spineTick}`}
        position={[BOX_W / 2, 0, 0]}
        rotation={[0, Math.PI / 2, 0]}
        castShadow
        receiveShadow
      >
        <planeGeometry args={[BOX_D, BOX_H]} />
        <meshStandardMaterial
          map={spineTexture}
          color={0xffffff}
          roughness={0.5}
          metalness={0.0}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ③ -Z 面（大面·封面）BOX_W × BOX_H，贴封面图 ✅ */}
      <mesh
        key={`zneg-${coverTick}`}
        position={[0, 0, -BOX_D / 2]}
        castShadow
        receiveShadow
      >
        <planeGeometry args={[BOX_W, BOX_H]} />
        <meshStandardMaterial
          map={coverTexture}
          color={0xffffff}
          roughness={0.45}
          metalness={0.0}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ④ +Z 面（大面·封面）BOX_W × BOX_H，贴封面图 ✅ */}
      <mesh
        key={`zpos-${coverTick}`}
        position={[0, 0, BOX_D / 2]}
        rotation={[0, Math.PI, 0]}
        castShadow
        receiveShadow
      >
        <planeGeometry args={[BOX_W, BOX_H]} />
        <meshStandardMaterial
          map={coverTexture}
          color={0xffffff}
          roughness={0.45}
          metalness={0.0}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ⑤ +Y 顶面（纯色）*/}
      <mesh
        position={[0, BOX_H / 2, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        castShadow
        receiveShadow
      >
        <planeGeometry args={[BOX_W, BOX_D]} />
        <meshStandardMaterial
          color={album.color}
          roughness={0.5}
          metalness={0.05}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ⑥ -Y 底面（纯色）*/}
      <mesh
        position={[0, -BOX_H / 2, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
        receiveShadow
      >
        <planeGeometry args={[BOX_W, BOX_D]} />
        <meshStandardMaterial
          color={album.color}
          roughness={0.5}
          metalness={0.05}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 内页白卡 */}
      <mesh
        ref={innerRef}
        visible={false}
        position={[0, 0, -BOX_D / 2 - 0.005]}
      >
        <boxGeometry args={[BOX_W - 0.06, BOX_H - 0.04, 0.02]} />
        <meshStandardMaterial color={0xf5f0eb} roughness={0.95} />
      </mesh>

      {/* 光碟组 */}
      {/* 光碟组 —— 真实 CD 结构：外环透明 + 封面主环 + 内圈透明 + 中心透明孔 */}
      <group
        ref={discRef}
        visible={false}
        position={[0, 0, -BOX_D / 2 - 0.008]}
      >
        {/* ① 外环透明边— 半径 0.58 ~ 0.60（更薄）*/}
        <mesh>
          <ringGeometry args={[0.58, 0.6, 96]} />
          <meshPhysicalMaterial
            color={0xffffff}
            transparent={true}
            opacity={0.25}
            transmission={0.9}
            roughness={0.05}
            metalness={0.1}
            thickness={0.003}
            clearcoat={1}
            clearcoatRoughness={0.05}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* ② 封面主环（贴封面图，中心挖空到内圈）— 半径 0.20 ~ 0.58 */}
        <mesh
          key={`disc-cover-${coverTick}`}
          position={[0, 0, 0.001]}
          castShadow
        >
          <ringGeometry args={[0.2, 0.73, 96]} />
          <meshStandardMaterial
            map={coverTexture}
            color={0xffffff}
            roughness={0.4}
            metalness={0.0}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* ③ 内圈透明环（你截图蓝圈位置）— 半径 0.13 ~ 0.20 */}
        <mesh position={[0, 0, 0.002]}>
          <ringGeometry args={[0.13, 0.2, 64]} />
          <meshPhysicalMaterial
            color={0xffffff}
            transparent={true}
            opacity={0.45}
            transmission={0.85}
            roughness={0.05}
            metalness={0.05}
            thickness={0.025}
            clearcoat={1}
            clearcoatRoughness={0.05}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* ④ 中心白色小圆片（夹在透明层中间的 CD 内芯）— 半径 0.06 ~ 0.13 */}
        <mesh position={[0, 0, 0.003]}>
          <ringGeometry args={[0.06, 0.13, 48]} />
          <meshStandardMaterial
            color={0xfafafa}
            roughness={0.6}
            metalness={0.0}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* ⑤ 中心最小的透明孔（你截图蓝圈里的小空心）— 半径 0 ~ 0.06 透明覆盖 */}
        <mesh position={[0, 0, 0.004]}>
          <circleGeometry args={[0.06, 48]} />
          <meshPhysicalMaterial
            color={0xffffff}
            transparent={true}
            opacity={0.55}
            transmission={0.95}
            roughness={0.02}
            thickness={0.02}
            clearcoat={1}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </group>
  );
}

export default function Albums() {
  const {
    albums: storeAlbums,
    activeAlbum,
    status,
    scrollOffset,
    setActiveAlbum,
    toggleAlbum,
    closeAlbum,
  } = useAlbumStore();
  const albumRefs = useRef([]);
  const { camera, raycaster, mouse } = useThree();
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const isEntering = useRef(false);

  // 入场（group 出生位置就对了，这里只做 scale 弹入 + 轻微下落，不会丢盒子）
  useEffect(() => {
    if (storeAlbums.length === 0 || isEntering.current) return;
    isEntering.current = true;
    const tl = gsap.timeline();
    storeAlbums.forEach((_, i) => {
      const ref = albumRefs.current[i];
      // 即便 ref 还没注册上，直接通过 group 对象兜底（用 Three.js scene 找也行，这里直接 set 初始值在下个 tick）
      if (!ref?.group) return;
      gsap.killTweensOf([ref.group.position, ref.group.scale]);
      ref.group.scale.set(0, 0, 0);
      ref.group.position.y = 1.2;
      tl.to(
        ref.group.scale,
        {
          x: 1,
          y: 1,
          z: 1,
          duration: 0.55,
          ease: "back.out(1.7)",
        },
        i * 0.06,
      );
      tl.to(
        ref.group.position,
        {
          y: 0,
          duration: 0.55,
          ease: "power2.out",
        },
        i * 0.06,
      );
    });
  }, [storeAlbums]);

  // Browse 滚动
  useEffect(() => {
    if (status !== "browse") return;
    storeAlbums.forEach((_, i) => {
      const ref = albumRefs.current[i];
      if (!ref?.group) return;
      const base = i * SPACING - ((storeAlbums.length - 1) * SPACING) / 2;
      gsap.killTweensOf(ref.group.position, { x: true });
      gsap.to(ref.group.position, {
        x: base + scrollOffset,
        duration: 0.3,
        ease: "power2.out",
      });
    });
  }, [scrollOffset, status]);

  // Reset → Browse
  useEffect(() => {
    if (status !== "browse") return;
    storeAlbums.forEach((_, i) => {
      const ref = albumRefs.current[i];
      if (!ref?.group) return;
      const base = i * SPACING - ((storeAlbums.length - 1) * SPACING) / 2;
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
  }, [status, storeAlbums]);

  // Focus
  useEffect(() => {
    if (status !== "focus" || !activeAlbum) return;
    storeAlbums.forEach((album, i) => {
      const ref = albumRefs.current[i];
      if (!ref?.group) return;
      if (album.id === activeAlbum.id) {
        gsap.killTweensOf(ref.group.rotation, true);
        gsap.to(ref.group.position, {
          x: 0,
          y: 0,
          z: 1.5,
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
          x: 1.2,
          y: 1.2,
          z: 1.2,
          duration: 0.7,
          ease: "power3.inOut",
        });
      } else {
        const base = i * SPACING - ((storeAlbums.length - 1) * SPACING) / 2;
        gsap.killTweensOf(ref.group.rotation, true);
        gsap.to(ref.group.position, {
          x: base,
          y: 0,
          z: -2.5,
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
          x: 0.8,
          y: 0.8,
          z: 0.8,
          duration: 0.7,
          ease: "power3.inOut",
        });
        // 🚨 关键：非当前盒子 —— 光碟/内页强制收回去（切换 activeAlbum 时，前一个盒子必须重置）
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
          // 动画结束后隐藏（避免半路上被看到）
          setTimeout(() => {
            if (ref.disc) ref.disc.visible = false;
          }, 420);
        }
      }
    });
  }, [activeAlbum, status, storeAlbums]);

  // Open / Playing（只滑光碟，封面不动）
  useEffect(() => {
    if ((status !== "open" && status !== "playing") || !activeAlbum) return;
    const idx = storeAlbums.findIndex((a) => a.id === activeAlbum.id);
    const ref = albumRefs.current[idx];
    if (!ref?.group) return;
    if (ref.inner) ref.inner.visible = true;
    if (ref.disc) {
      gsap.killTweensOf(ref.disc.position, true);
      gsap.to(ref.disc.position, {
        x: BOX_W / 2 + 0.15,
        y: 0,
        z: -BOX_D / 2 - 0.008 + 0.1,
        duration: 0.6,
        ease: "power2.out",
        delay: 0.1,
      });
      ref.disc.visible = true;
    }
  }, [status, activeAlbum, storeAlbums]);

  useFrame((_, delta) => {
    if (status !== "playing" || !activeAlbum) return;
    const idx = storeAlbums.findIndex((a) => a.id === activeAlbum.id);
    const ref = albumRefs.current[idx];
    if (ref?.disc?.visible) ref.disc.rotation.z -= delta * 2;
  });

  // 鼠标交互
  function handlePointerMove(e) {
    if ((e.stopPropagation(), !storeAlbums.length)) return;
    mouse.set(
      (e.clientX / window.innerWidth) * 2 - 1,
      -(e.clientY / window.innerHeight) * 2 + 1,
    );
    raycaster.setFromCamera(mouse, camera);
    const targets = [];
    albumRefs.current.forEach((ref) => {
      if (ref?.group) targets.push(ref.group);
    });
    const intersects = raycaster.intersectObjects(targets, true);
    let hitIdx = null;
    if (intersects.length > 0) {
      let obj = intersects[0].object;
      while (obj.parent && !obj.userData?.album) obj = obj.parent;
      const album = obj.userData?.album;
      if (album) hitIdx = storeAlbums.findIndex((a) => a.id === album.id);
    }
    setHoveredIdx(hitIdx);
    if (hitIdx === null) return;
    const ref = albumRefs.current[hitIdx];
    if (!ref?.group) return;
    let baseRotY = Math.PI / 2;
    if (status !== "browse") {
      if (activeAlbum?.id === ref.album.id) baseRotY = 0;
      else return;
    }
    gsap.killTweensOf(ref.group.rotation, { x: true, y: true });
    gsap.to(ref.group.rotation, {
      x: -mouse.y * 0.12,
      y: baseRotY + mouse.x * 0.12,
      duration: 0.25,
      ease: "power2.out",
    });
  }

  function handlePointerOut() {
    if (hoveredIdx === null) return;
    const ref = albumRefs.current[hoveredIdx];
    if (!ref?.group) {
      setHoveredIdx(null);
      return;
    }
    let baseRotY = Math.PI / 2;
    if (status !== "browse") {
      if (activeAlbum?.id === ref.album.id) baseRotY = 0;
      else {
        setHoveredIdx(null);
        return;
      }
    }
    gsap.killTweensOf(ref.group.rotation, { x: true, y: true });
    gsap.to(ref.group.rotation, {
      x: 0,
      y: baseRotY,
      duration: 0.4,
      ease: "power2.inOut",
    });
    setHoveredIdx(null);
  }

  function handleClick(e) {
    if ((e.stopPropagation(), !storeAlbums.length)) return;
    mouse.set(
      (e.clientX / window.innerWidth) * 2 - 1,
      -(e.clientY / window.innerHeight) * 2 + 1,
    );
    raycaster.setFromCamera(mouse, camera);
    const targets = [];
    albumRefs.current.forEach((ref) => {
      if (ref?.group) targets.push(ref.group);
    });
    const intersects = raycaster.intersectObjects(targets, true);
    if (intersects.length > 0) {
      let obj = intersects[0].object;
      while (obj.parent && !obj.userData?.album) obj = obj.parent;
      const album = obj.userData?.album;
      if (!album) return;
      if (activeAlbum?.id === album.id) toggleAlbum();
      else setActiveAlbum(album);
    } else if (status !== "browse") {
      closeAlbum();
    }
  }

  return (
    <group
      onPointerMove={handlePointerMove}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      {storeAlbums.map((album, i) => (
        <AlbumBox
          key={album.id}
          album={album}
          index={i}
          albumRefs={albumRefs}
        />
      ))}
    </group>
  );
}
