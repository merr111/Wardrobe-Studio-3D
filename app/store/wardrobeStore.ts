"use client";

import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import {
  WardrobeConfiguration,
  WardrobeType,
  WardrobeDimensions,
  WardrobeComponent,
  Material,
  Project,
  Room,
  RoomType,
  FurnitureItem,
  FurnitureType,
} from "../types/wardrobe";

// Default materials
const defaultMaterials: Material[] = [
  { id: "mat1", name: "White Melamine", color: "#ffffff", price: 100 },
  { id: "mat2", name: "Oak Veneer", color: "#d2b48c", price: 200 },
  { id: "mat3", name: "Walnut Veneer", color: "#654321", price: 250 },
  { id: "mat4", name: "Black Melamine", color: "#222222", price: 120 },
  { id: "mat5", name: "Gray Melamine", color: "#808080", price: 110 },
  { id: "mat6", name: "Chrome", color: "#c0c0c0", price: 80 },
];

// Default dimensions based on wardrobe type
const defaultDimensions: Record<WardrobeType, WardrobeDimensions> = {
  standard: { width: 200, height: 220, depth: 60 },
  corner: { width: 200, height: 220, depth: 200 },
  sliding: { width: 250, height: 240, depth: 65 },
  "walk-in": { width: 300, height: 240, depth: 300 },
};

const DIVIDER_GAP = 2;
const MIN_COMPONENT_WIDTH = 5;
const DRAWER_VERTICAL_GAP = 0.3;
const SHELF_DRAWER_GAP = 0.3;
const DEFAULT_FURNITURE_BY_ROOM: Record<RoomType, FurnitureType> = {
  bedroom: "wardrobe",
  kitchen: "cabinet",
  living: "sideboard",
  hallway: "wardrobe",
  custom: "wardrobe",
};

const createDefaultConfiguration = (
  type: WardrobeType = "standard"
): WardrobeConfiguration => ({
  id: uuidv4(),
  type,
  dimensions: defaultDimensions[type],
  components: [],
  materials: {
    body: "mat1",
    doors: "mat2",
    handles: "mat6",
  },
  price: 0,
});

const createFurnitureItem = (
  name: string,
  type: FurnitureType = "wardrobe"
): FurnitureItem => ({
  id: uuidv4(),
  name,
  type,
  configuration: createDefaultConfiguration(),
});

const createRoom = (name: string, type: RoomType): Room => {
  const defaultFurniture = DEFAULT_FURNITURE_BY_ROOM[type];
  const defaultName =
    defaultFurniture.charAt(0).toUpperCase() + defaultFurniture.slice(1);
  return {
    id: uuidv4(),
    name,
    type,
    furniture: [createFurnitureItem(`${defaultName} 1`, defaultFurniture)],
  };
};

const createInitialProject = (): Project => ({
  id: uuidv4(),
  name: "My Project",
  rooms: [createRoom("Bedroom", "bedroom")],
});

const clampValue = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const getVerticalRange = (y: number, height: number) => ({
  min: y - height / 2,
  max: y + height / 2,
});

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
      candidate.min <= range.max + SHELF_DRAWER_GAP &&
      candidate.max >= range.min - SHELF_DRAWER_GAP
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
    candidates.add(range.max + SHELF_DRAWER_GAP + height / 2);
    candidates.add(range.min - SHELF_DRAWER_GAP - height / 2);
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

const isShelfYValid = (
  y: number,
  height: number,
  otherDrawers: WardrobeComponent[],
  wardrobeHeight: number
) => {
  const boundsMin = height / 2 + SHELF_DRAWER_GAP;
  const boundsMax = wardrobeHeight - height / 2 - SHELF_DRAWER_GAP;
  if (y < boundsMin || y > boundsMax) return false;

  const candidate = getVerticalRange(y, height);
  return !otherDrawers.some((drawer) => {
    const range = getVerticalRange(drawer.position.y, drawer.dimensions.height);
    return (
      candidate.min <= range.max + SHELF_DRAWER_GAP &&
      candidate.max >= range.min - SHELF_DRAWER_GAP
    );
  });
};

const resolveShelfY = (
  targetY: number,
  height: number,
  otherDrawers: WardrobeComponent[],
  wardrobeHeight: number
) => {
  if (isShelfYValid(targetY, height, otherDrawers, wardrobeHeight)) {
    return targetY;
  }

  const candidates = new Set<number>();
  const boundsMin = height / 2 + SHELF_DRAWER_GAP;
  const boundsMax = wardrobeHeight - height / 2 - SHELF_DRAWER_GAP;

  candidates.add(boundsMin);
  candidates.add(boundsMax);

  otherDrawers.forEach((drawer) => {
    const range = getVerticalRange(drawer.position.y, drawer.dimensions.height);
    candidates.add(range.max + SHELF_DRAWER_GAP + height / 2);
    candidates.add(range.min - SHELF_DRAWER_GAP - height / 2);
  });

  const sorted = Array.from(candidates)
    .filter((value) => value >= boundsMin && value <= boundsMax)
    .sort((a, b) => Math.abs(a - targetY) - Math.abs(b - targetY));

  return (
    sorted.find((value) =>
      isShelfYValid(value, height, otherDrawers, wardrobeHeight)
    ) ?? null
  );
};

const splitShelfAtDivider = (
  shelf: WardrobeComponent,
  dividerX: number,
  dividerWidth: number
) => {
  const leftEdge = shelf.position.x - shelf.dimensions.width / 2;
  const rightEdge = shelf.position.x + shelf.dimensions.width / 2;
  const leftMax = dividerX - dividerWidth / 2 - DIVIDER_GAP;
  const rightMin = dividerX + dividerWidth / 2 + DIVIDER_GAP;

  const leftWidth = leftMax - leftEdge;
  const rightWidth = rightEdge - rightMin;

  const nextComponents: WardrobeComponent[] = [];

  if (leftWidth >= MIN_COMPONENT_WIDTH) {
    nextComponents.push({
      ...shelf,
      id: uuidv4(),
      position: {
        ...shelf.position,
        x: leftEdge + leftWidth / 2,
      },
      dimensions: {
        ...shelf.dimensions,
        width: leftWidth,
      },
    });
  }

  if (rightWidth >= MIN_COMPONENT_WIDTH) {
    nextComponents.push({
      ...shelf,
      id: uuidv4(),
      position: {
        ...shelf.position,
        x: rightMin + rightWidth / 2,
      },
      dimensions: {
        ...shelf.dimensions,
        width: rightWidth,
      },
    });
  }

  return nextComponents;
};

const getDividerSections = (
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

const getDrawerSectionIndex = (
  component: WardrobeComponent,
  sections: { minX: number; maxX: number }[]
) => {
  if (sections.length === 0) return -1;
  return getSectionIndexForX(component.position.x, sections);
};

const normalizeComponents = (
  components: WardrobeComponent[],
  wardrobeDimensions: WardrobeDimensions
) => {
  const sections = getDividerSections(components, wardrobeDimensions.width);
  const normalized: WardrobeComponent[] = [];
  const drawersBySection = new Map<number, WardrobeComponent[]>();
  const shelvesBySection = new Map<number, WardrobeComponent[]>();

  components.forEach((component) => {
    if (component.type === "divider") {
      normalized.push(component);
      return;
    }

    const constrained = constrainComponentToSections(
      component,
      components,
      wardrobeDimensions.width
    );
    const sectionIndex = sections.length
      ? getSectionIndexForX(constrained.position.x, sections)
      : -1;
    const section =
      sectionIndex >= 0 ? sections[sectionIndex] : sections[0] ?? null;

    if (constrained.type === "drawer") {
      const otherDrawers = drawersBySection.get(sectionIndex) ?? [];
      const otherShelves = shelvesBySection.get(sectionIndex) ?? [];
      const resolvedY = resolveDrawerY(
        constrained.position.y,
        constrained.dimensions.height,
        otherDrawers,
        otherShelves,
        wardrobeDimensions.height
      );
      if (resolvedY === null) return;

      const nextComponent = {
        ...constrained,
        position: { ...constrained.position, y: resolvedY },
      };
      const updatedDrawers = [...otherDrawers, nextComponent];
      drawersBySection.set(sectionIndex, updatedDrawers);
      normalized.push(nextComponent);
      return;
    }

    if (constrained.type === "shelf") {
      const adjusted =
        section && constrained.dimensions.width >= section.maxX - section.minX - 4
          ? {
              ...constrained,
              position: {
                ...constrained.position,
                x: (section.minX + section.maxX) / 2,
              },
              dimensions: {
                ...constrained.dimensions,
                width: section.maxX - section.minX,
              },
            }
          : constrained;
      const otherDrawers = drawersBySection.get(sectionIndex) ?? [];
      const resolvedY = resolveShelfY(
        adjusted.position.y,
        adjusted.dimensions.height,
        otherDrawers,
        wardrobeDimensions.height
      );
      if (resolvedY === null) return;

      const nextComponent = {
        ...adjusted,
        position: { ...adjusted.position, y: resolvedY },
      };
      const updatedShelves = [
        ...(shelvesBySection.get(sectionIndex) ?? []),
        nextComponent,
      ];
      shelvesBySection.set(sectionIndex, updatedShelves);
      normalized.push(nextComponent);
      return;
    }

    if (constrained.type === "rail" && section) {
      if (constrained.dimensions.width >= section.maxX - section.minX - 4) {
        normalized.push({
          ...constrained,
          position: {
            ...constrained.position,
            x: (section.minX + section.maxX) / 2,
          },
          dimensions: {
            ...constrained.dimensions,
            width: section.maxX - section.minX,
          },
        });
        return;
      }
    }

    normalized.push(constrained);
  });

  return normalized;
};

const cloneConfiguration = (config: WardrobeConfiguration) =>
  JSON.parse(JSON.stringify(config)) as WardrobeConfiguration;

const recordHistory = (
  state: WardrobeState,
  configuration: WardrobeConfiguration
) => {
  const snapshot = JSON.stringify(configuration);
  if (snapshot === state.lastHistorySnapshot) {
    return {};
  }

  const history = state.history.slice(0, state.historyIndex + 1);
  history.push(cloneConfiguration(configuration));

  return {
    history,
    historyIndex: history.length - 1,
    lastHistorySnapshot: snapshot,
  };
};

const updateProjectConfiguration = (
  project: Project,
  roomId: string,
  furnitureId: string,
  configuration: WardrobeConfiguration
) => ({
  ...project,
  rooms: project.rooms.map((room) => {
    if (room.id !== roomId) return room;
    return {
      ...room,
      furniture: room.furniture.map((item) =>
        item.id === furnitureId ? { ...item, configuration } : item
      ),
    };
  }),
});

const getActiveRoom = (project: Project, roomId: string) =>
  project.rooms.find((room) => room.id === roomId) ?? project.rooms[0];

const getActiveFurniture = (room: Room, furnitureId: string) =>
  room.furniture.find((item) => item.id === furnitureId) ?? room.furniture[0];

const getSectionIndexForX = (
  x: number,
  sections: { minX: number; maxX: number }[]
) => sections.findIndex((section) => x >= section.minX && x <= section.maxX);

const getWidestSectionIndex = (sections: { minX: number; maxX: number }[]) =>
  sections.reduce((widestIndex, section, index) => {
    const width = section.maxX - section.minX;
    const widestWidth = sections[widestIndex].maxX - sections[widestIndex].minX;
    return width > widestWidth ? index : widestIndex;
  }, 0);

const placeComponentInSection = (
  component: WardrobeComponent,
  section: { minX: number; maxX: number }
) => {
  const sectionWidth = Math.max(
    section.maxX - section.minX,
    MIN_COMPONENT_WIDTH
  );
  const nextWidth = Math.min(component.dimensions.width, sectionWidth);
  const nextX = clampValue(
    component.position.x,
    section.minX + nextWidth / 2,
    section.maxX - nextWidth / 2
  );

  return {
    ...component,
    dimensions: { ...component.dimensions, width: nextWidth },
    position: { ...component.position, x: nextX },
  };
};

const constrainComponentToSections = (
  component: WardrobeComponent,
  components: WardrobeComponent[],
  wardrobeWidth: number
) => {
  if (component.type === "divider") return component;

  const sections = getDividerSections(components, wardrobeWidth);
  if (sections.length === 0) return component;

  const centerX = component.position.x;
  const sectionIndex = getSectionIndexForX(centerX, sections);
  const section =
    sectionIndex >= 0
      ? sections[sectionIndex]
      : sections[getWidestSectionIndex(sections)];

  return placeComponentInSection(component, section);
};

const adjustComponentForDivider = (
  component: WardrobeComponent,
  dividerX: number,
  dividerWidth: number,
  wardrobeWidth: number
) => {
  const leftEdge = component.position.x - component.dimensions.width / 2;
  const rightEdge = component.position.x + component.dimensions.width / 2;
  const intersects = leftEdge < dividerX && rightEdge > dividerX;

  if (!intersects) return [component];

  if (component.type === "shelf") {
    return splitShelfAtDivider(component, dividerX, dividerWidth);
  }

  const leftSectionMin = -wardrobeWidth / 2 + DIVIDER_GAP;
  const leftSectionMax = dividerX - dividerWidth / 2 - DIVIDER_GAP;
  const rightSectionMin = dividerX + dividerWidth / 2 + DIVIDER_GAP;
  const rightSectionMax = wardrobeWidth / 2 - DIVIDER_GAP;

  const overlapLeft = dividerX - leftEdge;
  const overlapRight = rightEdge - dividerX;
  const useLeft = overlapLeft >= overlapRight;

  const sectionMin = useLeft ? leftSectionMin : rightSectionMin;
  const sectionMax = useLeft ? leftSectionMax : rightSectionMax;
  const availableWidth = Math.max(sectionMax - sectionMin, MIN_COMPONENT_WIDTH);
  const nextWidth = Math.min(component.dimensions.width, availableWidth);
  const nextX = clampValue(
    component.position.x,
    sectionMin + nextWidth / 2,
    sectionMax - nextWidth / 2
  );

  return [
    {
      ...component,
      dimensions: { ...component.dimensions, width: nextWidth },
      position: { ...component.position, x: nextX },
    },
  ];
};

interface WardrobeState {
  project: Project;
  configuration: WardrobeConfiguration;
  availableMaterials: Material[];
  selectedComponentId: string | null;
  isDraggingComponent: boolean;
  activeAddType: WardrobeComponent["type"] | null;
  hoveredComponentId: string | null;
  focusComponentId: string | null;
  componentOpenStates: Record<string, boolean>;
  reflowToken: number;
  history: WardrobeConfiguration[];
  historyIndex: number;
  lastHistorySnapshot: string;
  activeRoomId: string;
  activeFurnitureId: string;
  addRoom: (type: RoomType, name?: string) => void;
  renameRoom: (roomId: string, name: string) => void;
  setActiveRoom: (roomId: string) => void;
  addFurniture: (type: FurnitureType, name?: string) => void;
  renameFurniture: (furnitureId: string, name: string) => void;
  duplicateFurniture: (furnitureId: string) => void;
  removeFurniture: (furnitureId: string) => void;
  combineFurniture: (
    primaryId: string,
    secondaryId: string,
    includeDivider?: boolean
  ) => void;
  splitCombinedFurniture: (furnitureId: string) => void;
  setActiveFurniture: (furnitureId: string) => void;
  setWardrobeType: (type: WardrobeType) => void;
  setDimensions: (dimensions: Partial<WardrobeDimensions>) => void;
  addComponent: (component: Omit<WardrobeComponent, "id">) => void;
  removeComponent: (id: string) => void;
  updateComponent: (
    id: string,
    updates: Partial<Omit<WardrobeComponent, "id">>
  ) => void;
  setSelectedComponent: (id: string | null) => void;
  setDraggingComponent: (isDragging: boolean) => void;
  setActiveAddType: (type: WardrobeComponent["type"] | null) => void;
  setHoveredComponentId: (id: string | null) => void;
  setFocusComponentId: (id: string | null) => void;
  setComponentOpen: (id: string, isOpen: boolean) => void;
  toggleComponentOpen: (id: string) => void;
  closeAllOpen: () => void;
  commitHistory: () => void;
  undo: () => void;
  redo: () => void;
  setMaterial: (
    part: keyof WardrobeConfiguration["materials"],
    materialId: string
  ) => void;
  calculatePrice: () => number;
  resetConfiguration: () => void;
  loadConfiguration: (config: WardrobeConfiguration | Project) => void;
}

const initialProject = createInitialProject();
const initialRoom = initialProject.rooms[0];
const initialFurniture = initialRoom.furniture[0];
const initialConfiguration: WardrobeConfiguration =
  initialFurniture.configuration;

// Create the store
const useWardrobeStore = create<WardrobeState>((set, get) => ({
  // Initial configuration
  project: initialProject,
  configuration: initialConfiguration,

  availableMaterials: defaultMaterials,
  selectedComponentId: null,
  isDraggingComponent: false,
  activeAddType: null,
  hoveredComponentId: null,
  focusComponentId: null,
  componentOpenStates: {},
  reflowToken: 0,
  history: [cloneConfiguration(initialConfiguration)],
  historyIndex: 0,
  lastHistorySnapshot: JSON.stringify(initialConfiguration),
  activeRoomId: initialRoom.id,
  activeFurnitureId: initialFurniture.id,

  addRoom: (type, name) =>
    set((state) => {
      const roomName = name || `${type.charAt(0).toUpperCase() + type.slice(1)} Room`;
      const room = createRoom(roomName, type);
      const project = {
        ...state.project,
        rooms: [...state.project.rooms, room],
      };
      const nextFurniture = room.furniture[0];
      const configuration = nextFurniture.configuration;
      return {
        project,
        activeRoomId: room.id,
        activeFurnitureId: nextFurniture.id,
        configuration,
        history: [cloneConfiguration(configuration)],
        historyIndex: 0,
        lastHistorySnapshot: JSON.stringify(configuration),
        selectedComponentId: null,
        activeAddType: null,
        isDraggingComponent: false,
        hoveredComponentId: null,
        focusComponentId: null,
        componentOpenStates: {},
        reflowToken: 0,
      };
    }),

  renameRoom: (roomId, name) =>
    set((state) => ({
      project: {
        ...state.project,
        rooms: state.project.rooms.map((room) =>
          room.id === roomId ? { ...room, name } : room
        ),
      },
    })),

  setActiveRoom: (roomId) =>
    set((state) => {
      const room = getActiveRoom(state.project, roomId);
      if (!room) return state;
      const furniture = room.furniture[0];
      if (!furniture) return state;
      const configuration = furniture.configuration;
      return {
        activeRoomId: room.id,
        activeFurnitureId: furniture.id,
        configuration,
        history: [cloneConfiguration(configuration)],
        historyIndex: 0,
        lastHistorySnapshot: JSON.stringify(configuration),
        selectedComponentId: null,
        activeAddType: null,
        isDraggingComponent: false,
        hoveredComponentId: null,
        focusComponentId: null,
        componentOpenStates: {},
        reflowToken: 0,
      };
    }),

  addFurniture: (type, name) =>
    set((state) => {
      const room = getActiveRoom(state.project, state.activeRoomId);
      if (!room) return state;
      const itemName = name || `${type.charAt(0).toUpperCase() + type.slice(1)} ${room.furniture.length + 1}`;
      const furniture = createFurnitureItem(itemName, type);
      const project = {
        ...state.project,
        rooms: state.project.rooms.map((entry) =>
          entry.id === room.id
            ? { ...entry, furniture: [...entry.furniture, furniture] }
            : entry
        ),
      };
      const configuration = furniture.configuration;
      return {
        project,
        activeFurnitureId: furniture.id,
        configuration,
        history: [cloneConfiguration(configuration)],
        historyIndex: 0,
        lastHistorySnapshot: JSON.stringify(configuration),
        selectedComponentId: null,
        activeAddType: null,
        isDraggingComponent: false,
        hoveredComponentId: null,
        focusComponentId: null,
        componentOpenStates: {},
        reflowToken: 0,
      };
    }),

  renameFurniture: (furnitureId, name) =>
    set((state) => ({
      project: {
        ...state.project,
        rooms: state.project.rooms.map((room) =>
          room.id === state.activeRoomId
            ? {
                ...room,
                furniture: room.furniture.map((item) =>
                  item.id === furnitureId ? { ...item, name } : item
                ),
              }
            : room
        ),
      },
    })),

  duplicateFurniture: (furnitureId) =>
    set((state) => {
      const room = getActiveRoom(state.project, state.activeRoomId);
      if (!room) return state;
      const item = room.furniture.find((entry) => entry.id === furnitureId);
      if (!item) return state;
      const configuration = cloneConfiguration(item.configuration);
      configuration.id = uuidv4();
      const copy: FurnitureItem = {
        id: uuidv4(),
        name: `${item.name} Copy`,
        type: item.type,
        configuration,
      };
      const project = {
        ...state.project,
        rooms: state.project.rooms.map((entry) =>
          entry.id === room.id
            ? { ...entry, furniture: [...entry.furniture, copy] }
            : entry
        ),
      };
      return {
        project,
        activeFurnitureId: copy.id,
        configuration,
        history: [cloneConfiguration(configuration)],
        historyIndex: 0,
        lastHistorySnapshot: JSON.stringify(configuration),
        selectedComponentId: null,
        activeAddType: null,
        isDraggingComponent: false,
        hoveredComponentId: null,
        focusComponentId: null,
        componentOpenStates: {},
        reflowToken: 0,
      };
    }),

  removeFurniture: (furnitureId) =>
    set((state) => {
      const room = getActiveRoom(state.project, state.activeRoomId);
      if (!room) return state;
      if (room.furniture.length <= 1) return state;
      const nextFurniture = room.furniture.filter(
        (item) => item.id !== furnitureId
      );
      const nextActive =
        furnitureId === state.activeFurnitureId ? nextFurniture[0] : null;
      const project = {
        ...state.project,
        rooms: state.project.rooms.map((entry) =>
          entry.id === room.id ? { ...entry, furniture: nextFurniture } : entry
        ),
      };
      if (!nextActive) {
        return { project };
      }
      const configuration = nextActive.configuration;
      return {
        project,
        activeFurnitureId: nextActive.id,
        configuration,
        history: [cloneConfiguration(configuration)],
        historyIndex: 0,
        lastHistorySnapshot: JSON.stringify(configuration),
        selectedComponentId: null,
        activeAddType: null,
        isDraggingComponent: false,
        hoveredComponentId: null,
        focusComponentId: null,
        componentOpenStates: {},
        reflowToken: 0,
      };
    }),

  combineFurniture: (primaryId, secondaryId, includeDivider = true) =>
    set((state) => {
      if (primaryId === secondaryId) return state;
      const room = getActiveRoom(state.project, state.activeRoomId);
      if (!room) return state;
      const left = room.furniture.find((item) => item.id === primaryId);
      const right = room.furniture.find((item) => item.id === secondaryId);
      if (!left || !right) return state;

      const leftConfig = left.configuration;
      const rightConfig = right.configuration;
      if (
        leftConfig.dimensions.height !== rightConfig.dimensions.height ||
        leftConfig.dimensions.depth !== rightConfig.dimensions.depth
      ) {
        return state;
      }

      const newWidth = leftConfig.dimensions.width + rightConfig.dimensions.width;
      const leftShift = -rightConfig.dimensions.width / 2;
      const rightShift = leftConfig.dimensions.width / 2;
      const combinedComponents = [
        ...leftConfig.components.map((component) => ({
          ...component,
          position: {
            ...component.position,
            x: component.position.x + leftShift,
          },
        })),
        ...rightConfig.components.map((component) => ({
          ...component,
          position: {
            ...component.position,
            x: component.position.x + rightShift,
          },
        })),
      ];

      if (includeDivider) {
        combinedComponents.push({
          id: uuidv4(),
          type: "divider",
          position: { x: 0, y: leftConfig.dimensions.height / 2, z: 0 },
          dimensions: {
            width: 2,
            height: leftConfig.dimensions.height - 2,
            depth: leftConfig.dimensions.depth - 2,
          },
          material: leftConfig.materials.body,
          rotation: { x: 0, y: 0, z: 0 },
        });
      }

      const configuration: WardrobeConfiguration = {
        ...cloneConfiguration(leftConfig),
        id: uuidv4(),
        dimensions: {
          width: newWidth,
          height: leftConfig.dimensions.height,
          depth: leftConfig.dimensions.depth,
        },
        components: normalizeComponents(
          combinedComponents,
          {
            width: newWidth,
            height: leftConfig.dimensions.height,
            depth: leftConfig.dimensions.depth,
          }
        ),
      };

      const combinedItem: FurnitureItem = {
        id: uuidv4(),
        name: `${left.name} + ${right.name}`,
        type: left.type,
        configuration,
        combinedFrom: {
          left: { ...left, configuration: cloneConfiguration(leftConfig) },
          right: { ...right, configuration: cloneConfiguration(rightConfig) },
        },
      };

      const project = {
        ...state.project,
        rooms: state.project.rooms.map((entry) => {
          if (entry.id !== room.id) return entry;
          return {
            ...entry,
            furniture: [
              ...entry.furniture.filter(
                (item) => item.id !== left.id && item.id !== right.id
              ),
              combinedItem,
            ],
          };
        }),
      };

      return {
        project,
        activeFurnitureId: combinedItem.id,
        configuration,
        history: [cloneConfiguration(configuration)],
        historyIndex: 0,
        lastHistorySnapshot: JSON.stringify(configuration),
        selectedComponentId: null,
        activeAddType: null,
        isDraggingComponent: false,
        hoveredComponentId: null,
        focusComponentId: null,
        componentOpenStates: {},
        reflowToken: 0,
      };
    }),

  splitCombinedFurniture: (furnitureId) =>
    set((state) => {
      const room = getActiveRoom(state.project, state.activeRoomId);
      if (!room) return state;
      const item = room.furniture.find((entry) => entry.id === furnitureId);
      if (!item?.combinedFrom) return state;

      const left = item.combinedFrom.left;
      const right = item.combinedFrom.right;
      const leftItem: FurnitureItem = {
        ...left,
        id: uuidv4(),
        configuration: cloneConfiguration(left.configuration),
      };
      const rightItem: FurnitureItem = {
        ...right,
        id: uuidv4(),
        configuration: cloneConfiguration(right.configuration),
      };

      const project = {
        ...state.project,
        rooms: state.project.rooms.map((entry) => {
          if (entry.id !== room.id) return entry;
          return {
            ...entry,
            furniture: [
              ...entry.furniture.filter((entryItem) => entryItem.id !== item.id),
              leftItem,
              rightItem,
            ],
          };
        }),
      };

      const configuration = leftItem.configuration;
      return {
        project,
        activeFurnitureId: leftItem.id,
        configuration,
        history: [cloneConfiguration(configuration)],
        historyIndex: 0,
        lastHistorySnapshot: JSON.stringify(configuration),
        selectedComponentId: null,
        activeAddType: null,
        isDraggingComponent: false,
        hoveredComponentId: null,
        focusComponentId: null,
        componentOpenStates: {},
        reflowToken: 0,
      };
    }),

  setActiveFurniture: (furnitureId) =>
    set((state) => {
      const room = getActiveRoom(state.project, state.activeRoomId);
      if (!room) return state;
      const furniture = getActiveFurniture(room, furnitureId);
      if (!furniture) return state;
      const configuration = furniture.configuration;
      return {
        activeFurnitureId: furniture.id,
        configuration,
        history: [cloneConfiguration(configuration)],
        historyIndex: 0,
        lastHistorySnapshot: JSON.stringify(configuration),
        selectedComponentId: null,
        activeAddType: null,
        isDraggingComponent: false,
        hoveredComponentId: null,
        focusComponentId: null,
        componentOpenStates: {},
        reflowToken: 0,
      };
    }),

  // Set wardrobe type and update dimensions to default for that type
  setWardrobeType: (type) =>
    set((state) => {
      const configuration = {
        ...state.configuration,
        type,
        dimensions: defaultDimensions[type],
      };
      const project = updateProjectConfiguration(
        state.project,
        state.activeRoomId,
        state.activeFurnitureId,
        configuration
      );
      return {
        project,
        configuration,
        ...recordHistory(state, configuration),
      };
    }),

  // Update dimensions
  setDimensions: (dimensions) =>
    set((state) => {
      const configuration = {
        ...state.configuration,
        dimensions: {
          ...state.configuration.dimensions,
          ...dimensions,
        },
      };
      const project = updateProjectConfiguration(
        state.project,
        state.activeRoomId,
        state.activeFurnitureId,
        configuration
      );
      return {
        project,
        configuration,
        ...recordHistory(state, configuration),
      };
    }),

  // Add a new component
  addComponent: (component) =>
    set((state) => {
      const nextComponent = { ...component, id: uuidv4() };
      const wardrobeWidth = state.configuration.dimensions.width;

      if (component.type !== "divider") {
        let constrained = constrainComponentToSections(
          nextComponent,
          state.configuration.components,
          wardrobeWidth
        );

        if (component.type === "shelf") {
          const sections = getDividerSections(
            state.configuration.components,
            wardrobeWidth
          );
          const shelfSectionIndex = getDrawerSectionIndex(
            constrained,
            sections
          );
          const drawersInSection = state.configuration.components.filter(
            (item) => {
              if (item.type !== "drawer") return false;
              if (shelfSectionIndex === -1) return true;
              const itemSectionIndex = getDrawerSectionIndex(item, sections);
              return itemSectionIndex === shelfSectionIndex;
            }
          );
          const resolvedY = resolveShelfY(
            constrained.position.y,
            constrained.dimensions.height,
            drawersInSection,
            state.configuration.dimensions.height
          );

          if (resolvedY === null) {
            return state;
          }

          constrained = {
            ...constrained,
            position: { ...constrained.position, y: resolvedY },
          };
        }

        if (component.type === "drawer") {
          const sections = getDividerSections(
            state.configuration.components,
            wardrobeWidth
          );
          if (sections.length > 0) {
            const selectedComponent = state.configuration.components.find(
              (item) => item.id === state.selectedComponentId
            );
            const activeX =
              selectedComponent?.position.x ?? constrained.position.x;
            const activeIndex = getSectionIndexForX(activeX, sections);
            const targetIndex =
              activeIndex >= 0 ? activeIndex : getWidestSectionIndex(sections);
            constrained = placeComponentInSection(
              constrained,
              sections[targetIndex]
            );
          }

          const drawerSectionIndex = getDrawerSectionIndex(
            constrained,
            sections
          );
          const otherDrawers = state.configuration.components.filter((item) => {
            if (item.type !== "drawer") return false;
            if (drawerSectionIndex === -1) return true;
            const itemSectionIndex = getDrawerSectionIndex(item, sections);
            return itemSectionIndex === drawerSectionIndex;
          });

          const shelvesInSection = state.configuration.components.filter(
            (item) =>
              item.type === "shelf" &&
              (drawerSectionIndex === -1
                ? true
                : getDrawerSectionIndex(item, sections) === drawerSectionIndex)
          );

          const resolvedY = resolveDrawerY(
            constrained.position.y,
            constrained.dimensions.height,
            otherDrawers,
            shelvesInSection,
            state.configuration.dimensions.height
          );

          if (resolvedY === null) {
            return state;
          }

          constrained = {
            ...constrained,
            position: { ...constrained.position, y: resolvedY },
          };
        }
        const configuration = {
          ...state.configuration,
          components: [...state.configuration.components, constrained],
        };
        const project = updateProjectConfiguration(
          state.project,
          state.activeRoomId,
          state.activeFurnitureId,
          configuration
        );
        return {
          project,
          configuration,
          ...recordHistory(state, configuration),
        };
      }

      const dividerX = component.position.x;
      const dividerWidth = component.dimensions.width || 2;
      const updatedComponents = state.configuration.components.flatMap((item) =>
        adjustComponentForDivider(item, dividerX, dividerWidth, wardrobeWidth)
      );
      const normalized = normalizeComponents(
        [...updatedComponents, nextComponent],
        state.configuration.dimensions
      );

      const configuration = {
        ...state.configuration,
        components: normalized,
      };
      const project = updateProjectConfiguration(
        state.project,
        state.activeRoomId,
        state.activeFurnitureId,
        configuration
      );
      return {
        project,
        configuration,
        ...recordHistory(state, configuration),
        reflowToken: Date.now(),
        componentOpenStates: {},
      };
    }),

  // Remove a component
  removeComponent: (id) =>
    set((state) => {
      const filtered = state.configuration.components.filter(
        (component) => component.id !== id
      );
      const normalized = normalizeComponents(
        filtered,
        state.configuration.dimensions
      );
      const configuration = {
        ...state.configuration,
        components: normalized,
      };
      const project = updateProjectConfiguration(
        state.project,
        state.activeRoomId,
        state.activeFurnitureId,
        configuration
      );
      const { [id]: removed, ...remainingOpenStates } = state.componentOpenStates;
      void removed;
      return {
        project,
        configuration,
        selectedComponentId:
          state.selectedComponentId === id ? null : state.selectedComponentId,
        componentOpenStates: remainingOpenStates,
        ...recordHistory(state, configuration),
      };
    }),

  // Update a component
  updateComponent: (id, updates) =>
    set((state) => {
      const wardrobeWidth = state.configuration.dimensions.width;
      const nextComponents = state.configuration.components.map((component) => {
        if (component.id !== id) return component;
        const nextComponent = constrainComponentToSections(
          { ...component, ...updates },
          state.configuration.components,
          wardrobeWidth
        );

        if (nextComponent.type === "shelf") {
          const sections = getDividerSections(
            state.configuration.components,
            wardrobeWidth
          );
          const shelfSectionIndex = getDrawerSectionIndex(
            nextComponent,
            sections
          );
          const drawersInSection = state.configuration.components.filter(
            (item) => {
              if (item.type !== "drawer") return false;
              if (shelfSectionIndex === -1) return true;
              const itemSectionIndex = getDrawerSectionIndex(item, sections);
              return itemSectionIndex === shelfSectionIndex;
            }
          );
          const resolvedY = resolveShelfY(
            nextComponent.position.y,
            nextComponent.dimensions.height,
            drawersInSection,
            state.configuration.dimensions.height
          );
          if (resolvedY === null) {
            return component;
          }

          return {
            ...nextComponent,
            position: { ...nextComponent.position, y: resolvedY },
          };
        }

        if (nextComponent.type !== "drawer") {
          return nextComponent;
        }

        const sections = getDividerSections(
          state.configuration.components,
          wardrobeWidth
        );
        const drawerSectionIndex = getDrawerSectionIndex(
          nextComponent,
          sections
        );
        const otherDrawers = state.configuration.components.filter((item) => {
          if (item.type !== "drawer" || item.id === id) return false;
          if (drawerSectionIndex === -1) return true;
          const itemSectionIndex = getDrawerSectionIndex(item, sections);
          return itemSectionIndex === drawerSectionIndex;
        });
        const shelvesInSection = state.configuration.components.filter(
          (item) => {
            if (item.type !== "shelf") return false;
            if (drawerSectionIndex === -1) return true;
            const itemSectionIndex = getDrawerSectionIndex(item, sections);
            return itemSectionIndex === drawerSectionIndex;
          }
        );

        const resolvedY = resolveDrawerY(
          nextComponent.position.y,
          nextComponent.dimensions.height,
          otherDrawers,
          shelvesInSection,
          state.configuration.dimensions.height
        );

        if (resolvedY === null) {
          return component;
        }

        return {
          ...nextComponent,
          position: { ...nextComponent.position, y: resolvedY },
        };
      });

      const configuration = {
        ...state.configuration,
        components: nextComponents,
      };
      const project = updateProjectConfiguration(
        state.project,
        state.activeRoomId,
        state.activeFurnitureId,
        configuration
      );

      return {
        project,
        configuration,
        ...(state.isDraggingComponent
          ? {}
          : recordHistory(state, configuration)),
      };
    }),

  setSelectedComponent: (id) => set({ selectedComponentId: id }),
  setDraggingComponent: (isDragging) =>
    set({ isDraggingComponent: isDragging }),
  setActiveAddType: (type) => set({ activeAddType: type }),
  setHoveredComponentId: (id) => set({ hoveredComponentId: id }),
  setFocusComponentId: (id) => set({ focusComponentId: id }),
  setComponentOpen: (id, isOpen) =>
    set((state) => ({
      componentOpenStates: {
        ...state.componentOpenStates,
        [id]: isOpen,
      },
    })),
  toggleComponentOpen: (id) =>
    set((state) => ({
      componentOpenStates: {
        ...state.componentOpenStates,
        [id]: !state.componentOpenStates[id],
      },
    })),
  closeAllOpen: () => set({ componentOpenStates: {} }),
  commitHistory: () =>
    set((state) => ({
      ...recordHistory(state, state.configuration),
    })),
  undo: () =>
    set((state) => {
      if (state.historyIndex <= 0) return state;
      const historyIndex = state.historyIndex - 1;
      const configuration = cloneConfiguration(state.history[historyIndex]);
      const project = updateProjectConfiguration(
        state.project,
        state.activeRoomId,
        state.activeFurnitureId,
        configuration
      );
      return {
        project,
        configuration,
        historyIndex,
        lastHistorySnapshot: JSON.stringify(configuration),
        selectedComponentId: null,
        isDraggingComponent: false,
        activeAddType: null,
        hoveredComponentId: null,
        focusComponentId: null,
        componentOpenStates: {},
        reflowToken: 0,
      };
    }),
  redo: () =>
    set((state) => {
      if (state.historyIndex >= state.history.length - 1) return state;
      const historyIndex = state.historyIndex + 1;
      const configuration = cloneConfiguration(state.history[historyIndex]);
      const project = updateProjectConfiguration(
        state.project,
        state.activeRoomId,
        state.activeFurnitureId,
        configuration
      );
      return {
        project,
        configuration,
        historyIndex,
        lastHistorySnapshot: JSON.stringify(configuration),
        selectedComponentId: null,
        isDraggingComponent: false,
        activeAddType: null,
        hoveredComponentId: null,
        focusComponentId: null,
        componentOpenStates: {},
        reflowToken: 0,
      };
    }),

  // Set material for a specific part
  setMaterial: (part, materialId) =>
    set((state) => {
      const configuration = {
        ...state.configuration,
        materials: {
          ...state.configuration.materials,
          [part]: materialId,
        },
      };
      const project = updateProjectConfiguration(
        state.project,
        state.activeRoomId,
        state.activeFurnitureId,
        configuration
      );
      return {
        project,
        configuration,
        ...recordHistory(state, configuration),
      };
    }),

  // Calculate the total price
  calculatePrice: () => {
    const state = get();
    const { configuration, availableMaterials } = state;

    // Base price based on dimensions
    const volumePrice =
      configuration.dimensions.width *
      configuration.dimensions.height *
      configuration.dimensions.depth *
      0.01;

    // Materials price
    const bodyMaterial = availableMaterials.find(
      (m) => m.id === configuration.materials.body
    );
    const doorsMaterial = availableMaterials.find(
      (m) => m.id === configuration.materials.doors
    );
    const handlesMaterial = availableMaterials.find(
      (m) => m.id === configuration.materials.handles
    );

    const materialsPrice =
      (bodyMaterial?.price || 0) +
      (doorsMaterial?.price || 0) +
      (handlesMaterial?.price || 0);

    // Components price (simplified)
    const componentsPrice = configuration.components.length * 50;

    // Total price
    const totalPrice = volumePrice + materialsPrice + componentsPrice;

    // Update the price in the configuration
    set((state) => {
      const configuration = {
        ...state.configuration,
        price: Math.round(totalPrice),
      };
      const project = updateProjectConfiguration(
        state.project,
        state.activeRoomId,
        state.activeFurnitureId,
        configuration
      );
      return {
        project,
        configuration,
      };
    });

    return Math.round(totalPrice);
  },

  // Reset to default configuration
  resetConfiguration: () =>
    set((state) => {
      const configuration = createDefaultConfiguration();
      const project = updateProjectConfiguration(
        state.project,
        state.activeRoomId,
        state.activeFurnitureId,
        configuration
      );
      return {
        project,
        configuration,
        selectedComponentId: null,
        isDraggingComponent: false,
        activeAddType: null,
        hoveredComponentId: null,
        focusComponentId: null,
        componentOpenStates: {},
        reflowToken: 0,
        history: [cloneConfiguration(configuration)],
        historyIndex: 0,
        lastHistorySnapshot: JSON.stringify(configuration),
      };
    }),

  // Load a saved configuration
  loadConfiguration: (config) => {
    if ("rooms" in config) {
      const incomingProject = config as Project;
      const fallbackRoom = createRoom("Bedroom", "bedroom");
      const project: Project =
        incomingProject.rooms?.length > 0
          ? incomingProject
          : { ...incomingProject, rooms: [fallbackRoom] };
      const room = project.rooms[0];
      const fallbackFurniture = createFurnitureItem("Wardrobe 1", "wardrobe");
      const hasFurniture = room.furniture.length > 0;
      const furniture = hasFurniture ? room.furniture[0] : fallbackFurniture;
      const normalizedProject = hasFurniture
        ? project
        : {
            ...project,
            rooms: project.rooms.map((entry, index) =>
              index === 0 ? { ...entry, furniture: [fallbackFurniture] } : entry
            ),
          };
      const configuration =
        furniture.configuration ?? createDefaultConfiguration();

      set({
        project: normalizedProject,
        activeRoomId: room.id,
        activeFurnitureId: furniture.id,
        configuration,
        selectedComponentId: null,
        activeAddType: null,
        isDraggingComponent: false,
        hoveredComponentId: null,
        focusComponentId: null,
        componentOpenStates: {},
        reflowToken: 0,
        history: [cloneConfiguration(configuration)],
        historyIndex: 0,
        lastHistorySnapshot: JSON.stringify(configuration),
      });

      get().calculatePrice();
      return;
    }

    const configurationToLoad = config as WardrobeConfiguration;
    const validConfig = {
      ...configurationToLoad,
      id: configurationToLoad.id || uuidv4(),
      type: Object.keys(defaultDimensions).includes(configurationToLoad.type)
        ? (configurationToLoad.type as WardrobeType)
        : "standard",
      dimensions: {
        width:
          configurationToLoad.dimensions?.width ||
          defaultDimensions["standard"].width,
        height:
          configurationToLoad.dimensions?.height ||
          defaultDimensions["standard"].height,
        depth:
          configurationToLoad.dimensions?.depth ||
          defaultDimensions["standard"].depth,
      },
      components: Array.isArray(configurationToLoad.components)
        ? configurationToLoad.components
        : [],
      materials: {
        body: configurationToLoad.materials?.body || "mat1",
        doors: configurationToLoad.materials?.doors || "mat2",
        handles: configurationToLoad.materials?.handles || "mat6",
      },
      price: 0,
    };

    set((state) => ({
      project: updateProjectConfiguration(
        state.project,
        state.activeRoomId,
        state.activeFurnitureId,
        validConfig
      ),
      configuration: validConfig,
      selectedComponentId: null,
      activeAddType: null,
      isDraggingComponent: false,
      hoveredComponentId: null,
      focusComponentId: null,
      componentOpenStates: {},
      reflowToken: 0,
      history: [cloneConfiguration(validConfig)],
      historyIndex: 0,
      lastHistorySnapshot: JSON.stringify(validConfig),
    }));

    get().calculatePrice();
  },
}));

export default useWardrobeStore;
