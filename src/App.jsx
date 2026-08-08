import { useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import Albums from './components/Albums'
import UIOverlay from './components/UIOverlay'
import { useAlbumStore } from './store/albumStore'
import { albums } from './data/albums'
import { Environment } from '@react-three/drei'

export default function App() {
  useEffect(() => {
    useAlbumStore.setState({ albums })
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#ffffff', position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
        style={{ width: '100%', height: '100%' }}
        onWheel={(e) => {
          if (useAlbumStore.getState().status !== 'browse') return
          e.stopPropagation()
          const { scrollOffset, albums: als } = useAlbumStore.getState()
          const maxOffset = -(als.length - 1) * 1.8 * 0.4
          const newOffset = Math.max(maxOffset, Math.min(0, scrollOffset + e.deltaY * 0.003))
          useAlbumStore.setState({ scrollOffset: newOffset })
        }}
      >
        <color attach="background" args={['#ffffff']} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 8, 5]} intensity={1} />
        <pointLight position={[-5, 3, 2]} intensity={0.3} color="#d4a574" />
        <pointLight position={[5, -2, 3]} intensity={0.2} color="#4a6fa5" />
        <Albums />
        <Environment preset="city" />
      </Canvas>
      <UIOverlay />
    </div>
  )
}
