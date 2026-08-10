import { useAlbumStore } from "../../store/albumStore.js";
import { durationToSeconds, formatSeconds } from "../../utils/formatTime.js";

/**
 * 专辑信息面板：右下角（Web 右对齐 / 手机左对齐，占满宽）
 * - artist + title
 * - Playing 状态下：进度条 + 「current / total」时间
 */
export default function InfoPanel() {
  const { activeAlbum, status, progress, currentTime, totalTime, isMobile } =
    useAlbumStore();

  if (!activeAlbum) return null;

  // 总秒数：优先 store 的 totalTime（真实 loadedmetadata），没有就用假数据 duration
  const totalSec =
    totalTime > 0 ? totalTime : durationToSeconds(activeAlbum.duration);
  const curSec = Math.max(0, currentTime || 0);

  return (
    <div
      style={{
        position: "absolute",
        bottom: isMobile ? 108 : 100,
        right: isMobile ? 22 : 48,
        left: isMobile ? 22 : "auto",
        width: isMobile ? "auto" : 380,
        maxWidth: isMobile ? "calc(100% - 44px)" : 420,
        textAlign: isMobile ? "left" : "right",
        pointerEvents: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      {/* Artist / Title */}
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

      {/* Playing 状态才显示进度 + 时间 */}
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
              {formatSeconds(curSec)}
              {" / "}
              {formatSeconds(totalSec)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
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
  time: {
    fontSize: "10px",
    color: "rgba(20,20,20,0.35)",
    letterSpacing: "0.1em",
    fontVariantNumeric: "tabular-nums",
  },
};
