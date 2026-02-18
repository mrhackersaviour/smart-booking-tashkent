import { Suspense, useState, useRef, useMemo, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text, Float } from '@react-three/drei';
import * as THREE from 'three';
import { Eye, RotateCcw } from 'lucide-react';

/**
 * VenueViewer3D — lightweight, themed 3D floor plan.
 *
 * Each venue gets a unique visual theme based on its name/type:
 *  - Different floor, wall, accent colors
 *  - Different furniture tones
 *  - Different lighting warmth
 *  - Different decorative elements
 *
 * Performance-focused:
 *  - No MeshReflectorMaterial (GPU-heavy)
 *  - No ContactShadows (extra render pass)
 *  - No Environment map (extra texture load)
 *  - Low-poly geometry (8-16 segments max)
 *  - Single directional light shadow (1024px)
 *  - Instanced-style chairs (minimal geometry)
 */

/* ---------- Theme generator — deterministic from venue name ---------- */
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < (s || '').length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const THEMES = [
  { // Warm wood — classic restaurant
    floor: '#8B6F47', wall: '#f0ede8', accent: '#3d2b1f', wainscot: '#6b4c3b',
    chair: '#4a3728', cushion: '#5c4033', brass: '#c5a55a', lightColor: '#ffd699',
    glassWall: true, barSide: 'left',
  },
  { // Cool marble — modern cafe
    floor: '#c4b8a8', wall: '#eef1f3', accent: '#2c3e50', wainscot: '#8fa3b0',
    chair: '#34495e', cushion: '#5d6d7e', brass: '#bdc3c7', lightColor: '#e8f0ff',
    glassWall: true, barSide: 'right',
  },
  { // Dark moody — lounge/bar
    floor: '#3d2b1f', wall: '#2c2c2c', accent: '#1a1a2e', wainscot: '#4a3728',
    chair: '#1a1a1a', cushion: '#8b0000', brass: '#d4af37', lightColor: '#ffb347',
    glassWall: false, barSide: 'left',
  },
  { // Garden green — terrace/outdoor feel
    floor: '#a0926b', wall: '#f5f0e8', accent: '#2d5a27', wainscot: '#7a8b5c',
    chair: '#5c4033', cushion: '#3a6b35', brass: '#b8860b', lightColor: '#ffe4b5',
    glassWall: true, barSide: 'right',
  },
  { // Luxury gold — fine dining
    floor: '#6b4c3b', wall: '#faf6f0', accent: '#8b7355', wainscot: '#c5a55a',
    chair: '#2c1810', cushion: '#4a0e2e', brass: '#d4af37', lightColor: '#fff0c8',
    glassWall: false, barSide: 'left',
  },
  { // Coastal blue — seafood/Mediterranean
    floor: '#c9b99a', wall: '#f0f5f8', accent: '#1a5276', wainscot: '#85c1e2',
    chair: '#2c3e50', cushion: '#2980b9', brass: '#f0e68c', lightColor: '#cce5ff',
    glassWall: true, barSide: 'right',
  },
];

function getTheme(venueName) {
  return THEMES[hashStr(venueName) % THEMES.length];
}

/* ---------- Table ---------- */
function Table({ table, isSelected, isAvailable, onSelect, theme }) {
  const [hovered, setHovered] = useState(false);

  const color = isSelected ? '#4f46e5'
    : !isAvailable ? '#dc2626'
    : hovered ? '#818cf8'
    : table.is_vip ? '#f59e0b'
    : '#16a34a';

  const r = Math.min(table.capacity * 0.13, 1.0);
  const seats = Math.min(table.capacity, 8);

  return (
    <group
      position={[table.position_x || 0, 0, table.position_z || 0]}
      onClick={(e) => { e.stopPropagation(); if (isAvailable) onSelect(table); }}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = isAvailable ? 'pointer' : 'not-allowed'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
    >
      {/* Table top */}
      <mesh position={[0, 0.72, 0]} castShadow>
        <cylinderGeometry args={[r, r, 0.05, 16]} />
        <meshStandardMaterial color={color} roughness={0.35} />
      </mesh>
      {/* Pedestal */}
      <mesh position={[0, 0.36, 0]}>
        <cylinderGeometry args={[0.04, 0.06, 0.7, 8]} />
        <meshStandardMaterial color={theme.brass} roughness={0.3} metalness={0.5} />
      </mesh>
      {/* Base */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[r * 0.4, r * 0.45, 0.04, 12]} />
        <meshStandardMaterial color={theme.accent} roughness={0.5} />
      </mesh>
      {/* Plate */}
      <mesh position={[0, 0.755, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.008, 12]} />
        <meshStandardMaterial color="#e8e0d4" roughness={0.2} />
      </mesh>

      {/* Chairs */}
      {Array.from({ length: seats }).map((_, i) => {
        const a = (i / seats) * Math.PI * 2;
        return (
          <group key={i} position={[Math.cos(a) * (r + 0.4), 0, Math.sin(a) * (r + 0.4)]} rotation={[0, -a + Math.PI, 0]}>
            <mesh position={[0, 0.42, 0]} castShadow>
              <boxGeometry args={[0.28, 0.05, 0.28]} />
              <meshStandardMaterial color={theme.cushion} roughness={0.85} />
            </mesh>
            <mesh position={[0, 0.68, -0.12]}>
              <boxGeometry args={[0.26, 0.28, 0.03]} />
              <meshStandardMaterial color={theme.chair} roughness={0.55} />
            </mesh>
            {[[-0.1, -0.1], [0.1, -0.1], [-0.1, 0.1], [0.1, 0.1]].map(([lx, lz], j) => (
              <mesh key={j} position={[lx, 0.21, lz]}>
                <boxGeometry args={[0.03, 0.42, 0.03]} />
                <meshStandardMaterial color={theme.chair} roughness={0.6} />
              </mesh>
            ))}
          </group>
        );
      })}

      {/* Label */}
      <Float speed={1.2} floatIntensity={0.08} rotationIntensity={0}>
        <Text position={[0, 1.1, 0]} fontSize={0.16} color={isSelected ? '#4f46e5' : '#374151'} anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="#ffffff">
          {table.label || `#${table.table_number}`}
        </Text>
        <Text position={[0, 0.92, 0]} fontSize={0.1} color="#9ca3af" anchorX="center" anchorY="middle">
          {table.capacity} seats{table.is_vip ? ' · VIP' : ''}
        </Text>
      </Float>

      {/* VIP / selection ring */}
      {(table.is_vip || isSelected) && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[r + 0.35, r + 0.45, 24]} />
          <meshBasicMaterial color={isSelected ? '#4f46e5' : '#f59e0b'} transparent opacity={0.25} />
        </mesh>
      )}
    </group>
  );
}

/* ---------- Floor ---------- */
function Floor({ width, depth, theme }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[width, depth]} />
      <meshStandardMaterial color={theme.floor} roughness={0.8} />
    </mesh>
  );
}

/* ---------- Walls ---------- */
function Walls({ width, depth, height, theme }) {
  return (
    <group>
      {/* Back wall */}
      <mesh position={[0, height / 2, -depth / 2]} receiveShadow>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color={theme.wall} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      {/* Wainscoting */}
      <mesh position={[0, 0.5, -depth / 2 + 0.01]}>
        <planeGeometry args={[width, 1.0]} />
        <meshStandardMaterial color={theme.wainscot} roughness={0.5} />
      </mesh>
      {/* Left wall */}
      <mesh position={[-width / 2, height / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[depth, height]} />
        <meshStandardMaterial color={theme.wall} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      {/* Right wall — glass or solid based on theme */}
      {theme.glassWall ? (
        <group>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} position={[width / 2, height / 2, (i - 1.5) * (depth / 4)]} rotation={[0, -Math.PI / 2, 0]}>
              <planeGeometry args={[depth / 4 - 0.08, height - 0.3]} />
              <meshStandardMaterial color="#dce8e8" transparent opacity={0.12} side={THREE.DoubleSide} />
            </mesh>
          ))}
          {/* Mullions */}
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh key={`m${i}`} position={[width / 2, height / 2, (i - 2) * (depth / 4)]} rotation={[0, -Math.PI / 2, 0]}>
              <boxGeometry args={[0.06, height, 0.03]} />
              <meshStandardMaterial color={theme.accent} roughness={0.4} />
            </mesh>
          ))}
        </group>
      ) : (
        <mesh position={[width / 2, height / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[depth, height]} />
          <meshStandardMaterial color={theme.wall} roughness={0.9} side={THREE.DoubleSide} />
        </mesh>
      )}
      {/* Ceiling */}
      <mesh position={[0, height, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#f8f6f3" roughness={1} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/* ---------- Bar (position based on theme) ---------- */
function Bar({ width, depth, theme }) {
  const x = theme.barSide === 'left' ? -width / 2 + 1.5 : width / 2 - 1.5;
  return (
    <group position={[x, 0, 0]}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[1.8, 1.1, 4.5]} />
        <meshStandardMaterial color={theme.accent} roughness={0.45} />
      </mesh>
      <mesh position={[0, 1.12, 0]}>
        <boxGeometry args={[1.9, 0.04, 4.6]} />
        <meshStandardMaterial color={theme.wainscot} roughness={0.2} metalness={0.15} />
      </mesh>
      {/* Bottles */}
      {[-1.5, -0.5, 0.5, 1.5].map((z, i) => (
        <mesh key={i} position={[0, 1.25, z]}>
          <cylinderGeometry args={[0.03, 0.03, 0.22, 6]} />
          <meshStandardMaterial color={[theme.accent, theme.cushion, theme.brass, theme.wainscot][i]} roughness={0.2} transparent opacity={0.7} />
        </mesh>
      ))}
      {/* Stools */}
      {[-1.2, 0, 1.2].map((z, i) => {
        const sx = theme.barSide === 'left' ? 1.2 : -1.2;
        return (
          <group key={i} position={[sx, 0, z]}>
            <mesh position={[0, 0.6, 0]}>
              <cylinderGeometry args={[0.14, 0.14, 0.04, 10]} />
              <meshStandardMaterial color={theme.cushion} roughness={0.7} />
            </mesh>
            <mesh position={[0, 0.3, 0]}>
              <cylinderGeometry args={[0.02, 0.03, 0.58, 6]} />
              <meshStandardMaterial color={theme.brass} roughness={0.3} metalness={0.5} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/* ---------- Plants ---------- */
function Plants({ width, depth, theme }) {
  const positions = [
    [-width / 2 + 0.8, 0, -depth / 2 + 0.8],
    [width / 2 - 1.2, 0, -depth / 2 + 0.8],
    [width / 2 - 1.2, 0, depth / 2 - 1.2],
  ];
  return (
    <group>
      {positions.map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh position={[0, 0.18, 0]}>
            <cylinderGeometry args={[0.15, 0.12, 0.36, 8]} />
            <meshStandardMaterial color="#d4c5b0" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.55, 0]}>
            <sphereGeometry args={[0.22, 6, 6]} />
            <meshStandardMaterial color="#2d5a27" roughness={0.9} />
          </mesh>
          <mesh position={[0.08, 0.7, 0.05]}>
            <sphereGeometry args={[0.16, 6, 6]} />
            <meshStandardMaterial color="#1e3d19" roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ---------- Wall art (themed) ---------- */
function WallArt({ depth, theme }) {
  return (
    <group>
      {[-2.5, 2.5].map((x, i) => (
        <group key={i} position={[x, 2.0, -depth / 2 + 0.04]}>
          <mesh>
            <boxGeometry args={[1.0, 0.7, 0.02]} />
            <meshStandardMaterial color={theme.brass} roughness={0.35} metalness={0.4} />
          </mesh>
          <mesh position={[0, 0, 0.015]}>
            <planeGeometry args={[0.85, 0.55]} />
            <meshStandardMaterial color={i === 0 ? theme.accent : theme.cushion} roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ---------- Lighting (themed warmth) ---------- */
function Lighting({ width, depth, theme }) {
  return (
    <>
      <ambientLight intensity={0.3} color={theme.lightColor} />
      <directionalLight
        position={[8, 10, 6]}
        intensity={0.5}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={40}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        color="#fff8f0"
      />
      {/* 4 ceiling lights */}
      {[[-3, -3], [3, -3], [-3, 3], [3, 3]].map(([x, z], i) => (
        <group key={i} position={[x, 3.4, z]}>
          <pointLight color={theme.lightColor} intensity={0.4} distance={5} decay={2} />
          <mesh>
            <cylinderGeometry args={[0.1, 0.07, 0.1, 8]} />
            <meshStandardMaterial color={theme.brass} roughness={0.3} metalness={0.5} />
          </mesh>
          <mesh position={[0, -0.08, 0]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshBasicMaterial color={theme.lightColor} />
          </mesh>
        </group>
      ))}
      {theme.glassWall && (
        <directionalLight position={[10, 4, 0]} intensity={0.2} color="#cce5ff" />
      )}
    </>
  );
}

/* ---------- Camera intro ---------- */
function CameraIntro() {
  const { camera } = useThree();
  const t = useRef(0);
  const done = useRef(false);
  useFrame((_, dt) => {
    if (done.current) return;
    t.current = Math.min(t.current + dt / 2.5, 1);
    const e = 1 - (1 - t.current) ** 3;
    camera.position.lerpVectors(new THREE.Vector3(2, 14, 14), new THREE.Vector3(2, 9, 10), e);
    camera.lookAt(0, 0, -1);
    if (t.current >= 1) done.current = true;
  });
  return null;
}

/* ---------- Main ---------- */
export default function VenueViewer3D({
  tables = [],
  sceneConfig = {},
  selectedTableId = null,
  unavailableTableIds = [],
  onTableSelect = () => {},
  venueName = '',
  className = '',
  compact = false,
}) {
  const dim = sceneConfig.dimensions || { width: 18, depth: 14, height: 3.6 };
  const theme = useMemo(() => getTheme(venueName), [venueName]);
  const controlsRef = useRef();

  return (
    <div className={`relative bg-surface-container rounded-2xl overflow-hidden ${className}`}>
      <Canvas
        shadows
        dpr={[1, 1.5]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.1; }}
      >
        <PerspectiveCamera makeDefault position={[2, 14, 14]} fov={42} />
        <OrbitControls
          ref={controlsRef}
          enablePan enableZoom enableRotate
          minDistance={3} maxDistance={22}
          maxPolarAngle={Math.PI / 2.1}
          target={[0, 0, -1]}
          enableDamping dampingFactor={0.05}
        />
        <CameraIntro />
        <Suspense fallback={null}>
          <Lighting width={dim.width} depth={dim.depth} theme={theme} />
          <Floor width={dim.width} depth={dim.depth} theme={theme} />
          <Walls width={dim.width} depth={dim.depth} height={dim.height} theme={theme} />
          <Bar width={dim.width} depth={dim.depth} theme={theme} />
          <Plants width={dim.width} depth={dim.depth} theme={theme} />
          <WallArt depth={dim.depth} theme={theme} />

          {tables.map((table) => (
            <Table
              key={table.id}
              table={table}
              isSelected={selectedTableId === table.id}
              isAvailable={!unavailableTableIds.includes(table.id)}
              onSelect={onTableSelect}
              theme={theme}
            />
          ))}
        </Suspense>
      </Canvas>

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
          {compact ? 'Drag to rotate' : 'Drag · Scroll · Click table'}
        </p>
      </div>
    </div>
  );
}
