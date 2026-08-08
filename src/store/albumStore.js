import { create } from 'zustand'

export const useAlbumStore = create((set, get) => ({
  albums: [],
  activeAlbum: null,
  status: 'browse', // browse | focus | open | playing
  scrollOffset: 0,

  setAlbums: (albums) => set({ albums }),
  setActiveAlbum: (album) => set({ activeAlbum: album, status: 'focus' }),
  toggleAlbum: () => {
    const { status } = get()
    if (status === 'focus') return set({ status: 'open' })
    if (status === 'open') return set({ status: 'playing' })
    if (status === 'playing') return set({ status: 'open' })
  },
  closeAlbum: () => set({ activeAlbum: null, status: 'browse', scrollOffset: 0 }),
  setScrollOffset: (scrollOffset) => set({ scrollOffset }),
}))
