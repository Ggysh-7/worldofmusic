import { useEffect, useRef } from "react";
import { albums } from "../../data/albums.js";
import { SPACING, SPACING_MOBILE } from "../../constants/layout.js";
import useCoverTexture from "../../hooks/useCoverTexture.js";
import useSpineTexture from "../../hooks/useSpineTexture.js";
import AlbumBoxGeometry from "./AlbumBoxGeometry.jsx";
import CompactDisc from "./CompactDisc.jsx";

/**
 * AlbumBox —— 单个专辑盒子（组合：封面纹理 + 书脊纹理 + 盒子6面 mesh + 光碟）
 * 原来 Albums.jsx 里 function AlbumBox(){...} 的完整逻辑直接平移过来，零改动。
 *
 * Props:
 *   @param {object}   album      - 单张专辑对象（from data/albums.js）
 *   @param {number}   index      - 遍历序号（算初始排布位置 + ref 注册 key）
 *   @param {MutableRefObject} albumRefs - 外层 Albums 的 albumRefs.current[]，用于 GSAP 动画
 *   @param {boolean}  isMobile   - 是否手机布局（改初始 X 方向间距 SPACING_MOBILE）
 */
export default function AlbumBox({ album, index, albumRefs, isMobile }) {
  const groupRef = useRef();
  const discRef = useRef();
  const innerRef = useRef();

  // --- 封面纹理 ---
  const [coverTexture, coverTick] = useCoverTexture(album.cover, 512);

  // --- 书脊纹理 ---
  const [spineTexture, spineTick] = useSpineTexture(album);

  // --- 把自己的三个 ref 注册给外层 Albums（供 GSAP 动画寻址）---
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
        (() => {
          const s = isMobile ? SPACING_MOBILE : SPACING;
          return index * s - ((albums.length - 1) * s) / 2;
        })(),
        0,
        0,
      ]}
    >
      {/* 盒子 6 面 + 内页白卡 */}
      <AlbumBoxGeometry
        coverTexture={coverTexture}
        spineTexture={spineTexture}
        coverTick={coverTick}
        spineTick={spineTick}
        albumColor={album.color}
        innerRef={innerRef}
      />

      {/* 光碟组 */}
      <CompactDisc
        ref={discRef}
        coverTexture={coverTexture}
        coverTick={coverTick}
      />
    </group>
  );
}
