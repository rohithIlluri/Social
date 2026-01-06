import * as THREE from 'three'

/**
 * RadarScene - Three.js radar visualization (Phase 2)
 *
 * Manages the radar visual elements:
 * - 4 concentric rings with subtle pulse
 * - Rotating sweep line (4s rotation, cone gradient)
 * - Grid overlay
 * - Center point with glow
 * - Vignette/fog for depth
 */
export class RadarScene {
    private scene: THREE.Scene
    private rings: THREE.Mesh[] = []
    private sweep: THREE.Mesh | null = null
    private centerPoint: THREE.Mesh | null = null
    private centerGlow: THREE.Mesh | null = null
    private grid: THREE.LineSegments | null = null
    private elapsedTime = 0

    // Constants
    private readonly RING_RADII = [2, 4, 6, 8]
    private readonly RING_COLOR = 0x22c55e
    private readonly SWEEP_DURATION = 4 // seconds for full rotation
    private readonly PULSE_SPEED = 0.5

    constructor(scene: THREE.Scene) {
        this.scene = scene
        this.createRings()
        this.createSweep()
        this.createGrid()
        this.createCenterPoint()
        this.createVignette()
    }

    /**
     * Creates 4 concentric radar rings
     */
    private createRings(): void {
        this.RING_RADII.forEach((radius, index) => {
            const geometry = new THREE.RingGeometry(radius - 0.02, radius + 0.02, 64)
            const material = new THREE.MeshBasicMaterial({
                color: this.RING_COLOR,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.15 - index * 0.02,
            })
            const ring = new THREE.Mesh(geometry, material)
            ring.rotation.x = -Math.PI / 2
            ring.position.y = 0.01
            ring.userData = { baseOpacity: 0.15 - index * 0.02 }
            this.scene.add(ring)
            this.rings.push(ring)
        })
    }

    /**
     * Creates rotating sweep line with cone gradient
     */
    private createSweep(): void {
        // Create a cone-like sweep using a custom shape
        const sweepAngle = Math.PI / 6 // 30 degrees
        const outerRadius = 8.5
        const segments = 32

        const shape = new THREE.Shape()
        shape.moveTo(0, 0)

        // Create arc
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * sweepAngle
            const x = Math.cos(angle) * outerRadius
            const y = Math.sin(angle) * outerRadius
            if (i === 0) {
                shape.lineTo(x, y)
            } else {
                shape.lineTo(x, y)
            }
        }
        shape.lineTo(0, 0)

        const geometry = new THREE.ShapeGeometry(shape)
        const material = new THREE.MeshBasicMaterial({
            color: this.RING_COLOR,
            transparent: true,
            opacity: 0.15,
            side: THREE.DoubleSide,
        })

        this.sweep = new THREE.Mesh(geometry, material)
        this.sweep.rotation.x = -Math.PI / 2
        this.sweep.position.y = 0.02
        this.scene.add(this.sweep)
    }

    /**
     * Creates grid overlay for tactical feel
     */
    private createGrid(): void {
        const size = 18
        const divisions = 18
        const gridColor = new THREE.Color(this.RING_COLOR)

        // Create grid lines manually for better control
        const points: THREE.Vector3[] = []
        const step = size / divisions
        const half = size / 2

        // Vertical lines
        for (let i = 0; i <= divisions; i++) {
            const x = -half + i * step
            points.push(new THREE.Vector3(x, 0, -half))
            points.push(new THREE.Vector3(x, 0, half))
        }

        // Horizontal lines
        for (let i = 0; i <= divisions; i++) {
            const z = -half + i * step
            points.push(new THREE.Vector3(-half, 0, z))
            points.push(new THREE.Vector3(half, 0, z))
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(points)
        const material = new THREE.LineBasicMaterial({
            color: gridColor,
            transparent: true,
            opacity: 0.05,
        })

        this.grid = new THREE.LineSegments(geometry, material)
        this.grid.position.y = 0.005
        this.scene.add(this.grid)
    }

    /**
     * Creates center point with glow effect
     */
    private createCenterPoint(): void {
        // Main center sphere
        const centerGeometry = new THREE.SphereGeometry(0.2, 32, 32)
        const centerMaterial = new THREE.MeshBasicMaterial({
            color: this.RING_COLOR,
        })
        this.centerPoint = new THREE.Mesh(centerGeometry, centerMaterial)
        this.centerPoint.position.y = 0.2
        this.scene.add(this.centerPoint)

        // Glow effect using a larger transparent sphere
        const glowGeometry = new THREE.SphereGeometry(0.4, 32, 32)
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: this.RING_COLOR,
            transparent: true,
            opacity: 0.3,
        })
        this.centerGlow = new THREE.Mesh(glowGeometry, glowMaterial)
        this.centerGlow.position.y = 0.2
        this.scene.add(this.centerGlow)
    }

    /**
     * Creates vignette overlay using fog
     */
    private createVignette(): void {
        // Use scene fog for depth effect
        this.scene.fog = new THREE.Fog(0x0a1a0a, 8, 15)
    }

    /**
     * Update animation loop - call this every frame
     */
    update(deltaTime: number): void {
        this.elapsedTime += deltaTime

        // Rotate sweep line (4 second full rotation)
        if (this.sweep) {
            this.sweep.rotation.z = (this.elapsedTime / this.SWEEP_DURATION) * Math.PI * 2
        }

        // Pulse rings subtly
        this.rings.forEach((ring, index) => {
            const baseOpacity = ring.userData.baseOpacity as number
            const pulseOffset = index * 0.5
            const pulse = Math.sin(this.elapsedTime * this.PULSE_SPEED + pulseOffset) * 0.03
            const material = ring.material as THREE.MeshBasicMaterial
            material.opacity = baseOpacity + pulse
        })

        // Pulse center glow
        if (this.centerGlow) {
            const glowPulse = 0.3 + Math.sin(this.elapsedTime * 2) * 0.1
            const material = this.centerGlow.material as THREE.MeshBasicMaterial
            material.opacity = glowPulse
        }
    }

    /**
     * Cleanup resources
     */
    dispose(): void {
        // Dispose rings
        this.rings.forEach((ring) => {
            ring.geometry.dispose()
                ; (ring.material as THREE.Material).dispose()
            this.scene.remove(ring)
        })
        this.rings = []

        // Dispose sweep
        if (this.sweep) {
            this.sweep.geometry.dispose()
                ; (this.sweep.material as THREE.Material).dispose()
            this.scene.remove(this.sweep)
            this.sweep = null
        }

        // Dispose grid
        if (this.grid) {
            this.grid.geometry.dispose()
                ; (this.grid.material as THREE.Material).dispose()
            this.scene.remove(this.grid)
            this.grid = null
        }

        // Dispose center point
        if (this.centerPoint) {
            this.centerPoint.geometry.dispose()
                ; (this.centerPoint.material as THREE.Material).dispose()
            this.scene.remove(this.centerPoint)
            this.centerPoint = null
        }

        // Dispose center glow
        if (this.centerGlow) {
            this.centerGlow.geometry.dispose()
                ; (this.centerGlow.material as THREE.Material).dispose()
            this.scene.remove(this.centerGlow)
            this.centerGlow = null
        }

        // Remove fog
        this.scene.fog = null
    }
}
