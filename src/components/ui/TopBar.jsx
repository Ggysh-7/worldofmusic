import { useAlbumStore } from "../../store/albumStore.js";
import ShinyText from "../text/ShinyText.jsx";

export default function TopBar() {
  const { activeAlbum, status, closeAlbum, isMobile } = useAlbumStore();

  return (
    <>
      {/* ✅ B方案：Playing 时 dot 呼吸动画（透明度+缩放，周期1.8s） */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes topDotBreath {
          0%, 100% { opacity: 0.6; transform: scale(0.85); }
          50%      { opacity: 1;   transform: scale(1.05); }
        }
        .dot-breathing {
          animation: topDotBreath 1.8s ease-in-out infinite !important;
        }
      `,
        }}
      />
      <div style={styles.topBar}>
        {/* 左上 Logo */}
        <div style={styles.brand}>
          <ShinyText
            text="Musicword"
            speed={2}
            color="rgba(20,20,20,0.5)"
            shineColor="rgba(20,20,20,1)"
            spread={120}
            direction="left"
            className="top-brand-title"
          />
          <span className="ovr-brand-sub" style={styles.brandSub}>
            Digital Collection
          </span>
        </div>

        {/* 右上：只有选中专辑时才显示「状态 + Close」*/}
        {activeAlbum && status !== "browse" && (
          <>
            <div className="ovr-status" style={styles.statusBadge}>
              <span
                className={status === "playing" ? "dot-breathing" : ""}
                style={{
                  ...styles.dot,
                  background:
                    status === "playing" ? "#fd2578" : "rgba(20,20,20,0.3)",
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
                  e.currentTarget.style.borderColor = "rgba(240,236,228,0.6)";
                  e.currentTarget.style.color = "#141414";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(20,20,20,0.2)";
                  e.currentTarget.style.color = "rgba(20,20,20,0.5)";
                }}
              >
                Close
              </button>
            )}
          </>
        )}
      </div>
    </>
  );
}

const styles = {
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
    transformOrigin: "50% 50%",
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
    marginLeft: 16,
  },
};
