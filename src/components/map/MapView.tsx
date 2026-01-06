import { useRef, useEffect, useState, useCallback } from 'react'
import * as THREE from 'three'
import type { NearbyUser } from '@/types'
import { haptics } from '@/utils/haptics'

interface MapViewProps {
  latitude: number
  longitude: number
  radius: number
  nearbyUsers: NearbyUser[]
  onUserClick?: (user: NearbyUser) => void
  isScanning?: boolean
}

/**
 * MapView - Three.js radar visualization (Phase 1 scaffold)
 *
 * Replaces MapLibre with pure Three.js. This scaffold provides:
 * - Basic scene setup with radar-themed background
 * - Camera positioned for top-down view
 * - Animation loop with proper cleanup
 * - Resize handling
 *
 * Phase 2 will add: RadarScene with rings, sweep, grid
 * Phase 3 will add: BlipParticleSystem for nearby users
 */
export function MapView({
  latitude: _latitude,
  longitude: _longitude,
  radius: _radius,
  nearbyUsers,
  onUserClick,
  isScanning: _isScanning = true,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const frameIdRef = useRef<number>(0)
  const [_isReady, setIsReady] = useState(false)

  // Props will be used in Phase 2/3
  void _latitude
  void _longitude
  void _radius
  void _isScanning

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a1a0a) // radar.screen color
    sceneRef.current = scene

    // Camera setup - positioned for slight 3D depth
    const aspect = containerRef.current.clientWidth / containerRef.current.clientHeight
    const camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 100)
    camera.position.set(0, 12, 3)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    })
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Add temporary placeholder elements (will be replaced in Phase 2)
    // Center point
    const centerGeometry = new THREE.SphereGeometry(0.2, 32, 32)
    const centerMaterial = new THREE.MeshBasicMaterial({ color: 0x22c55e })
    const center = new THREE.Mesh(centerGeometry, centerMaterial)
    center.position.y = 0.1
    scene.add(center)

    // Simple ring placeholder
    const ringGeometry = new THREE.RingGeometry(3.9, 4, 64)
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x22c55e,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.15,
    })
    const ring = new THREE.Mesh(ringGeometry, ringMaterial)
    ring.rotation.x = -Math.PI / 2
    ring.position.y = 0.01
    scene.add(ring)

    // Ground plane for reference
    const groundGeometry = new THREE.PlaneGeometry(20, 20)
    const groundMaterial = new THREE.MeshBasicMaterial({
      color: 0x050a05,
      side: THREE.DoubleSide,
    })
    const ground = new THREE.Mesh(groundGeometry, groundMaterial)
    ground.rotation.x = -Math.PI / 2
    scene.add(ground)

    setIsReady(true)

    // Animation loop
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate)
      renderer.render(scene, camera)
    }
    animate()

    // Cleanup
    return () => {
      cancelAnimationFrame(frameIdRef.current)
      renderer.dispose()

      // Dispose geometries and materials
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()
          if (Array.isArray(object.material)) {
            object.material.forEach((m) => m.dispose())
          } else {
            object.material.dispose()
          }
        }
      })

      scene.clear()

      if (containerRef.current && renderer.domElement.parentNode) {
        containerRef.current.removeChild(renderer.domElement)
      }
    }
  }, [])

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return

      const width = containerRef.current.clientWidth
      const height = containerRef.current.clientHeight

      cameraRef.current.aspect = width / height
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(width, height)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Placeholder click handler (will be replaced in Phase 3 with raycasting)
  const handleClick = useCallback(
    (_event: React.MouseEvent) => {
      if (!nearbyUsers.length || !onUserClick) return

      // For Phase 1: clicking anywhere triggers the first nearby user
      // Phase 3 will implement proper raycasting
      haptics.subtle()
      onUserClick(nearbyUsers[0])
    },
    [nearbyUsers, onUserClick]
  )

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className="relative w-full h-full min-h-[400px] overflow-hidden cursor-pointer"
      style={{ touchAction: 'none' }}
    />
  )
}
