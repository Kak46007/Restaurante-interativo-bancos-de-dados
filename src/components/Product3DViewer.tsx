import { Suspense, useRef, useEffect, useState, Component, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, useGLTF } from '@react-three/drei';
import type { Group as ThreeGroup } from 'three';
import * as THREE from 'three';
import { isWebGLAvailable } from '@/utils/webgl';

interface ModelProps {
  modelPath: string;
  autoRotate: boolean;
}

function Model({ modelPath, autoRotate }: ModelProps) {
  const ref = useRef<ThreeGroup>(null);
  const { scene } = useGLTF(modelPath) as { scene: ThreeGroup };

  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        }
      });
    }
  }, [scene]);

  useFrame(({ clock }) => {
    if (ref.current && autoRotate) {
      ref.current.rotation.y = clock.elapsedTime * 0.3;
    }
  });

  return (
    <group ref={ref}>
      <primitive object={scene} scale={1.2} />
    </group>
  );
}

class ErrorBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; onError: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

interface Product3DViewerProps {
  modelPath?: string;
  image: string;
  alt: string;
  autoRotate?: boolean;
  className?: string;
}

export default function Product3DViewer({
  modelPath,
  image,
  alt,
  autoRotate = true,
  className = '',
}: Product3DViewerProps) {
  const webglAvailable = isWebGLAvailable();
  const [modelError, setModelError] = useState(false);
  const has3D = webglAvailable && !!modelPath && !modelError;

  if (!has3D) {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <img
          src={image}
          alt={alt}
          className="w-full h-full object-cover rounded-2xl"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/60 via-transparent to-transparent rounded-2xl pointer-events-none" />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <Canvas
        shadows
        camera={{ position: [0, 0.8, 3], fov: 40 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.3} />
          <spotLight
            position={[2, 4, 2]}
            angle={0.35}
            penumbra={0.8}
            intensity={2}
            castShadow
            color="#fff5e1"
          />
          <pointLight position={[-2, 1, -2]} intensity={0.8} color="#ffd000" />

          <ErrorBoundary onError={() => setModelError(true)}>
            <Model modelPath={modelPath!} autoRotate={autoRotate} />
          </ErrorBoundary>

          <ContactShadows
            position={[0, -0.6, 0]}
            opacity={0.4}
            scale={4}
            blur={2}
            far={2}
            color="#000"
          />
          <Environment preset="night" />
          <OrbitControls
            enablePan={false}
            minDistance={1.5}
            maxDistance={5}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 1.8}
            enableDamping
            dampingFactor={0.05}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
