import { useAlbumStore } from "../../store/albumStore.js";

/**
 * UI 最底部一行 3 段：
 *   左：3D Album Collection
 *   中：Ggysh7
 *   右：[artist] — [title]（未选中时这一行不显示）
 *
 * 以及 Browse 未选中专辑时，屏幕中下部的「Click an album to explore」提示
 */
export default function FooterPlayer() {
  const { activeAlbum, isMobile } = useAlbumStore();

  return (
    <>
      {/* Browse + 未选中：中下部提示 */}
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

      {/* 底部一行 */}
      <div className={isMobile ? "ovr-footer-stack" : ""} style={styles.footer}>
        <span style={styles.footerText}>3D Album Collection</span>
        <span style={styles.footerText}>Ggysh7</span>
        {activeAlbum && (
          <span style={styles.footerTrack}>
            {activeAlbum.artist} — {activeAlbum.title}
          </span>
        )}
      </div>
    </>
  );
}

const styles = {
  hint: {
    position: "absolute",
    bottom: "120px",
    left: 0,
    right: 0,
    textAlign: "center",
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
