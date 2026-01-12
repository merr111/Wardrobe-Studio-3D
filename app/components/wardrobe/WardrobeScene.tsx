"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import WardrobeModel from './WardrobeModel';
import useWardrobeStore from '../../store/wardrobeStore';
import * as THREE from 'three';

type ViewPreset = 'iso' | 'front' | 'side' | 'top';
type LightingPreset = 'studio' | 'warm' | 'cool';

const CameraPresetControls: React.FC<{ view: ViewPreset; enabled: boolean }> = ({
  view,
  enabled,
}) => {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const { camera } = useThree();

  const presets = useMemo(
    () => ({
      iso: { position: [200, 200, 200], target: [0, 100, 0] },
      front: { position: [0, 140, 300], target: [0, 100, 0] },
      side: { position: [300, 140, 0], target: [0, 100, 0] },
      top: { position: [0, 400, 0], target: [0, 0, 0] },
    }),
    []
  );

  useEffect(() => {
    const preset = presets[view];
    if (!preset) return;
    camera.position.set(preset.position[0], preset.position[1], preset.position[2]);
    controlsRef.current?.target.set(preset.target[0], preset.target[1], preset.target[2]);
    camera.lookAt(preset.target[0], preset.target[1], preset.target[2]);
    controlsRef.current?.update();
    camera.updateProjectionMatrix();
  }, [camera, presets, view]);

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={enabled}
      enablePan
      enableZoom
      enableRotate
      dampingFactor={0.1}
      enableDamping
      target={[0, 100, 0]}
    />
  );
};

const WardrobeScene: React.FC = () => {
  const [view, setView] = useState<ViewPreset>('iso');
  const [lightingPreset, setLightingPreset] = useState<LightingPreset>('studio');
  const [exploded, setExploded] = useState(false);
  const [showDimensions, setShowDimensions] = useState(false);
  const isDraggingComponent = useWardrobeStore((state) => state.isDraggingComponent);
  const setSelectedComponent = useWardrobeStore((state) => state.setSelectedComponent);
  const closeAllOpen = useWardrobeStore((state) => state.closeAllOpen);

  return (
    <div className="w-full h-full relative rounded-3xl bg-gradient-to-br from-[#fbf8f2] via-[#f2ece1] to-[#e8e0d4] shadow-[0_20px_60px_rgba(15,23,42,0.18)] overflow-hidden">
      <Canvas
        shadows
        camera={{ position: [200, 200, 200], fov: 50 }}
        style={{ background: 'transparent' }}
        onPointerMissed={() => {
          setSelectedComponent(null);
          closeAllOpen();
        }}
      >
        <Suspense fallback={null}>
          <WardrobeModel exploded={exploded} showDimensions={showDimensions} />
          <Environment preset="apartment" />
        </Suspense>
        <LightingRig preset={lightingPreset} />
        <ContactShadows
          position={[0, -1.2, 0]}
          opacity={0.3}
          scale={400}
          blur={3.5}
          far={200}
        />
        <CameraFocus />
        <CameraPresetControls view={view} enabled={!isDraggingComponent} />
      </Canvas>

      <div className="absolute top-4 left-4 z-10 rounded-lg bg-white/90 shadow-md backdrop-blur">
        <div className="flex items-center gap-2 px-3 py-2">
          {(['iso', 'front', 'side', 'top'] as ViewPreset[]).map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setView(preset)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                view === preset
                  ? 'bg-slate-900 text-white'
                  : 'bg-white/70 text-slate-700 hover:bg-white'
              }`}
            >
              {preset === 'iso' ? 'Iso' : preset.charAt(0).toUpperCase() + preset.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="absolute top-4 right-4 z-10 rounded-lg bg-white/90 shadow-md backdrop-blur">
        <div className="px-3 py-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Lighting</div>
          <div className="mt-2 flex items-center gap-2">
            {(['studio', 'warm', 'cool'] as LightingPreset[]).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setLightingPreset(preset)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  lightingPreset === preset
                    ? 'bg-slate-900 text-white'
                    : 'bg-white/70 text-slate-700 hover:bg-white'
                }`}
              >
                {preset === 'studio' && 'Showroom'}
                {preset === 'warm' && 'Home Light'}
                {preset === 'cool' && 'Technical'}
              </button>
            ))}
          </div>
          <div className="mt-3 space-y-2 text-sm text-gray-700">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-blue-600"
                checked={exploded}
                onChange={(event) => setExploded(event.target.checked)}
              />
              Exploded view
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-blue-600"
                checked={showDimensions}
                onChange={(event) => setShowDimensions(event.target.checked)}
              />
              Dimension labels
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WardrobeScene; 

const CameraFocus: React.FC = () => {
  const { camera } = useThree();
  const focusComponentId = useWardrobeStore((state) => state.focusComponentId);
  const setFocusComponentId = useWardrobeStore((state) => state.setFocusComponentId);
  const components = useWardrobeStore((state) => state.configuration.components);

  useEffect(() => {
    if (!focusComponentId) return;
    const component = components.find((item) => item.id === focusComponentId);
    if (!component) {
      setFocusComponentId(null);
      return;
    }

    const target = new THREE.Vector3(
      component.position.x,
      component.position.y,
      component.position.z
    );
    const offset = new THREE.Vector3(200, 160, 200);
    camera.position.copy(target.clone().add(offset));
    camera.lookAt(target);
    camera.updateProjectionMatrix();
    setFocusComponentId(null);
  }, [camera, components, focusComponentId, setFocusComponentId]);

  return null;
};

const LightingRig: React.FC<{ preset: LightingPreset }> = ({ preset }) => {
  if (preset === 'warm') {
    return (
      <>
        <ambientLight intensity={0.45} color="#ffe8cc" />
        <directionalLight position={[200, 240, 180]} intensity={1.2} color="#ffd8a8" />
        <directionalLight position={[-180, 120, -140]} intensity={0.5} color="#fff4e6" />
        <hemisphereLight intensity={0.25} color="#fff1e6" groundColor="#e9ecef" />
      </>
    );
  }

  if (preset === 'cool') {
    return (
      <>
        <ambientLight intensity={0.5} color="#e7f5ff" />
        <directionalLight position={[220, 220, 200]} intensity={1.1} color="#cfe8ff" />
        <directionalLight position={[-200, 160, -120]} intensity={0.45} color="#e0f2ff" />
        <hemisphereLight intensity={0.3} color="#e7f5ff" groundColor="#dee2e6" />
      </>
    );
  }

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[200, 220, 200]} intensity={1.1} />
      <directionalLight position={[-160, 120, -120]} intensity={0.4} />
      <hemisphereLight intensity={0.2} groundColor="#e2e8f0" />
    </>
  );
};
