import { useEffect, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'
import { useAlbumStore } from '../store/albumStore'
import { albums } from '../data/albums'

// Box dimensions
const BOX_W = 1.2
const BOX_H = 1.6
const BOX_D = 0.35
const SPACING = 1.8

// Create a canvas texture from cover URL
function createCoverTexture(url) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(0, 0, 512, 512)
  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    ctx.clearRect(0, 0, 512, 512)
    const scale = Math.min(512, 512 / (BOX_H / BOX_W))
    ctx.drawImage(img, 0, (512 - scale) / 2, 512, scale)
    texture.needsUpdate = true
  }
  img.src = url
  return texture
}

// Album box component
function AlbumBox({ album, index, albumRefs }) {
  const groupRef = useRef()
  const coverRef = useRef()
  const discRef = useRef()
  const innerRef = useRef()
  const [coverTexture, setCoverTexture] = useState(null)

  useEffect(() => {
    setCoverTexture(createCoverTexture(album.cover))
  }, [album.cover])

  useEffect(() => {
    if (groupRef.current) {
      albumRefs.current[index] = {
        group: groupRef.current,
        cover: coverRef.current,
        disc: discRef.current,
        inner: innerRef.current,
        album,
      }
    }
  }, [index, album, albumRefs])

  return (
    <group ref={groupRef} userData={{ album }}>
      {/* Main box body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[BOX_W, BOX_H, BOX_D]} />
        <meshStandardMaterial color={album.color} roughness={0.5} metalness={0.05} />
      </mesh>

      {/* Cover group (front face) */}
      <group ref={coverRef} position={[0, 0, BOX_D / 2 - 0.01]}>
        {/* Cover art */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[BOX_W - 0.02, BOX_H - 0.02, 0.01]} />
          <meshStandardMaterial map={coverTexture} roughness={0.3} metalness={0.05} />
        </mesh>
        {/* Dark back of cover */}
        <mesh position={[0, 0, -0.01]} rotation={[0, Math.PI, 0]}>
          <boxGeometry args={[BOX_W - 0.02, BOX_H - 0.02, 0.01]} />
          <meshStandardMaterial
            color={new THREE.Color(album.color).offsetHSL(0, 0, -0.1)}
            roughness={0.7}
          />
        </mesh>
      </group>

      {/* Inner face (white, hidden until opened) */}
      <mesh ref={innerRef} visible={false} position={[0, 0, BOX_D / 2 + 0.005]}>
        <boxGeometry args={[BOX_W - 0.06, BOX_H - 0.04, 0.02]} />
        <meshStandardMaterial color={0xf5f0eb} roughness={0.95} />
      </mesh>

      {/* Disc (hidden until opened) */}
      <group ref={discRef} visible={false} position={[0, 0, BOX_D / 2 + 0.01]}>
        {/* Disc surface */}
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.4, 0.4, 0.02, 64]} />
          <meshStandardMaterial color={0x111111} roughness={0.05} metalness={0.9} />
        </mesh>
        {/* Disc label */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.003]}>
          <cylinderGeometry args={[0.13, 0.13, 0.025, 32]} />
          <meshStandardMaterial color={album.color} roughness={0.5} />
        </mesh>
      </group>
    </group>
  )
}

// Albums list component
export default function Albums() {
  const { albums: storeAlbums, activeAlbum, status, scrollOffset, setActiveAlbum, toggleAlbum, closeAlbum } = useAlbumStore()
  const albumRefs = useRef([])
  const { camera, raycaster, mouse } = useThree()
  const [hoveredIdx, setHoveredIdx] = useState(null)
  const isEntering = useRef(false)

  // Initial entrance animation
  useEffect(() => {
    if (storeAlbums.length === 0 || isEntering.current) return
    isEntering.current = true

    // Set initial positions off-screen
    storeAlbums.forEach((album, i) => {
      const ref = albumRefs.current[i]
      if (ref?.group) {
        ref.group.position.set(18 + i * SPACING * 0.5, 0, -3)
        ref.group.rotation.set(0, -Math.PI / 2, 0)
        ref.group.scale.set(1, 1, 1)
      }
    })

    // Entrance timeline
    const tl = gsap.timeline()
    storeAlbums.forEach((album, i) => {
      const ref = albumRefs.current[i]
      if (!ref?.group) return
      const targetX = i * SPACING - (storeAlbums.length - 1) * SPACING / 2
      tl.to(ref.group.position, { x: targetX, z: 0, duration: 1, ease: 'power3.out' }, i * 0.08)
      tl.to(ref.group.rotation, { y: 0, duration: 0.9, ease: 'power2.out' }, i * 0.08)
    })

    // After entrance, set spine-side view
    setTimeout(() => {
      storeAlbums.forEach((album, i) => {
        const ref = albumRefs.current[i]
        if (!ref?.group) return
        const targetX = i * SPACING - (storeAlbums.length - 1) * SPACING / 2
        gsap.killTweensOf(ref.group.rotation, { y: true })
        gsap.set(ref.group.rotation, { y: Math.PI / 2 })
        gsap.set(ref.group.position, { x: targetX, z: 0 })
      })
    }, 1400)
  }, [storeAlbums])

  // Scroll movement in browse mode
  useEffect(() => {
    if (status !== 'browse') return
    storeAlbums.forEach((album, i) => {
      const ref = albumRefs.current[i]
      if (!ref?.group) return
      const targetX = i * SPACING - (storeAlbums.length - 1) * SPACING / 2
      gsap.killTweensOf(ref.group.position, { x: true })
      gsap.to(ref.group.position, { x: targetX + scrollOffset, duration: 0.3, ease: 'power2.out' })
    })
  }, [scrollOffset, status])

  // Reset to browse state
  useEffect(() => {
    if (status !== 'browse') return
    storeAlbums.forEach((album, i) => {
      const ref = albumRefs.current[i]
      if (!ref?.group) return
      const targetX = i * SPACING - (storeAlbums.length - 1) * SPACING / 2
      gsap.killTweensOf(ref.group.rotation, { y: true })
      gsap.to(ref.group.position, { x: targetX + scrollOffset, z: 0, duration: 0.6, ease: 'power2.inOut' })
      gsap.to(ref.group.rotation, { x: 0, y: Math.PI / 2, z: 0, duration: 0.6, ease: 'power2.inOut' })
      gsap.to(ref.group.scale, { x: 1, y: 1, z: 1, duration: 0.6, ease: 'power2.inOut' })
      if (ref.cover) {
        gsap.killTweensOf(ref.cover.position, true)
        gsap.killTweensOf(ref.cover.rotation, true)
        gsap.to(ref.cover.position, { x: 0, z: 0, duration: 0.5, ease: 'power2.inOut' })
        gsap.to(ref.cover.rotation, { y: 0, duration: 0.5, ease: 'power2.inOut' })
      }
      if (ref.inner) ref.inner.visible = false
      if (ref.disc) {
        gsap.killTweensOf(ref.disc.position, true)
        gsap.to(ref.disc.position, { x: 0, z: 0, duration: 0.5, ease: 'power2.inOut' })
        ref.disc.visible = false
      }
    })
  }, [status, storeAlbums])

  // Focus state
  useEffect(() => {
    if (status !== 'focus' || !activeAlbum) return
    storeAlbums.forEach((album, i) => {
      const ref = albumRefs.current[i]
      if (!ref?.group) return
      if (album.id === activeAlbum.id) {
        gsap.killTweensOf(ref.group.rotation, true)
        gsap.to(ref.group.position, { x: 0, y: 0, z: 1.5, duration: 0.7, ease: 'power3.inOut' })
        gsap.to(ref.group.rotation, { x: 0, y: 0, z: 0, duration: 0.7, ease: 'power3.inOut' })
        gsap.to(ref.group.scale, { x: 1.2, y: 1.2, z: 1.2, duration: 0.7, ease: 'power3.inOut' })
      } else {
        const targetX = i * SPACING - (storeAlbums.length - 1) * SPACING / 2
        gsap.killTweensOf(ref.group.rotation, true)
        gsap.to(ref.group.position, { x: targetX, y: 0, z: -2.5, duration: 0.7, ease: 'power3.inOut' })
        gsap.to(ref.group.rotation, { x: 0, y: Math.PI / 2, z: 0, duration: 0.7, ease: 'power3.inOut' })
        gsap.to(ref.group.scale, { x: 0.8, y: 0.8, z: 0.8, duration: 0.7, ease: 'power3.inOut' })
      }
    })
  }, [activeAlbum, status, storeAlbums])

  // Open state - cover slides left, disc slides right
  useEffect(() => {
    if ((status !== 'open' && status !== 'playing') || !activeAlbum) return
    const idx = storeAlbums.findIndex(a => a.id === activeAlbum.id)
    const ref = albumRefs.current[idx]
    if (!ref?.group) return
    gsap.killTweensOf(ref.cover.position, true)
    gsap.killTweensOf(ref.cover.rotation, true)
    gsap.to(ref.cover.position, { x: -BOX_W / 2 - 0.05, z: 0, duration: 0.6, ease: 'power2.inOut' })
    if (ref.inner) ref.inner.visible = true
    gsap.killTweensOf(ref.disc.position, true)
    gsap.to(ref.disc.position, { x: BOX_W / 2 + 0.15, z: 0.15, duration: 0.6, ease: 'power2.out', delay: 0.1 })
    ref.disc.visible = true
  }, [status, activeAlbum, storeAlbums])

  // Disc rotation in playing state
  useFrame((_, delta) => {
    if (status !== 'playing' || !activeAlbum) return
    const idx = storeAlbums.findIndex(a => a.id === activeAlbum.id)
    const ref = albumRefs.current[idx]
    if (ref?.disc?.visible) {
      ref.disc.rotation.z -= delta * 2
    }
  })

  // Pointer events
  function handlePointerMove(e) {
    if (e.stopPropagation(), !storeAlbums.length) return
    mouse.set(e.clientX / window.innerWidth * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1)
    raycaster.setFromCamera(mouse, camera)

    const targets = []
    albumRefs.current.forEach(ref => { if (ref?.group) targets.push(ref.group) })
    const intersects = raycaster.intersectObjects(targets, true)
    let hitIdx = null

    if (intersects.length > 0) {
      let obj = intersects[0].object
      while (obj.parent && !obj.userData?.album) obj = obj.parent
      const album = obj.userData?.album
      if (album) {
        hitIdx = storeAlbums.findIndex(a => a.id === album.id)
      }
    }

    setHoveredIdx(hitIdx)

    if (hitIdx === null) return
    const ref = albumRefs.current[hitIdx]
    if (!ref?.group) return

    let baseRotY = Math.PI / 2
    if (status !== 'browse') {
      if (activeAlbum?.id === ref.album.id) baseRotY = 0
      else return
    }

    gsap.killTweensOf(ref.group.rotation, { x: true, y: true })
    gsap.to(ref.group.rotation, {
      x: -mouse.y * 0.12,
      y: baseRotY + mouse.x * 0.12,
      duration: 0.25,
      ease: 'power2.out'
    })
  }

  function handlePointerOut() {
    if (hoveredIdx === null) return
    const ref = albumRefs.current[hoveredIdx]
    if (!ref?.group) { setHoveredIdx(null); return }

    let baseRotY = Math.PI / 2
    if (status !== 'browse') {
      if (activeAlbum?.id === ref.album.id) baseRotY = 0
      else { setHoveredIdx(null); return }
    }

    gsap.killTweensOf(ref.group.rotation, { x: true, y: true })
    gsap.to(ref.group.rotation, { x: 0, y: baseRotY, duration: 0.4, ease: 'power2.inOut' })
    setHoveredIdx(null)
  }

  function handleClick(e) {
    if (e.stopPropagation(), !storeAlbums.length) return
    mouse.set(e.clientX / window.innerWidth * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1)
    raycaster.setFromCamera(mouse, camera)

    const targets = []
    albumRefs.current.forEach(ref => { if (ref?.group) targets.push(ref.group) })
    const intersects = raycaster.intersectObjects(targets, true)

    if (intersects.length > 0) {
      let obj = intersects[0].object
      while (obj.parent && !obj.userData?.album) obj = obj.parent
      const album = obj.userData?.album
      if (!album) return
      if (activeAlbum?.id === album.id) {
        toggleAlbum()
      } else {
        setActiveAlbum(album)
      }
    } else if (status !== 'browse') {
      closeAlbum()
    }
  }

  return (
    <group
      onPointerMove={handlePointerMove}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      {storeAlbums.map((album, i) => (
        <AlbumBox key={album.id} album={album} index={i} albumRefs={albumRefs} />
      ))}
    </group>
  )
}
