import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { SceneMode } from "./ControlPanel";

interface Props {
  mode: SceneMode;
  temperature: number;
  outsideTemperature: number | null;
  brightness: string | null;
  noise: string | null;
}

function tempToColor(t: number): THREE.Color {
  const stops = [
    { t: 10, c: new THREE.Color("#2563eb") },
    { t: 18, c: new THREE.Color("#06b6d4") },
    { t: 23, c: new THREE.Color("#22c55e") },
    { t: 27, c: new THREE.Color("#eab308") },
    { t: 31, c: new THREE.Color("#f97316") },
    { t: 36, c: new THREE.Color("#ef4444") },
  ];
  if (t <= stops[0].t) return stops[0].c;
  for (let i = 0; i < stops.length - 1; i++) {
    if (t >= stops[i].t && t <= stops[i + 1].t) {
      const ratio = (t - stops[i].t) / (stops[i + 1].t - stops[i].t);
      return stops[i].c.clone().lerp(stops[i + 1].c, ratio);
    }
  }
  return stops[stops.length - 1].c;
}

function brightnessToLight(b: string | null) {
  switch (b) {
    case "dark":
      return { color: "#64748b", intensity: 0.3 };
    case "dim":
      return { color: "#94a3b8", intensity: 0.6 };
    case "normal":
      return { color: "#ffffff", intensity: 1.1 };
    case "bright":
      return { color: "#fef3c7", intensity: 1.6 };
    case "very_bright":
      return { color: "#fde68a", intensity: 2.2 };
    default:
      return { color: "#ffffff", intensity: 1 };
  }
}

function noiseToWave(n: string | null) {
  switch (n) {
    case "quiet":
      return { speed: 0.3, opacity: 0.15, color: "#94a3b8" };
    case "mild":
      return { speed: 0.6, opacity: 0.25, color: "#64748b" };
    case "noisy":
      return { speed: 1.1, opacity: 0.4, color: "#475569" };
    case "very_noisy":
      return { speed: 1.8, opacity: 0.55, color: "#1e293b" };
    default:
      return { speed: 0.3, opacity: 0.15, color: "#94a3b8" };
  }
}

function Room({
  mode,
  temperature,
  outsideTemperature,
  brightness,
  noise,
}: Props) {
  const overlayRef = useRef<THREE.Mesh>(null);
  const wavesRef = useRef<THREE.Group>(null);

  const activeColor = useMemo(() => {
    if (mode === "atrium_temp") return tempToColor(temperature);
    if (mode === "outside_temp")
      return tempToColor(outsideTemperature ?? temperature);
    return new THREE.Color("#ffffff");
  }, [mode, temperature, outsideTemperature]);

  const light = useMemo(() => brightnessToLight(brightness), [brightness]);
  const wave = useMemo(() => noiseToWave(noise), [noise]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (overlayRef.current) {
      const mat = overlayRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = 0.35 + Math.sin(t * 0.6) * 0.08;
      overlayRef.current.position.x = Math.sin(t * 0.2) * 0.3;
    }
    if (wavesRef.current && mode === "noise") {
      wavesRef.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        mesh.position.y = -0.5 + i * 0.6 + Math.sin(t * wave.speed + i) * 0.2;
        (mesh.material as THREE.MeshStandardMaterial).opacity =
          wave.opacity + Math.sin(t * wave.speed + i) * 0.1;
      });
    }
  });

  return (
    <>
      <ambientLight
        intensity={mode === "brightness" ? light.intensity * 0.4 : 0.5}
        color={mode === "brightness" ? light.color : "#ffffff"}
      />
      <pointLight
        position={[0, 4, 0]}
        intensity={mode === "brightness" ? light.intensity : 1}
        color={mode === "brightness" ? light.color : "#ffffff"}
      />

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.5, 0]}
        receiveShadow
      >
        <planeGeometry args={[10, 6]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>

      <mesh position={[0, 0.5, -3]}>
        <boxGeometry args={[10, 4, 0.1]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <mesh position={[-5, 0.5, 0]}>
        <boxGeometry args={[0.1, 4, 6]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <mesh position={[5, 0.5, 0]}>
        <boxGeometry args={[0.1, 4, 6]} />
        <meshStandardMaterial color="#334155" />
      </mesh>

      {(mode === "atrium_temp" || mode === "outside_temp") && (
        <mesh ref={overlayRef} position={[0, 0.5, 0]}>
          <sphereGeometry args={[4, 32, 32]} />
          <meshStandardMaterial
            color={activeColor}
            transparent
            opacity={0.35}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {mode === "noise" && (
        <group ref={wavesRef}>
          {[0, 1, 2, 3].map((i) => (
            <mesh
              key={i}
              position={[0, -0.5 + i * 0.6, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <planeGeometry args={[8 - i, 5 - i * 0.5]} />
              <meshStandardMaterial
                color={wave.color}
                transparent
                opacity={wave.opacity}
                side={THREE.DoubleSide}
              />
            </mesh>
          ))}
        </group>
      )}
    </>
  );
}

export default function AtriumScene(props: Props) {
  return (
    <div className="w-full h-[420px] rounded-3xl overflow-hidden bg-slate-900 shadow-2xl">
      <Canvas camera={{ position: [6, 4, 8], fov: 50 }} shadows>
        <Room {...props} />
      </Canvas>
    </div>
  );
}
