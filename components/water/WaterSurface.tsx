"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { waterFragmentShader, waterVertexShader } from "@/lib/shaders/water";
import type { PointerState } from "@/hooks/useMousePosition";

interface WaterSurfaceProps {
  pointer: React.MutableRefObject<PointerState>;
}

export default function WaterSurface({ pointer }: WaterSurfaceProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { size, viewport } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: {
        value: new THREE.Vector2(
          size.width * viewport.dpr,
          size.height * viewport.dpr
        )
      },
      uPointer: { value: new THREE.Vector2(0.5, 0.5) },
      uPointerOn: { value: 0 },
      uIntensity: { value: 0.0 } // eases in on first frame
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useFrame((state, delta) => {
    const m = materialRef.current;
    if (!m) return;

    m.uniforms.uTime.value = state.clock.elapsedTime;
    m.uniforms.uResolution.value.set(
      size.width * viewport.dpr,
      size.height * viewport.dpr
    );

    // Smoothly chase the pointer; flip Y into GL space.
    const target = m.uniforms.uPointer.value as THREE.Vector2;
    target.x += (pointer.current.nx - target.x) * Math.min(1, delta * 6);
    target.y += (1 - pointer.current.ny - target.y) * Math.min(1, delta * 6);

    const wantOn = pointer.current.active ? 1 : 0;
    m.uniforms.uPointerOn.value +=
      (wantOn - m.uniforms.uPointerOn.value) * Math.min(1, delta * 3);

    // Gentle fade-in of the whole surface.
    m.uniforms.uIntensity.value +=
      (1 - m.uniforms.uIntensity.value) * Math.min(1, delta * 1.5);
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={waterVertexShader}
        fragmentShader={waterFragmentShader}
        uniforms={uniforms}
        transparent
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}
