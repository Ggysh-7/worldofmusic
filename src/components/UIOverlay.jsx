import { useEffect, useState } from "react";
import { useAlbumStore } from "../store/albumStore";

export default function UIOverlay({ isMobile: propMobile }) {
  const {
    activeAlbum,
    status,
    closeAlbum,
    progress,
    currentTime,
    totalTime,
    isMobile: storeMobile,
  } = useAlbumStore();
  const isMobile = storeMobile ?? propMobile ?? false;

  const totalSec =
    totalTime > 0
      ? totalTime
      : activeAlbum?.duration
        ? (() => {
            const [m, s] = activeAlbum.duration.split(":").map(Number);
            return m * 60 + s;
          })()
        : 0;

  return (
    <div
      className={isMobile ? "ovr-root ovr-mobile" : "ovr-root"}
      style={styles.overlay}
    >
      {/* 注入响应式 CSS（≤768px 生效）*/}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media (max-width: 768px) {
          .ovr-mobile { padding: 20px 18px !important; }
          .ovr-mobile .ovr-brand-title { font-size: 10px !important; letter-spacing: 0.2em !important; }
          .ovr-mobile .ovr-brand-sub { font-size: 8px !important; }
          .ovr-mobile .ovr-status { gap: 5px !important; font-size: 8px !important; margin-left: 8px; }
          .ovr-close-circle {
            position: absolute; top: 58px; right: 18px;
            width: 34px; height: 34px; border-radius: 50%;
            border: 1px solid rgba(20,20,20,0.18); background: rgba(255,255,255,0.88);
            color: rgba(20,20,20,0.6); font-size: 15px;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; pointer-events: auto;
            backdrop-filter: blur(6px);
            font-weight: 500;
            user-select: none;
            z-index: 20;
          }
          .ovr-info-title { font-size: 16px !important; }
          .ovr-info-artist { font-size: 8.5px !important; }
          .ovr-progress-track { width: 100% !important; }
          .ovr-time { font-size: 8.5px !important; }
          .ovr-footer-stack {
            flex-direction: column !important; align-items: center !important; gap: 8px !important;
          }
          .ovr-footer-stack > span { font-size: 8px !important; text-align: center; }
        }
      `,
        }}
      />

      {/* Top bar */}
      <div style={styles.topBar}>
        <div style={styles.brand}>
          <span className="ovr-brand-title" style={styles.brandTitle}>
            Musicword
          </span>
          <span className="ovr-brand-sub" style={styles.brandSub}>
            Digital Collection
          </span>
        </div>
        {activeAlbum && (
          <>
            <div className="ovr-status" style={styles.statusBadge}>
              <span
                style={{
                  ...styles.dot,
                  background:
                    status === "playing" ? "#b8865a" : "rgba(20,20,20,0.3)",
                }}
              />
              <span style={styles.statusText}>
                {status === "browse"
                  ? "Browse"
                  : status === "focus"
                    ? "Selected"
                    : status === "open"
                      ? "Open"
                      : "Playing"}
              </span>
            </div>
            {isMobile ? (
              <button
                onClick={closeAlbum}
                className="ovr-close-circle"
                aria-label="Close"
                title="Close"
              >
                ✕
              </button>
            ) : (
              <button
                onClick={closeAlbum}
                style={styles.closeBtn}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = "rgba(240,236,228,0.6)";
                  e.target.style.color = "#141414";
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = "rgba(20,20,20,0.2)";
                  e.target.style.color = "rgba(20,20,20,0.5)";
                }}
              >
                Close
              </button>
            )}
          </>
        )}
      </div>

      {/* Hint when no album selected */}
      {!activeAlbum && (
        <div style={styles.hint}>
          <p
            style={{
              fontSize: isMobile ? "10px" : "11px",
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "rgba(20,20,20,0.25)",
              margin: 0,
            }}
          >
            Click an album to explore
          </p>
        </div>
      )}

      {/* ↓↓ 重点调整：Album info panel 整体放到蓝框位置 —— 右下角，靠底部 footer 上方，右对齐
              Web / 手机统一使用绝对定位定位到右下角，不再参与 Flex 的 space-between 布局 */}
      {activeAlbum && (
        <div
          style={{
            position: "absolute",
            // Web 右下角：离底部 footer（~72px 高）上方 28px；离右边 44px；
            // 手机右下角：离底部上方 28px，离右边 22px，居中宽度 82%
            bottom: isMobile ? 108 : 100, // 蓝框底部 = 从下往上
            right: isMobile ? 22 : 48, // 蓝框右侧 = 从右往左
            left: isMobile ? 22 : "auto",
            width: isMobile ? "auto" : 380,
            maxWidth: isMobile ? "calc(100% - 44px)" : 420,
            // 右对齐文字（在右下角更自然）
            textAlign: isMobile ? "left" : "right",
            pointerEvents: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {/* 桌面右对齐 / 手机左对齐 */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              alignItems: isMobile ? "flex-start" : "flex-end",
            }}
          >
            <span className="ovr-info-artist" style={styles.artist}>
              {activeAlbum.artist}
            </span>
            <h2
              className="ovr-info-title"
              style={{
                ...styles.title,
                textAlign: isMobile ? "left" : "right",
              }}
            >
              {activeAlbum.title}
            </h2>
          </div>

          {status === "playing" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div className="ovr-progress-track" style={styles.progressTrack}>
                <div
                  style={{
                    ...styles.progressFill,
                    width: `${progress * 100}%`,
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: isMobile ? "space-between" : "flex-end",
                  alignItems: "center",
                  gap: isMobile ? 0 : 12,
                }}
              >
                <span
                  className="ovr-time"
                  style={{ ...styles.time, order: isMobile ? 0 : 2 }}
                >
                  {`${Math.floor(currentTime / 60)}:${String(
                    Math.floor(currentTime % 60),
                  ).padStart(2, "0")}`}
                  {" / "}
                  {`${Math.floor(totalSec / 60)}:${String(
                    Math.floor(totalSec % 60),
                  ).padStart(2, "0")}`}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer —— 保持在最底部 */}
      <div className={isMobile ? "ovr-footer-stack" : ""} style={styles.footer}>
        <span style={styles.footerText}>3D Album Collection</span>
        <span style={styles.footerText}>Ggysh7</span>
        {activeAlbum && (
          <span style={styles.footerTrack}>
            {activeAlbum.artist} — {activeAlbum.title}
          </span>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "32px 40px",
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    color: "#141414",
    zIndex: 10,
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    pointerEvents: "auto",
  },
  brand: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  brandTitle: {
    fontSize: "13px",
    fontWeight: 400,
    letterSpacing: "0.25em",
    textTransform: "uppercase",
    color: "rgba(20,20,20,0.5)",
    margin: 0,
  },
  brandSub: {
    fontSize: "10px",
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    color: "rgba(20,20,20,0.25)",
  },
  statusBadge: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "10px",
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    color: "rgba(20,20,20,0.4)",
  },
  dot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    display: "inline-block",
  },
  statusText: {
    letterSpacing: "0.15em",
  },
  closeBtn: {
    background: "none",
    border: "1px solid rgba(240,236,228,0.2)",
    color: "rgba(20,20,20,0.5)",
    padding: "5px 14px",
    fontSize: "10px",
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    cursor: "pointer",
    borderRadius: "2px",
    transition: "all 0.3s ease",
  },
  hint: {
    position: "absolute",
    bottom: "120px",
    left: 0,
    right: 0,
    textAlign: "center",
  },
  // 下面几个样式还保留在 styles 变量里，被 className 覆盖前有默认值
  infoPanel: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    pointerEvents: "auto",
    maxWidth: "400px",
  },
  albumInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  artist: {
    fontSize: "10px",
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: "rgba(20,20,20,0.35)",
    margin: 0,
  },
  title: {
    fontSize: "26px",
    fontWeight: 300,
    letterSpacing: "-0.02em",
    color: "rgba(20,20,20,0.9)",
    margin: 0,
    lineHeight: 1.2,
  },
  player: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  progressTrack: {
    width: "100%",
    height: "2px",
    background: "rgba(240,236,228,0.1)",
    borderRadius: "1px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "rgba(184,134,90,0.8)",
    transition: "width 0.3s linear",
  },
  playerControls: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  time: {
    fontSize: "10px",
    color: "rgba(20,20,20,0.35)",
    letterSpacing: "0.1em",
    fontVariantNumeric: "tabular-nums",
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    pointerEvents: "none",
  },
  footerText: {
    fontSize: "9px",
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: "rgba(20,20,20,0.2)",
  },
  footerTrack: {
    fontSize: "9px",
    letterSpacing: "0.15em",
    color: "rgba(20,20,20,0.3)",
  },
};
