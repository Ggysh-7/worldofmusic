import { useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import { useAlbumStore } from "../store/albumStore";
import { albums } from "../data/albums";
import AlbumBox from "./album/AlbumBox.jsx";
import useAlbumClick from "../hooks/useAlbumClick.js";
import useAlbumAnimations from "../hooks/useAlbumAnimations.js";
import {
  BOX_W,
  BOX_H,
  BOX_D,
  SPACING,
  SPACING_MOBILE,
  CD_OUTER_RING_MIN,
  CD_OUTER_RING_MAX,
  CD_COVER_MIN,
  CD_COVER_MAX,
  CD_INNER_RING_MIN,
  CD_INNER_RING_MAX,
  CD_DISC_MIN,
  CD_DISC_MAX,
  CD_CENTER,
  CD_SEGMENTS_OUTER,
  CD_SEGMENTS_INNER,
  CD_SEGMENTS_CENTER,
  TEX_SPINE_ANISOTROPY,
} from "../constants/layout.js";

export default function Albums({ isMobile: propMobile }) {
  const {
    albums: storeAlbums,
    activeAlbum,
    status,
    scrollOffset,
    setActiveAlbum,
    toggleAlbum,
    closeAlbum,
    collapseAlbum,
    isMobile: storeMobile,
  } = useAlbumStore();
  const albumRefs = useRef([]);
  const { camera, raycaster, mouse } = useThree();
  const isMobile = storeMobile ?? propMobile ?? false;
  const sp = isMobile ? SPACING_MOBILE : SPACING;
  // ↓↓ 交互（hover 倾斜 + 点击切专辑/打开/关闭）—— 拆成 hook
  const [onPointerMove, onPointerOut, onClick] = useAlbumClick({
    albumRefs,
    r3fDeps: { camera, raycaster, mouse },
    albums: storeAlbums,
    status,
    activeAlbum,
    setActiveAlbum,
    toggleAlbum,
    closeAlbum,
    collapseAlbum,
  });

  // ↓↓ 全部动画（入场/Browse滚动/Focus/Reset/Open光碟/播放旋转）—— 拆成 hook
  useAlbumAnimations({
    albumRefs,
    storeAlbums,
    status,
    activeAlbum,
    scrollOffset,
    isMobile,
  });

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
      onPointerMove={onPointerMove}
      onPointerOut={onPointerOut}
      onClick={onClick}
    >
      {storeAlbums.map((album, i) => (
        <AlbumBox
          key={album.id}
          album={album}
          index={i}
          albumRefs={albumRefs}
          isMobile={isMobile}
        />
      ))}
    </group>
  );
}
