import TopBar from "./ui/TopBar.jsx";
import InfoPanel from "./ui/InfoPanel.jsx";
import FooterPlayer from "./ui/FooterPlayer.jsx";
import { useAlbumStore } from "../store/albumStore";

const overlayStyle = {
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
};

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

  return (
    <div
      className={isMobile ? "ovr-root ovr-mobile" : "ovr-root"}
      style={overlayStyle}
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
      <TopBar />
      <InfoPanel />
      <FooterPlayer />
    </div>
  );
}
