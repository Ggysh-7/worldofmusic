import { useEffect, useState } from "react";
import { useAlbumStore } from "../store/albumStore";

export default function UIOverlay() {
  const { activeAlbum, status, closeAlbum, progress, currentTime, totalTime } =
    useAlbumStore();

  // 用真实 totalTime（audio loadedmetadata 之后拿到的），没有就 fallback 用 album.duration
  const totalSec =
    totalTime > 0
      ? totalTime
      : activeAlbum?.duration
        ? (() => {
            const [m, s] = activeAlbum.duration.split(":").map(Number);
            return m * 60 + s;
          })()
        : 0;

  // const formatTime = (percent, duration) => {
  //   const totalSec = parseDuration(duration)
  //   const elapsed = Math.floor(totalSec * percent / 100)
  //   return `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`
  // }

  // const parseDuration = (dur) => {
  //   const [m, s] = dur.split(':').map(Number)
  //   return m * 60 + s
  // }

  return (
    <div style={styles.overlay}>
      {/* Top bar */}
      <div style={styles.topBar}>
        <div style={styles.brand}>
          <span style={styles.brandTitle}>Musicword</span>
          <span style={styles.brandSub}>Digital Collection</span>
        </div>
        {activeAlbum && (
          <>
            <div style={styles.statusBadge}>
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
          </>
        )}
      </div>

      {/* Hint when no album selected */}
      {!activeAlbum && (
        <div style={styles.hint}>
          <p
            style={{
              fontSize: "11px",
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

      {/* Album info panel */}
      {activeAlbum && (
        <div style={styles.infoPanel}>
          <div style={styles.albumInfo}>
            <span style={styles.artist}>{activeAlbum.artist}</span>
            <h2 style={styles.title}>{activeAlbum.title}</h2>
          </div>
          {status === "playing" && (
            <div style={styles.player}>
              <div style={styles.progressTrack}>
                <div
                  style={{ ...styles.progressFill, width: `${progress}%` }}
                />
              </div>
              <div style={styles.playerControls}>
                <span style={styles.time}>
                  {`${Math.floor(currentTime / 60)}:${String(Math.floor(currentTime % 60)).padStart(2, "0")}`}
                  {" / "}
                  {`${Math.floor(totalSec / 60)}:${String(Math.floor(totalSec % 60)).padStart(2, "0")}`}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={styles.footer}>
        <span style={styles.footerText}>3D Album Collection</span>
        <span style={styles.footerText}>Built with Three.js</span>
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
