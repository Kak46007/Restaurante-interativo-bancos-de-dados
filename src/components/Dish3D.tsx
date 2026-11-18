import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  Environment,
  ContactShadows,
  Float,
  PresentationControls,
} from '@react-three/drei';
import * as THREE from 'three';

function Plate() {
  const plateGeo = useMemo(() => {
    const shape = new THREE.LatheGeometry([
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0, 0),
      new THREE.Vector2(1.4, 0),
      new THREE.Vector2(1.5, 0.06),
      new THREE.Vector2(1.5, 0.12),
      new THREE.Vector2(1.42, 0.16),
      new THREE.Vector2(1.4, 0.16),
      new THREE.Vector2(1.3, 0.14),
      new THREE.Vector2(1.28, 0.1),
      new THREE.Vector2(1.28, 0),
      new THREE.Vector2(0, 0),
    ], 64);
    return shape;
  }, []);

  const rimGeo = useMemo(() => new THREE.TorusGeometry(1.45, 0.025, 16, 128), []);

  return (
    <group>
      {/* Plate base */}
      <mesh geometry={plateGeo} castShadow receiveShadow>
        <meshStandardMaterial
          color="#1a1a20"
          metalness={0.9}
          roughness={0.15}
          envMapIntensity={1.2}
        />
      </mesh>
      {/* Gold rim */}
      <mesh geometry={rimGeo} position={[0, 0.16, 0]}>
        <meshStandardMaterial
          color="#ffd000"
          metalness={1}
          roughness={0.1}
          emissive="#aa8500"
          emissiveIntensity={0.15}
        />
      </mesh>
    </group>
  );
}

function FoodStack() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.elapsedTime * 0.15;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.2, 0]}>
      {/* Patty / base */}
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.7, 0.7, 0.18, 48]} />
        <meshStandardMaterial
          color="#4a2c17"
          roughness={0.75}
          metalness={0.1}
        />
      </mesh>

      {/* Cheese layer */}
      <mesh position={[0, 0.34, 0]} castShadow>
        <cylinderGeometry args={[0.72, 0.72, 0.04, 48]} />
        <meshStandardMaterial
          color="#d4a017"
          roughness={0.35}
          metalness={0.3}
          emissive="#b8860b"
          emissiveIntensity={0.05}
        />
      </mesh>

      {/* Bun bottom */}
      <mesh position={[0, 0.41, 0]} castShadow>
        <cylinderGeometry args={[0.75, 0.7, 0.12, 48]} />
        <meshStandardMaterial
          color="#c8915a"
          roughness={0.7}
          metalness={0.05}
        />
      </mesh>

      {/* Bun top */}
      <mesh position={[0, 0.52, 0]} castShadow>
        <sphereGeometry args={[0.75, 48, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#e0a060"
          roughness={0.65}
          metalness={0.05}
        />
      </mesh>

      {/* Sesame seeds */}
      {Array.from({ length: 14 }).map((_, i) => {
        const angle = (i / 14) * Math.PI * 2;
        const radius = 0.3 + (i % 3) * 0.12;
        const height = 0.55 + Math.sin(i * 1.3) * 0.04;
        return (
          <mesh
            key={i}
            position={[
              Math.cos(angle) * radius,
              height,
              Math.sin(angle) * radius,
            ]}
            rotation={[Math.PI / 2, 0, angle]}
          >
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshStandardMaterial color="#f5e6c8" roughness={0.5} />
          </mesh>
        );
      })}

      {/* Tomato slice */}
      <mesh position={[0.45, 0.28, 0.3]} rotation={[0, 0.5, 0.1]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 0.03, 24]} />
        <meshStandardMaterial color="#c0392b" roughness={0.5} />
      </mesh>

      {/* Lettuce piece */}
      <mesh position={[-0.4, 0.28, 0.35]} rotation={[0, 1.2, 0.15]} castShadow>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#4a7c3a" roughness={0.7} />
      </mesh>
    </group>
  );
}

function SceneContent() {
  const { mouse } = useThree();
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        mouse.x * 0.3,
        0.04,
      );
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        -mouse.y * 0.15,
        0.04,
      );
    }
  });

  return (
    <group ref={groupRef}>
      <Float
        speed={1.5}
        rotationIntensity={0.2}
        floatIntensity={0.5}
        floatingRange={[-0.08, 0.08]}
      >
        <PresentationControls
          global
          polar={[-0.2, 0.2]}
          azimuth={[-0.3, 0.3]}
          config={{ mass: 2, tension: 200 }}
        >
          <Plate />
          <FoodStack />
        </PresentationControls>
      </Float>

      <ContactShadows
        position={[0, -0.5, 0]}
        opacity={0.5}
        scale={6}
        blur={2.5}
        far={3}
        color="#000"
      />
    </group>
  );
}

export default function Dish3D() {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 1.5, 3.5], fov: 40 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      dpr={[1, 2]}
    >
      {/* Cinematic lighting */}
      <ambientLight intensity={0.15} />
      <spotLight
        position={[3, 5, 2]}
        angle={0.3}
        penumbra={0.8}
        intensity={2.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        color="#fff5e1"
      />
      <pointLight position={[-3, 2, -2]} intensity={1} color="#ffd000" />
      <pointLight position={[0, -1, 3]} intensity={0.5} color="#ffd700" />

      <SceneContent />

      <Environment preset="night" />
    </Canvas>
  );
}
