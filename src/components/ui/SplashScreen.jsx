/**
 * 开屏动画 —— 脚本 B：黑胶仪式感（纯 CSS keyframes 动画，严格按节奏）
 * 节奏：
 *  0~500ms  → 中央黑胶 CD：scale 0.2 → 1 + 旋转 0→180°（淡入）
 *  500~800ms → CD 下方 MUSICWORD 整行淡入 + 上移
 *  800~1000ms → CD 中心棕点闪一下（op 0.5→1→0.5）+ 底部进度条 0→100%
 *  1000ms → 父组件 set showSplash=false → 整个蒙层 300ms opacity 淡出
 */
export default function SplashScreen({ show = true, progress = 0 }) {
  return (
    <div
      className="splash-root"
      style={{
        position: "fixed",
        inset: 0,
        background: "#ffffff",
        zIndex: 9999,
        pointerEvents: show ? "auto" : "none",
        opacity: show ? 1 : 0,
        transition: "opacity 300ms ease",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        color: "#141414",
        userSelect: "none",
      }}
    >
      {/* =========== 1. 黑胶 CD（纯 CSS radial-gradient 画）=========== */}
      <div className="splash-cd" style={styles.cd}>
        <div style={styles.cdInnerGlow} />
        <div style={styles.cdWhiteRing} />
        <div style={styles.cdCenterDot} className="splash-dot-flash" />
      </div>

      {/* =========== 2. MUSICWORD / DIGITAL COLLECTION =========== */}
      <div style={styles.brand} className="splash-brand-in">
        <span style={styles.brandTitle}>MUSICWORD</span>
        <span style={styles.brandSub}>DIGITAL COLLECTION</span>
      </div>

      {/* =========== 3. 底部进度条（假跑：0~1000ms 从 0→progress 1.0）=========== */}
      <div style={styles.progressWrap}>
        <div style={styles.progressTrack}>
          <div
            style={{
              ...styles.progressFill,
              width: `${Math.min(1, Math.max(0, progress)) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* =========== 注入 CSS 动画（keyframes）—— 避免外部 CSS 文件 =========== */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        /* CD 入场：0~500ms 放大 + 旋转半圈 */
        @keyframes splash-cd-in {
          0%   { transform: scale(0.2) rotate(0deg);   opacity: 0; }
          100% { transform: scale(1)   rotate(180deg); opacity: 1; }
        }
        .splash-cd {
          animation: splash-cd-in 500ms cubic-bezier(0.22,1,0.36,1) 0ms both;
        }

        /* 品牌字：500~800ms 淡入 + 上移 6px */
        @keyframes splash-brand-in {
          0%   { opacity: 0; transform: translateY(6px); }
          100% { opacity: 1; transform: translateY(0);   }
        }
        .splash-brand-in {
          animation: splash-brand-in 300ms ease 500ms both;
        }

        /* CD 中心棕点闪光：800~1000ms flash */
        @keyframes splash-dot-flash {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50%      { opacity: 1;   transform: scale(1.35); }
        }
        .splash-dot-flash {
          animation: splash-dot-flash 200ms ease 800ms 1 both;
        }

        /* 手机断点（≤768px），尺寸和字距对齐 TopBar @media */
        @media (max-width: 768px) {
          .splash-root { padding: 0 24px !important; }
          .splash-brand-title { font-size: 10px !important; letter-spacing: 0.2em !important; }
          .splash-brand-sub   { font-size: 8px  !important; letter-spacing: 0.15em !important; }
        }
      `,
        }}
      />
    </div>
  );
}

const styles = {
  // --- 黑胶 CD（响应式 clamp 尺寸：手机 160px，桌面 260px）---
  cd: {
    position: "relative",
    width: "clamp(160px, 20vw, 260px)",
    height: "clamp(160px, 20vw, 260px)",
    borderRadius: "50%",
    boxShadow:
      "0 12px 30px rgba(20,20,20,0.08), inset 0 0 0 1px rgba(20,20,20,0.04)",
    marginBottom: "clamp(24px, 3vw, 36px)",
    background:
      // ① 最外层透明边（对应 CompactDisc 外环）
      "radial-gradient(circle at center, transparent 95.5%, rgba(255,255,255,0.35) 95.5%, rgba(255,255,255,0.35) 98.5%, transparent 98.5%)," +
      // ② 封面主区：暗金 radial 渐变模拟 CD 彩虹反光（暂时不引图片，避免开屏还要加载图）
      "radial-gradient(circle at 30% 30%, rgba(184,134,90,0.22) 0%, rgba(74,111,165,0.12) 40%, rgba(20,20,20,0.04) 70%, rgba(255,255,255,0) 100%)," +
      // ③ 底色：米白偏暖
      "conic-gradient(from 0deg, #f5f1ea 0%, #faf7f1 30%, #f1ece3 60%, #f5f1ea 100%)",
  },
  // 内圈白色塑料环（CD 里的白圈）
  cdInnerGlow: {
    position: "absolute",
    inset: "18%",
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(255,255,255,0.98) 72%, rgba(250,245,235,0.95) 100%)",
    boxShadow: "inset 0 0 0 1px rgba(20,20,20,0.04)",
  },
  // 塑料环外边 border
  cdWhiteRing: {
    position: "absolute",
    inset: "40%",
    borderRadius: "50%",
    boxShadow: "inset 0 0 0 1px rgba(20,20,20,0.06)",
  },
  // 中心最小那个棕点（就是 PLAYING 那个颜色！）
  cdCenterDot: {
    position: "absolute",
    inset: "calc(50% - clamp(7px, 0.9vw, 10px))",
    borderRadius: "50%",
    background: "#b8865a",
    opacity: 0.55,
  },

  // --- 品牌字（跟 TopBar 完全一致的字距/颜色/大小）---
  brand: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    marginBottom: "clamp(40px, 6vw, 60px)",
  },
  brandTitle: {
    fontSize: "clamp(15px, 1.2vw, 18px)",
    letterSpacing: "0.25em",
    textTransform: "uppercase",
    color: "rgba(20,20,20,0.95)",
    fontWeight: 400,
  },
  brandSub: {
    fontSize: "clamp(11.5px, 0.9vw, 13px)",
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    color: "rgba(0, 0, 0, 0.95)",
  },

  // --- 底部进度条（跟 InfoPanel 完全一致的颜色/高度）---
  progressWrap: {
    position: "absolute",
    bottom: "clamp(48px, 7vw, 88px)",
    width: "min(28vw, 360px)",
    display: "flex",
    justifyContent: "center",
  },
  progressTrack: {
    width: "100%",
    height: "2px",
    background: "rgba(240,236,228,0.35)",
    borderRadius: "1px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "rgba(184,134,90,0.8)",
    transition: "width 60ms linear",
  },
};
