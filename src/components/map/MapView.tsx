import { useRef, useEffect, useCallback } from 'react'
import * as THREE from 'three'
import type { NearbyUser } from '@/types'
import { haptics } from '@/utils/haptics'
import { RadarScene } from './three/RadarScene'
import { BlipParticleSystem } from './three/BlipParticleSystem'

interface MapViewProps {
  latitude: number
  longitude: number
  radius: number
  nearbyUsers: NearbyUser[]
  onUserClick?: (user: NearbyUser) => void
  isScanning?: boolean
}

/**
 * MapView - Three.js radar visualization
 *
 * Complete radar implementation with:
 * - RadarScene: rings, sweep, grid, center point, fog
 * - BlipParticleSystem: GPU particles for nearby users with raycasting
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
  const clockRef = useRef<THREE.Clock | null>(null)
  const frameIdRef = useRef<number>(0)
  const radarSceneRef = useRef<RadarScene | null>(null)
  const blipSystemRef = useRef<BlipParticleSystem | null>(null)

  // Props will be used for future geolocation features
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

    // Clock for delta time
    const clock = new THREE.Clock()
    clockRef.current = clock

    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(20, 20)
    const groundMaterial = new THREE.MeshBasicMaterial({
      color: 0x050a05,
      side: THREE.DoubleSide,
    })
    const ground = new THREE.Mesh(groundGeometry, groundMaterial)
    ground.rotation.x = -Math.PI / 2
    scene.add(ground)

    // Initialize RadarScene (Phase 2)
    const radarScene = new RadarScene(scene)
    radarSceneRef.current = radarScene

    // Initialize BlipParticleSystem (Phase 3)
    const blipSystem = new BlipParticleSystem(scene, camera)
    blipSystemRef.current = blipSystem

    // Animation loop
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate)
      const deltaTime = clock.getDelta()

      // Update radar animations
      radarSceneRef.current?.update(deltaTime)
      blipSystemRef.current?.update(deltaTime)

      renderer.render(scene, camera)
    }
    animate()

    // Cleanup
    return () => {
      cancelAnimationFrame(frameIdRef.current)

      // Dispose radar scene and blip system
      radarSceneRef.current?.dispose()
      radarSceneRef.current = null
      blipSystemRef.current?.dispose()
      blipSystemRef.current = null

      // Dispose renderer
      renderer.dispose()

      // Dispose ground
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

  // Update blip system when nearby users change
  useEffect(() => {
    blipSystemRef.current?.updateUsers(nearbyUsers)
  }, [nearbyUsers])

  // Handle resize with ResizeObserver and visibility change
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return

      const width = containerRef.current.clientWidth
      const height = containerRef.current.clientHeight

      // Skip if dimensions are invalid
      if (width === 0 || height === 0) return

      cameraRef.current.aspect = width / height
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(width, height)
    }

    // Handle visibility change (tab switch, minimize, etc.)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Resume clock and resize on next frame
        clockRef.current?.start()
        requestAnimationFrame(() => {
          handleResize()
        })
      } else {
        // Pause clock when hidden to prevent timing issues
        clockRef.current?.stop()
      }
    }

    // ResizeObserver for robust container size tracking
    const resizeObserver = new ResizeObserver(() => {
      handleResize()
    })

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    // Initial resize check after layout settles
    requestAnimationFrame(() => {
      handleResize()
    })

    window.addEventListener('resize', handleResize)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      resizeObserver.disconnect()
    }
  }, [])

  // Click handler with raycasting
  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      if (!containerRef.current || !blipSystemRef.current || !onUserClick) return

      // Get normalized mouse coordinates
      const mouse = BlipParticleSystem.getNormalizedMouse(
        event.nativeEvent,
        containerRef.current
      )

      // Raycast to find clicked user
      const clickedUser = blipSystemRef.current.raycast(mouse)

      if (clickedUser) {
        haptics.subtle()
        onUserClick(clickedUser)
      }
    },
    [onUserClick]
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
