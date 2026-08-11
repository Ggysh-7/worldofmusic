import { useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import { useAlbumStore } from "../store/albumStore";
import AlbumBox from "./album/AlbumBox.jsx";
import useAlbumClick from "../hooks/useAlbumClick.js";
import useAlbumAnimations from "../hooks/useAlbumAnimations.js";
import { SPACING, SPACING_MOBILE } from "../constants/layout.js";

export default function Albums({
  isMobile: propMobile,
  canStartScene = false,
}) {
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

  useAlbumAnimations({
    albumRefs,
    storeAlbums,
    status,
    activeAlbum,
    scrollOffset,
    isMobile,
    canStartScene,
  });

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
