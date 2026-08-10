import { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import { useAlbumStore } from "../store/albumStore";
import { albums } from "../data/albums";

const BOX_W = 1.2;
const BOX_H = 1.6;
const BOX_D = 0.35;
const SPACING = 1.8;

function AlbumBox({ album, index, albumRefs }) {
  const groupRef = useRef();
  const discRef = useRef();
  const innerRef = useRef();
  const [coverTexture, setCoverTexture] = useState(null);
  const [coverTick, setCoverTick] = useState(0);

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
    <group ref={groupRef} userData={{ album }} rotation={[0, Math.PI / 2, 0]}>
      {/* ① -X 面（窄条·书脊占位）BOX_D × BOX_H，以后换书脊图 */}
      <mesh
        position={[-BOX_W / 2, 0, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        castShadow
        receiveShadow
      >
        <planeGeometry args={[BOX_D, BOX_H]} />
        <meshStandardMaterial
          color={album.color}
          roughness={0.5}
          metalness={0.05}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ② +X 面（窄条·书脊占位）BOX_D × BOX_H，以后换书脊图 */}
      <mesh
        position={[BOX_W / 2, 0, 0]}
        rotation={[0, Math.PI / 2, 0]}
        castShadow
        receiveShadow
      >
        <planeGeometry args={[BOX_D, BOX_H]} />
        <meshStandardMaterial
          color={album.color}
          roughness={0.5}
          metalness={0.05}
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
      <group
        ref={discRef}
        visible={false}
        position={[0, 0, -BOX_D / 2 - 0.008]}
      >
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.4, 0.4, 0.02, 64]} />
          <meshStandardMaterial
            color={0x111111}
            roughness={0.05}
            metalness={0.9}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.003]}>
          <cylinderGeometry args={[0.13, 0.13, 0.025, 32]} />
          <meshStandardMaterial color={album.color} roughness={0.5} />
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

  // 入场（只动 position，不动 rotation）
  useEffect(() => {
    if (storeAlbums.length === 0 || isEntering.current) return;
    isEntering.current = true;
    const targetPositions = storeAlbums.map(
      (_, i) => i * SPACING - ((storeAlbums.length - 1) * SPACING) / 2,
    );
    storeAlbums.forEach((_, i) => {
      const ref = albumRefs.current[i];
      if (ref?.group) {
        gsap.killTweensOf(ref.group.position);
        ref.group.position.set(18 + i * 0.5, 0, -2);
      }
    });
    const tl = gsap.timeline();
    storeAlbums.forEach((_, i) => {
      const ref = albumRefs.current[i];
      if (!ref?.group) return;
      tl.to(
        ref.group.position,
        {
          x: targetPositions[i],
          z: 0,
          duration: 1.0,
          ease: "power3.out",
        },
        i * 0.08,
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
