import { useAlbumStore } from "../../store/albumStore.js";
import ShinyText from "../text/ShinyText.jsx";
import EchoText from "../text/EchoText.jsx";

export default function FooterPlayer() {
  const { activeAlbum, isMobile } = useAlbumStore();
  return (
    <>
      {!activeAlbum && (
        <div style={styles.hint}>
          <EchoText
            text="CLICK AN ALBUM TO EXPLORE"
            echoes={8}
            lag={0.18}
            offset={20}
            direction="right"
            fade={0.65}
            blur={2}
            tint="#01847F"
            mode="both"
            cursorRadius={200}
            duration={600}
            ease="ease-out"
            fontSize="9px"
            fontWeight={400}
            color="rgba(20,20,20,0.3)"
          />
        </div>
      )}
      <div className={isMobile ? "ovr-footer-stack" : ""} style={styles.footer}>
        <ShinyText
          text="3D Album Collection"
          speed={1.5}
          color="rgba(20,20,20,0.2)"
          shineColor="rgba(20,20,20,0.7)"
          spread={120}
          direction="left"
          className="footer-shiny"
        />
        <ShinyText
          text="Ggysh7"
          speed={1.5}
          color="rgba(20,20,20,0.2)"
          shineColor="rgba(20,20,20,0.7)"
          spread={120}
          direction="left"
          className="footer-shiny"
        />
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
  footerTrack: {
    fontSize: "9px",
    letterSpacing: "0.15em",
    color: "rgba(20,20,20,0.3)",
  },
};
