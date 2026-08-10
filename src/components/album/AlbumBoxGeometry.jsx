import * as THREE from "three";
import { BOX_W, BOX_H, BOX_D } from "../../constants/layout.js";

/**
 * AlbumBoxGeometry —— 专辑盒子的 6 个面（纯 mesh 结构，零状态/零副作用/零 ref）
 *
 * 把 Albums.jsx 里原来 120 行的「6 个 plane mesh + 内页白卡 mesh」整块独立出来。
 * 唯一的逻辑就是「根据 props 给对应面贴纹理/颜色」。
 *
 * Props:
 *   @param {THREE.CanvasTexture | null} coverTexture  - 封面纹理（给 ±Z 两个大面贴）
 *   @param {THREE.CanvasTexture | null} spineTexture  - 书脊纹理（给 ±X 两个窄面贴）
 *   @param {number}                     coverTick    - 封面纹理 key（±Z 面 mesh key 强制重建材质）
 *   @param {number}                     spineTick    - 书脊纹理 key（±X 面 mesh key 强制重建材质）
 *   @param {string}                     albumColor   - 专辑主色（给 ±Y 上下两个底面涂纯色）
 */
export default function AlbumBoxGeometry({
  coverTexture = null,
  spineTexture = null,
  coverTick = 0,
  spineTick = 0,
  albumColor = "#333333",
  innerRef = null,
}) {
  return (
    <>
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

      {/* ③ -Z 面（大面·封面）BOX_W × BOX_H，贴封面图 */}
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

      {/* ④ +Z 面（大面·封面）BOX_W × BOX_H，贴封面图 */}
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
          color={albumColor}
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
          color={albumColor}
          roughness={0.5}
          metalness={0.05}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 内页白卡（Open/Playing 时可见，光盘滑出后面那层白纸）*/}
      <mesh
        ref={innerRef}
        visible={false}
        position={[0, 0, -BOX_D / 2 - 0.005]}
      >
        <boxGeometry args={[BOX_W - 0.06, BOX_H - 0.04, 0.02]} />
        <meshStandardMaterial color={0xf5f0eb} roughness={0.95} />
      </mesh>
    </>
  );
}
