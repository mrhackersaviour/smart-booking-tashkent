import { Suspense, useState, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text, RoundedBox, Environment } from '@react-three/drei';
import * as THREE from 'three';

// Individual table component
function Table({ table, isSelected, isAvailable, onSelect }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  const getColor = () => {
    if (isSelected) return '#3b82f6'; // Primary blue
    if (!isAvailable) return '#ef4444'; // Red for unavailable
    if (hovered) return '#60a5fa'; // Light blue on hover
    if (table.is_vip) return '#f59e0b'; // Gold for VIP
    return '#22c55e'; // Green for available
  };

  const tableHeight = 0.1;
  const tableRadius = Math.min(table.capacity * 0.15, 1.2);

  return (
    <group
      position={[table.position_x || 0, tableHeight / 2, table.position_z || 0]}
      onClick={(e) => {
        e.stopPropagation();
        if (isAvailable) onSelect(table);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = isAvailable ? 'pointer' : 'not-allowed';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'default';
      }}
    >
      {/* Table top */}
      <mesh ref={meshRef} castShadow receiveShadow>
        <cylinderGeometry args={[tableRadius, tableRadius, tableHeight, 32]} />
        <meshStandardMaterial
          color={getColor()}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>

      {/* Table label */}
      <Text
        position={[0, 0.3, 0]}
        fontSize={0.2}
        color="#1f2937"
        anchorX="center"
        anchorY="middle"
        font="/fonts/Inter-Bold.woff"
      >
        {table.label || `#${table.table_number}`}
      </Text>

      {/* Capacity indicator */}
      <Text
        position={[0, 0.15, 0]}
        fontSize={0.12}
        color="#6b7280"
        anchorX="center"
        anchorY="middle"
      >
        {table.capacity} seats
      </Text>

      {/* Chairs around the table */}
      {Array.from({ length: Math.min(table.capacity, 8) }).map((_, i) => {
        const angle = (i / Math.min(table.capacity, 8)) * Math.PI * 2;
        const chairX = Math.cos(angle) * (tableRadius + 0.3);
        const chairZ = Math.sin(angle) * (tableRadius + 0.3);
        return (
          <mesh key={i} position={[chairX, 0.15, chairZ]} castShadow>
            <boxGeometry args={[0.2, 0.3, 0.2]} />
            <meshStandardMaterial color="#8b5cf6" roughness={0.5} />
          </mesh>
        );
      })}

      {/* VIP indicator */}
      {table.is_vip && (
        <mesh position={[0, 0.5, 0]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.5} />
        </mesh>
      )}
    </group>
  );
}

// Floor component
function Floor({ width = 20, depth = 15 }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[width, depth]} />
      <meshStandardMaterial color="#e5e7eb" roughness={0.8} />
    </mesh>
  );
}

// Walls component
function Walls({ width = 20, depth = 15, height = 4 }) {
  const wallMaterial = <meshStandardMaterial color="#f3f4f6" roughness={0.9} side={THREE.DoubleSide} />;

  return (
    <group>
      {/* Back wall */}
      <mesh position={[0, height / 2, -depth / 2]} receiveShadow>
        <planeGeometry args={[width, height]} />
        {wallMaterial}
      </mesh>
      {/* Left wall */}
      <mesh position={[-width / 2, height / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[depth, height]} />
        {wallMaterial}
      </mesh>
      {/* Right wall */}
      <mesh position={[width / 2, height / 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[depth, height]} />
        {wallMaterial}
      </mesh>
    </group>
  );
}

// Scene lighting
function Lighting({ ambientIntensity = 0.4 }) {
  return (
    <>
      <ambientLight intensity={ambientIntensity} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <pointLight position={[-5, 5, -5]} intensity={0.3} color="#fff5e1" />
      <pointLight position={[5, 5, 5]} intensity={0.3} color="#fff5e1" />
    </>
  );
}

// Main 3D viewer component
export default function VenueViewer3D({
  tables = [],
  sceneConfig = {},
  selectedTableId = null,
  unavailableTableIds = [],
  onTableSelect = () => {},
  className = ''
}) {
  const dimensions = sceneConfig.dimensions || { width: 20, depth: 15, height: 4 };

  return (
    <div className={`relative bg-gray-100 rounded-xl overflow-hidden ${className}`}>
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 12, 12]} fov={50} />
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={30}
          maxPolarAngle={Math.PI / 2.1}
          target={[0, 0, 0]}
        />

        <Suspense fallback={null}>
          <Lighting ambientIntensity={sceneConfig.ambient_light || 0.4} />

          <Floor width={dimensions.width} depth={dimensions.depth} />
          <Walls width={dimensions.width} depth={dimensions.depth} height={dimensions.height} />

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
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg">
        <div className="text-xs font-medium text-gray-700 mb-2">Table Status</div>
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Booked</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span>VIP</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Selected</span>
          </div>
        </div>
      </div>

      {/* Controls hint */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow text-xs text-gray-600">
        Drag to rotate | Scroll to zoom | Click table to select
      </div>
    </div>
  );
}
