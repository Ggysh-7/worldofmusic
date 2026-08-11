import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import gsap from "gsap";
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
} from "../constants/layout.js";

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
  collapseAlbum,
}) {
  const { camera, raycaster, mouse } = r3fDeps;
  const [hoveredIdx, setHoveredIdx] = useState(null);
  // 用 ref 存一下 hoveredIdx，避免 handlePointerOut 闭包拿旧值（虽然 useState 有但 ref 更稳）
  const hoveredIdxRef = useRef(null);
  hoveredIdxRef.current = hoveredIdx;

  // --- 辅助：从 intersects 命中里挑「真的视觉上点中了某本专辑」的 album 对象
  //     ✅ 修复核心：命中「盒子背面（DoubleSide 下法线和射线同向）」→ 直接返回 null，算空白
  //     ✅ 额外：status≠browse 时，命中 activeAlbum 且 distance 异常（打在了延伸面上）→ 也过滤
  function pickAlbumFromIntersects(
    intersects,
    debug = false,
    status = "browse",
  ) {
    if (!intersects || intersects.length === 0) return null;
    const hit = intersects[0];
    if (!hit?.object || !hit?.face) return null;

    // ======================================================
    // ✅ 修复：只在 status!=browse（盒子正面对我们）时才过滤背面
    //   Browse（一排书脊）时，露出的大封面是背面命中，绝对不能过滤！不然点红框那面没反应！
    // ======================================================
    if (status !== "browse") {
      const dot = hit.face.normal.dot(raycaster.ray.direction);
      const isBackFace = dot > 0;
      if (isBackFace) return null;
    }

    // 正面命中 → 向上冒泡找 userData.album
    let obj = hit.object;
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
    const albumHit = pickAlbumFromIntersects(intersects, true, status);
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
  // --- ③ onClick：点击盒子 → 切专辑 / 打开 / 播放 / 关闭（带调试 log）---
  function onClick(e) {
    if (typeof e.stopPropagation === "function") e.stopPropagation();
    // status≠browse 时，R3F 的 onClick 全部停用！交给 useEffect 里那个 DOM 原生 click（2D 中心区判定）
    if (status !== "browse") {
      return;
    }
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
    const albumHit = pickAlbumFromIntersects(intersects, false, status);
    if (albumHit) {
      // ✅ 情况 1：真的命中了 album 的某一面 → 切换/toggle
      if (activeAlbum?.id === albumHit.id) toggleAlbum();
      else setActiveAlbum(albumHit);
      return;
    }

    // ✅ 情况 2：命中了「非 album 物体」（例如 Environment 的全景球、透明 background Mesh、Ground 等）
    //         或者 intersects.length 真的 = 0
    //         → 统统视为「点空白」：status≠browse 就 collapse
    if (status !== "browse") {
      collapseAlbum(); // 只折盒子，歌/信息留着
    }
    // ↓ 注意：这里绝对不能再 return 了，上面 2 个 if 已经都处理完了
  }

  // ======================================================
  // ✅ 终极方案：status!=browse 时，用「2D 屏幕中心安全区」判定（不依赖 R3F 射线，100%准）
  // ======================================================
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onDomClick = (e) => {
      // 只在 focus/open/playing 时接管；browse 状态完全用 R3F 原来的逻辑（点小盒子切歌）
      if (status === "browse") return;
      // 防止点到 UI 层（Close 按钮 / 进度条 / 品牌字）也触发
      const uiEl = e.target?.closest?.(
        ".ovr-root, .ovr-close-circle, [class*='ovr-']",
      );
      if (uiEl) return;

      const w = window.innerWidth;
      const h = window.innerHeight;
      // 📱 手机单独小一点（手机盒子整体缩小了）
      const mobile =
        typeof window !== "undefined" && window.innerWidth <= MOBILE_BP;
      const RX = w * (mobile ? SAFE_RX_MOBILE : SAFE_RX_WEB);
      const RY = h * (mobile ? SAFE_RY_MOBILE : SAFE_RY_WEB);
      const cx = w / 2 + (mobile ? SAFE_OFFSET_X_MOBILE : SAFE_OFFSET_X_WEB);
      const cy = h / 2 + (mobile ? SAFE_OFFSET_Y_MOBILE : SAFE_OFFSET_Y_WEB);
      const inSafe =
        Math.abs(e.clientX - cx) <= RX && Math.abs(e.clientY - cy) <= RY;

      if (inSafe)
        toggleAlbum(); // 安全区内 → 点盒子
      else collapseAlbum(); // 安全区外 → 点空白（折回去，歌继续播）
    };

    // capture: true 让我们比 R3F 的合成事件更早拿到，避免被 stopPropagation 干掉
    window.addEventListener("click", onDomClick, true);

    return () => {
      window.removeEventListener("click", onDomClick, true);
    };
  }, [status, toggleAlbum, collapseAlbum]);
  return [onPointerMove, onPointerOut, onClick];
}
