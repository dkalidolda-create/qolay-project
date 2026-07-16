import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { SceneMode } from "./ControlPanel";
import { PALETTE, TEMP_STOPS } from "../theme";

interface Props {
  mode: SceneMode;
  temperature: number;
  outsideTemperature: number | null;
  brightness: string | null;
  noise: string | null;
}

function lerpColor(a: string, b: string, ratio: number) {
  return new THREE.Color(a).lerp(new THREE.Color(b), ratio);
}

function tempToColor(t: number): THREE.Color {
  const stops = TEMP_STOPS;
  if (t <= stops[0].t) return new THREE.Color(stops[0].c);
  for (let i = 0; i < stops.length - 1; i++) {
    if (t >= stops[i].t && t <= stops[i + 1].t) {
      const ratio = (t - stops[i].t) / (stops[i + 1].t - stops[i].t);
      return lerpColor(stops[i].c, stops[i + 1].c, ratio);
    }
  }
  return new THREE.Color(stops[stops.length - 1].c);
}

function brightnessToLevel(b: string | null) {
  switch (b) {
    case "dark":
      return 0.4;
    case "dim":
      return 0.7;
    case "normal":
      return 1.0;
    case "bright":
      return 1.3;
    case "very_bright":
      return 1.6;
    default:
      return 1.0;
  }
}

function noiseToLevel(n: string | null) {
  switch (n) {
    case "quiet":
      return { speed: 0.5, amp: 0.06 };
    case "mild":
      return { speed: 1.0, amp: 0.14 };
    case "noisy":
      return { speed: 1.8, amp: 0.26 };
    case "very_noisy":
      return { speed: 2.8, amp: 0.4 };
    default:
      return { speed: 0.5, amp: 0.06 };
  }
}

// --- Веерная геометрия: корпуса расходятся шире к краям, как на реальном кампусе ---
const BLOCK_Z = [-6.5, -2.2, 2.2, 6.5];
const BLOCK_W = 2.6;
const BLOCK_D = 3.8;
const BLOCK_H = 2.6;
const CORRIDOR_HALF_WIDTH = 1.3;
const GAP = 0.5;
const BASE_BLOCK_X = CORRIDOR_HALF_WIDTH + GAP + BLOCK_W / 2;
const FAN_FACTOR = 0.22; // чем больше — тем сильнее веерный разлёт корпусов к краям
const CORRIDOR_HALF_LEN = 9;
const FAN_LEN = 3.2;
const PARTICLE_COUNT = 90;
const OUTSIDE_PARTICLE_COUNT = 70;

function fanX(z: number) {
  return BASE_BLOCK_X + FAN_FACTOR * Math.abs(z);
}

function maxFootprintX() {
  return fanX(CORRIDOR_HALF_LEN) + BLOCK_W / 2 + 0.3;
}

function Building({ x, z }: { x: number; z: number }) {
  const geo = useMemo(
    () => new THREE.BoxGeometry(BLOCK_W, BLOCK_H, BLOCK_D),
    [],
  );
  const edges = useMemo(() => new THREE.EdgesGeometry(geo), [geo]);
  const roofGeo = useMemo(
    () => new THREE.BoxGeometry(BLOCK_W * 1.03, 0.1, BLOCK_D * 1.03),
    [],
  );
  return (
    <group position={[x, BLOCK_H / 2, z]}>
      <mesh geometry={geo} castShadow receiveShadow>
        <meshStandardMaterial color="#E7E6E1" roughness={0.85} metalness={0} />
      </mesh>
      <mesh geometry={roofGeo} position={[0, BLOCK_H / 2 + 0.05, 0]}>
        <meshStandardMaterial color="#8C9198" roughness={0.6} />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color={PALETTE.control} />
      </lineSegments>
      {[0.35, -0.1].map((yOff, i) => (
        <mesh key={i} position={[0, yOff * BLOCK_H, BLOCK_D / 2 + 0.005]}>
          <planeGeometry args={[BLOCK_W * 0.85, 0.1]} />
          <meshBasicMaterial
            color={PALETTE.controlSoft}
            transparent
            opacity={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}

function Buildings() {
  return (
    <>
      {BLOCK_Z.map((z) => {
        const x = fanX(z);
        return (
          <group key={z}>
            <Building x={-x} z={z} />
            <Building x={x} z={z} />
          </group>
        );
      })}
    </>
  );
}

function RotundaEntrance({ side }: { side: 1 | -1 }) {
  return (
    <group position={[0, 0, side * (CORRIDOR_HALF_LEN + 1.6)]}>
      <mesh position={[0, 1.1, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2, 2, 2.2, 32]} />
        <meshStandardMaterial color="#F4F3EF" roughness={0.8} />
      </mesh>
      <mesh position={[0, 2.3, 0]}>
        <sphereGeometry args={[2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#C9A24B" roughness={0.3} metalness={0.4} />
      </mesh>
      <mesh position={[0, 3.35, 0]}>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial color="#C9A24B" roughness={0.2} metalness={0.6} />
      </mesh>
      <lineSegments
        geometry={
          new THREE.EdgesGeometry(new THREE.CylinderGeometry(2, 2, 2.2, 32))
        }
        position={[0, 1.1, 0]}
      >
        <lineBasicMaterial color={PALETTE.control} />
      </lineSegments>
    </group>
  );
}

function GlassRoof() {
  const length = CORRIDOR_HALF_LEN * 2 + FAN_LEN * 2;
  const ridgeH = BLOCK_H + 1.1;
  const eaveH = BLOCK_H + 0.3;
  const halfSpan = CORRIDOR_HALF_WIDTH + 0.6;

  const geo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-halfSpan, eaveH);
    shape.lineTo(0, ridgeH);
    shape.lineTo(halfSpan, eaveH);
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: length,
      bevelEnabled: false,
      curveSegments: 1,
    });
    g.translate(0, 0, -length / 2);
    return g;
  }, []);

  return (
    <group>
      <mesh geometry={geo}>
        <meshPhysicalMaterial
          color="#DCEFEC"
          transparent
          opacity={0.25}
          roughness={0.1}
          metalness={0}
          side={THREE.DoubleSide}
        />
      </mesh>
      <lineSegments geometry={new THREE.EdgesGeometry(geo)}>
        <lineBasicMaterial color={PALETTE.control} transparent opacity={0.5} />
      </lineSegments>
    </group>
  );
}

function AtriumFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[CORRIDOR_HALF_WIDTH * 2, CORRIDOR_HALF_LEN * 2]} />
      <meshStandardMaterial color={PALETTE.bg} roughness={1} />
    </mesh>
  );
}

function Grounds() {
  const maxX = maxFootprintX();
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.015, 0]}>
        <ringGeometry args={[maxX + 2, maxX + 2.6, 64]} />
        <meshStandardMaterial color="#D8D4CB" roughness={1} />
      </mesh>
      {BLOCK_Z.map((z) => {
        const x = fanX(z);
        return (
          <group key={z}>
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              position={[-(x + 1.3), -0.01, z]}
            >
              <planeGeometry args={[1.6, 2.6]} />
              <meshStandardMaterial color="#CFE3CF" roughness={1} />
            </mesh>
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              position={[x + 1.3, -0.01, z]}
            >
              <planeGeometry args={[1.6, 2.6]} />
              <meshStandardMaterial color="#CFE3CF" roughness={1} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function GroundPlane() {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.02, 0]}
      receiveShadow
    >
      <planeGeometry args={[45, 45]} />
      <meshStandardMaterial color="#F3F2EE" roughness={1} />
    </mesh>
  );
}

/** Температура внутри — поток частиц между корпусами */
function TempFlow({ color }: { color: THREE.Color }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const seeds = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }).map(() => ({
        z: (Math.random() - 0.5) * CORRIDOR_HALF_LEN * 2,
        x: (Math.random() - 0.5) * (CORRIDOR_HALF_WIDTH * 1.6),
        y: 0.3 + Math.random() * (BLOCK_H - 0.4),
        speed: 0.6 + Math.random() * 0.8,
        scale: 0.14 + Math.random() * 0.14,
        phase: Math.random() * Math.PI * 2,
      })),
    [],
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const mesh = meshRef.current;
    if (!mesh) return;
    seeds.forEach((s, i) => {
      const z =
        ((s.z + t * s.speed + CORRIDOR_HALF_LEN) % (CORRIDOR_HALF_LEN * 2)) -
        CORRIDOR_HALF_LEN;
      const x = s.x + Math.sin(t * 0.5 + s.phase) * 0.25;
      const y = s.y + Math.sin(t * 0.8 + s.phase) * 0.12;
      dummy.position.set(x, y, z);
      dummy.scale.setScalar(s.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    (mesh.material as THREE.MeshBasicMaterial).color = color;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
      <sphereGeometry args={[1, 10, 10]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.9}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

/** Температура снаружи — тот же тип потока частиц, но по кольцу вокруг здания */
function OutsideTempFlow({ color }: { color: THREE.Color }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const outerR = maxFootprintX() + 2;

  const seeds = useMemo(
    () =>
      Array.from({ length: OUTSIDE_PARTICLE_COUNT }).map(() => {
        const angle = Math.random() * Math.PI * 2;
        const radius = outerR + Math.random() * 3;
        return {
          angle,
          radius,
          y: 0.2 + Math.random() * 1.4,
          speed: (0.15 + Math.random() * 0.25) * (Math.random() > 0.5 ? 1 : -1),
          scale: 0.16 + Math.random() * 0.16,
          phase: Math.random() * Math.PI * 2,
        };
      }),
    [outerR],
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const mesh = meshRef.current;
    if (!mesh) return;
    seeds.forEach((s, i) => {
      const a = s.angle + t * s.speed;
      const r = s.radius + Math.sin(t * 0.4 + s.phase) * 0.6;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const y = s.y + Math.sin(t * 0.7 + s.phase) * 0.15;
      dummy.position.set(x, y, z);
      dummy.scale.setScalar(s.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    (mesh.material as THREE.MeshBasicMaterial).color = color;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, OUTSIDE_PARTICLE_COUNT]}
    >
      <sphereGeometry args={[1, 10, 10]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.85}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

function NoiseLayer({ speed, amp }: { speed: number; amp: number }) {
  const geoRef = useRef<THREE.PlaneGeometry>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const geo = geoRef.current;
    if (!geo) return;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y0 = pos.getY(i);
      const wave =
        Math.sin(x * 1.5 + t * speed) * amp +
        Math.cos(y0 * 1.2 + t * speed * 0.8) * amp;
      pos.setZ(i, wave);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, BLOCK_H + 0.5, 0]}>
      <planeGeometry
        ref={geoRef}
        args={[CORRIDOR_HALF_WIDTH * 2 + 1, CORRIDOR_HALF_LEN * 2, 24, 48]}
      />
      <meshStandardMaterial
        color={PALETTE.control}
        transparent
        opacity={0.55}
        side={THREE.DoubleSide}
        wireframe
      />
    </mesh>
  );
}

function Scene({
  mode,
  temperature,
  outsideTemperature,
  brightness,
  noise,
}: Props) {
  const insideColor = useMemo(() => tempToColor(temperature), [temperature]);
  const outsideColor = useMemo(
    () => tempToColor(outsideTemperature ?? temperature),
    [outsideTemperature, temperature],
  );
  const lightLevel = useMemo(() => brightnessToLevel(brightness), [brightness]);
  const wave = useMemo(() => noiseToLevel(noise), [noise]);

  return (
    <>
      <ambientLight intensity={0.75} />
      <directionalLight
        position={[10, 14, 8]}
        intensity={mode === "brightness" ? lightLevel : 1.1}
        castShadow
      />
      <GroundPlane />
      <Grounds />
      <AtriumFloor />
      <Buildings />
      <RotundaEntrance side={1} />
      <RotundaEntrance side={-1} />
      <GlassRoof />

      {mode === "atrium_temp" && <TempFlow color={insideColor} />}
      {mode === "outside_temp" && <OutsideTempFlow color={outsideColor} />}
      {mode === "noise" && <NoiseLayer speed={wave.speed} amp={wave.amp} />}
    </>
  );
}

function Legend({ mode }: { mode: SceneMode }) {
  if (mode === "atrium_temp" || mode === "outside_temp") {
    const gradient = TEMP_STOPS.map((s) => s.c).join(", ");
    return (
      <div
        className="absolute top-3 right-3 z-10 rounded-xl px-3 py-2 shadow-sm border text-xs"
        style={{
          background: "rgba(250,250,249,0.92)",
          borderColor: PALETTE.controlSoft,
          color: PALETTE.control,
        }}
      >
        <div className="mb-1 font-medium">
          {mode === "atrium_temp"
            ? "Температура внутри"
            : "Температура снаружи"}
        </div>
        <div
          className="h-2 w-40 rounded-full"
          style={{ background: `linear-gradient(90deg, ${gradient})` }}
        />
        <div className="flex justify-between mt-1 opacity-80">
          <span>Холодно</span>
          <span>Комфортно</span>
          <span>Жарко</span>
        </div>
      </div>
    );
  }
  if (mode === "noise") {
    return (
      <div
        className="absolute top-3 right-3 z-10 rounded-xl px-3 py-2 shadow-sm border text-xs"
        style={{
          background: "rgba(250,250,249,0.92)",
          borderColor: PALETTE.controlSoft,
          color: PALETTE.control,
        }}
      >
        <div className="font-medium mb-1">Уровень шума</div>
        <div>Чем сильнее вибрация сетки — тем громче</div>
      </div>
    );
  }
  return (
    <div
      className="absolute top-3 right-3 z-10 rounded-xl px-3 py-2 shadow-sm border text-xs"
      style={{
        background: "rgba(250,250,249,0.92)",
        borderColor: PALETTE.controlSoft,
        color: PALETTE.control,
      }}
    >
      <div className="font-medium mb-1">Освещение</div>
      <div>Яркость сцены = уровень света</div>
    </div>
  );
}

export default function AtriumScene(props: Props) {
  return (
    <div
      className="relative w-full h-[460px] rounded-3xl overflow-hidden shadow-sm border"
      style={{ background: PALETTE.bg, borderColor: PALETTE.controlSoft }}
    >
      <Legend mode={props.mode} />
      <Canvas camera={{ position: [20, 15, 22], fov: 38 }} shadows>
        <color attach="background" args={[PALETTE.bg]} />
        <Scene {...props} />
        <OrbitControls
          enablePan={false}
          minDistance={15}
          maxDistance={40}
          maxPolarAngle={Math.PI / 2.3}
        />
      </Canvas>
    </div>
  );
}
