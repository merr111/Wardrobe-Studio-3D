"use client";

import React, { useEffect, useState } from 'react';
import { 
  TrashIcon, 
  PencilIcon, 
  CheckIcon, 
  XMarkIcon,
  Square3Stack3DIcon,
  SquaresPlusIcon,
  RectangleGroupIcon,
  ViewColumnsIcon,
  ArrowsUpDownIcon,
  ShoppingBagIcon,
  Bars3BottomLeftIcon,
  LightBulbIcon,
  RectangleStackIcon,
  CubeIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import useWardrobeStore from '../../store/wardrobeStore';
import { Listbox } from '@headlessui/react';
import { ChevronUpDownIcon } from '@heroicons/react/20/solid';

const componentTypes = [
  { type: 'shelf', name: 'Shelf' },
  { type: 'drawer', name: 'Drawer' },
  { type: 'rail', name: 'Hanging Rail' },
  { type: 'door', name: 'Door' },
  { type: 'divider', name: 'Vertical Divider' },
  { type: 'shoe_rack', name: 'Shoe Rack' },
  { type: 'trouser_rack', name: 'Trouser Rack' },
  { type: 'tie_rack', name: 'Tie/Belt Rack' },
  { type: 'mirror', name: 'Mirror' },
  { type: 'lighting', name: 'LED Lighting' },
  { type: 'jewelry_tray', name: 'Jewelry Tray' },
  { type: 'pull_out', name: 'Pull-Out Basket' },
] as const;

const DIVIDER_GAP = 2;
const MIN_COMPONENT_WIDTH = 5;
const DRAWER_VERTICAL_GAP = 0.3;

const getDividerSections = (
  components: { type: string; position: { x: number }; dimensions: { width: number } }[],
  wardrobeWidth: number
) => {
  const dividers = components
    .filter((component) => component.type === 'divider')
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

const getSectionIndexForX = (x: number, sections: { minX: number; maxX: number }[]) =>
  sections.findIndex((section) => x >= section.minX && x <= section.maxX);

const getWidestSectionIndex = (sections: { minX: number; maxX: number }[]) =>
  sections.reduce((widestIndex, section, index) => {
    const width = section.maxX - section.minX;
    const widestWidth = sections[widestIndex].maxX - sections[widestIndex].minX;
    return width > widestWidth ? index : widestIndex;
  }, 0);

const getVerticalRange = (y: number, height: number) => ({
  min: y - height / 2,
  max: y + height / 2,
});

const isDrawerYValid = (
  y: number,
  height: number,
  otherDrawers: { position: { y: number }; dimensions: { height: number } }[],
  otherShelves: { position: { y: number }; dimensions: { height: number } }[],
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
  otherDrawers: { position: { y: number }; dimensions: { height: number } }[],
  otherShelves: { position: { y: number }; dimensions: { height: number } }[],
  wardrobeHeight: number
) => {
  if (isDrawerYValid(targetY, height, otherDrawers, otherShelves, wardrobeHeight)) {
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

type ComponentsManagerMode = 'full' | 'add' | 'edit';

const ComponentsManager: React.FC<{ mode?: ComponentsManagerMode }> = ({ mode = 'full' }) => {
  const { 
    configuration, 
    availableMaterials, 
    addComponent, 
    removeComponent,
    updateComponent,
    selectedComponentId,
    setSelectedComponent,
    setActiveAddType,
    setHoveredComponentId,
    setFocusComponentId,
  } = useWardrobeStore();
  
  const { components, dimensions } = configuration;
  
  // State for tracking which component is being edited
  const [editingComponentId, setEditingComponentId] = useState<string | null>(null);
  
  // State for storing temporary edit values
  const [editValues, setEditValues] = useState<{
    position: { x: number; y: number; z: number };
    dimensions: { width: number; height: number; depth: number };
    rotation?: { x: number; y: number; z: number };
    material: string;
    drawerVariant?: 'standard' | 'full-extension' | 'inner';
    drawerSoftClose?: boolean;
    drawerPushToOpen?: boolean;
    doorVariant?: 'hinged-left' | 'hinged-right' | 'hinged-double' | 'sliding';
    doorSoftClose?: boolean;
    doorPushToOpen?: boolean;
    doorMirror?: boolean;
  } | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const selectedComponent = selectedComponentId
    ? components.find((component) => component.id === selectedComponentId)
    : undefined;
  
  // Default values for new components
  const defaultComponentValues = {
    shelf: {
      type: 'shelf' as const,
      position: { x: 0, y: dimensions.height / 2, z: 0 },
      dimensions: { width: dimensions.width - 10, height: 2, depth: dimensions.depth - 10 },
      rotation: { x: 0, y: 0, z: 0 },
      material: configuration.materials.body,
    },
    drawer: {
      type: 'drawer' as const,
      position: { x: 0, y: dimensions.height / 3, z: dimensions.depth / 2 - 5 },
      dimensions: { width: dimensions.width - 10, height: 20, depth: dimensions.depth - 10 },
      rotation: { x: 0, y: 0, z: 0 },
      material: configuration.materials.doors,
      drawerVariant: 'standard' as const,
      drawerSoftClose: true,
      drawerPushToOpen: false,
    },
    rail: {
      type: 'rail' as const,
      position: { x: 0, y: dimensions.height - 30, z: 0 },
      dimensions: { width: dimensions.width - 10, height: 2, depth: 2 },
      rotation: { x: 0, y: 90, z: 0 }, // Rotate by default to be horizontal
      material: configuration.materials.handles,
    },
    door: {
      type: 'door' as const,
      position: { x: 0, y: dimensions.height / 2, z: dimensions.depth / 2 },
      dimensions: { width: dimensions.width / 2 - 5, height: dimensions.height - 4, depth: 2 },
      rotation: { x: 0, y: 0, z: 0 },
      material: configuration.materials.doors,
      doorVariant: 'hinged-right' as const,
      doorSoftClose: true,
      doorPushToOpen: false,
      doorMirror: false,
    },
    divider: {
      type: 'divider' as const,
      position: { x: dimensions.width / 2, y: dimensions.height / 2, z: 0 },
      dimensions: { width: 2, height: dimensions.height - 10, depth: dimensions.depth - 10 },
      rotation: { x: 0, y: 0, z: 0 },
      material: configuration.materials.body,
    },
    shoe_rack: {
      type: 'shoe_rack' as const,
      position: { x: 0, y: 20, z: 0 },
      dimensions: { width: dimensions.width - 10, height: 15, depth: dimensions.depth - 10 },
      rotation: { x: 0, y: 0, z: 0 },
      material: configuration.materials.body,
    },
    trouser_rack: {
      type: 'trouser_rack' as const,
      position: { x: 0, y: dimensions.height / 2, z: dimensions.depth / 3 },
      dimensions: { width: dimensions.width - 20, height: 5, depth: 40 },
      rotation: { x: 0, y: 0, z: 0 },
      material: configuration.materials.handles,
    },
    tie_rack: {
      type: 'tie_rack' as const,
      position: { x: dimensions.width / 4, y: dimensions.height / 2, z: dimensions.depth - 10 },
      dimensions: { width: 30, height: 5, depth: 10 },
      rotation: { x: 0, y: 0, z: 0 },
      material: configuration.materials.handles,
    },
    mirror: {
      type: 'mirror' as const,
      position: { x: 0, y: dimensions.height / 2, z: dimensions.depth / 2 },
      dimensions: { width: dimensions.width / 3, height: dimensions.height / 2, depth: 1 },
      rotation: { x: 0, y: 0, z: 0 },
      material: 'mat1', // Default to white material
    },
    lighting: {
      type: 'lighting' as const,
      position: { x: 0, y: dimensions.height - 5, z: 0 },
      dimensions: { width: dimensions.width - 20, height: 2, depth: 2 },
      rotation: { x: 0, y: 0, z: 0 },
      material: 'mat6', // Chrome material
    },
    jewelry_tray: {
      type: 'jewelry_tray' as const,
      position: { x: 0, y: dimensions.height / 3, z: 0 },
      dimensions: { width: dimensions.width / 3, height: 5, depth: dimensions.depth / 2 },
      rotation: { x: 0, y: 0, z: 0 },
      material: configuration.materials.body,
    },
    pull_out: {
      type: 'pull_out' as const,
      position: { x: 0, y: dimensions.height / 4, z: dimensions.depth / 2 },
      dimensions: { width: dimensions.width - 20, height: 15, depth: dimensions.depth - 20 },
      rotation: { x: 0, y: 0, z: 0 },
      material: configuration.materials.body,
    },
  };

  const drawerAvailability = (() => {
    const drawerBase = defaultComponentValues.drawer;
    const sections = getDividerSections(components, dimensions.width);
    const selectedComponent = components.find((component) => component.id === selectedComponentId);
    const activeX = selectedComponent?.position.x ?? drawerBase.position.x;
    const sectionIndex = sections.length
      ? getSectionIndexForX(activeX, sections)
      : -1;
    const resolvedIndex =
      sectionIndex >= 0 ? sectionIndex : sections.length ? getWidestSectionIndex(sections) : -1;

    const drawerInSection = (drawer: typeof components[number]) => {
      if (sections.length === 0) return true;
      const drawerSectionIndex = getSectionIndexForX(drawer.position.x, sections);
      return drawerSectionIndex === resolvedIndex;
    };

    const otherDrawers = components.filter(
      (component) => component.type === 'drawer' && drawerInSection(component)
    );
    const shelvesInSection = components.filter(
      (component) => component.type === 'shelf' && drawerInSection(component)
    );

    const resolvedY = resolveDrawerY(
      drawerBase.position.y,
      drawerBase.dimensions.height,
      otherDrawers,
      shelvesInSection,
      dimensions.height
    );

    return resolvedY !== null;
  })();

  const getCompartmentLabel = (component: typeof components[number]) => {
    const sections = getDividerSections(components, dimensions.width);
    if (sections.length === 0) return 'Full width';
    const index = getSectionIndexForX(component.position.x, sections);
    if (sections.length === 2) {
      return index <= 0 ? 'Left compartment' : 'Right compartment';
    }
    if (sections.length === 3) {
      if (index === 0) return 'Left compartment';
      if (index === 1) return 'Center compartment';
      return 'Right compartment';
    }
    return `Compartment ${Math.max(index + 1, 1)}`;
  };
  
  // Add a new component
  const handleAddComponent = (type: keyof typeof defaultComponentValues) => {
    addComponent(defaultComponentValues[type]);
    setActiveAddType(null);
  };
  
  // Start editing a component
  const handleStartEdit = (component: typeof components[0]) => {
    setEditingComponentId(component.id);
    setEditValues({
      position: { ...component.position },
      dimensions: { ...component.dimensions },
      rotation: component.rotation ? { ...component.rotation } : { x: 0, y: 0, z: 0 },
      material: component.material,
      drawerVariant: component.drawerVariant,
      drawerSoftClose: component.drawerSoftClose,
      drawerPushToOpen: component.drawerPushToOpen,
      doorVariant: component.doorVariant,
      doorSoftClose: component.doorSoftClose,
      doorPushToOpen: component.doorPushToOpen,
      doorMirror: component.doorMirror,
    });
  };
  
  // Cancel editing
  const handleCancelEdit = () => {
    setEditingComponentId(null);
    setEditValues(null);
    setSelectedComponent(null);
  };
  
  // Save edits
  const handleSaveEdit = (id: string) => {
    setEditingComponentId(null);
    setEditValues(null);
  };
  
  // Handle input change for position and dimensions
  const handleNumberInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    category: 'position' | 'dimensions' | 'rotation',
    property: 'x' | 'y' | 'z' | 'width' | 'height' | 'depth'
  ) => {
    if (editValues) {
      const value = parseFloat(e.target.value) || 0;
      const nextValues = {
        ...editValues,
        [category]: {
          ...editValues[category],
          [property]: value,
        },
      };
      setEditValues(nextValues);
      if (editingComponentId) {
        updateComponent(editingComponentId, {
          position: nextValues.position,
          dimensions: nextValues.dimensions,
          rotation: nextValues.rotation,
          material: nextValues.material,
        });
      }
    }
  };

  useEffect(() => {
    if (mode === 'add') return;
    if (!selectedComponentId) {
      setEditingComponentId(null);
      setEditValues(null);
      setShowAdvanced(false);
      return;
    }
    const selectedComponent = components.find((component) => component.id === selectedComponentId);
    if (selectedComponent) {
      setEditingComponentId(selectedComponent.id);
      setEditValues({
        position: { ...selectedComponent.position },
        dimensions: { ...selectedComponent.dimensions },
        rotation: selectedComponent.rotation
          ? { ...selectedComponent.rotation }
          : { x: 0, y: 0, z: 0 },
        material: selectedComponent.material,
        drawerVariant: selectedComponent.drawerVariant,
        drawerSoftClose: selectedComponent.drawerSoftClose,
        drawerPushToOpen: selectedComponent.drawerPushToOpen,
        doorVariant: selectedComponent.doorVariant,
        doorSoftClose: selectedComponent.doorSoftClose,
        doorPushToOpen: selectedComponent.doorPushToOpen,
        doorMirror: selectedComponent.doorMirror,
      });
      setShowAdvanced(false);
    }
  }, [components, mode, selectedComponentId]);

  if (mode === 'add') {
    return (
      <div className="w-full" onMouseLeave={() => setActiveAddType(null)}>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Add Components</h2>

        <div className="mt-4 space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700">Storage</h3>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {componentTypes
                .filter(c => ['shelf', 'drawer', 'divider', 'pull_out'].includes(c.type))
                .map((componentType) => {
                  const isDrawer = componentType.type === 'drawer';
                  const isDisabled = isDrawer && !drawerAvailability;
                  return (
                    <button
                      key={componentType.type}
                      onMouseEnter={() =>
                        setActiveAddType(isDrawer ? 'drawer' : null)
                      }
                      onClick={() => handleAddComponent(componentType.type as keyof typeof defaultComponentValues)}
                      disabled={isDisabled}
                      className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium shadow-sm transition-all ${
                        isDisabled
                          ? 'border-gray-100 bg-gray-50 text-gray-400'
                          : 'border-gray-200 bg-white text-gray-800 hover:-translate-y-0.5 hover:border-gray-300 hover:bg-gray-50 hover:shadow-md'
                      }`}
                    >
                      {componentType.type === 'shelf' && <Square3Stack3DIcon className="h-4 w-4 text-sky-600" />}
                      {componentType.type === 'drawer' && <SquaresPlusIcon className={`h-4 w-4 ${isDisabled ? 'text-gray-300' : 'text-sky-600'}`} />}
                      {componentType.type === 'divider' && <ViewColumnsIcon className="h-4 w-4 text-sky-600" />}
                      {componentType.type === 'pull_out' && <CubeIcon className="h-4 w-4 text-sky-600" />}
                      <span>{componentType.name}</span>
                    </button>
                  );
                })}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700">Hanging</h3>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {componentTypes
                .filter(c => ['rail', 'shoe_rack', 'trouser_rack', 'tie_rack'].includes(c.type))
                .map((componentType) => (
                  <button
                    key={componentType.type}
                    onMouseEnter={() => setActiveAddType(null)}
                    onClick={() => handleAddComponent(componentType.type as keyof typeof defaultComponentValues)}
                    className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-sm transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:bg-gray-50 hover:shadow-md"
                  >
                    {componentType.type === 'rail' && <ArrowsUpDownIcon className="h-4 w-4 text-sky-600" />}
                    {componentType.type === 'shoe_rack' && <ShoppingBagIcon className="h-4 w-4 text-sky-600" />}
                    {componentType.type === 'trouser_rack' && <RectangleGroupIcon className="h-4 w-4 text-sky-600" />}
                    {componentType.type === 'tie_rack' && <Bars3BottomLeftIcon className="h-4 w-4 text-sky-600" />}
                    <span>{componentType.name}</span>
                  </button>
                ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700">Fronts</h3>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {componentTypes
                .filter(c => ['door', 'mirror', 'lighting', 'jewelry_tray'].includes(c.type))
                .map((componentType) => (
                  <button
                    key={componentType.type}
                    onMouseEnter={() => setActiveAddType(null)}
                    onClick={() => handleAddComponent(componentType.type as keyof typeof defaultComponentValues)}
                    className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-sm transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:bg-gray-50 hover:shadow-md"
                  >
                    {componentType.type === 'door' && <RectangleStackIcon className="h-4 w-4 text-sky-600" />}
                    {componentType.type === 'mirror' && <EyeIcon className="h-4 w-4 text-sky-600" />}
                    {componentType.type === 'lighting' && <LightBulbIcon className="h-4 w-4 text-sky-600" />}
                    {componentType.type === 'jewelry_tray' && <SquaresPlusIcon className="h-4 w-4 text-sky-600" />}
                    <span>{componentType.name}</span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'edit') {
    return (
      <div className="w-full">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Selected Component</h2>
        {selectedComponentId && editValues ? (
          <>
            <div className="mt-4 space-y-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-800">Position</div>
                <button
                  onClick={() => removeComponent(selectedComponentId)}
                  className="text-xs font-semibold text-rose-600 transition hover:text-rose-700"
                >
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs text-gray-500">
                  Height
                  <input
                    type="number"
                    value={editValues.position.y}
                    onChange={(e) => handleNumberInputChange(e, 'position', 'y')}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-700 focus:border-blue-400 focus:outline-none"
                  />
                </label>
                <label className="text-xs text-gray-500">
                  Width
                  <input
                    type="number"
                    value={editValues.dimensions.width}
                    onChange={(e) => handleNumberInputChange(e, 'dimensions', 'width')}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-700 focus:border-blue-400 focus:outline-none"
                  />
                </label>
              </div>

              <div className="text-sm font-medium text-gray-800">Size</div>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs text-gray-500">
                  Height
                  <input
                    type="number"
                    value={editValues.dimensions.height}
                    onChange={(e) => handleNumberInputChange(e, 'dimensions', 'height')}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-700 focus:border-blue-400 focus:outline-none"
                  />
                </label>
                <label className="text-xs text-gray-500">
                  Depth
                  <input
                    type="number"
                    value={editValues.dimensions.depth}
                    onChange={(e) => handleNumberInputChange(e, 'dimensions', 'depth')}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-700 focus:border-blue-400 focus:outline-none"
                  />
                </label>
              </div>

              <div className="text-sm font-medium text-gray-800">Material</div>
              <Listbox
                value={editValues.material}
                onChange={(materialId) => {
                  const nextValues = { ...editValues, material: materialId };
                  setEditValues(nextValues);
                  if (editingComponentId) {
                    updateComponent(editingComponentId, {
                      position: nextValues.position,
                      dimensions: nextValues.dimensions,
                      rotation: nextValues.rotation,
                      material: nextValues.material,
                    });
                  }
                }}
              >
                <div className="relative mt-1">
                  <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-gray-50 py-2 pl-3 pr-10 text-left text-sm text-gray-700 border border-gray-200 focus:outline-none focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-200">
                    <div className="flex items-center">
                      <div
                        className="w-4 h-4 rounded-full mr-2"
                        style={{ backgroundColor: availableMaterials.find(m => m.id === editValues.material)?.color || '#ffffff' }}
                      />
                      <span className="block truncate">
                        {availableMaterials.find(m => m.id === editValues.material)?.name || 'Unknown'}
                      </span>
                    </div>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <ChevronUpDownIcon className="h-4 w-4 text-gray-500" aria-hidden="true" />
                    </span>
                  </Listbox.Button>
                  <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    {availableMaterials.map((material) => (
                      <Listbox.Option
                        key={material.id}
                        value={material.id}
                        className={({ active, selected }) =>
                          `${active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}
                          ${selected ? 'bg-blue-50' : ''}
                          relative cursor-pointer select-none py-2 pl-3 pr-9`
                        }
                      >
                        {({ selected }) => (
                          <div className="flex items-center">
                            <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: material.color }} />
                            <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                              {material.name}
                            </span>
                          </div>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </div>
              </Listbox>

              {selectedComponent?.type === 'drawer' && (
                <>
                  <div className="text-sm font-medium text-gray-800">Drawer Options</div>
                  <label className="text-xs text-gray-500">
                    Variant
                    <select
                      value={editValues.drawerVariant || 'standard'}
                      onChange={(event) => {
                        const nextValues = {
                          ...editValues,
                          drawerVariant: event.target.value as 'standard' | 'full-extension' | 'inner',
                        };
                        setEditValues(nextValues);
                        if (editingComponentId) {
                          updateComponent(editingComponentId, {
                            drawerVariant: nextValues.drawerVariant,
                          });
                        }
                      }}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-700 focus:border-blue-400 focus:outline-none"
                    >
                      <option value="standard">Standard</option>
                      <option value="full-extension">Full extension</option>
                      <option value="inner">Inner drawer</option>
                    </select>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-blue-600"
                      checked={editValues.drawerSoftClose ?? false}
                      onChange={(event) => {
                        const nextValues = {
                          ...editValues,
                          drawerSoftClose: event.target.checked,
                        };
                        setEditValues(nextValues);
                        if (editingComponentId) {
                          updateComponent(editingComponentId, {
                            drawerSoftClose: nextValues.drawerSoftClose,
                          });
                        }
                      }}
                    />
                    Soft-close
                  </label>
                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-blue-600"
                      checked={editValues.drawerPushToOpen ?? false}
                      onChange={(event) => {
                        const nextValues = {
                          ...editValues,
                          drawerPushToOpen: event.target.checked,
                        };
                        setEditValues(nextValues);
                        if (editingComponentId) {
                          updateComponent(editingComponentId, {
                            drawerPushToOpen: nextValues.drawerPushToOpen,
                          });
                        }
                      }}
                    />
                    Push-to-open
                  </label>
                </>
              )}

              {selectedComponent?.type === 'door' && (
                <>
                  <div className="text-sm font-medium text-gray-800">Door Options</div>
                  <label className="text-xs text-gray-500">
                    Variant
                    <select
                      value={editValues.doorVariant || 'hinged-right'}
                      onChange={(event) => {
                        const nextValues = {
                          ...editValues,
                          doorVariant: event.target.value as
                            | 'hinged-left'
                            | 'hinged-right'
                            | 'hinged-double'
                            | 'sliding',
                        };
                        setEditValues(nextValues);
                        if (editingComponentId) {
                          updateComponent(editingComponentId, {
                            doorVariant: nextValues.doorVariant,
                          });
                        }
                      }}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-700 focus:border-blue-400 focus:outline-none"
                    >
                      <option value="hinged-left">Hinged left</option>
                      <option value="hinged-right">Hinged right</option>
                      <option value="hinged-double">Double hinged</option>
                      <option value="sliding">Sliding</option>
                    </select>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-blue-600"
                      checked={editValues.doorSoftClose ?? false}
                      onChange={(event) => {
                        const nextValues = {
                          ...editValues,
                          doorSoftClose: event.target.checked,
                        };
                        setEditValues(nextValues);
                        if (editingComponentId) {
                          updateComponent(editingComponentId, {
                            doorSoftClose: nextValues.doorSoftClose,
                          });
                        }
                      }}
                    />
                    Soft-close
                  </label>
                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-blue-600"
                      checked={editValues.doorPushToOpen ?? false}
                      onChange={(event) => {
                        const nextValues = {
                          ...editValues,
                          doorPushToOpen: event.target.checked,
                        };
                        setEditValues(nextValues);
                        if (editingComponentId) {
                          updateComponent(editingComponentId, {
                            doorPushToOpen: nextValues.doorPushToOpen,
                          });
                        }
                      }}
                    />
                    Push-to-open
                  </label>
                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-blue-600"
                      checked={editValues.doorMirror ?? false}
                      onChange={(event) => {
                        const nextValues = {
                          ...editValues,
                          doorMirror: event.target.checked,
                        };
                        setEditValues(nextValues);
                        if (editingComponentId) {
                          updateComponent(editingComponentId, {
                            doorMirror: nextValues.doorMirror,
                          });
                        }
                      }}
                    />
                    Mirror door
                  </label>
                </>
              )}

              <button
                type="button"
                onClick={() => setShowAdvanced((prev) => !prev)}
                className="text-xs font-semibold text-slate-600 transition hover:text-slate-900"
              >
                {showAdvanced ? 'Hide advanced' : 'Show advanced'}
              </button>

              {showAdvanced && (
                <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Advanced</div>
                  <div className="grid grid-cols-3 gap-2">
                    {(['x', 'y', 'z'] as const).map((axis) => (
                      <label key={axis} className="text-xs text-gray-500">
                        {axis.toUpperCase()}
                        <input
                          type="number"
                          value={editValues.position[axis]}
                          onChange={(e) => handleNumberInputChange(e, 'position', axis)}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-700 focus:border-blue-400 focus:outline-none"
                        />
                      </label>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(['width', 'height', 'depth'] as const).map((axis) => (
                      <label key={axis} className="text-xs text-gray-500">
                        {axis.charAt(0).toUpperCase()}
                        <input
                          type="number"
                          value={editValues.dimensions[axis]}
                          onChange={(e) => handleNumberInputChange(e, 'dimensions', axis)}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-700 focus:border-blue-400 focus:outline-none"
                        />
                      </label>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(['x', 'y', 'z'] as const).map((axis) => (
                      <label key={axis} className="text-xs text-gray-500">
                        Rot {axis.toUpperCase()}
                        <input
                          type="number"
                          value={editValues.rotation?.[axis] || 0}
                          onChange={(e) => handleNumberInputChange(e, 'rotation', axis)}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-700 focus:border-blue-400 focus:outline-none"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="text-sm font-semibold text-gray-800">All Components</div>
              {components.length > 0 ? (
                <div className="mt-3 max-h-48 space-y-2 overflow-y-auto pr-1">
                  {components.map((component) => {
                    const isActive = selectedComponentId === component.id;
                    return (
                      <button
                        key={component.id}
                        type="button"
                      onClick={() => {
                        setSelectedComponent(component.id);
                        setFocusComponentId(component.id);
                      }}
                      onMouseEnter={() => setHoveredComponentId(component.id)}
                      onMouseLeave={() => setHoveredComponentId(null)}
                      className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                        isActive
                          ? 'border-blue-200 bg-blue-50 text-blue-900'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {componentTypes.find((item) => item.type === component.type)?.name ||
                            component.type}
                        </span>
                        <span className="text-xs text-gray-500">
                          {getCompartmentLabel(component)}
                        </span>
                      </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-3 text-sm text-gray-500">
                  No components yet.
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-white/60 p-6 text-sm text-gray-600">
            Select a component in the wardrobe to edit it.
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="w-full p-4">
      <h2 className="text-xl font-semibold mb-4 text-gray-900">Add Components</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3 text-gray-800">Storage Components</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {componentTypes
            .filter(c => ['shelf', 'drawer', 'divider', 'pull_out'].includes(c.type))
            .map((componentType) => (
              <button
                key={componentType.type}
                onClick={() => handleAddComponent(componentType.type as keyof typeof defaultComponentValues)}
                className="flex items-center justify-center p-3 bg-white rounded-lg shadow hover:bg-gray-50 border border-gray-200"
              >
                {componentType.type === 'shelf' && <Square3Stack3DIcon className="h-5 w-5 mr-2 text-blue-700" />}
                {componentType.type === 'drawer' && <SquaresPlusIcon className="h-5 w-5 mr-2 text-blue-700" />}
                {componentType.type === 'divider' && <ViewColumnsIcon className="h-5 w-5 mr-2 text-blue-700" />}
                {componentType.type === 'pull_out' && <CubeIcon className="h-5 w-5 mr-2 text-blue-700" />}
                <span className="text-gray-900">Add {componentType.name}</span>
              </button>
            ))}
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3 text-gray-800">Clothing Organization</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {componentTypes
            .filter(c => ['rail', 'shoe_rack', 'trouser_rack', 'tie_rack'].includes(c.type))
            .map((componentType) => (
              <button
                key={componentType.type}
                onClick={() => handleAddComponent(componentType.type as keyof typeof defaultComponentValues)}
                className="flex items-center justify-center p-3 bg-white rounded-lg shadow hover:bg-gray-50 border border-gray-200"
              >
                {componentType.type === 'rail' && <ArrowsUpDownIcon className="h-5 w-5 mr-2 text-blue-700" />}
                {componentType.type === 'shoe_rack' && <ShoppingBagIcon className="h-5 w-5 mr-2 text-blue-700" />}
                {componentType.type === 'trouser_rack' && <RectangleGroupIcon className="h-5 w-5 mr-2 text-blue-700" />}
                {componentType.type === 'tie_rack' && <Bars3BottomLeftIcon className="h-5 w-5 mr-2 text-blue-700" />}
                <span className="text-gray-900">Add {componentType.name}</span>
              </button>
            ))}
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3 text-gray-800">Accessories & Finishing</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {componentTypes
            .filter(c => ['door', 'mirror', 'lighting', 'jewelry_tray'].includes(c.type))
            .map((componentType) => (
              <button
                key={componentType.type}
                onClick={() => handleAddComponent(componentType.type as keyof typeof defaultComponentValues)}
                className="flex items-center justify-center p-3 bg-white rounded-lg shadow hover:bg-gray-50 border border-gray-200"
              >
                {componentType.type === 'door' && <RectangleStackIcon className="h-5 w-5 mr-2 text-blue-700" />}
                {componentType.type === 'mirror' && <EyeIcon className="h-5 w-5 mr-2 text-blue-700" />}
                {componentType.type === 'lighting' && <LightBulbIcon className="h-5 w-5 mr-2 text-blue-700" />}
                {componentType.type === 'jewelry_tray' && <SquaresPlusIcon className="h-5 w-5 mr-2 text-blue-700" />}
                <span className="text-gray-900">Add {componentType.name}</span>
              </button>
            ))}
        </div>
      </div>
      
      {components.length > 0 ? (
        <div>
          <h3 className="text-lg font-medium mb-2 text-gray-900">Current Components</h3>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Position</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Dimensions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Material</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Rotation</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {components.map((component) => {
                    const materialObj = availableMaterials.find(m => m.id === component.material);
                    const isEditing = editingComponentId === component.id;
                    
                    const isSelected = selectedComponentId === component.id;

                    return (
                      <tr
                        key={component.id}
                        className={isSelected ? 'bg-blue-50' : undefined}
                        onClick={() => setSelectedComponent(component.id)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <div className="flex items-center">
                            {component.type === 'shelf' && <Square3Stack3DIcon className="h-5 w-5 mr-2 text-blue-700" />}
                            {component.type === 'drawer' && <SquaresPlusIcon className="h-5 w-5 mr-2 text-blue-700" />}
                            {component.type === 'divider' && <ViewColumnsIcon className="h-5 w-5 mr-2 text-blue-700" />}
                            {component.type === 'pull_out' && <CubeIcon className="h-5 w-5 mr-2 text-blue-700" />}
                            {component.type === 'rail' && <ArrowsUpDownIcon className="h-5 w-5 mr-2 text-blue-700" />}
                            {component.type === 'shoe_rack' && <ShoppingBagIcon className="h-5 w-5 mr-2 text-blue-700" />}
                            {component.type === 'trouser_rack' && <RectangleGroupIcon className="h-5 w-5 mr-2 text-blue-700" />}
                            {component.type === 'tie_rack' && <Bars3BottomLeftIcon className="h-5 w-5 mr-2 text-blue-700" />}
                            {component.type === 'door' && <RectangleStackIcon className="h-5 w-5 mr-2 text-blue-700" />}
                            {component.type === 'mirror' && <EyeIcon className="h-5 w-5 mr-2 text-blue-700" />}
                            {component.type === 'lighting' && <LightBulbIcon className="h-5 w-5 mr-2 text-blue-700" />}
                            {component.type === 'jewelry_tray' && <SquaresPlusIcon className="h-5 w-5 mr-2 text-blue-700" />}
                            {componentTypes.find(t => t.type === component.type)?.name || component.type}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {isEditing ? (
                            <div className="flex space-x-2">
                              <div className="flex flex-col">
                                <label className="text-xs text-gray-500">X:</label>
                                <input
                                  type="number"
                                  value={editValues?.position.x}
                                  onChange={(e) => handleNumberInputChange(e, 'position', 'x')}
                                  className="w-20 border border-gray-300 rounded px-2 py-1"
                                />
                              </div>
                              <div className="flex flex-col">
                                <label className="text-xs text-gray-500">Y:</label>
                                <input
                                  type="number"
                                  value={editValues?.position.y}
                                  onChange={(e) => handleNumberInputChange(e, 'position', 'y')}
                                  className="w-20 border border-gray-300 rounded px-2 py-1"
                                />
                              </div>
                              <div className="flex flex-col">
                                <label className="text-xs text-gray-500">Z:</label>
                                <input
                                  type="number"
                                  value={editValues?.position.z}
                                  onChange={(e) => handleNumberInputChange(e, 'position', 'z')}
                                  className="w-20 border border-gray-300 rounded px-2 py-1"
                                />
                              </div>
                            </div>
                          ) : (
                            <span>X: {component.position.x}, Y: {component.position.y}, Z: {component.position.z}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {isEditing ? (
                            <div className="flex space-x-2">
                              <div className="flex flex-col">
                                <label className="text-xs text-gray-500">W:</label>
                                <input
                                  type="number"
                                  value={editValues?.dimensions.width}
                                  onChange={(e) => handleNumberInputChange(e, 'dimensions', 'width')}
                                  className="w-20 border border-gray-300 rounded px-2 py-1"
                                />
                              </div>
                              <div className="flex flex-col">
                                <label className="text-xs text-gray-500">H:</label>
                                <input
                                  type="number"
                                  value={editValues?.dimensions.height}
                                  onChange={(e) => handleNumberInputChange(e, 'dimensions', 'height')}
                                  className="w-20 border border-gray-300 rounded px-2 py-1"
                                />
                              </div>
                              <div className="flex flex-col">
                                <label className="text-xs text-gray-500">D:</label>
                                <input
                                  type="number"
                                  value={editValues?.dimensions.depth}
                                  onChange={(e) => handleNumberInputChange(e, 'dimensions', 'depth')}
                                  className="w-20 border border-gray-300 rounded px-2 py-1"
                                />
                              </div>
                            </div>
                          ) : (
                            <span>W: {component.dimensions.width}, H: {component.dimensions.height}, D: {component.dimensions.depth}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {isEditing ? (
                            <Listbox 
                              value={editValues?.material} 
                              onChange={(materialId) => {
                                const nextValues = { ...editValues!, material: materialId };
                                setEditValues(nextValues);
                                if (editingComponentId) {
                                  updateComponent(editingComponentId, {
                                    position: nextValues.position,
                                    dimensions: nextValues.dimensions,
                                    rotation: nextValues.rotation,
                                    material: nextValues.material,
                                  });
                                }
                              }}
                            >
                              <div className="relative mt-1 w-48">
                                <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white py-2 pl-3 pr-10 text-left border border-gray-300 focus:outline-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500">
                                  {editValues && (
                                    <div className="flex items-center">
                                      <div 
                                        className="w-4 h-4 rounded-full mr-2" 
                                        style={{ backgroundColor: availableMaterials.find(m => m.id === editValues.material)?.color || '#ffffff' }}
                                      />
                                      <span className="block truncate">
                                        {availableMaterials.find(m => m.id === editValues.material)?.name || 'Unknown'}
                                      </span>
                                    </div>
                                  )}
                                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                    <ChevronUpDownIcon className="h-4 w-4 text-gray-500" aria-hidden="true" />
                                  </span>
                                </Listbox.Button>
                                <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                  {availableMaterials.map((material) => (
                                    <Listbox.Option
                                      key={material.id}
                                      value={material.id}
                                      className={({ active, selected }) =>
                                        `${active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}
                                        ${selected ? 'bg-blue-50' : ''}
                                        relative cursor-pointer select-none py-2 pl-3 pr-9`
                                      }
                                    >
                                      {({ selected }) => (
                                        <div className="flex items-center">
                                          <div 
                                            className="w-4 h-4 rounded-full mr-2" 
                                            style={{ backgroundColor: material.color }}
                                          />
                                          <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                            {material.name}
                                          </span>
                                        </div>
                                      )}
                                    </Listbox.Option>
                                  ))}
                                </Listbox.Options>
                              </div>
                            </Listbox>
                          ) : (
                            <div className="flex items-center">
                              <div 
                                className="w-4 h-4 rounded-full mr-2" 
                                style={{ backgroundColor: materialObj?.color || '#ffffff' }}
                              />
                              {materialObj?.name || 'Unknown'}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {isEditing ? (
                            <div className="flex space-x-2">
                              <div className="flex flex-col">
                                <label className="text-xs text-gray-500">Rot X:</label>
                                <input
                                  type="number"
                                  value={editValues?.rotation?.x || 0}
                                  onChange={(e) => handleNumberInputChange(e, 'rotation', 'x')}
                                  className="w-20 border border-gray-300 rounded px-2 py-1"
                                />
                              </div>
                              <div className="flex flex-col">
                                <label className="text-xs text-gray-500">Rot Y:</label>
                                <input
                                  type="number"
                                  value={editValues?.rotation?.y || 0}
                                  onChange={(e) => handleNumberInputChange(e, 'rotation', 'y')}
                                  className="w-20 border border-gray-300 rounded px-2 py-1"
                                />
                              </div>
                              <div className="flex flex-col">
                                <label className="text-xs text-gray-500">Rot Z:</label>
                                <input
                                  type="number"
                                  value={editValues?.rotation?.z || 0}
                                  onChange={(e) => handleNumberInputChange(e, 'rotation', 'z')}
                                  className="w-20 border border-gray-300 rounded px-2 py-1"
                                />
                              </div>
                            </div>
                          ) : (
                            <span>
                              {component.rotation ? 
                                `X: ${component.rotation.x}°, Y: ${component.rotation.y}°, Z: ${component.rotation.z}°` : 
                                'No rotation'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {isEditing ? (
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => handleSaveEdit(component.id)}
                                className="text-green-600 hover:text-green-900"
                              >
                                <CheckIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="text-gray-600 hover:text-gray-900"
                              >
                                <XMarkIcon className="h-5 w-5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => handleStartEdit(component)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <PencilIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => removeComponent(component.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-4 text-gray-700">
          No components added yet. Add components to customize your wardrobe.
        </div>
      )}
    </div>
  );
};

export default ComponentsManager;
