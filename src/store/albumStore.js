import { create } from "zustand";

// 真实 Audio 单例（全局只有一个 <audio>，不会多首同时放）
let audioEl = null;
if (typeof window !== "undefined") {
  audioEl = new Audio();
  audioEl.preload = "metadata";
}

export const useAlbumStore = create((set, get) => ({
  albums: [],
  activeAlbum: null,
  status: "browse", // browse | focus | open | playing
  scrollOffset: 0,
  progress: 0, // 0~1，真实进度（替代原来 UIOverlay 的假 interval）
  currentTime: 0, // 当前秒
  totalTime: 0, // 总秒（真实从 audio 读，不再用 album.duration 手写字）
  isMobile: false, // ≤768px 由 App.jsx 自动更新

  setAlbums: (albums) => set({ albums }),
  setActiveAlbum: (album) => {
    // 切专辑时 —— 上一首先暂停归零（不管 src 变不变，防止继续响）
    if (audioEl) {
      audioEl.pause();
      audioEl.currentTime = 0;
    }
    // 换了 src 才 load
    if (audioEl && album?.audio && audioEl.src !== album.audio) {
      audioEl.src = album.audio;
      audioEl.load();
    }
    set({
      activeAlbum: album,
      status: "focus",
      progress: 0,
      currentTime: 0,
      totalTime: 0,
    });
  },
  toggleAlbum: () => {
    const { status, activeAlbum } = get();
    if (status === "browse" && activeAlbum) {
      set({ status: "focus" });
      return;
    }
    if (status === "focus") return set({ status: "open" });
    if (status === "open") {
      // 真正开始播放
      if (audioEl && activeAlbum?.audio) {
        audioEl.play().catch((err) => console.warn("播放失败:", err));
      }
      return set({ status: "playing" });
    }
    if (status === "playing") {
      // 暂停
      if (audioEl) audioEl.pause();
      return set({ status: "open" });
    }
  },
  closeAlbum: () => {
    // 关闭时暂停 + 重置
    if (audioEl) {
      audioEl.pause();
      audioEl.currentTime = 0;
    }
    set({
      activeAlbum: null,
      status: "browse",
      scrollOffset: 0,
      progress: 0,
      currentTime: 0,
    });
  },
  // 点空白：只把盒子折回 Browse 一排，歌继续播、信息全留（和 Close 按钮彻底区分）
  collapseAlbum: () => {
    const { status, activeAlbum } = get();
    // 只在有选中专辑、而且不是 browse 时才切（browse 本身已经是一排了，切也白切）
    if (!activeAlbum || status === "browse") return;
    set({ status: "browse" });
    // 注意：其他字段全不动！！
    // ❌ 不要 audio.pause() / 不要 activeAlbum=null / 不要 scrollOffset=0 / 不要 progress=0
    // ✅ activeAlbum 保留 → 状态徽标/进度条/底部歌名全留
    // ✅ audio 继续响 → 歌继续播
    // ✅ scrollOffset 保留 → 滚到哪就停哪
  },
  setScrollOffset: (scrollOffset) => set({ scrollOffset }),
  setProgress: (p, current, total) =>
    set({ progress: p, currentTime: current, totalTime: total }),
  setIsMobile: (isMobile) => set({ isMobile }), // ✅ 补上缺失的 action，useResponsive 报错根因
}));

// 把 audio 真实事件绑定到 Store（更新真实进度条）
if (typeof window !== "undefined" && audioEl) {
  // 进度变化（每秒多次）
  audioEl.addEventListener("timeupdate", () => {
    if (!audioEl.duration || isNaN(audioEl.duration)) return;
    const p = Math.min(1, audioEl.currentTime / audioEl.duration);
    useAlbumStore
      .getState()
      .setProgress(p, audioEl.currentTime, audioEl.duration);
  });
  // 元数据加载完（拿到真实总时长）
  audioEl.addEventListener("loadedmetadata", () => {
    const s = useAlbumStore.getState();
    s.setProgress(0, 0, audioEl.duration);
  });
  // 播放结束 → 自动回到 open 状态（不再循环假进度）
  audioEl.addEventListener("ended", () => {
    if (audioEl) audioEl.pause();
    const s = useAlbumStore.getState();
    s.setProgress(1, audioEl.duration, audioEl.duration);
    if (useAlbumStore.getState().status === "playing") {
      useAlbumStore.setState({ status: "open" });
    }
  });
}

export { audioEl };
