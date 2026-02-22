import { Suspense, useState, useRef, useMemo, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import {
  OrbitControls, PerspectiveCamera, Text, Environment,
  ContactShadows, Float, MeshReflectorMaterial,
} from '@react-three/drei';
import * as THREE from 'three';
import { Eye, RotateCcw } from 'lucide-react';

/**
 * VenueViewer3D — realistic interactive 3D restaurant floor plan.
 *
 * Features:
 *  - Parquet wood floor with subtle reflections
 *  - Glass facade wall (front), solid walls (back/sides)
 *  - Warm chandelier lighting with ambient glow
 *  - Bar counter with stools
 *  - Potted plants / greenery
 *  - Realistic table+chair models with wood+fabric materials
 *  - Table selection for booking flow
 *  - Camera intro sweep animation
 */

/* ---------- Color palette ---------- */
const COLORS = {
  woodDark: '#3d2b1f',
  woodMed: '#6b4c3b',
  woodLight: '#8B6F47',
  leather: '#4a3728',
  fabric: '#5c4033',
  wallCream: '#f0ede8',
  wallAccent: '#1a1a2e',
  plant: '#2d5a27',
  plantDark: '#1e3d19',
  brass: '#c5a55a',
  ceramic: '#e8e0d4',
  glass: '#dce8e8',
};

/* ---------- Table component ---------- */
function Table({ table, isSelected, isAvailable, onSelect }) {
  const [hovered, setHovered] = useState(false);

  const color = useMemo(() => {
    if (isSelected) return '#4f46e5';
    if (!isAvailable) return '#dc2626';
    if (hovered) return '#818cf8';
    if (table.is_vip) return '#f59e0b';
    return '#16a34a';
  }, [isSelected, isAvailable, hovered, table.is_vip]);

  const radius = Math.min(table.capacity * 0.13, 1.0);
  const seats = Math.min(table.capacity, 8);

  return (
    <group
      position={[table.position_x || 0, 0, table.position_z || 0]}
      onClick={(e) => { e.stopPropagation(); if (isAvailable) onSelect(table); }}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = isAvailable ? 'pointer' : 'not-allowed'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
    >
      {/* Table top */}
      <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius, 0.05, 32]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.05} envMapIntensity={0.5} />
      </mesh>

      {/* Tablecloth rim (subtle white edge) */}
      <mesh position={[0, 0.71, 0]}>
        <cylinderGeometry args={[radius + 0.02, radius + 0.02, 0.01, 32]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} transparent opacity={0.3} />
      </mesh>

      {/* Central pedestal */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.07, 0.7, 12]} />
        <meshStandardMaterial color={COLORS.brass} roughness={0.3} metalness={0.6} />
      </mesh>
      {/* Base */}
      <mesh position={[0, 0.02, 0]} castShadow>
        <cylinderGeometry args={[radius * 0.4, radius * 0.45, 0.04, 24]} />
        <meshStandardMaterial color={COLORS.woodDark} roughness={0.5} metalness={0.15} />
      </mesh>

      {/* Plate on table */}
      <mesh position={[0, 0.755, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.01, 24]} />
        <meshStandardMaterial color={COLORS.ceramic} roughness={0.2} metalness={0.05} />
      </mesh>
      {/* Wine glass */}
      <mesh position={[0.18, 0.82, -0.05]}>
        <cylinderGeometry args={[0.03, 0.02, 0.12, 8]} />
        <meshPhysicalMaterial color="#e0f0e8" transparent opacity={0.3} roughness={0} transmission={0.9} />
      </mesh>

      {/* Chairs */}
      {Array.from({ length: seats }).map((_, i) => {
        const angle = (i / seats) * Math.PI * 2;
        const cx = Math.cos(angle) * (radius + 0.4);
        const cz = Math.sin(angle) * (radius + 0.4);
        return <Chair key={i} position={[cx, 0, cz]} rotation={angle} />;
      })}

      {/* Floating label */}
      <Float speed={1.5} floatIntensity={0.12} rotationIntensity={0}>
        <Text
          position={[0, 1.15, 0]}
          fontSize={0.16}
          color={isSelected ? '#4f46e5' : '#374151'}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.025}
          outlineColor="#ffffff"
        >
          {table.label || `#${table.table_number}`}
        </Text>
        <Text position={[0, 0.95, 0]} fontSize={0.1} color="#9ca3af" anchorX="center" anchorY="middle">
          {table.capacity} seats{table.is_vip ? ' · VIP' : ''}
        </Text>
      </Float>

      {/* VIP glow */}
      {table.is_vip && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius + 0.3, radius + 0.42, 48]} />
          <meshBasicMaterial color="#f59e0b" transparent opacity={0.2} />
        </mesh>
      )}
      {isSelected && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius + 0.45, radius + 0.55, 48]} />
          <meshBasicMaterial color="#4f46e5" transparent opacity={0.35} />
        </mesh>
      )}
    </group>
  );
}

/* ---------- Chair ---------- */
function Chair({ position, rotation }) {
  return (
    <group position={position} rotation={[0, -rotation + Math.PI, 0]}>
      {/* Seat — cushioned */}
      <mesh position={[0, 0.42, 0]} castShadow>
        <boxGeometry args={[0.32, 0.06, 0.32]} />
        <meshStandardMaterial color={COLORS.fabric} roughness={0.85} />
      </mesh>
      {/* Seat cushion top */}
      <mesh position={[0, 0.46, 0]}>
        <boxGeometry args={[0.28, 0.03, 0.28]} />
        <meshStandardMaterial color="#6b5243" roughness={0.9} />
      </mesh>
      {/* Backrest — curved feel with box */}
      <mesh position={[0, 0.7, -0.14]} castShadow>
        <boxGeometry args={[0.3, 0.32, 0.035]} />
        <meshStandardMaterial color={COLORS.leather} roughness={0.55} metalness={0.05} />
      </mesh>
      {/* Legs */}
      {[[-0.12, -0.12], [0.12, -0.12], [-0.12, 0.12], [0.12, 0.12]].map(([lx, lz], i) => (
        <mesh key={i} position={[lx, 0.21, lz]} castShadow>
          <cylinderGeometry args={[0.015, 0.015, 0.42, 6]} />
          <meshStandardMaterial color={COLORS.woodDark} roughness={0.6} metalness={0.15} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------- Restaurant floor ---------- */
function RestaurantFloor({ width = 20, depth = 15 }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
      <planeGeometry args={[width, depth]} />
      <MeshReflectorMaterial
        blur={[400, 100]}
        resolution={512}
        mixBlur={0.85}
        mixStrength={0.25}
        roughness={0.75}
        depthScale={0.4}
        color={COLORS.woodLight}
        metalness={0.05}
      />
    </mesh>
  );
}

/* ---------- Walls ---------- */
function Walls({ width = 20, depth = 15, height = 3.8 }) {
  return (
    <group>
      {/* Back wall — accent with wainscoting */}
      <mesh position={[0, height / 2, -depth / 2]} receiveShadow>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color={COLORS.wallCream} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      {/* Back wall lower panel (wainscoting) */}
      <mesh position={[0, 0.6, -depth / 2 + 0.01]}>
        <planeGeometry args={[width, 1.2]} />
        <meshStandardMaterial color={COLORS.woodMed} roughness={0.5} metalness={0.05} />
      </mesh>

      {/* Left wall */}
      <mesh position={[-width / 2, height / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[depth, height]} />
        <meshStandardMaterial color={COLORS.wallCream} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>

      {/* Right wall — glass facade */}
      <GlassFacade width={depth} height={height} position={[width / 2, 0, 0]} rotation={[0, -Math.PI / 2, 0]} />

      {/* Ceiling */}
      <mesh position={[0, height, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#f8f6f3" roughness={1} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/* ---------- Glass facade (large windows) ---------- */
function GlassFacade({ width, height, position, rotation }) {
  const paneW = width / 5;
  const mullionW = 0.06;
  return (
    <group position={position} rotation={rotation}>
      {/* Glass panes */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i} position={[(i - 2) * paneW, height / 2, 0]}>
          <planeGeometry args={[paneW - mullionW, height - 0.3]} />
          <meshPhysicalMaterial
            color={COLORS.glass}
            transparent opacity={0.12}
            roughness={0} metalness={0.05}
            transmission={0.92} side={THREE.DoubleSide}
          />
        </mesh>
      ))}
      {/* Mullions (window frames) */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={`m${i}`} position={[(i - 2.5) * paneW, height / 2, 0.01]}>
          <boxGeometry args={[mullionW, height, 0.03]} />
          <meshStandardMaterial color={COLORS.woodDark} roughness={0.4} metalness={0.2} />
        </mesh>
      ))}
      {/* Outside glow (simulates daylight outside) */}
      <mesh position={[0, height / 2, -0.5]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial color="#d4e5f7" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/* ---------- Bar area ---------- */
function BarArea({ position = [-7.5, 0, 0] }) {
  return (
    <group position={position}>
      {/* Counter base */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[2, 1.1, 5]} />
        <meshStandardMaterial color={COLORS.woodDark} roughness={0.45} metalness={0.08} />
      </mesh>
      {/* Counter top — marble */}
      <mesh position={[0, 1.12, 0]}>
        <boxGeometry args={[2.1, 0.04, 5.1]} />
        <meshStandardMaterial color={COLORS.wallAccent} roughness={0.15} metalness={0.25} />
      </mesh>
      {/* Bar footrest rail */}
      <mesh position={[1.05, 0.2, 0]}>
        <boxGeometry args={[0.04, 0.04, 4.5]} />
        <meshStandardMaterial color={COLORS.brass} roughness={0.2} metalness={0.7} />
      </mesh>
      {/* Back shelf */}
      <mesh position={[-0.95, 1.8, 0]}>
        <boxGeometry args={[0.15, 0.6, 4.5]} />
        <meshStandardMaterial color={COLORS.woodMed} roughness={0.5} />
      </mesh>
      {/* Bottles on shelf */}
      {[-1.5, -0.7, 0, 0.7, 1.5].map((z, i) => (
        <mesh key={i} position={[-0.95, 2.2, z]}>
          <cylinderGeometry args={[0.04, 0.04, 0.3, 8]} />
          <meshPhysicalMaterial
            color={['#2d5a27', '#8b2e1b', '#c5a55a', '#1a1a2e', '#6b4c3b'][i]}
            roughness={0.1} metalness={0.1} transmission={0.5} transparent opacity={0.7}
          />
        </mesh>
      ))}
      {/* Bar stools */}
      {[-1.8, -0.6, 0.6, 1.8].map((z, i) => (
        <BarStool key={i} position={[1.4, 0, z]} />
      ))}
    </group>
  );
}

function BarStool({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.65, 0]} castShadow>
        <cylinderGeometry args={[0.17, 0.17, 0.05, 16]} />
        <meshStandardMaterial color={COLORS.leather} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.33, 0]}>
        <cylinderGeometry args={[0.025, 0.035, 0.65, 8]} />
        <meshStandardMaterial color={COLORS.brass} roughness={0.25} metalness={0.65} />
      </mesh>
      <mesh position={[0, 0.01, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.02, 16]} />
        <meshStandardMaterial color={COLORS.woodDark} roughness={0.5} metalness={0.15} />
      </mesh>
    </group>
  );
}

/* ---------- Plants ---------- */
function Plant({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      {/* Pot */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.14, 0.4, 12]} />
        <meshStandardMaterial color={COLORS.ceramic} roughness={0.6} />
      </mesh>
      {/* Foliage layers */}
      {[0.55, 0.7, 0.85].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <sphereGeometry args={[0.22 + i * 0.05, 8, 8]} />
          <meshStandardMaterial
            color={i === 1 ? COLORS.plant : COLORS.plantDark}
            roughness={0.9}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ---------- Decorative picture frames on back wall ---------- */
function WallArt({ width, depth }) {
  return (
    <group>
      {[-3, 3].map((x, i) => (
        <group key={i} position={[x, 2.2, -depth / 2 + 0.05]}>
          {/* Frame */}
          <mesh>
            <boxGeometry args={[1.2, 0.9, 0.03]} />
            <meshStandardMaterial color={COLORS.brass} roughness={0.3} metalness={0.5} />
          </mesh>
          {/* Canvas */}
          <mesh position={[0, 0, 0.02]}>
            <planeGeometry args={[1.0, 0.7]} />
            <meshStandardMaterial
              color={i === 0 ? '#2c3e50' : '#8e4429'}
              roughness={0.8}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ---------- Lighting ---------- */
function Lighting() {
  return (
    <>
      <ambientLight intensity={0.2} color="#fff5e1" />
      <directionalLight
        position={[10, 14, 8]}
        intensity={0.5}
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
      {/* Window light — cool daylight from glass facade */}
      <directionalLight position={[12, 5, 0]} intensity={0.3} color="#cce5ff" />
      {/* Warm ceiling spots */}
      {[[-4, -4], [0, -4], [4, -4], [-4, 2], [0, 2], [4, 2]].map(([x, z], i) => (
        <group key={i} position={[x, 3.6, z]}>
          <pointLight color="#ffd699" intensity={0.5} distance={6} decay={2} />
          {/* Light fixture */}
          <mesh>
            <cylinderGeometry args={[0.12, 0.08, 0.15, 12]} />
            <meshStandardMaterial color={COLORS.brass} roughness={0.25} metalness={0.7} />
          </mesh>
          <mesh position={[0, -0.12, 0]}>
            <sphereGeometry args={[0.06, 12, 12]} />
            <meshStandardMaterial color="#fff8e7" emissive="#ffdd88" emissiveIntensity={3} transparent opacity={0.85} />
          </mesh>
        </group>
      ))}
    </>
  );
}

/* ---------- Camera intro ---------- */
function CameraIntro() {
  const { camera } = useThree();
  const elapsed = useRef(0);
  const done = useRef(false);

  useFrame((_, delta) => {
    if (done.current) return;
    elapsed.current += delta;
    const t = Math.min(elapsed.current / 3, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    camera.position.lerpVectors(
      new THREE.Vector3(2, 16, 16),
      new THREE.Vector3(2, 9, 11),
      ease
    );
    camera.lookAt(0, 0, -1);
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
  const dim = sceneConfig.dimensions || { width: 20, depth: 15, height: 3.8 };
  const controlsRef = useRef();

  return (
    <div className={`relative bg-surface-container rounded-2xl overflow-hidden ${className}`}>
      <Canvas shadows gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}>
        <PerspectiveCamera makeDefault position={[2, 16, 16]} fov={42} />
        <OrbitControls
          ref={controlsRef}
          enablePan enableZoom enableRotate
          minDistance={3} maxDistance={25}
          maxPolarAngle={Math.PI / 2.1}
          target={[0, 0, -1]}
          enableDamping dampingFactor={0.05}
        />
        <CameraIntro />

        <Suspense fallback={null}>
          <Environment preset="apartment" environmentIntensity={0.25} />
          <Lighting />
          <RestaurantFloor width={dim.width} depth={dim.depth} />
          <Walls width={dim.width} depth={dim.depth} height={dim.height} />
          <BarArea position={[-dim.width / 2 + 2, 0, 0]} />
          <WallArt width={dim.width} depth={dim.depth} />

          {/* Plants at corners and near windows */}
          <Plant position={[-dim.width / 2 + 1, 0, -dim.depth / 2 + 1]} scale={1.2} />
          <Plant position={[dim.width / 2 - 1.5, 0, -dim.depth / 2 + 1]} />
          <Plant position={[dim.width / 2 - 1.5, 0, dim.depth / 2 - 1.5]} scale={0.9} />
          <Plant position={[-dim.width / 2 + 1, 0, dim.depth / 2 - 1.5]} scale={1.1} />

          <ContactShadows
            position={[0, -0.005, 0]}
            opacity={0.35} scale={30} blur={2.5} far={8}
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

      <div className="absolute top-4 right-4">
        <button
          type="button"
          onClick={() => controlsRef.current?.reset()}
          aria-label="Reset view"
          className="w-9 h-9 bg-surface-container-lowest/80 backdrop-blur-glass text-on-surface rounded-lg shadow-ambient flex items-center justify-center hover:bg-surface-container transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-surface-container-lowest/70 backdrop-blur-glass rounded-lg shadow-ambient">
        <p className="text-[10px] font-medium text-on-surface-variant">
          <Eye className="inline h-3 w-3 mr-1" />
          {compact ? 'Drag to rotate' : 'Drag to rotate · Scroll to zoom · Click table to book'}
        </p>
      </div>
    </div>
  );
}
