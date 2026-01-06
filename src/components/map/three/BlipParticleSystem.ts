import * as THREE from 'three'
import type { NearbyUser } from '@/types'

/**
 * BlipParticleSystem - GPU-accelerated particle system for nearby users (Phase 3)
 *
 * Features:
 * - Points geometry representing nearby users
 * - Custom shader for glow and pulse effects
 * - Position mapping from distance to 3D coordinates
 * - Raycasting for click detection
 */
export class BlipParticleSystem {
    private scene: THREE.Scene
    private camera: THREE.Camera
    private points: THREE.Points | null = null
    private raycaster: THREE.Raycaster
    private users: NearbyUser[] = []
    private userPositions: Map<string, THREE.Vector3> = new Map()
    private elapsedTime = 0

    // Constants
    private readonly BLIP_COLOR = new THREE.Color(0x22c55e)
    private readonly MAX_RADIUS = 7 // Max distance from center in 3D units
    private readonly PARTICLE_SIZE = 0.4

    // Shader uniforms
    private uniforms: {
        time: { value: number }
        color: { value: THREE.Color }
        size: { value: number }
    }

    constructor(scene: THREE.Scene, camera: THREE.Camera) {
        this.scene = scene
        this.camera = camera
        this.raycaster = new THREE.Raycaster()
        this.raycaster.params.Points = { threshold: 0.5 }

        this.uniforms = {
            time: { value: 0 },
            color: { value: this.BLIP_COLOR },
            size: { value: this.PARTICLE_SIZE * 100 }, // Point size in pixels
        }

        this.createParticleSystem()
    }

    /**
     * Creates the initial particle system with empty geometry
     */
    private createParticleSystem(): void {
        const geometry = new THREE.BufferGeometry()

        // Initialize with empty arrays
        geometry.setAttribute('position', new THREE.Float32BufferAttribute([], 3))
        geometry.setAttribute('alpha', new THREE.Float32BufferAttribute([], 1))

        // Custom shader material for glow effect
        const material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: `
        attribute float alpha;
        varying float vAlpha;
        uniform float time;
        uniform float size;

        void main() {
          vAlpha = alpha;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

          // Pulse effect
          float pulse = 1.0 + 0.2 * sin(time * 3.0 + position.x * 2.0);

          gl_PointSize = size * pulse * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
            fragmentShader: `
        uniform vec3 color;
        varying float vAlpha;

        void main() {
          // Create circular point with soft edge
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);

          if (dist > 0.5) discard;

          // Soft glow falloff
          float glow = 1.0 - smoothstep(0.0, 0.5, dist);
          float alpha = glow * vAlpha;

          gl_FragColor = vec4(color, alpha);
        }
      `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        })

        this.points = new THREE.Points(geometry, material)
        this.points.position.y = 0.3 // Slightly above ground
        this.scene.add(this.points)
    }

    /**
     * Convert distance (meters) and bearing to 3D position
     * Distributes users radially around center
     */
    private distanceToPosition(distance: number, index: number, total: number): THREE.Vector3 {
        // Normalize distance to 3D radius (cap at MAX_RADIUS)
        const normalizedDistance = Math.min(distance / 500, 1) // Assume 500m = max
        const radius = normalizedDistance * this.MAX_RADIUS

        // Distribute users evenly around circle, with some randomness
        const baseAngle = (index / Math.max(total, 1)) * Math.PI * 2
        const angleOffset = (Math.random() - 0.5) * 0.5 // Small random offset
        const angle = baseAngle + angleOffset

        return new THREE.Vector3(
            Math.cos(angle) * radius,
            0,
            Math.sin(angle) * radius
        )
    }

    /**
     * Update particle system with new nearby users
     */
    updateUsers(nearbyUsers: NearbyUser[]): void {
        this.users = nearbyUsers

        if (!this.points) return

        const geometry = this.points.geometry
        const positions: number[] = []
        const alphas: number[] = []

        // Clear old positions
        this.userPositions.clear()

        // Create positions for each user
        nearbyUsers.forEach((user, index) => {
            const position = this.distanceToPosition(user.distance, index, nearbyUsers.length)

            // Store position for raycasting lookup
            this.userPositions.set(user.id, position)

            positions.push(position.x, position.y, position.z)

            // Alpha based on reveal level (more revealed = brighter)
            const alpha = 0.6 + (user.revealLevel / 10) * 0.4
            alphas.push(alpha)
        })

        // Update geometry attributes
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
        geometry.setAttribute('alpha', new THREE.Float32BufferAttribute(alphas, 1))
        geometry.attributes.position.needsUpdate = true
        geometry.attributes.alpha.needsUpdate = true
        geometry.computeBoundingSphere()
    }

    /**
     * Raycast to detect which user was clicked
     * Returns the NearbyUser if hit, null otherwise
     */
    raycast(mouse: THREE.Vector2): NearbyUser | null {
        if (!this.points || this.users.length === 0) return null

        this.raycaster.setFromCamera(mouse, this.camera)
        const intersects = this.raycaster.intersectObject(this.points)

        if (intersects.length > 0) {
            const index = intersects[0].index
            if (index !== undefined && index < this.users.length) {
                return this.users[index]
            }
        }

        return null
    }

    /**
     * Get mouse coordinates normalized to [-1, 1] from click event
     */
    static getNormalizedMouse(event: MouseEvent | Touch, container: HTMLElement): THREE.Vector2 {
        const rect = container.getBoundingClientRect()
        return new THREE.Vector2(
            ((event.clientX - rect.left) / rect.width) * 2 - 1,
            -((event.clientY - rect.top) / rect.height) * 2 + 1
        )
    }

    /**
     * Update animation - call every frame
     */
    update(deltaTime: number): void {
        this.elapsedTime += deltaTime
        this.uniforms.time.value = this.elapsedTime
    }

    /**
     * Cleanup resources
     */
    dispose(): void {
        if (this.points) {
            this.points.geometry.dispose()
                ; (this.points.material as THREE.Material).dispose()
            this.scene.remove(this.points)
            this.points = null
        }
        this.users = []
        this.userPositions.clear()
    }
}
