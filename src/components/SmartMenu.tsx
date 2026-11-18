import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, OrbitControls, ContactShadows } from '@react-three/drei';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, CameraOff, Minus, Plus, Ruler, X } from 'lucide-react';
import * as THREE from 'three';
import type { Product } from '@/data/products';

interface SmartMenuProps {
  product: Product | null;
  onClose: () => void;
}

function StreetFoodModel({ product, scale }: { product: Product; scale: number }) {
  const ref = useRef<THREE.Group>(null);
  const isPizza = product.category === 'PIZZAS';
  const isDrink = product.category === 'BEBIDAS';
  const isChicken = product.category === 'FRANGO';
  const isFries = product.category === 'MABELLY PORÇÕES';
  const isHotDog = product.category === 'DOGÃO GOURMET';

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = Math.sin(clock.elapsedTime * 0.35) * 0.18;
      ref.current.position.y = Math.sin(clock.elapsedTime * 0.8) * 0.04;
    }
  });

  return (
    <group ref={ref} scale={scale * 0.72}>
      {isPizza ? (
        <>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[1.35, 1.35, 0.12, 64]} />
            <meshStandardMaterial color="#d28c48" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.08, 0]} castShadow>
            <cylinderGeometry args={[1.22, 1.22, 0.05, 64]} />
            <meshStandardMaterial color="#e7a22d" roughness={0.4} />
          </mesh>
          {Array.from({ length: 10 }).map((_, index) => {
            const angle = (index / 10) * Math.PI * 2;
            return (
              <mesh key={index} position={[Math.cos(angle) * 0.72, 0.13, Math.sin(angle) * 0.72]} castShadow>
                <sphereGeometry args={[0.14, 16, 16]} />
                <meshStandardMaterial color="#a82e25" roughness={0.55} />
              </mesh>
            );
          })}
        </>
      ) : isDrink ? (
        <>
          <mesh castShadow>
            <cylinderGeometry args={[0.48, 0.38, 1.65, 32]} />
            <meshStandardMaterial color="#e9799d" roughness={0.25} metalness={0.1} />
          </mesh>
          <mesh position={[0, 0.84, 0]}>
            <torusGeometry args={[0.39, 0.08, 16, 32]} />
            <meshStandardMaterial color="#f5e0d5" roughness={0.5} />
          </mesh>
          <mesh position={[0.1, 1.05, 0.04]} rotation={[0, 0, -0.15]}>
            <cylinderGeometry args={[0.06, 0.06, 0.8, 12]} />
            <meshStandardMaterial color="#ffd000" roughness={0.4} />
          </mesh>
        </>
      ) : isFries || isChicken ? (
        <>
          <mesh castShadow>
            <boxGeometry args={[1.25, 0.55, 0.9]} />
            <meshStandardMaterial color={isChicken ? '#9f3d21' : '#d54b2b'} roughness={0.65} />
          </mesh>
          {Array.from({ length: 12 }).map((_, index) => (
            <mesh key={index} position={[(index % 4 - 1.5) * 0.25, 0.38 + (index % 3) * 0.08, (Math.floor(index / 4) - 1) * 0.24]} rotation={[0, (index % 2) * 0.3, (index % 3 - 1) * 0.12]} castShadow>
              <boxGeometry args={[0.16, 0.65, 0.16]} />
              <meshStandardMaterial color={isChicken ? '#c87935' : '#f1b847'} roughness={0.75} />
            </mesh>
          ))}
        </>
      ) : isHotDog ? (
        <>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <capsuleGeometry args={[0.22, 1.7, 12, 24]} />
            <meshStandardMaterial color="#b43b29" roughness={0.55} />
          </mesh>
          <mesh position={[0, -0.14, 0]} rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.35, 1.8, 12, 24]} />
            <meshStandardMaterial color="#d89150" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.2, 0]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.13, 0.035, 12, 32]} />
            <meshStandardMaterial color="#f2d05b" roughness={0.4} />
          </mesh>
        </>
      ) : (
        <>
          <mesh position={[0, -0.2, 0]} castShadow>
            <cylinderGeometry args={[0.72, 0.68, 0.18, 48]} />
            <meshStandardMaterial color="#4b2818" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.02, 0]} castShadow>
            <cylinderGeometry args={[0.74, 0.74, 0.04, 48]} />
            <meshStandardMaterial color="#e7b839" roughness={0.35} />
          </mesh>
          <mesh position={[0, 0.16, 0]} castShadow>
            <sphereGeometry args={[0.78, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#d28d4c" roughness={0.7} />
          </mesh>
        </>
      )}
    </group>
  );
}

function SmartScene({ product, scale }: { product: Product; scale: number }) {
  return (
    <Canvas camera={{ position: [0, 0.6, 3.8], fov: 38 }} shadows dpr={[1, 1.5]}>
      <ambientLight intensity={0.55} />
      <spotLight position={[2, 4, 3]} intensity={2.4} angle={0.4} penumbra={0.8} castShadow color="#fff1da" />
      <pointLight position={[-3, 1, -2]} intensity={1.2} color="#ffd000" />
      <Suspense fallback={null}>
        <StreetFoodModel product={product} scale={scale} />
        <ContactShadows position={[0, -0.72, 0]} opacity={0.55} scale={4} blur={2} far={2.5} />
        <Environment preset="city" />
      </Suspense>
      <OrbitControls enablePan={false} enableDamping dampingFactor={0.06} minDistance={2.5} maxDistance={6} />
    </Canvas>
  );
}

export default function SmartMenu({ product, onClose }: SmartMenuProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const toggleCamera = async () => {
    if (cameraOn) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setCameraOn(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraOn(true);
      setCameraError(false);
    } catch {
      setCameraError(true);
    }
  };

  return (
    <AnimatePresence>
      {product && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] bg-ink-900" role="dialog" aria-modal="true">
          <div className="absolute inset-0">
            {cameraOn ? (
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[radial-gradient(circle_at_center,_rgba(255,208,0,0.18),_transparent_48%),linear-gradient(135deg,#131318,#08080a)]" />
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-ink-900/90 via-transparent to-ink-900/95 pointer-events-none" />

          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center justify-between px-5 py-5 md:px-8">
              <div>
                <div className="flex items-center gap-2 text-champagne-500">
                  <Ruler className="w-4 h-4" />
                  <span className="text-[10px] tracking-[0.25em] uppercase">4D Smart Menu</span>
                </div>
                <h2 className="font-display text-2xl md:text-3xl text-champagne-500 mt-1">Veja o tamanho real</h2>
              </div>
              <button onClick={onClose} className="w-10 h-10 rounded-full bg-black/40 border border-yellow-300/20 flex items-center justify-center text-champagne-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative flex-1 min-h-0">
              <div className="absolute inset-0 pointer-events-auto">
                <SmartScene product={product} scale={scale} />
              </div>
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 translate-y-[90px] px-3 py-1.5 rounded-full bg-black/50 border border-yellow-300/15 text-[10px] tracking-[0.14em] uppercase text-champagne-500 pointer-events-none">
                Arraste o {product.category === 'BEBIDAS' ? 'copo' : 'item'} para ver em 3D
              </div>
            </div>

            <div className="px-5 pb-6 md:px-8 md:pb-8 space-y-4">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="font-display text-2xl text-champagne-500">{product.name}</p>
                  <p className="text-xs text-champagne-500 mt-1">Escala de referência: {product.realSize}</p>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-black/45 border border-yellow-300/15 p-1">
                  <button onClick={() => setScale((value) => Math.max(0.65, Number((value - 0.1).toFixed(1))))} className="w-8 h-8 rounded-full flex items-center justify-center text-champagne-500 hover:bg-yellow-300/10"><Minus className="w-4 h-4" /></button>
                  <span className="text-xs text-champagne-500 w-10 text-center">{Math.round(scale * 100)}%</span>
                  <button onClick={() => setScale((value) => Math.min(1.5, Number((value + 0.1).toFixed(1))))} className="w-8 h-8 rounded-full flex items-center justify-center text-champagne-500 hover:bg-yellow-300/10"><Plus className="w-4 h-4" /></button>
                </div>
              </div>

              {cameraError && <p className="text-xs text-champagne-500 bg-black/60 border border-yellow-300/20 rounded-xl px-3 py-2">A câmera não foi liberada. Você ainda pode explorar o modelo 3D em um espaço virtual.</p>}

              <button onClick={toggleCamera} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full bg-yellow-500 text-black font-semibold text-sm hover:bg-yellow-400 transition-colors">
                {cameraOn ? <CameraOff className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
                {cameraOn ? 'FECHAR CÂMERA' : 'VER NA MINHA CÂMERA'}
              </button>
              <p className="text-center text-[10px] text-champagne-500">A escala é uma referência visual. Use o controle para aproximar ou afastar o item.</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
