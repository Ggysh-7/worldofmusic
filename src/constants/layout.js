/**
 * 全局尺寸 & 布局常量
 * 所有 magic number 集中放这里，之后改盒子厚度/光碟半径/手机断点都只改这里
 */

/* ---------- 盒子 AlbumBox 尺寸（3D 世界单位）---------- */
export const BOX_W = 1.4; // 封面宽（Z± 面的宽）
export const BOX_H = 1.9; // 封面高（Z± 面的高）
export const BOX_D = 0.15; // 书脊厚（X 方向的厚度 = 盒子立方体的深）

/* ---------- 光碟 CompactDisc 半径（3D 世界单位）---------- */
export const CD_OUTER_RING_MIN = 0.58; // ① 外环透明：内径
export const CD_OUTER_RING_MAX = 0.6; // ① 外环透明：外径
export const CD_COVER_MIN = 0.2; // ② 封面主环（贴封面图）：内径
export const CD_COVER_MAX = 0.73; // ② 封面主环（贴封面图）：外径
export const CD_INNER_RING_MIN = 0.13; // ③ 内圈透明环：内径
export const CD_INNER_RING_MAX = 0.2; // ③ 内圈透明环：外径
export const CD_DISC_MIN = 0.06; // ④ 中心白色小圆片：内径
export const CD_DISC_MAX = 0.13; // ④ 中心白色小圆片：外径
export const CD_CENTER = 0.06; // ⑤ 中心最小透明孔：半径（圆形）
export const CD_SEGMENTS_OUTER = 96;
export const CD_SEGMENTS_INNER = 64;
export const CD_SEGMENTS_CENTER = 48;

/* ---------- 相册排布 & 响应式 ---------- */
export const SPACING = 1.8;
export const SPACING_MOBILE = 1.35;
export const MOBILE_BP = 768;

/* ---------- 渲染通用参数 ---------- */
export const TEX_MAX_ANISOTROPY = 8;
export const TEX_SPINE_ANISOTROPY = 4;
