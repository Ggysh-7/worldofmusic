import { forwardRef } from "react";
import * as THREE from "three";
import {
  BOX_D,
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
} from "../../constants/layout.js";

/**
 * 光碟 CompactDisc —— 5 层叠加的真实 CD 结构
 *
 * 纯 JSX 组件，零副作用。位置/显示/旋转由外层通过 ref + props 控制。
 *
 * Props:
 *   @param {THREE.CanvasTexture | null} coverTexture  - 封面纹理（来自 useCoverTexture）
 *   @param {number}                     coverTick    - 纹理更新 tick（给封面主环做 key，强制重建材质）
 *
 * Ref:  接收 forwardRef 指向最外层 <group>，这样 Albums.jsx 里 gsap.to(disc.position, ...) 不用改。
 *       （也就是你现在 discRef.current 直接指向的还是原来那个 group 对象，一行动画代码不用改）
 */
const CompactDisc = forwardRef(function CompactDisc(
  { coverTexture = null, coverTick = 0 },
  ref,
) {
  return (
    <group
      ref={ref}
      visible={false}
      position={[0, 0, -BOX_D / 2 - 0.008]}
      /* ↓ 这里的 BOX_D 我们直接用 0.15 写死，等于 layout.js 的 BOX_D，
         因为 constants 里 BOX_D = 0.15，避免在这里又多引一次（未来要改直接改 layout.js，
         这里会跟着我同步把它改成从 layout.js 引）*/
    >
      {/* ① 外环透明边 */}
      <mesh>
        <ringGeometry
          args={[CD_OUTER_RING_MIN, CD_OUTER_RING_MAX, CD_SEGMENTS_OUTER]}
        />
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

      {/* ② 封面主环（贴封面图，中心挖空到内圈）*/}
      <mesh key={`disc-cover-${coverTick}`} position={[0, 0, 0.001]} castShadow>
        <ringGeometry args={[CD_COVER_MIN, CD_COVER_MAX, CD_SEGMENTS_OUTER]} />
        <meshStandardMaterial
          map={coverTexture}
          color={0xffffff}
          roughness={0.4}
          metalness={0.0}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ③ 内圈透明环 */}
      <mesh position={[0, 0, 0.002]}>
        <ringGeometry
          args={[CD_INNER_RING_MIN, CD_INNER_RING_MAX, CD_SEGMENTS_INNER]}
        />
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

      {/* ④ 中心白色小圆片 */}
      <mesh position={[0, 0, 0.003]}>
        <ringGeometry args={[CD_DISC_MIN, CD_DISC_MAX, CD_SEGMENTS_CENTER]} />
        <meshStandardMaterial
          color={0xfafafa}
          roughness={0.6}
          metalness={0.0}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ⑤ 中心最小的透明孔 */}
      <mesh position={[0, 0, 0.004]}>
        <circleGeometry args={[CD_CENTER, CD_SEGMENTS_CENTER]} />
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
  );
});

export default CompactDisc;
