import { useRef, useState } from "react";
import * as THREE from "three";
import gsap from "gsap";

/**
 * 自定义 Hook：处理 3D 场景里的「盒子 hover 倾斜 + 点击切专辑」交互（raycaster 三件套）
 *
 * 等价替换 Albums.jsx 里原来那 100 行的：
 *   const [hoveredIdx, setHoveredIdx] = useState(null);
 *   function handlePointerMove(e){ ... raycaster + gsap tilt ... }
 *   function handlePointerOut(){ ... reset tilt ... }
 *   function handleClick(e){ ... raycaster + toggleAlbum / setActiveAlbum / closeAlbum ... }
 *
 * Params:
 *   @param {MutableRefObject} albumRefs    - Albums.jsx 的 albumRefs.current[]（注册过每个 box 的 group/disc/inner）
 *   @param {object}           r3fDeps      - R3F 提供的 3 个对象：{ camera, raycaster, mouse }（直接传 useThree() 拆出来的）
 *   @param {Array}            albums       - storeAlbums（现在的专辑数组，用于命中后 findIndex 找 id）
 *   @param {string}           status       - browse / focus / open / playing
 *   @param {object|null}      activeAlbum  - 当前选中的专辑对象
 *   @param {Function}         setActiveAlbum  - store action，切到别的专辑
 *   @param {Function}         toggleAlbum     - store action，同一个专辑再点就 focus→open→playing 切换
 *   @param {Function}         closeAlbum      - store action，空白处点击回到 browse
 *
 * Returns: [onPointerMove, onPointerOut, onClick] 三个回调，直接绑到外层 <group> 上
 */
export default function useAlbumClick({
  albumRefs,
  r3fDeps,
  albums,
  status,
  activeAlbum,
  setActiveAlbum,
  toggleAlbum,
  closeAlbum,
}) {
  const { camera, raycaster, mouse } = r3fDeps;
  const [hoveredIdx, setHoveredIdx] = useState(null);
  // 用 ref 存一下 hoveredIdx，避免 handlePointerOut 闭包拿旧值（虽然 useState 有但 ref 更稳）
  const hoveredIdxRef = useRef(null);
  hoveredIdxRef.current = hoveredIdx;

  // --- 辅助：从 intersects 第一个命中点向上找带 userData.album 的 group ---
  function pickAlbumFromIntersects(intersects) {
    if (!intersects || intersects.length === 0) return null;
    let obj = intersects[0].object;
    // 一直向上冒泡（命中 mesh → 冒泡到 group → 冒泡到外层 AlbumBox 的 <group userData={{album}}>）
    while (obj && obj.parent && !obj.userData?.album) obj = obj.parent;
    return obj?.userData?.album ?? null;
  }

  // --- 辅助：拿到 ref 后计算 baseRotY（browse 是侧面 90°，focus+ 是正面 0°）---
  function getBaseRotY(ref) {
    const isBrowse = status === "browse";
    if (!isBrowse && activeAlbum?.id !== ref?.album?.id) return null; // 非当前选中的其他盒子：不处理 tilt
    return isBrowse ? Math.PI / 2 : 0;
  }

  // --- ① onPointerMove：鼠标/手指移动 → 射线检测 → hover 倾斜 ---
  function onPointerMove(e) {
    if (typeof e.stopPropagation === "function") e.stopPropagation();
    if (!albums || albums.length === 0) return;
    // R3F 会给 pointer 事件填 e.norm；没有就手动算（兼容普通 DOM 事件）
    const nx = e.nx ?? (e.clientX / window.innerWidth) * 2 - 1;
    const ny = e.ny ?? -(e.clientY / window.innerHeight) * 2 + 1;
    if (!mouse) return;
    mouse.set(nx, ny);

    raycaster.setFromCamera(mouse, camera);
    const targets = [];
    albumRefs.current.forEach((ref) => {
      if (ref?.group) targets.push(ref.group);
    });
    const intersects = raycaster.intersectObjects(targets, true);
    const albumHit = pickAlbumFromIntersects(intersects);
    const hitIdx = albumHit
      ? albums.findIndex((a) => a.id === albumHit.id)
      : null;
    setHoveredIdx(hitIdx);
    if (hitIdx === null) return;

    const ref = albumRefs.current[hitIdx];
    if (!ref?.group) return;
    const baseRotY = getBaseRotY(ref);
    if (baseRotY === null) return; // 非 browse 又不是当前专辑 → 不 tilt

    gsap.killTweensOf(ref.group.rotation, { x: true, y: true });
    gsap.to(ref.group.rotation, {
      x: -mouse.y * 0.12,
      y: baseRotY + mouse.x * 0.12,
      duration: 0.25,
      ease: "power2.out",
    });
  }

  // --- ② onPointerOut：指针离开盒子 → 倾斜复位 ---
  function onPointerOut() {
    const idx = hoveredIdxRef.current;
    if (idx === null || idx === undefined) return;
    const ref = albumRefs.current[idx];
    if (!ref?.group) {
      setHoveredIdx(null);
      return;
    }
    const baseRotY = getBaseRotY(ref);
    if (baseRotY === null) {
      setHoveredIdx(null);
      return;
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

  // --- ③ onClick：点击盒子 → 切专辑 / 打开 / 播放 / 关闭 ---
  function onClick(e) {
    if (typeof e.stopPropagation === "function") e.stopPropagation();
    if (!albums || albums.length === 0) return;
    const nx = e.nx ?? (e.clientX / window.innerWidth) * 2 - 1;
    const ny = e.ny ?? -(e.clientY / window.innerHeight) * 2 + 1;
    if (mouse) mouse.set(nx, ny);

    raycaster.setFromCamera(mouse, camera);
    const targets = [];
    albumRefs.current.forEach((ref) => {
      if (ref?.group) targets.push(ref.group);
    });
    const intersects = raycaster.intersectObjects(targets, true);
    const albumHit = pickAlbumFromIntersects(intersects);
    if (albumHit) {
      // 命中了盒子：命中的就是当前的 → toggle；否则 → 切换
      if (activeAlbum?.id === albumHit.id) toggleAlbum();
      else setActiveAlbum(albumHit);
      return;
    }
    // 没命中任何盒子 → 如果不是 browse，就视为空白处点击 → 关闭
    if (status !== "browse") closeAlbum();
  }

  return [onPointerMove, onPointerOut, onClick];
}
