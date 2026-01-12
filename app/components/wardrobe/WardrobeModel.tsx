"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import useWardrobeStore from "../../store/wardrobeStore";
import { Material, WardrobeComponent } from "../../types/wardrobe";

// Helper function to convert degrees to radians
const degToRad = (degrees: number) => degrees * (Math.PI / 180);

const HOVER_EMISSIVE = "#60a5fa";
const DIVIDER_GAP = 2;
const DRAWER_VERTICAL_GAP = 0.3;
const DEFAULT_DRAWER_HEIGHT = 20;
const MIN_COMPONENT_WIDTH = 5;

const getExplodedPosition = (
  position: WardrobeComponent["position"],
  zOffset: number
) => [position.x, position.y, position.z + zOffset] as const;

const resolveMaterialColor = (
  materialId: string | undefined,
  fallbackId: string,
  availableMaterials: Material[]
) => {
  const direct = availableMaterials.find((m) => m.id === materialId);
  if (direct) return direct.color;
  const fallback = availableMaterials.find((m) => m.id === fallbackId);
  return fallback?.color || "#ffffff";
};

const adjustColor = (hex: string, amount: number) => {
  const color = new THREE.Color(hex);
  color.offsetHSL(0, 0, amount);
  return `#${color.getHexString()}`;
};

const clampValue = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const getVerticalRange = (y: number, height: number) => ({
  min: y - height / 2,
  max: y + height / 2,
});

const getHorizontalRange = (x: number, width: number) => ({
  min: x - width / 2,
  max: x + width / 2,
});

const rangesOverlap = (
  a: { min: number; max: number },
  b: { min: number; max: number }
) => a.min <= b.max && a.max >= b.min;

const isDrawerYValid = (
  y: number,
  height: number,
  otherDrawers: WardrobeComponent[],
  otherShelves: WardrobeComponent[],
  wardrobeHeight: number
) => {
  const boundsMin = height / 2 + DRAWER_VERTICAL_GAP;
  const boundsMax = wardrobeHeight - height / 2 - DRAWER_VERTICAL_GAP;
  if (y < boundsMin || y > boundsMax) return false;

  const candidate = getVerticalRange(y, height);
  const drawerOverlap = otherDrawers.some((drawer) => {
    const range = getVerticalRange(drawer.position.y, drawer.dimensions.height);
    return (
      candidate.min <= range.max + DRAWER_VERTICAL_GAP &&
      candidate.max >= range.min - DRAWER_VERTICAL_GAP
    );
  });

  if (drawerOverlap) return false;

  const shelfOverlap = otherShelves.some((shelf) => {
    const range = getVerticalRange(shelf.position.y, shelf.dimensions.height);
    return (
      candidate.min <= range.max + DRAWER_VERTICAL_GAP &&
      candidate.max >= range.min - DRAWER_VERTICAL_GAP
    );
  });

  return !shelfOverlap;
};

const resolveDrawerY = (
  targetY: number,
  height: number,
  otherDrawers: WardrobeComponent[],
  otherShelves: WardrobeComponent[],
  wardrobeHeight: number
) => {
  if (
    isDrawerYValid(targetY, height, otherDrawers, otherShelves, wardrobeHeight)
  ) {
    return targetY;
  }

  const candidates = new Set<number>();
  const boundsMin = height / 2 + DRAWER_VERTICAL_GAP;
  const boundsMax = wardrobeHeight - height / 2 - DRAWER_VERTICAL_GAP;

  candidates.add(boundsMin);
  candidates.add(boundsMax);

  otherDrawers.forEach((drawer) => {
    const range = getVerticalRange(drawer.position.y, drawer.dimensions.height);
    candidates.add(range.max + DRAWER_VERTICAL_GAP + height / 2);
    candidates.add(range.min - DRAWER_VERTICAL_GAP - height / 2);
  });
  otherShelves.forEach((shelf) => {
    const range = getVerticalRange(shelf.position.y, shelf.dimensions.height);
    candidates.add(range.max + DRAWER_VERTICAL_GAP + height / 2);
    candidates.add(range.min - DRAWER_VERTICAL_GAP - height / 2);
  });

  const sorted = Array.from(candidates)
    .filter((value) => value >= boundsMin && value <= boundsMax)
    .sort((a, b) => Math.abs(a - targetY) - Math.abs(b - targetY));

  return (
    sorted.find((value) =>
      isDrawerYValid(value, height, otherDrawers, otherShelves, wardrobeHeight)
    ) ?? null
  );
};

const snapValue = (value: number, gridSize: number) =>
  Math.round(value / gridSize) * gridSize;

const clampPosition = (
  position: WardrobeComponent["position"],
  componentDimensions: WardrobeComponent["dimensions"],
  wardrobeDimensions: { width: number; height: number; depth: number }
) => {
  const margin = 2;
  const xMin =
    -wardrobeDimensions.width / 2 + componentDimensions.width / 2 + margin;
  const xMax =
    wardrobeDimensions.width / 2 - componentDimensions.width / 2 - margin;
  const yMin = componentDimensions.height / 2 + margin;
  const yMax =
    wardrobeDimensions.height - componentDimensions.height / 2 - margin;
  const zMin =
    -wardrobeDimensions.depth / 2 + componentDimensions.depth / 2 + margin;
  const zMax =
    wardrobeDimensions.depth / 2 - componentDimensions.depth / 2 - margin;

  return {
    x: clampValue(position.x, xMin, xMax),
    y: clampValue(position.y, yMin, yMax),
    z: clampValue(position.z, zMin, zMax),
  };
};

const getDividerSectionsLocal = (
  components: WardrobeComponent[],
  wardrobeWidth: number
) => {
  const dividers = components
    .filter((component) => component.type === "divider")
    .map((divider) => ({
      x: divider.position.x,
      width: divider.dimensions.width || 2,
    }))
    .sort((a, b) => a.x - b.x);

  const sections: { minX: number; maxX: number }[] = [];
  let currentMin = -wardrobeWidth / 2 + DIVIDER_GAP;

  dividers.forEach((divider) => {
    const leftMax = divider.x - divider.width / 2 - DIVIDER_GAP;
    if (leftMax > currentMin) {
      sections.push({ minX: currentMin, maxX: leftMax });
    }
    currentMin = divider.x + divider.width / 2 + DIVIDER_GAP;
  });

  const finalMax = wardrobeWidth / 2 - DIVIDER_GAP;
  if (finalMax > currentMin) {
    sections.push({ minX: currentMin, maxX: finalMax });
  }

  return sections;
};

const getSectionIndexForX = (
  x: number,
  sections: { minX: number; maxX: number }[]
) => sections.findIndex((section) => x >= section.minX && x <= section.maxX);

const getNearestSectionIndex = (
  x: number,
  sections: { minX: number; maxX: number }[]
) => {
  if (sections.length === 0) return -1;
  return sections.reduce((closestIndex, section, index) => {
    const distance = Math.min(
      Math.abs(x - section.minX),
      Math.abs(x - section.maxX)
    );
    const closestSection = sections[closestIndex];
    const closestDistance = Math.min(
      Math.abs(x - closestSection.minX),
      Math.abs(x - closestSection.maxX)
    );
    return distance < closestDistance ? index : closestIndex;
  }, 0);
};

const getHighlightIntensity = (isHovered: boolean, isSelected: boolean) =>
  isSelected ? 0.7 : isHovered ? 0.3 : 0;

const createStandardMaterial = (
  color: string,
  highlightIntensity: number,
  options?: {
    roughness?: number;
    metalness?: number;
    clearcoat?: number;
    clearcoatRoughness?: number;
  }
) =>
  new THREE.MeshPhysicalMaterial({
    color,
    roughness: options?.roughness ?? 0.5,
    metalness: options?.metalness ?? 0.1,
    clearcoat: options?.clearcoat ?? 0,
    clearcoatRoughness: options?.clearcoatRoughness ?? 0.6,
    emissive: highlightIntensity > 0 ? HOVER_EMISSIVE : "#000000",
    emissiveIntensity: highlightIntensity,
  });

// Basic wardrobe frame
const WardrobeFrame: React.FC<{
  explodedOffset: number;
  isHovered: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
}> = ({ explodedOffset, isHovered, onHoverStart, onHoverEnd }) => {
  const { configuration, availableMaterials } = useWardrobeStore();
  const { dimensions, materials } = configuration;

  // Find the material objects
  const bodyMaterial = availableMaterials.find((m) => m.id === materials.body);

  // Create a Three.js material
  const baseColor = bodyMaterial?.color || "#ffffff";
  const material = createStandardMaterial(baseColor, isHovered ? 0.25 : 0, {
    roughness: 0.55,
    metalness: 0.05,
    clearcoat: 0.08,
    clearcoatRoughness: 0.8,
  });
  const shadowMaterial = new THREE.MeshBasicMaterial({
    color: "#000000",
    transparent: true,
    opacity: 0.08,
  });
  const ignoreRaycast = useCallback(() => null, []);

  return (
    <group>
      {/* Back panel */}
      <mesh
        position={[
          0,
          dimensions.height / 2,
          -dimensions.depth / 2 - explodedOffset,
        ]}
        material={material}
        onPointerOver={onHoverStart}
        onPointerOut={onHoverEnd}
      >
        <boxGeometry args={[dimensions.width, dimensions.height, 2]} />
      </mesh>
      <mesh
        position={[
          0,
          dimensions.height / 2,
          -dimensions.depth / 2 - explodedOffset + 1,
        ]}
        material={
          new THREE.MeshBasicMaterial({
            color: adjustColor(baseColor, -0.07),
            transparent: true,
            opacity: 0.9,
          })
        }
        raycast={ignoreRaycast}
      >
        <boxGeometry args={[dimensions.width - 2, dimensions.height - 2, 1]} />
      </mesh>

      {/* Left side panel */}
      <mesh
        position={[
          -dimensions.width / 2 - explodedOffset,
          dimensions.height / 2,
          0,
        ]}
        material={material}
        onPointerOver={onHoverStart}
        onPointerOut={onHoverEnd}
      >
        <boxGeometry args={[2, dimensions.height, dimensions.depth]} />
      </mesh>

      {/* Right side panel */}
      <mesh
        position={[
          dimensions.width / 2 + explodedOffset,
          dimensions.height / 2,
          0,
        ]}
        material={material}
        onPointerOver={onHoverStart}
        onPointerOut={onHoverEnd}
      >
        <boxGeometry args={[2, dimensions.height, dimensions.depth]} />
      </mesh>

      {/* Top panel */}
      <mesh
        position={[0, dimensions.height + explodedOffset, 0]}
        material={material}
        onPointerOver={onHoverStart}
        onPointerOut={onHoverEnd}
      >
        <boxGeometry args={[dimensions.width, 2, dimensions.depth]} />
      </mesh>

      {/* Bottom panel */}
      <mesh
        position={[0, 0 - explodedOffset, 0]}
        material={material}
        onPointerOver={onHoverStart}
        onPointerOut={onHoverEnd}
      >
        <boxGeometry args={[dimensions.width, 2, dimensions.depth]} />
      </mesh>

      {/* Inner shadow planes for depth */}
      <mesh
        position={[-dimensions.width / 2 + 1, dimensions.height / 2, 0]}
        material={shadowMaterial}
        raycast={ignoreRaycast}
      >
        <planeGeometry args={[dimensions.depth - 4, dimensions.height - 4]} />
      </mesh>
      <mesh
        position={[dimensions.width / 2 - 1, dimensions.height / 2, 0]}
        rotation={[0, Math.PI, 0]}
        material={shadowMaterial}
        raycast={ignoreRaycast}
      >
        <planeGeometry args={[dimensions.depth - 4, dimensions.height - 4]} />
      </mesh>
      <mesh
        position={[0, dimensions.height - 1, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        material={shadowMaterial}
        raycast={ignoreRaycast}
      >
        <planeGeometry args={[dimensions.width - 4, dimensions.depth - 4]} />
      </mesh>
      <mesh
        position={[0, 1, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={shadowMaterial}
        raycast={ignoreRaycast}
      >
        <planeGeometry args={[dimensions.width - 4, dimensions.depth - 4]} />
      </mesh>
    </group>
  );
};

// Component for rendering a shelf
const Shelf: React.FC<{
  component: WardrobeComponent;
  explodedOffset: number;
  isHovered: boolean;
  isSelected: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  onPointerDown: (event: ThreeEvent<PointerEvent>) => void;
}> = ({
  component,
  explodedOffset,
  isHovered,
  isSelected,
  onHoverStart,
  onHoverEnd,
  onPointerDown,
}) => {
  const { availableMaterials, configuration } = useWardrobeStore();
  const { position, dimensions, material: materialId, rotation } = component;

  const materialColor = resolveMaterialColor(
    materialId,
    configuration.materials.body,
    availableMaterials
  );
  const highlightIntensity = getHighlightIntensity(isHovered, isSelected);
  const material = createStandardMaterial(materialColor, highlightIntensity, {
    roughness: 0.48,
    clearcoat: 0.06,
    clearcoatRoughness: 0.7,
  });
  const edgeMaterial = new THREE.MeshStandardMaterial({
    color: adjustColor(materialColor, 0.06),
    roughness: 0.3,
    metalness: 0.05,
  });

  const shelfPosition = getExplodedPosition(position, explodedOffset);

  return (
    <group>
      <mesh
        position={shelfPosition}
        rotation={
          rotation
            ? [degToRad(rotation.x), degToRad(rotation.y), degToRad(rotation.z)]
            : [0, 0, 0]
        }
        material={material}
        onPointerOver={onHoverStart}
        onPointerOut={onHoverEnd}
        onPointerDown={onPointerDown}
        scale={isSelected ? [1.02, 1.02, 1.02] : [1, 1, 1]}
      >
        <boxGeometry
          args={[dimensions.width, dimensions.height, dimensions.depth]}
        />
      </mesh>
      <mesh
        position={[
          shelfPosition[0],
          shelfPosition[1] + dimensions.height / 2 - 0.2,
          shelfPosition[2] + dimensions.depth / 2 + 0.8,
        ]}
        rotation={
          rotation
            ? [degToRad(rotation.x), degToRad(rotation.y), degToRad(rotation.z)]
            : [0, 0, 0]
        }
        material={edgeMaterial}
      >
        <boxGeometry args={[dimensions.width - 1, 0.6, 1.2]} />
      </mesh>
    </group>
  );
};

// Component for rendering a drawer
const Drawer: React.FC<{
  component: WardrobeComponent;
  explodedOffset: number;
  isHovered: boolean;
  isSelected: boolean;
  isOpen: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  onPointerDown: (event: ThreeEvent<PointerEvent>) => void;
}> = ({
  component,
  explodedOffset,
  isHovered,
  isSelected,
  isOpen,
  onHoverStart,
  onHoverEnd,
  onPointerDown,
}) => {
  const { availableMaterials, configuration } = useWardrobeStore();
  const { position, dimensions, material: materialId, rotation } = component;
  const drawerVariant = component.drawerVariant ?? "standard";
  const drawerSoftClose = component.drawerSoftClose ?? false;
  const drawerPushToOpen = component.drawerPushToOpen ?? false;
  const openProgress = useRef(0);

  const bodyColor = resolveMaterialColor(
    materialId,
    configuration.materials.body,
    availableMaterials
  );
  const handleColor = resolveMaterialColor(
    configuration.materials.handles,
    configuration.materials.handles,
    availableMaterials
  );
  const highlightIntensity = getHighlightIntensity(isHovered, isSelected);
  const material = createStandardMaterial(bodyColor, highlightIntensity, {
    roughness: 0.4,
    clearcoat: 0.12,
    clearcoatRoughness: 0.6,
  });
  const handleMaterial = createStandardMaterial(
    handleColor,
    highlightIntensity,
    { metalness: 0.85, roughness: 0.35 }
  );

  useFrame((_, delta) => {
    const target = isOpen ? 1 : 0;
    const speed = isOpen ? 8 : drawerSoftClose ? 3.5 : 7;
    openProgress.current = THREE.MathUtils.damp(
      openProgress.current,
      target,
      speed,
      delta
    );
  });

  const openMultiplier =
    drawerVariant === "full-extension"
      ? 1
      : drawerVariant === "inner"
      ? 0.6
      : 0.8;
  const openOffset = openProgress.current * dimensions.depth * openMultiplier;

  return (
    <group
      position={[
        position.x,
        position.y,
        position.z + openOffset + explodedOffset,
      ]}
      rotation={
        rotation
          ? [degToRad(rotation.x), degToRad(rotation.y), degToRad(rotation.z)]
          : [0, 0, 0]
      }
      onPointerOver={onHoverStart}
      onPointerOut={onHoverEnd}
      onPointerDown={onPointerDown}
      scale={isSelected ? [1.015, 1.015, 1.015] : [1, 1, 1]}
    >
      {/* Drawer front */}
      <mesh position={[0, 0, dimensions.depth / 2]} material={material}>
        <boxGeometry args={[dimensions.width, dimensions.height, 2]} />
      </mesh>

      {/* Drawer body */}
      <mesh position={[0, -dimensions.height / 4, 0]} material={material}>
        <boxGeometry
          args={[
            dimensions.width - 4,
            dimensions.height / 2,
            dimensions.depth - 4,
          ]}
        />
      </mesh>

      {/* Drawer handle */}
      {!drawerPushToOpen && (
        <mesh
          position={[0, 0, dimensions.depth / 2 + 2]}
          material={handleMaterial}
        >
          <boxGeometry args={[dimensions.width / 4, 2, 1]} />
        </mesh>
      )}
    </group>
  );
};

// Component for rendering a rail
const Rail: React.FC<{
  component: WardrobeComponent;
  explodedOffset: number;
  isHovered: boolean;
  isSelected: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  onPointerDown: (event: ThreeEvent<PointerEvent>) => void;
}> = ({
  component,
  explodedOffset,
  isHovered,
  isSelected,
  onHoverStart,
  onHoverEnd,
  onPointerDown,
}) => {
  const { position, dimensions, rotation } = component;
  const highlightIntensity = getHighlightIntensity(isHovered, isSelected);
  const material = createStandardMaterial("#c0c0c0", highlightIntensity, {
    metalness: 0.85,
    roughness: 0.25,
  });

  return (
    <mesh
      position={getExplodedPosition(position, explodedOffset)}
      rotation={
        rotation
          ? [degToRad(rotation.x), degToRad(rotation.y), degToRad(rotation.z)]
          : [0, 0, 0]
      }
      material={material}
      onPointerOver={onHoverStart}
      onPointerOut={onHoverEnd}
      onPointerDown={onPointerDown}
      scale={isSelected ? [1.02, 1.02, 1.02] : [1, 1, 1]}
    >
      <cylinderGeometry args={[1, 1, dimensions.width, 16]} />
    </mesh>
  );
};

// Component for rendering a door
const Door: React.FC<{
  component: WardrobeComponent;
  explodedOffset: number;
  isHovered: boolean;
  isSelected: boolean;
  isOpen: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  onPointerDown: (event: ThreeEvent<PointerEvent>) => void;
}> = ({
  component,
  explodedOffset,
  isHovered,
  isSelected,
  isOpen,
  onHoverStart,
  onHoverEnd,
  onPointerDown,
}) => {
  const { availableMaterials, configuration } = useWardrobeStore();
  const { position, dimensions, rotation } = component;
  const { materials } = configuration;
  const doorVariant = component.doorVariant ?? "hinged-right";
  const doorSoftClose = component.doorSoftClose ?? false;
  const doorPushToOpen = component.doorPushToOpen ?? false;
  const doorMirror = component.doorMirror ?? false;
  const openProgress = useRef(0);

  // Find the material objects
  const doorMaterial = availableMaterials.find((m) => m.id === materials.doors);
  const handleMaterial = availableMaterials.find(
    (m) => m.id === materials.handles
  );
  const highlightIntensity = getHighlightIntensity(isHovered, isSelected);
  const hingeAngle = degToRad(doorSoftClose ? 120 : 90);

  useFrame((_, delta) => {
    const target = isOpen ? 1 : 0;
    const speed = isOpen ? 8.5 : doorSoftClose ? 4 : 7;
    openProgress.current = THREE.MathUtils.damp(
      openProgress.current,
      target,
      speed,
      delta
    );
  });

  const baseDoorColor = doorMirror
    ? "#e2e8f0"
    : doorMaterial?.color || "#d2b48c";
  const panelMaterial = createStandardMaterial(
    !isOpen ? adjustColor(baseDoorColor, -0.05) : baseDoorColor,
    highlightIntensity,
    doorMirror
      ? {
          metalness: 0.9,
          roughness: 0.12,
          clearcoat: 0.2,
          clearcoatRoughness: 0.25,
        }
      : {
          roughness: 0.38,
          clearcoat: 0.16,
          clearcoatRoughness: 0.5,
        }
  );
  const hingeMaterial = createStandardMaterial(
    adjustColor(baseDoorColor, -0.2),
    isHovered ? 0.35 : 0,
    { metalness: 0.4, roughness: 0.6 }
  );
  const edgeMaterial = createStandardMaterial(
    adjustColor(baseDoorColor, -0.1),
    isHovered ? 0.2 : 0,
    { roughness: 0.45, clearcoat: 0.12 }
  );
  const handleMat = createStandardMaterial(
    handleMaterial?.color || "#c0c0c0",
    highlightIntensity,
    { metalness: 0.9, roughness: 0.3 }
  );
  const basePosition = getExplodedPosition(position, explodedOffset);
  const doorThickness = 2;
  const handleOffset = Math.min(10, dimensions.width / 2 - 4);

  if (doorVariant === "sliding") {
    const slideDistance = dimensions.width * 0.6;
    const direction = position.x >= 0 ? 1 : -1;
    const slideOffset = openProgress.current * slideDistance * direction;
    return (
      <group
        position={[
          basePosition[0] + slideOffset,
          basePosition[1],
          basePosition[2],
        ]}
        rotation={
          rotation
            ? [degToRad(rotation.x), degToRad(rotation.y), degToRad(rotation.z)]
            : [0, 0, 0]
        }
        onPointerOver={onHoverStart}
        onPointerOut={onHoverEnd}
        onPointerDown={onPointerDown}
        scale={isSelected ? [1.02, 1.02, 1.02] : [1, 1, 1]}
      >
        <mesh position={[0, 0, 0]} material={panelMaterial}>
          <boxGeometry
            args={[dimensions.width, dimensions.height, doorThickness]}
          />
        </mesh>
        <mesh position={[0, 0, -doorThickness / 2]} material={edgeMaterial}>
          <boxGeometry args={[dimensions.width, dimensions.height, 0.6]} />
        </mesh>
        {!doorPushToOpen && (
          <mesh
            position={[dimensions.width / 2 - handleOffset, 0, doorThickness]}
            material={handleMat}
          >
            <cylinderGeometry args={[1, 1, 10, 16]} />
          </mesh>
        )}
      </group>
    );
  }

  if (doorVariant === "hinged-double") {
    const halfWidth = dimensions.width / 2;
    const leftHingeX = -halfWidth;
    const rightHingeX = halfWidth;
    return (
      <group
        position={basePosition}
        rotation={
          rotation
            ? [degToRad(rotation.x), degToRad(rotation.y), degToRad(rotation.z)]
            : [0, 0, 0]
        }
        onPointerOver={onHoverStart}
        onPointerOut={onHoverEnd}
        onPointerDown={onPointerDown}
        scale={isSelected ? [1.02, 1.02, 1.02] : [1, 1, 1]}
      >
        <group
          position={[
            basePosition[0] + leftHingeX,
            basePosition[1],
            basePosition[2] + doorThickness / 2,
          ]}
          rotation={[0, -openProgress.current * hingeAngle, 0]}
        >
          <mesh
            position={[halfWidth / 2, 0, -doorThickness / 2]}
            material={panelMaterial}
          >
            <boxGeometry args={[halfWidth, dimensions.height, doorThickness]} />
          </mesh>
          <mesh position={[0, 0, -doorThickness / 2]} material={edgeMaterial}>
            <boxGeometry args={[0.6, dimensions.height, 0.6]} />
          </mesh>
          <mesh position={[0, 0, -doorThickness / 2]} material={hingeMaterial}>
            <cylinderGeometry args={[0.8, 0.8, dimensions.height, 10]} />
          </mesh>
          {!doorPushToOpen && (
            <mesh
              position={[halfWidth / 2 - handleOffset / 2, 0, doorThickness]}
              material={handleMat}
            >
              <cylinderGeometry args={[1, 1, 8, 16]} />
            </mesh>
          )}
        </group>
        <group
          position={[
            basePosition[0] + rightHingeX,
            basePosition[1],
            basePosition[2] + doorThickness / 2,
          ]}
          rotation={[0, openProgress.current * hingeAngle, 0]}
        >
          <mesh
            position={[-halfWidth / 2, 0, -doorThickness / 2]}
            material={panelMaterial}
          >
            <boxGeometry args={[halfWidth, dimensions.height, doorThickness]} />
          </mesh>
          <mesh position={[0, 0, -doorThickness / 2]} material={edgeMaterial}>
            <boxGeometry args={[0.6, dimensions.height, 0.6]} />
          </mesh>
          <mesh position={[0, 0, -doorThickness / 2]} material={hingeMaterial}>
            <cylinderGeometry args={[0.8, 0.8, dimensions.height, 10]} />
          </mesh>
          {!doorPushToOpen && (
            <mesh
              position={[-halfWidth / 2 + handleOffset / 2, 0, doorThickness]}
              material={handleMat}
            >
              <cylinderGeometry args={[1, 1, 8, 16]} />
            </mesh>
          )}
        </group>
      </group>
    );
  }

  const hingeDirection = doorVariant === "hinged-left" ? -1 : 1;
  const hingeX =
    doorVariant === "hinged-left"
      ? -dimensions.width / 2
      : dimensions.width / 2;

  return (
    <group
      position={[
        basePosition[0] + hingeX,
        basePosition[1],
        basePosition[2] + doorThickness / 2,
      ]}
      rotation={
        rotation
          ? [degToRad(rotation.x), degToRad(rotation.y), degToRad(rotation.z)]
          : [0, 0, 0]
      }
      onPointerOver={onHoverStart}
      onPointerOut={onHoverEnd}
      onPointerDown={onPointerDown}
      scale={isSelected ? [1.02, 1.02, 1.02] : [1, 1, 1]}
    >
      <group
        rotation={[0, hingeDirection * openProgress.current * hingeAngle, 0]}
      >
        <mesh
          position={[-hingeX, 0, -doorThickness / 2]}
          material={panelMaterial}
        >
          <boxGeometry
            args={[dimensions.width, dimensions.height, doorThickness]}
          />
        </mesh>
        <mesh
          position={[
            -hingeX - hingeDirection * (dimensions.width / 2 - 0.3),
            0,
            -doorThickness / 2,
          ]}
          material={edgeMaterial}
        >
          <boxGeometry args={[0.6, dimensions.height, 0.6]} />
        </mesh>
        <mesh
          position={[
            -hingeX - hingeDirection * (dimensions.width / 2 - 0.3),
            0,
            -doorThickness / 2,
          ]}
          material={hingeMaterial}
        >
          <cylinderGeometry args={[0.8, 0.8, dimensions.height, 10]} />
        </mesh>
        {!doorPushToOpen && (
          <mesh
            position={[
              -hingeDirection * (dimensions.width / 2 - handleOffset),
              0,
              doorThickness,
            ]}
            material={handleMat}
          >
            <cylinderGeometry args={[1, 1, 10, 16]} />
          </mesh>
        )}
      </group>
    </group>
  );
};

// Component for rendering a vertical divider
const Divider: React.FC<{
  component: WardrobeComponent;
  explodedOffset: number;
  isHovered: boolean;
  isSelected: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  onPointerDown: (event: ThreeEvent<PointerEvent>) => void;
}> = ({
  component,
  explodedOffset,
  isHovered,
  isSelected,
  onHoverStart,
  onHoverEnd,
  onPointerDown,
}) => {
  const { availableMaterials, configuration } = useWardrobeStore();
  const { position, dimensions, material: materialId, rotation } = component;

  const materialColor = resolveMaterialColor(
    materialId,
    configuration.materials.body,
    availableMaterials
  );
  const highlightIntensity = getHighlightIntensity(isHovered, isSelected);
  const material = createStandardMaterial(materialColor, highlightIntensity, {
    roughness: 0.5,
    clearcoat: 0.05,
    clearcoatRoughness: 0.75,
  });

  return (
    <mesh
      position={getExplodedPosition(position, explodedOffset)}
      rotation={
        rotation
          ? [degToRad(rotation.x), degToRad(rotation.y), degToRad(rotation.z)]
          : [0, 0, 0]
      }
      material={material}
      onPointerOver={onHoverStart}
      onPointerOut={onHoverEnd}
      onPointerDown={onPointerDown}
      scale={isSelected ? [1.02, 1.02, 1.02] : [1, 1, 1]}
    >
      <boxGeometry
        args={[dimensions.width, dimensions.height, dimensions.depth]}
      />
    </mesh>
  );
};

// Component for rendering a shoe rack
const ShoeRack: React.FC<{
  component: WardrobeComponent;
  explodedOffset: number;
  isHovered: boolean;
  isSelected: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  onPointerDown: (event: ThreeEvent<PointerEvent>) => void;
}> = ({
  component,
  explodedOffset,
  isHovered,
  isSelected,
  onHoverStart,
  onHoverEnd,
  onPointerDown,
}) => {
  const { availableMaterials, configuration } = useWardrobeStore();
  const { position, dimensions, material: materialId, rotation } = component;

  const materialColor = resolveMaterialColor(
    materialId,
    configuration.materials.body,
    availableMaterials
  );
  const highlightIntensity = getHighlightIntensity(isHovered, isSelected);
  const material = createStandardMaterial(materialColor, highlightIntensity, {
    roughness: 0.5,
    clearcoat: 0.08,
    clearcoatRoughness: 0.7,
  });

  return (
    <group
      position={getExplodedPosition(position, explodedOffset)}
      rotation={
        rotation
          ? [degToRad(rotation.x), degToRad(rotation.y), degToRad(rotation.z)]
          : [0, 0, 0]
      }
      onPointerOver={onHoverStart}
      onPointerOut={onHoverEnd}
      onPointerDown={onPointerDown}
      scale={isSelected ? [1.02, 1.02, 1.02] : [1, 1, 1]}
    >
      {/* Main shelf */}
      <mesh position={[0, 0, 0]} material={material}>
        <boxGeometry
          args={[dimensions.width, dimensions.height, dimensions.depth]}
        />
      </mesh>

      {/* Dividers for shoes (3 sections) */}
      {[-dimensions.width / 3, 0, dimensions.width / 3].map((x, index) => (
        <mesh
          key={index}
          position={[x, dimensions.height / 2, 0]}
          material={material}
        >
          <boxGeometry args={[1, dimensions.height, dimensions.depth]} />
        </mesh>
      ))}
    </group>
  );
};

// Component for rendering a trouser rack
const TrouserRack: React.FC<{
  component: WardrobeComponent;
  explodedOffset: number;
  isHovered: boolean;
  isSelected: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  onPointerDown: (event: ThreeEvent<PointerEvent>) => void;
}> = ({
  component,
  explodedOffset,
  isHovered,
  isSelected,
  onHoverStart,
  onHoverEnd,
  onPointerDown,
}) => {
  const { availableMaterials, configuration } = useWardrobeStore();
  const { position, dimensions, material: materialId, rotation } = component;

  const materialColor = resolveMaterialColor(
    materialId,
    configuration.materials.handles,
    availableMaterials
  );
  const highlightIntensity = getHighlightIntensity(isHovered, isSelected);
  const material = createStandardMaterial(materialColor, highlightIntensity, {
    metalness: 0.85,
    roughness: 0.3,
  });

  return (
    <group
      position={getExplodedPosition(position, explodedOffset)}
      rotation={
        rotation
          ? [degToRad(rotation.x), degToRad(rotation.y), degToRad(rotation.z)]
          : [0, 0, 0]
      }
      onPointerOver={onHoverStart}
      onPointerOut={onHoverEnd}
      onPointerDown={onPointerDown}
      scale={isSelected ? [1.02, 1.02, 1.02] : [1, 1, 1]}
    >
      {/* Main rail */}
      <mesh position={[0, 0, 0]} material={material}>
        <boxGeometry
          args={[dimensions.width, dimensions.height, dimensions.depth / 4]}
        />
      </mesh>

      {/* Individual trouser hangers */}
      {Array.from({ length: 5 }).map((_, index) => {
        const x =
          -dimensions.width / 2 + (dimensions.width / 5) * (index + 0.5);
        return (
          <mesh
            key={index}
            position={[x, -dimensions.height * 2, dimensions.depth / 3]}
            material={material}
          >
            <boxGeometry
              args={[
                dimensions.width / 10,
                dimensions.height * 4,
                dimensions.depth / 10,
              ]}
            />
          </mesh>
        );
      })}
    </group>
  );
};

// Component for rendering a tie/belt rack
const TieRack: React.FC<{
  component: WardrobeComponent;
  explodedOffset: number;
  isHovered: boolean;
  isSelected: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  onPointerDown: (event: ThreeEvent<PointerEvent>) => void;
}> = ({
  component,
  explodedOffset,
  isHovered,
  isSelected,
  onHoverStart,
  onHoverEnd,
  onPointerDown,
}) => {
  const { availableMaterials, configuration } = useWardrobeStore();
  const { position, dimensions, material: materialId, rotation } = component;

  const materialColor = resolveMaterialColor(
    materialId,
    configuration.materials.handles,
    availableMaterials
  );
  const highlightIntensity = getHighlightIntensity(isHovered, isSelected);
  const material = createStandardMaterial(materialColor, highlightIntensity, {
    metalness: 0.85,
    roughness: 0.35,
  });

  return (
    <group
      position={getExplodedPosition(position, explodedOffset)}
      rotation={
        rotation
          ? [degToRad(rotation.x), degToRad(rotation.y), degToRad(rotation.z)]
          : [0, 0, 0]
      }
      onPointerOver={onHoverStart}
      onPointerOut={onHoverEnd}
      onPointerDown={onPointerDown}
      scale={isSelected ? [1.02, 1.02, 1.02] : [1, 1, 1]}
    >
      {/* Main bar */}
      <mesh position={[0, 0, 0]} material={material}>
        <boxGeometry
          args={[dimensions.width, dimensions.height, dimensions.depth]}
        />
      </mesh>

      {/* Hooks for ties/belts */}
      {Array.from({ length: 6 }).map((_, index) => {
        const x =
          -dimensions.width / 2 + (dimensions.width / 6) * (index + 0.5);
        return (
          <mesh
            key={index}
            position={[x, -dimensions.height * 1.5, 0]}
            material={material}
          >
            <cylinderGeometry args={[0.5, 0.5, dimensions.height * 2, 8]} />
          </mesh>
        );
      })}
    </group>
  );
};

// Component for rendering a mirror
const Mirror: React.FC<{
  component: WardrobeComponent;
  explodedOffset: number;
  isHovered: boolean;
  isSelected: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  onPointerDown: (event: ThreeEvent<PointerEvent>) => void;
}> = ({
  component,
  explodedOffset,
  isHovered,
  isSelected,
  onHoverStart,
  onHoverEnd,
  onPointerDown,
}) => {
  const { position, dimensions, rotation } = component;
  const highlightIntensity = getHighlightIntensity(isHovered, isSelected);

  // Create a Three.js material for mirror
  const mirrorMaterial = createStandardMaterial("#e0e0e0", highlightIntensity, {
    metalness: 0.9,
    roughness: 0.1,
    clearcoat: 0.2,
    clearcoatRoughness: 0.2,
  });

  // Create a Three.js material for frame
  const frameMaterial = createStandardMaterial("#a0a0a0", highlightIntensity, {
    metalness: 0.5,
    roughness: 0.45,
    clearcoat: 0.1,
    clearcoatRoughness: 0.5,
  });

  return (
    <group
      position={getExplodedPosition(position, explodedOffset)}
      rotation={
        rotation
          ? [degToRad(rotation.x), degToRad(rotation.y), degToRad(rotation.z)]
          : [0, 0, 0]
      }
      onPointerOver={onHoverStart}
      onPointerOut={onHoverEnd}
      onPointerDown={onPointerDown}
      scale={isSelected ? [1.02, 1.02, 1.02] : [1, 1, 1]}
    >
      {/* Mirror surface */}
      <mesh position={[0, 0, 0]} material={mirrorMaterial}>
        <boxGeometry
          args={[dimensions.width, dimensions.height, dimensions.depth / 2]}
        />
      </mesh>

      {/* Mirror frame */}
      <mesh position={[0, 0, -dimensions.depth / 4]} material={frameMaterial}>
        <boxGeometry
          args={[
            dimensions.width + 4,
            dimensions.height + 4,
            dimensions.depth / 2,
          ]}
        />
      </mesh>
    </group>
  );
};

// Component for rendering LED lighting
const Lighting: React.FC<{
  component: WardrobeComponent;
  explodedOffset: number;
  isHovered: boolean;
  isSelected: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  onPointerDown: (event: ThreeEvent<PointerEvent>) => void;
}> = ({
  component,
  explodedOffset,
  isHovered,
  isSelected,
  onHoverStart,
  onHoverEnd,
  onPointerDown,
}) => {
  const { position, dimensions, rotation } = component;
  const highlightIntensity = getHighlightIntensity(isHovered, isSelected);

  // Create a Three.js material for the light fixture
  const fixtureMaterial = createStandardMaterial(
    "#c0c0c0",
    highlightIntensity,
    { metalness: 0.85, roughness: 0.3 }
  );

  // Create a Three.js material for the light glow
  const lightMaterial = new THREE.MeshBasicMaterial({
    color: isHovered || isSelected ? "#bfdbfe" : "#ffffff",
  });

  return (
    <group
      position={getExplodedPosition(position, explodedOffset)}
      rotation={
        rotation
          ? [degToRad(rotation.x), degToRad(rotation.y), degToRad(rotation.z)]
          : [0, 0, 0]
      }
      onPointerOver={onHoverStart}
      onPointerOut={onHoverEnd}
      onPointerDown={onPointerDown}
      scale={isSelected ? [1.015, 1.015, 1.015] : [1, 1, 1]}
    >
      {/* Light fixture */}
      <mesh position={[0, 0, 0]} material={fixtureMaterial}>
        <boxGeometry
          args={[dimensions.width, dimensions.height, dimensions.depth]}
        />
      </mesh>

      {/* Light glow */}
      <mesh position={[0, -dimensions.height, 0]} material={lightMaterial}>
        <boxGeometry args={[dimensions.width, 0.5, dimensions.depth]} />
      </mesh>

      {/* Add a point light */}
      <pointLight position={[0, -5, 0]} intensity={0.5} color="#ffffff" />
    </group>
  );
};

// Component for rendering a jewelry tray
const JewelryTray: React.FC<{
  component: WardrobeComponent;
  explodedOffset: number;
  isHovered: boolean;
  isSelected: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  onPointerDown: (event: ThreeEvent<PointerEvent>) => void;
}> = ({
  component,
  explodedOffset,
  isHovered,
  isSelected,
  onHoverStart,
  onHoverEnd,
  onPointerDown,
}) => {
  const { availableMaterials, configuration } = useWardrobeStore();
  const { position, dimensions, material: materialId, rotation } = component;

  const materialColor = resolveMaterialColor(
    materialId,
    configuration.materials.body,
    availableMaterials
  );
  const highlightIntensity = getHighlightIntensity(isHovered, isSelected);
  const material = createStandardMaterial(materialColor, highlightIntensity, {
    roughness: 0.52,
    clearcoat: 0.05,
    clearcoatRoughness: 0.75,
  });

  return (
    <group
      position={getExplodedPosition(position, explodedOffset)}
      rotation={
        rotation
          ? [degToRad(rotation.x), degToRad(rotation.y), degToRad(rotation.z)]
          : [0, 0, 0]
      }
      onPointerOver={onHoverStart}
      onPointerOut={onHoverEnd}
      onPointerDown={onPointerDown}
      scale={isSelected ? [1.02, 1.02, 1.02] : [1, 1, 1]}
    >
      {/* Tray base */}
      <mesh position={[0, 0, 0]} material={material}>
        <boxGeometry
          args={[dimensions.width, dimensions.height / 2, dimensions.depth]}
        />
      </mesh>

      {/* Tray dividers */}
      <mesh position={[0, dimensions.height / 2, 0]} material={material}>
        <boxGeometry args={[dimensions.width, dimensions.height / 2, 1]} />
      </mesh>
      <mesh
        position={[0, dimensions.height / 2, -dimensions.depth / 3]}
        material={material}
      >
        <boxGeometry args={[dimensions.width, dimensions.height / 2, 1]} />
      </mesh>
      <mesh
        position={[0, dimensions.height / 2, dimensions.depth / 3]}
        material={material}
      >
        <boxGeometry args={[dimensions.width, dimensions.height / 2, 1]} />
      </mesh>
    </group>
  );
};

// Component for rendering a pull-out basket
const PullOut: React.FC<{
  component: WardrobeComponent;
  explodedOffset: number;
  isHovered: boolean;
  isSelected: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  onPointerDown: (event: ThreeEvent<PointerEvent>) => void;
}> = ({
  component,
  explodedOffset,
  isHovered,
  isSelected,
  onHoverStart,
  onHoverEnd,
  onPointerDown,
}) => {
  const { availableMaterials, configuration } = useWardrobeStore();
  const { position, dimensions, material: materialId, rotation } = component;

  const materialColor = resolveMaterialColor(
    materialId,
    configuration.materials.body,
    availableMaterials
  );
  const railColor = resolveMaterialColor(
    configuration.materials.handles,
    configuration.materials.handles,
    availableMaterials
  );
  const highlightIntensity = getHighlightIntensity(isHovered, isSelected);
  const material = createStandardMaterial(materialColor, highlightIntensity, {
    roughness: 0.5,
    clearcoat: 0.05,
    clearcoatRoughness: 0.7,
  });
  const railMaterial = createStandardMaterial(railColor, highlightIntensity, {
    metalness: 0.85,
    roughness: 0.3,
  });

  return (
    <group
      position={getExplodedPosition(position, explodedOffset)}
      rotation={
        rotation
          ? [degToRad(rotation.x), degToRad(rotation.y), degToRad(rotation.z)]
          : [0, 0, 0]
      }
      onPointerOver={onHoverStart}
      onPointerOut={onHoverEnd}
      onPointerDown={onPointerDown}
      scale={isSelected ? [1.02, 1.02, 1.02] : [1, 1, 1]}
    >
      {/* Basket base */}
      <mesh position={[0, 0, 0]} material={material}>
        <boxGeometry
          args={[dimensions.width, dimensions.height / 2, dimensions.depth]}
        />
      </mesh>

      {/* Basket sides */}
      <mesh
        position={[0, dimensions.height / 2, dimensions.depth / 2]}
        material={material}
      >
        <boxGeometry args={[dimensions.width, dimensions.height / 2, 1]} />
      </mesh>
      <mesh
        position={[0, dimensions.height / 2, -dimensions.depth / 2]}
        material={material}
      >
        <boxGeometry args={[dimensions.width, dimensions.height / 2, 1]} />
      </mesh>
      <mesh
        position={[dimensions.width / 2, dimensions.height / 2, 0]}
        material={material}
      >
        <boxGeometry args={[1, dimensions.height / 2, dimensions.depth]} />
      </mesh>
      <mesh
        position={[-dimensions.width / 2, dimensions.height / 2, 0]}
        material={material}
      >
        <boxGeometry args={[1, dimensions.height / 2, dimensions.depth]} />
      </mesh>

      {/* Rails */}
      <mesh
        position={[-dimensions.width / 2 - 1, 0, 0]}
        material={railMaterial}
      >
        <boxGeometry args={[1, 1, dimensions.depth]} />
      </mesh>
      <mesh position={[dimensions.width / 2 + 1, 0, 0]} material={railMaterial}>
        <boxGeometry args={[1, 1, dimensions.depth]} />
      </mesh>
    </group>
  );
};

const DimensionsLabels: React.FC<{
  width: number;
  height: number;
  depth: number;
}> = ({ width, height, depth }) => {
  const labelStyle: React.CSSProperties = {
    background: "rgba(15, 23, 42, 0.55)",
    color: "#f1f5f9",
    padding: "3px 6px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: 500,
    whiteSpace: "nowrap",
    pointerEvents: "none",
  };

  return (
    <group>
      <Html position={[0, height + 8, depth / 2 + 8]} center style={labelStyle}>
        W: {width} cm
      </Html>
      <Html
        position={[-width / 2 - 8, height / 2, depth / 2]}
        center
        style={labelStyle}
      >
        H: {height} cm
      </Html>
      <Html position={[width / 2 + 8, 6, 0]} center style={labelStyle}>
        D: {depth} cm
      </Html>
    </group>
  );
};

const DragGuides: React.FC<{
  position: { x: number; y: number; z: number };
  bounds: { width: number; height: number };
}> = ({ position, bounds }) => {
  const pointsX = [
    new THREE.Vector3(-bounds.width / 2, position.y, position.z),
    new THREE.Vector3(bounds.width / 2, position.y, position.z),
  ];
  const pointsY = [
    new THREE.Vector3(position.x, 0, position.z),
    new THREE.Vector3(position.x, bounds.height, position.z),
  ];
  const lineMaterial = new THREE.LineBasicMaterial({
    color: "#93c5fd",
    transparent: true,
    opacity: 0.6,
  });

  return (
    <>
      <line
        geometry={new THREE.BufferGeometry().setFromPoints(pointsX)}
        material={lineMaterial}
      />
      <line
        geometry={new THREE.BufferGeometry().setFromPoints(pointsY)}
        material={lineMaterial}
      />
    </>
  );
};

const SectionGuides: React.FC<{
  sections: { minX: number; maxX: number }[];
  height: number;
  depth: number;
}> = ({ sections, height, depth }) => {
  const ignoreRaycast = useCallback(() => null, []);
  const guideMaterial = new THREE.MeshBasicMaterial({
    color: "#93c5fd",
    transparent: true,
    opacity: 0.12,
  });

  return (
    <>
      {sections.map((section, index) => (
        <mesh
          key={`${section.minX}-${section.maxX}-${index}`}
          position={[
            (section.minX + section.maxX) / 2,
            height / 2,
            depth / 2 + 2,
          ]}
          material={guideMaterial}
          raycast={ignoreRaycast}
        >
          <planeGeometry args={[section.maxX - section.minX, height]} />
        </mesh>
      ))}
    </>
  );
};

const Floor: React.FC = () => {
  const gridRef = useRef<THREE.GridHelper>(null);

  useEffect(() => {
    if (!gridRef.current) return;
    const material = gridRef.current.material as
      | THREE.Material
      | THREE.Material[];
    const applyMaterial = (mat: THREE.Material) => {
      if ("opacity" in mat) {
        (
          mat as THREE.Material & { opacity: number; transparent: boolean }
        ).opacity = 0.12;
        (
          mat as THREE.Material & { opacity: number; transparent: boolean }
        ).transparent = true;
      }
    };
    if (Array.isArray(material)) {
      material.forEach(applyMaterial);
    } else {
      applyMaterial(material);
    }
  }, []);

  return (
    <group position={[0, -1, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[1200, 1200]} />
        <meshStandardMaterial color="#f4f1ea" roughness={0.9} />
      </mesh>
      <gridHelper ref={gridRef} args={[1000, 100]} />
    </group>
  );
};

// Main wardrobe model component
const WardrobeModel: React.FC<{
  exploded: boolean;
  showDimensions: boolean;
}> = ({ exploded, showDimensions }) => {
  const {
    configuration,
    selectedComponentId,
    setSelectedComponent,
    updateComponent,
    setDraggingComponent,
    isDraggingComponent,
    activeAddType,
    commitHistory,
    hoveredComponentId,
    reflowToken,
    componentOpenStates,
    setComponentOpen,
  } = useWardrobeStore();
  const { components, dimensions } = configuration;
  const { camera, gl } = useThree();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hoveredSectionIndex, setHoveredSectionIndex] = useState<number | null>(
    null
  );
  const explodedBase = exploded ? 12 : 0;
  const selectedComponent =
    components.find((component) => component.id === selectedComponentId) ||
    null;
  const hoveredComponent =
    components.find((component) => component.id === hoveredComponentId) || null;
  const sections = getDividerSectionsLocal(components, dimensions.width);
  const activeSectionIndex =
    (selectedComponent || hoveredComponent) && sections.length > 0
      ? getSectionIndexForX(
          (selectedComponent || hoveredComponent)!.position.x,
          sections
        )
      : null;
  const reflowFactor = useRef(0);

  useEffect(() => {
    if (activeAddType !== "drawer") {
      setHoveredSectionIndex(null);
    }
  }, [activeAddType]);

  useEffect(() => {
    if (reflowToken) {
      reflowFactor.current = 1;
    }
  }, [reflowToken]);

  useFrame((_, delta) => {
    if (reflowFactor.current > 0) {
      reflowFactor.current = Math.max(0, reflowFactor.current - delta * 4.5);
    }
  });

  const canOpenDrawer = useCallback(
    (drawer: WardrobeComponent) => {
      const sections = getDividerSectionsLocal(components, dimensions.width);
      const drawerSectionIndex = sections.length
        ? getSectionIndexForX(drawer.position.x, sections)
        : -1;
      const drawerRangeY = getVerticalRange(
        drawer.position.y,
        drawer.dimensions.height
      );
      const drawerRangeX = getHorizontalRange(
        drawer.position.x,
        drawer.dimensions.width
      );

      const hasBlockingDrawer = components.some((component) => {
        if (component.type !== "drawer" || component.id === drawer.id)
          return false;
        if (!componentOpenStates[component.id]) return false;
        if (sections.length > 0) {
          const sectionIndex = getSectionIndexForX(
            component.position.x,
            sections
          );
          if (sectionIndex !== drawerSectionIndex) return false;
        }
        const range = getVerticalRange(
          component.position.y,
          component.dimensions.height
        );
        return rangesOverlap(drawerRangeY, range);
      });

      if (hasBlockingDrawer) return false;

      const blockedByDoor = components.some((component) => {
        if (component.type !== "door") return false;
        if (componentOpenStates[component.id]) return false;
        const doorRangeX = getHorizontalRange(
          component.position.x,
          component.dimensions.width
        );
        const doorRangeY = getVerticalRange(
          component.position.y,
          component.dimensions.height
        );
        return (
          rangesOverlap(drawerRangeX, doorRangeX) &&
          rangesOverlap(drawerRangeY, doorRangeY)
        );
      });

      return !blockedByDoor;
    },
    [components, componentOpenStates, dimensions.width]
  );

  const canCloseDoor = useCallback(
    (door: WardrobeComponent) => {
      const doorRangeX = getHorizontalRange(
        door.position.x,
        door.dimensions.width
      );
      const doorRangeY = getVerticalRange(
        door.position.y,
        door.dimensions.height
      );

      const blockedByDrawer = components.some((component) => {
        if (component.type !== "drawer") return false;
        if (!componentOpenStates[component.id]) return false;
        const drawerRangeX = getHorizontalRange(
          component.position.x,
          component.dimensions.width
        );
        const drawerRangeY = getVerticalRange(
          component.position.y,
          component.dimensions.height
        );
        return (
          rangesOverlap(drawerRangeX, doorRangeX) &&
          rangesOverlap(drawerRangeY, doorRangeY)
        );
      });

      return !blockedByDrawer;
    },
    [components, componentOpenStates]
  );

  const handleToggleOpen = useCallback(
    (component: WardrobeComponent) => {
      const isOpen = !!componentOpenStates[component.id];
      if (component.type === "drawer") {
        if (isOpen) {
          setComponentOpen(component.id, false);
          return;
        }
        if (canOpenDrawer(component)) {
          setComponentOpen(component.id, true);
        }
      }
      if (component.type === "door") {
        if (isOpen) {
          if (canCloseDoor(component)) {
            setComponentOpen(component.id, false);
          }
          return;
        }
        setComponentOpen(component.id, true);
      }
    },
    [canCloseDoor, canOpenDrawer, componentOpenStates, setComponentOpen]
  );
  const dragRef = useRef<{
    id: string;
    type: WardrobeComponent["type"];
    offset: THREE.Vector3;
    planeZ: number;
    sectionIndex: number;
    startPointer: { x: number; y: number };
    isActive: boolean;
  } | null>(null);
  const configRef = useRef(configuration);

  useEffect(() => {
    configRef.current = configuration;
  }, [configuration]);

  const handleHoverStart = useCallback(
    (component: WardrobeComponent | "frame") => () => {
      const id = component === "frame" ? "frame" : component.id;
      setHoveredId(id);
      if (component !== "frame") {
        document.body.style.cursor =
          component.type === "door" ? "pointer" : "grab";
      }
    },
    []
  );

  const handleHoverEnd = useCallback(
    (component: WardrobeComponent | "frame") => () => {
      const id = component === "frame" ? "frame" : component.id;
      setHoveredId((prev) => (prev === id ? null : prev));
      if (component !== "frame" && !isDraggingComponent) {
        document.body.style.cursor = "default";
      }
    },
    [isDraggingComponent]
  );

  const handleStartDrag = useCallback(
    (component: WardrobeComponent) => (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation();
      setSelectedComponent(component.id);

      const dragPlane = new THREE.Plane(
        new THREE.Vector3(0, 0, 1),
        -component.position.z
      );
      const intersection = new THREE.Vector3();
      const hasIntersection = event.ray.intersectPlane(dragPlane, intersection);
      if (!hasIntersection) {
        dragRef.current = null;
        return;
      }

      const offset = new THREE.Vector3(
        component.position.x - intersection.x,
        component.position.y - intersection.y,
        0
      );

      const sections = getDividerSectionsLocal(
        configRef.current.components,
        configRef.current.dimensions.width
      );
      const initialIndex = sections.length
        ? getSectionIndexForX(component.position.x, sections)
        : -1;

      dragRef.current = {
        id: component.id,
        type: component.type,
        offset,
        planeZ: component.position.z,
        sectionIndex: initialIndex,
        startPointer: { x: event.clientX, y: event.clientY },
        isActive: false,
      };
    },
    [setSelectedComponent]
  );

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const dragData = dragRef.current;
      if (!dragData) return;

      const component = configRef.current.components.find(
        (item) => item.id === dragData.id
      );
      if (!component) return;

      if (!dragData.isActive) {
        const deltaX = event.clientX - dragData.startPointer.x;
        const deltaY = event.clientY - dragData.startPointer.y;
        const distance = Math.hypot(deltaX, deltaY);
        if (distance < 4) return;
        dragData.isActive = true;
        setDraggingComponent(true);
        setComponentOpen(dragData.id, false);
        document.body.style.cursor = "grabbing";
      }

      const rect = gl.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

      const dragPlane = new THREE.Plane(
        new THREE.Vector3(0, 0, 1),
        -dragData.planeZ
      );
      const intersection = new THREE.Vector3();
      if (!raycaster.ray.intersectPlane(dragPlane, intersection)) return;

      const grid = event.shiftKey ? 20 : 5;
      const targetX = snapValue(intersection.x + dragData.offset.x, grid);
      const targetY = snapValue(intersection.y + dragData.offset.y, grid);

      const sections = getDividerSectionsLocal(
        configRef.current.components,
        configRef.current.dimensions.width
      );

      let nextPosition = {
        x: targetX,
        y: targetY,
        z: component.position.z,
      };

      if (sections.length > 0) {
        let desiredIndex = getSectionIndexForX(targetX, sections);
        if (desiredIndex === -1) {
          desiredIndex = getNearestSectionIndex(targetX, sections);
        }
        const currentIndex =
          dragData.sectionIndex === -1 ? desiredIndex : dragData.sectionIndex;
        const desiredSection = sections[desiredIndex] ?? sections[currentIndex];
        const desiredWidth = desiredSection.maxX - desiredSection.minX;
        const canFitInDesired = component.dimensions.width <= desiredWidth;

        const activeIndex = canFitInDesired ? desiredIndex : currentIndex;
        dragData.sectionIndex = activeIndex;

        const activeSection = sections[activeIndex];
        nextPosition.x = clampValue(
          nextPosition.x,
          activeSection.minX + component.dimensions.width / 2,
          activeSection.maxX - component.dimensions.width / 2
        );
      }

      const clamped = clampPosition(
        nextPosition,
        component.dimensions,
        configRef.current.dimensions
      );
      const smoothPosition = {
        x: THREE.MathUtils.lerp(component.position.x, clamped.x, 0.35),
        y: THREE.MathUtils.lerp(component.position.y, clamped.y, 0.35),
        z: component.position.z,
      };

      updateComponent(dragData.id, { position: smoothPosition });
    };

    const handlePointerUp = () => {
      const dragData = dragRef.current;
      if (!dragData) return;

      if (!dragData.isActive) {
        const component = configRef.current.components.find(
          (item) => item.id === dragData.id
        );
        if (
          component &&
          (component.type === "drawer" || component.type === "door")
        ) {
          handleToggleOpen(component);
        }
        dragRef.current = null;
        return;
      }

      dragRef.current = null;
      setDraggingComponent(false);
      document.body.style.cursor = "default";
      commitHistory();
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [
    camera,
    gl,
    setComponentOpen,
    setDraggingComponent,
    updateComponent,
    commitHistory,
    handleToggleOpen,
  ]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!selectedComponentId) return;
      const component = configRef.current.components.find(
        (item) => item.id === selectedComponentId
      );
      if (!component) return;

      const step = event.shiftKey ? 10 : 2;
      const delta = { x: 0, y: 0 };
      if (event.key === "ArrowUp") delta.y = step;
      if (event.key === "ArrowDown") delta.y = -step;
      if (event.key === "ArrowLeft") delta.x = -step;
      if (event.key === "ArrowRight") delta.x = step;
      if (delta.x === 0 && delta.y === 0) return;

      event.preventDefault();
      const nextPosition = clampPosition(
        {
          x: component.position.x + delta.x,
          y: component.position.y + delta.y,
          z: component.position.z,
        },
        component.dimensions,
        configRef.current.dimensions
      );
      updateComponent(component.id, { position: nextPosition });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedComponentId, updateComponent]);

  const reflowScale = 1 + reflowFactor.current * 0.02;

  // Render the wardrobe components based on their type
  const renderComponent = (component: WardrobeComponent, index: number) => {
    const explodedOffset = exploded ? explodedBase + index * 4 : 0;
    const isHovered =
      hoveredId === component.id || hoveredComponentId === component.id;
    const isSelected = selectedComponentId === component.id;
    const isOpen = !!componentOpenStates[component.id];
    const onHoverStart = handleHoverStart(component);
    const onHoverEnd = handleHoverEnd(component);
    const onPointerDown = handleStartDrag(component);

    switch (component.type) {
      case "shelf":
        return (
          <Shelf
            key={component.id}
            component={component}
            explodedOffset={explodedOffset}
            isHovered={isHovered}
            isSelected={isSelected}
            onHoverStart={onHoverStart}
            onHoverEnd={onHoverEnd}
            onPointerDown={onPointerDown}
          />
        );
      case "drawer":
        return (
          <Drawer
            key={component.id}
            component={component}
            explodedOffset={explodedOffset}
            isHovered={isHovered}
            isSelected={isSelected}
            isOpen={isOpen}
            onHoverStart={onHoverStart}
            onHoverEnd={onHoverEnd}
            onPointerDown={onPointerDown}
          />
        );
      case "rail":
        return (
          <Rail
            key={component.id}
            component={component}
            explodedOffset={explodedOffset}
            isHovered={isHovered}
            isSelected={isSelected}
            onHoverStart={onHoverStart}
            onHoverEnd={onHoverEnd}
            onPointerDown={onPointerDown}
          />
        );
      case "door":
        return (
          <Door
            key={component.id}
            component={component}
            explodedOffset={explodedOffset}
            isHovered={isHovered}
            isSelected={isSelected}
            isOpen={isOpen}
            onHoverStart={onHoverStart}
            onHoverEnd={onHoverEnd}
            onPointerDown={onPointerDown}
          />
        );
      case "divider":
        return (
          <Divider
            key={component.id}
            component={component}
            explodedOffset={explodedOffset}
            isHovered={isHovered}
            isSelected={isSelected}
            onHoverStart={onHoverStart}
            onHoverEnd={onHoverEnd}
            onPointerDown={onPointerDown}
          />
        );
      case "shoe_rack":
        return (
          <ShoeRack
            key={component.id}
            component={component}
            explodedOffset={explodedOffset}
            isHovered={isHovered}
            isSelected={isSelected}
            onHoverStart={onHoverStart}
            onHoverEnd={onHoverEnd}
            onPointerDown={onPointerDown}
          />
        );
      case "trouser_rack":
        return (
          <TrouserRack
            key={component.id}
            component={component}
            explodedOffset={explodedOffset}
            isHovered={isHovered}
            isSelected={isSelected}
            onHoverStart={onHoverStart}
            onHoverEnd={onHoverEnd}
            onPointerDown={onPointerDown}
          />
        );
      case "tie_rack":
        return (
          <TieRack
            key={component.id}
            component={component}
            explodedOffset={explodedOffset}
            isHovered={isHovered}
            isSelected={isSelected}
            onHoverStart={onHoverStart}
            onHoverEnd={onHoverEnd}
            onPointerDown={onPointerDown}
          />
        );
      case "mirror":
        return (
          <Mirror
            key={component.id}
            component={component}
            explodedOffset={explodedOffset}
            isHovered={isHovered}
            isSelected={isSelected}
            onHoverStart={onHoverStart}
            onHoverEnd={onHoverEnd}
            onPointerDown={onPointerDown}
          />
        );
      case "lighting":
        return (
          <Lighting
            key={component.id}
            component={component}
            explodedOffset={explodedOffset}
            isHovered={isHovered}
            isSelected={isSelected}
            onHoverStart={onHoverStart}
            onHoverEnd={onHoverEnd}
            onPointerDown={onPointerDown}
          />
        );
      case "jewelry_tray":
        return (
          <JewelryTray
            key={component.id}
            component={component}
            explodedOffset={explodedOffset}
            isHovered={isHovered}
            isSelected={isSelected}
            onHoverStart={onHoverStart}
            onHoverEnd={onHoverEnd}
            onPointerDown={onPointerDown}
          />
        );
      case "pull_out":
        return (
          <PullOut
            key={component.id}
            component={component}
            explodedOffset={explodedOffset}
            isHovered={isHovered}
            isSelected={isSelected}
            onHoverStart={onHoverStart}
            onHoverEnd={onHoverEnd}
            onPointerDown={onPointerDown}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <group scale={[reflowScale, reflowScale, reflowScale]}>
        {/* Wardrobe frame */}
        <WardrobeFrame
          explodedOffset={exploded ? 10 : 0}
          isHovered={hoveredId === "frame"}
          onHoverStart={handleHoverStart("frame")}
          onHoverEnd={handleHoverEnd("frame")}
        />

        {/* Render all components */}
        {components.map(renderComponent)}
      </group>

      {showDimensions && (
        <DimensionsLabels
          width={dimensions.width}
          height={dimensions.height}
          depth={dimensions.depth}
        />
      )}

      {isDraggingComponent && (
        <mesh position={[0, dimensions.height / 2, 0]}>
          <boxGeometry
            args={[dimensions.width, dimensions.height, dimensions.depth]}
          />
          <meshBasicMaterial
            color="#93c5fd"
            wireframe
            opacity={0.35}
            transparent
          />
        </mesh>
      )}

      {isDraggingComponent && selectedComponent && (
        <>
          <mesh
            position={[
              selectedComponent.position.x,
              selectedComponent.position.y,
              selectedComponent.position.z,
            ]}
          >
            <boxGeometry
              args={[
                selectedComponent.dimensions.width + 2,
                selectedComponent.dimensions.height + 2,
                selectedComponent.dimensions.depth + 2,
              ]}
            />
            <meshBasicMaterial color="#bfdbfe" opacity={0.2} transparent />
          </mesh>
          <DragGuides
            position={selectedComponent.position}
            bounds={{ width: dimensions.width, height: dimensions.height }}
          />
          {sections.length > 0 && (
            <SectionGuides
              sections={sections}
              height={dimensions.height}
              depth={dimensions.depth}
            />
          )}
        </>
      )}

      {activeSectionIndex !== null &&
        activeSectionIndex >= 0 &&
        activeSectionIndex < sections.length &&
        activeAddType !== "drawer" &&
        sections.length > 0 && (
          <SectionGuides
            sections={[sections[activeSectionIndex]]}
            height={dimensions.height}
            depth={dimensions.depth}
          />
        )}

      {activeAddType === "drawer" && sections.length > 0 && (
        <>
          {components
            .filter((component) => component.type === "drawer")
            .map((drawer) => (
              <mesh
                key={`drawer-occupied-${drawer.id}`}
                position={[
                  drawer.position.x,
                  drawer.position.y,
                  drawer.position.z,
                ]}
              >
                <boxGeometry
                  args={[
                    drawer.dimensions.width,
                    drawer.dimensions.height,
                    drawer.dimensions.depth,
                  ]}
                />
                <meshBasicMaterial color="#1d4ed8" opacity={0.12} transparent />
              </mesh>
            ))}
          {components
            .filter((component) => component.type === "shelf")
            .map((shelf) => (
              <mesh
                key={`shelf-occupied-${shelf.id}`}
                position={[
                  shelf.position.x,
                  shelf.position.y,
                  shelf.position.z + shelf.dimensions.depth / 2 + 2,
                ]}
              >
                <planeGeometry args={[shelf.dimensions.width, 2]} />
                <meshBasicMaterial color="#94a3b8" opacity={0.2} transparent />
              </mesh>
            ))}
          {sections.map((section, index) => {
            const sectionWidth = section.maxX - section.minX;
            const sectionCenterX = (section.minX + section.maxX) / 2;
            const drawerWidth = Math.min(sectionWidth, dimensions.width - 10);
            const drawerDepth = dimensions.depth - 10;
            const drawerHeight = DEFAULT_DRAWER_HEIGHT;
            const otherDrawers = components.filter(
              (component) =>
                component.type === "drawer" &&
                getSectionIndexForX(component.position.x, sections) === index
            );
            const otherShelves = components.filter(
              (component) =>
                component.type === "shelf" &&
                getSectionIndexForX(component.position.x, sections) === index
            );
            const resolvedY = resolveDrawerY(
              dimensions.height / 3,
              drawerHeight,
              otherDrawers,
              otherShelves,
              dimensions.height
            );
            const isValid =
              resolvedY !== null && drawerWidth >= MIN_COMPONENT_WIDTH;
            const isActive =
              hoveredSectionIndex === index || activeSectionIndex === index;

            return (
              <group key={`drawer-section-${index}`}>
                <mesh
                  position={[
                    sectionCenterX,
                    dimensions.height / 2,
                    dimensions.depth / 2 + 4,
                  ]}
                  onPointerOver={() => setHoveredSectionIndex(index)}
                  onPointerOut={() => setHoveredSectionIndex(null)}
                >
                  <planeGeometry args={[sectionWidth, dimensions.height]} />
                  <meshBasicMaterial
                    color={isValid ? "#93c5fd" : "#cbd5f5"}
                    transparent
                    opacity={isValid ? (isActive ? 0.22 : 0.12) : 0.08}
                  />
                </mesh>

                {isValid && resolvedY !== null && (
                  <>
                    <mesh
                      position={[
                        sectionCenterX,
                        resolvedY,
                        dimensions.depth / 2 - 5,
                      ]}
                    >
                      <boxGeometry
                        args={[drawerWidth, drawerHeight, drawerDepth]}
                      />
                      <meshBasicMaterial
                        color="#bfdbfe"
                        transparent
                        opacity={0.2}
                      />
                    </mesh>
                    <Html
                      position={[
                        sectionCenterX,
                        resolvedY + drawerHeight / 2 + 6,
                        dimensions.depth / 2,
                      ]}
                      center
                      style={{
                        background: "rgba(15, 23, 42, 0.6)",
                        color: "#f8fafc",
                        padding: "3px 8px",
                        borderRadius: "999px",
                        fontSize: "11px",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Add here
                    </Html>
                  </>
                )}
              </group>
            );
          })}
        </>
      )}

      {selectedComponent && !isDraggingComponent && (
        <lineSegments
          position={[
            selectedComponent.position.x,
            selectedComponent.position.y,
            selectedComponent.position.z,
          ]}
        >
          <edgesGeometry
            args={[
              new THREE.BoxGeometry(
                selectedComponent.dimensions.width + 1,
                selectedComponent.dimensions.height + 1,
                selectedComponent.dimensions.depth + 1
              ),
            ]}
          />
          <lineBasicMaterial color="#60a5fa" transparent opacity={0.9} />
        </lineSegments>
      )}

      {/* Floor grid for reference */}
      <Floor />
    </>
  );
};

export default WardrobeModel;
