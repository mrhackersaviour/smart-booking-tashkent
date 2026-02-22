import { Suspense, useState, useRef, useMemo, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import {
  OrbitControls, PerspectiveCamera, Text, Environment,
  ContactShadows, Float, MeshReflectorMaterial,
} from '@react-three/drei';
import * as THREE from 'three';
import { Eye, RotateCcw, Maximize, ZoomIn, ZoomOut } from 'lucide-react';

/**
 * VenueViewer3D — upgraded interactive 3D floor plan.
 *
 * Realistic restaurant scene: wood-textured floor, glass walls,
 * warm ambient lighting, contact shadows, environment reflections.
 * Tables are interactive: click to select for booking.
 *
 * Follows DESIGN.md:
 *  - Overlay controls: glass-morphism tonal cards.
 *  - No 1px solid borders.
 *  - Primary gradient on selected states.
 */

/* ---------- Materials ---------- */
const WOOD_COLOR = '#8B6F47';
const WALL_COLOR = '#f0ede8';
const CHAIR_COLOR = '#4a3728';
const VIP_GLOW = '#f59e0b';

/* ---------- Improved Table ---------- */
function Table({ table, isSelected, isAvailable, onSelect }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  const color = useMemo(() => {
    if (isSelected) return '#4f46e5';
    if (!isAvailable) return '#dc2626';
    if (hovered) return '#818cf8';
    if (table.is_vip) return VIP_GLOW;
    return '#16a34a';
  }, [isSelected, isAvailable, hovered, table.is_vip]);

  const tableRadius = Math.min(table.capacity * 0.13, 1.0);
  const legHeight = 0.6;

  return (
    <group
      position={[table.position_x || 0, 0, table.position_z || 0]}
      onClick={(e) => { e.stopPropagation(); if (isAvailable) onSelect(table); }}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = isAvailable ? 'pointer' : 'not-allowed'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
    >
      {/* Table top — wood-like */}
      <mesh ref={meshRef} position={[0, legHeight + 0.04, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[tableRadius, tableRadius, 0.08, 32]} />
        <meshStandardMaterial
          color={color}
          roughness={0.35}
          metalness={0.05}
          envMapIntensity={0.5}
        />
      </mesh>

      {/* Central leg */}
      <mesh position={[0, legHeight / 2, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, legHeight, 12]} />
        <meshStandardMaterial color={CHAIR_COLOR} roughness={0.7} metalness={0.15} />
      </mesh>

      {/* Base */}
      <mesh position={[0, 0.02, 0]} castShadow>
        <cylinderGeometry args={[tableRadius * 0.5, tableRadius * 0.55, 0.04, 24]} />
        <meshStandardMaterial color={CHAIR_COLOR} roughness={0.6} metalness={0.2} />
      </mesh>

      {/* Chairs */}
      {Array.from({ length: Math.min(table.capacity, 8) }).map((_, i) => {
        const angle = (i / Math.min(table.capacity, 8)) * Math.PI * 2;
        const cx = Math.cos(angle) * (tableRadius + 0.35);
        const cz = Math.sin(angle) * (tableRadius + 0.35);
        return <Chair key={i} position={[cx, 0, cz]} rotation={angle} />;
      })}

      {/* Floating label */}
      <Float speed={1.5} floatIntensity={0.15} rotationIntensity={0}>
        <Text
          position={[0, 1.1, 0]}
          fontSize={0.18}
          color={isSelected ? '#4f46e5' : '#374151'}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#ffffff"
        >
          {table.label || `#${table.table_number}`}
        </Text>
        <Text
          position={[0, 0.88, 0]}
          fontSize={0.11}
          color="#9ca3af"
          anchorX="center"
          anchorY="middle"
        >
          {table.capacity} seats{table.is_vip ? ' · VIP' : ''}
        </Text>
      </Float>

      {/* VIP glow ring */}
      {table.is_vip && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[tableRadius + 0.25, tableRadius + 0.35, 48]} />
          <meshBasicMaterial color={VIP_GLOW} transparent opacity={0.25} />
        </mesh>
      )}

      {/* Selection ring */}
      {isSelected && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[tableRadius + 0.4, tableRadius + 0.5, 48]} />
          <meshBasicMaterial color="#4f46e5" transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
}

/* ---------- Chair ---------- */
function Chair({ position, rotation }) {
  const seatH = 0.38;
  const backH = 0.65;
  return (
    <group position={position} rotation={[0, -rotation + Math.PI, 0]}>
      {/* Seat */}
      <mesh position={[0, seatH, 0]} castShadow>
        <boxGeometry args={[0.28, 0.04, 0.28]} />
        <meshStandardMaterial color={CHAIR_COLOR} roughness={0.6} metalness={0.1} />
      </mesh>
      {/* Backrest */}
      <mesh position={[0, backH, -0.12]} castShadow>
        <boxGeometry args={[0.26, 0.3, 0.03]} />
        <meshStandardMaterial color={CHAIR_COLOR} roughness={0.6} metalness={0.1} />
      </mesh>
      {/* Legs */}
      {[[-0.11, 0, -0.11], [0.11, 0, -0.11], [-0.11, 0, 0.11], [0.11, 0, 0.11]].map((lp, i) => (
        <mesh key={i} position={[lp[0], seatH / 2, lp[2]]} castShadow>
          <cylinderGeometry args={[0.015, 0.015, seatH, 6]} />
          <meshStandardMaterial color={CHAIR_COLOR} roughness={0.7} metalness={0.15} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------- Floor with reflection ---------- */
function RestaurantFloor({ width = 20, depth = 15 }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
      <planeGeometry args={[width, depth]} />
      <MeshReflectorMaterial
        blur={[300, 100]}
        resolution={512}
        mixBlur={0.8}
        mixStrength={0.3}
        roughness={0.8}
        depthScale={0.5}
        color={WOOD_COLOR}
        metalness={0.05}
      />
    </mesh>
  );
}

/* ---------- Glass Walls ---------- */
function Walls({ width = 20, depth = 15, height = 3.5 }) {
  return (
    <group>
      {/* Back wall — solid */}
      <mesh position={[0, height / 2, -depth / 2]} receiveShadow>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color={WALL_COLOR} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      {/* Side walls — glass-like */}
      {[[-width / 2, Math.PI / 2], [width / 2, -Math.PI / 2]].map(([x, rot], i) => (
        <mesh key={i} position={[x, height / 2, 0]} rotation={[0, rot, 0]}>
          <planeGeometry args={[depth, height]} />
          <meshPhysicalMaterial
            color="#e8f0f0"
            transparent
            opacity={0.15}
            roughness={0}
            metalness={0.1}
            transmission={0.9}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ---------- Decorative elements ---------- */
function Decor() {
  return (
    <group>
      {/* Ceiling light fixtures */}
      {[[-3, 0], [3, 0], [0, -4], [0, 4]].map(([x, z], i) => (
        <group key={i} position={[x, 3.2, z]}>
          <mesh>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial
              color="#fff8e7"
              emissive="#ffdd88"
              emissiveIntensity={2}
              transparent
              opacity={0.9}
            />
          </mesh>
          <pointLight color="#ffdd88" intensity={0.6} distance={6} decay={2} />
        </group>
      ))}
      {/* Bar counter */}
      <mesh position={[-7, 0.55, 0]} castShadow>
        <boxGeometry args={[2, 1.1, 6]} />
        <meshStandardMaterial color="#3d2b1f" roughness={0.4} metalness={0.1} />
      </mesh>
      <mesh position={[-7, 1.12, 0]}>
        <boxGeometry args={[2.1, 0.04, 6.1]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.2} metalness={0.3} />
      </mesh>
    </group>
  );
}

/* ---------- Scene lighting ---------- */
function Lighting() {
  return (
    <>
      <ambientLight intensity={0.25} color="#fff5e1" />
      <directionalLight
        position={[8, 12, 6]}
        intensity={0.6}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        color="#fff8f0"
      />
      {/* Warm fill */}
      <pointLight position={[0, 5, 0]} intensity={0.4} color="#ffedd5" distance={20} />
      {/* Cool rim */}
      <directionalLight position={[-5, 3, 8]} intensity={0.15} color="#cce5ff" />
    </>
  );
}

/* ---------- Camera auto-intro animation ---------- */
function CameraIntro({ target }) {
  const { camera } = useThree();
  const elapsed = useRef(0);
  const done = useRef(false);

  useFrame((_, delta) => {
    if (done.current) return;
    elapsed.current += delta;
    const t = Math.min(elapsed.current / 2.5, 1);
    const ease = 1 - Math.pow(1 - t, 3); // easeOutCubic

    // Sweep from high overview to angled view
    camera.position.lerpVectors(
      new THREE.Vector3(0, 18, 18),
      new THREE.Vector3(0, 10, 12),
      ease
    );
    camera.lookAt(0, 0, 0);
    if (t >= 1) done.current = true;
  });

  return null;
}

/* ---------- Main component ---------- */
export default function VenueViewer3D({
  tables = [],
  sceneConfig = {},
  selectedTableId = null,
  unavailableTableIds = [],
  onTableSelect = () => {},
  className = '',
  compact = false,
}) {
  const dimensions = sceneConfig.dimensions || { width: 20, depth: 15, height: 3.5 };
  const controlsRef = useRef();

  const resetCamera = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  }, []);

  return (
    <div className={`relative bg-surface-container rounded-2xl overflow-hidden ${className}`}>
      <Canvas shadows gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}>
        <PerspectiveCamera makeDefault position={[0, 18, 18]} fov={45} />
        <OrbitControls
          ref={controlsRef}
          enablePan
          enableZoom
          enableRotate
          minDistance={4}
          maxDistance={28}
          maxPolarAngle={Math.PI / 2.15}
          target={[0, 0, 0]}
          enableDamping
          dampingFactor={0.05}
        />

        <CameraIntro />

        <Suspense fallback={null}>
          <Environment preset="apartment" environmentIntensity={0.3} />
          <Lighting />
          <RestaurantFloor width={dimensions.width} depth={dimensions.depth} />
          <Walls width={dimensions.width} depth={dimensions.depth} height={dimensions.height} />
          <Decor />
          <ContactShadows
            position={[0, -0.005, 0]}
            opacity={0.4}
            scale={30}
            blur={2.5}
            far={8}
            color="#1a1a2e"
          />

          {tables.map((table) => (
            <Table
              key={table.id}
              table={table}
              isSelected={selectedTableId === table.id}
              isAvailable={!unavailableTableIds.includes(table.id)}
              onSelect={onTableSelect}
            />
          ))}
        </Suspense>
      </Canvas>

      {/* Legend */}
      {!compact && (
        <div className="absolute bottom-4 left-4 bg-surface-container-lowest/80 backdrop-blur-glass rounded-xl px-4 py-3 shadow-ambient">
          <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Table Status</div>
          <div className="flex flex-wrap gap-3 text-xs font-medium text-on-surface-variant">
            {[
              { color: 'bg-green-500', label: 'Available' },
              { color: 'bg-red-500', label: 'Booked' },
              { color: 'bg-amber-500', label: 'VIP' },
              { color: 'bg-indigo-500', label: 'Selected' },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <ControlButton label="Reset view" onClick={resetCamera}>
          <RotateCcw className="h-4 w-4" />
        </ControlButton>
      </div>

      {/* Interaction hint */}
      <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-surface-container-lowest/70 backdrop-blur-glass rounded-lg shadow-ambient">
        <p className="text-[10px] font-medium text-on-surface-variant">
          <Eye className="inline h-3 w-3 mr-1" />
          {compact ? 'Drag to rotate' : 'Drag to rotate · Scroll to zoom · Click table to select'}
        </p>
      </div>
    </div>
  );
}

function ControlButton({ children, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="w-9 h-9 bg-surface-container-lowest/80 backdrop-blur-glass text-on-surface rounded-lg shadow-ambient flex items-center justify-center hover:bg-surface-container transition-colors"
    >
      {children}
    </button>
  );
}
