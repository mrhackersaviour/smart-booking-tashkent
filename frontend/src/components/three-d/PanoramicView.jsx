import { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Environment, Html } from '@react-three/drei';
import * as THREE from 'three';
import { MapPin, ChevronRight, RotateCcw } from 'lucide-react';

/**
 * PanoramicView — 360° virtual-tour viewer.
 *
 * If a real equirectangular image URL is supplied (`panoramaUrl`), it's mapped
 * onto an inside-out sphere and the user can drag to look around (like Google
 * Street View).
 *
 * When NO image is supplied the component renders a beautiful procedural
 * environment (drei `<Environment preset>`) with interactive hotspot markers
 * to demonstrate the capability.
 *
 * Follows DESIGN.md:
 *  - Overlay controls use glass-morphism tonal cards.
 *  - No 1px solid borders.
 *  - Primary gradient on CTA elements.
 */

/* ---------- Hotspot overlay shown in 3D space ---------- */
function Hotspot({ position, label, onClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Html position={position} center distanceFactor={8} zIndexRange={[10, 0]}>
      <button
        type="button"
        onClick={onClick}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        className="group relative flex items-center gap-2 cursor-pointer select-none"
      >
        <span className="relative flex h-8 w-8">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/40" />
          <span className="relative inline-flex rounded-full h-8 w-8 bg-gradient-to-r from-primary to-primary-container items-center justify-center shadow-ambient">
            <MapPin className="h-4 w-4 text-white" />
          </span>
        </span>
        {hovered && (
          <span className="px-3 py-1.5 rounded-lg bg-surface-container-lowest/90 backdrop-blur-glass text-on-surface text-xs font-bold whitespace-nowrap shadow-ambient">
            {label} <ChevronRight className="inline h-3 w-3" />
          </span>
        )}
      </button>
    </Html>
  );
}

/* ---------- Equirectangular sphere (real 360° image) ---------- */
function PanoSphere({ url }) {
  const meshRef = useRef();
  const texture = useThree((s) => s.gl).capabilities
    ? new THREE.TextureLoader().load(url)
    : null;

  if (!texture) return null;
  texture.mapping = THREE.EquirectangularReflectionMapping;

  return (
    <mesh ref={meshRef} scale={[-1, 1, 1]}>
      <sphereGeometry args={[50, 64, 64]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  );
}

/* ---------- Look-around camera controller ---------- */
function LookControls() {
  const { camera, gl } = useThree();
  const isDragging = useRef(false);
  const prevPointer = useRef({ x: 0, y: 0 });
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const autoRotate = useRef(true);

  useEffect(() => {
    const canvas = gl.domElement;

    const onDown = (e) => {
      isDragging.current = true;
      autoRotate.current = false;
      const pt = e.touches?.[0] || e;
      prevPointer.current = { x: pt.clientX, y: pt.clientY };
    };
    const onUp = () => { isDragging.current = false; };
    const onMove = (e) => {
      if (!isDragging.current) return;
      const pt = e.touches?.[0] || e;
      const dx = (pt.clientX - prevPointer.current.x) * 0.003;
      const dy = (pt.clientY - prevPointer.current.y) * 0.003;
      euler.current.y -= dx;
      euler.current.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, euler.current.x - dy));
      camera.quaternion.setFromEuler(euler.current);
      prevPointer.current = { x: pt.clientX, y: pt.clientY };
    };

    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('touchstart', onDown, { passive: true });
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('touchmove', onMove, { passive: true });

    return () => {
      canvas.removeEventListener('mousedown', onDown);
      canvas.removeEventListener('touchstart', onDown);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchend', onUp);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('touchmove', onMove);
    };
  }, [camera, gl]);

  // Gentle auto-rotation until the user interacts
  useFrame((_, delta) => {
    if (autoRotate.current) {
      euler.current.y -= delta * 0.08;
      camera.quaternion.setFromEuler(euler.current);
    }
  });

  return null;
}

/* ---------- Demo scene (no panorama image) ---------- */
function DemoScene({ venueName, hotspots }) {
  return (
    <>
      <Environment preset="apartment" background backgroundBlurriness={0} />
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#2a2520" roughness={0.85} metalness={0.05} />
      </mesh>
      {/* Hotspots */}
      {(hotspots || []).map((h, i) => (
        <Hotspot key={i} position={h.position} label={h.label} onClick={h.onClick} />
      ))}
    </>
  );
}

/* ---------- Main component ---------- */
export default function PanoramicView({
  panoramaUrl,
  venueName = 'Virtual Tour',
  hotspots = [],
  className = '',
}) {
  const [viewAngle, setViewAngle] = useState(0);

  const defaultHotspots = hotspots.length > 0 ? hotspots : [
    { position: [3, 0, -5], label: 'Main Dining', onClick: () => {} },
    { position: [-4, 0.5, -3], label: 'Bar Area', onClick: () => {} },
    { position: [0, 0, 5], label: 'Terrace', onClick: () => {} },
  ];

  return (
    <div className={`relative w-full h-full bg-on-secondary-fixed ${className}`}>
      <Canvas
        camera={{ fov: 75, near: 0.1, far: 100, position: [0, 0, 0.1] }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <LookControls />
        {panoramaUrl ? (
          <PanoSphere url={panoramaUrl} />
        ) : (
          <DemoScene venueName={venueName} hotspots={defaultHotspots} />
        )}
        <ambientLight intensity={0.3} />
      </Canvas>

      {/* UI overlay — top-left venue badge */}
      <div className="absolute top-4 left-4 px-4 py-2 bg-surface-container-lowest/70 backdrop-blur-glass rounded-xl shadow-ambient">
        <p className="text-[10px] font-bold uppercase tracking-widest text-primary">360° Tour</p>
        <p className="text-sm font-bold text-on-surface">{venueName}</p>
      </div>

      {/* Bottom hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-surface-container-lowest/60 backdrop-blur-glass rounded-full shadow-ambient flex items-center gap-2">
        <RotateCcw className="h-3.5 w-3.5 text-on-surface-variant animate-spin" style={{ animationDuration: '4s' }} />
        <span className="text-xs font-medium text-on-surface-variant">Drag to look around</span>
      </div>

      {!panoramaUrl && (
        <div className="absolute top-4 right-4 px-3 py-1.5 bg-amber-500/15 rounded-lg">
          <p className="text-[10px] font-bold text-amber-700">Demo Mode</p>
        </div>
      )}
    </div>
  );
}
