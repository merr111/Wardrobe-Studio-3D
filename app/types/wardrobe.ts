export type WardrobeType = 'standard' | 'corner' | 'sliding' | 'walk-in';

export type Material = {
  id: string;
  name: string;
  color: string;
  texture?: string;
  price: number;
};

export type WardrobeDimensions = {
  width: number;
  height: number;
  depth: number;
};

export type WardrobeComponent = {
  id: string;
  type: 'shelf' | 'drawer' | 'rail' | 'door' | 'divider' | 'shoe_rack' | 'trouser_rack' | 'tie_rack' | 'mirror' | 'lighting' | 'jewelry_tray' | 'pull_out';
  position: {
    x: number;
    y: number;
    z: number;
  };
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  material: string; // Material ID
  drawerVariant?: 'standard' | 'full-extension' | 'inner';
  drawerSoftClose?: boolean;
  drawerPushToOpen?: boolean;
  doorVariant?: 'hinged-left' | 'hinged-right' | 'hinged-double' | 'sliding';
  doorSoftClose?: boolean;
  doorPushToOpen?: boolean;
  doorMirror?: boolean;
  rotation?: {
    x: number;
    y: number;
    z: number;
  };
};

export type WardrobeConfiguration = {
  id: string;
  type: WardrobeType;
  dimensions: WardrobeDimensions;
  components: WardrobeComponent[];
  materials: {
    body: string; // Material ID
    doors: string; // Material ID
    handles: string; // Material ID
  };
  price: number;
};

export type RoomType = 'bedroom' | 'kitchen' | 'living' | 'hallway' | 'custom';

export type FurnitureType = 'wardrobe' | 'cabinet' | 'sideboard' | 'shelving';

export type FurnitureItem = {
  id: string;
  name: string;
  type: FurnitureType;
  configuration: WardrobeConfiguration;
  combinedFrom?: {
    left: FurnitureItem;
    right: FurnitureItem;
  };
};

export type Room = {
  id: string;
  name: string;
  type: RoomType;
  dimensions?: {
    width: number;
    length: number;
    height: number;
  };
  furniture: FurnitureItem[];
};

export type Project = {
  id: string;
  name: string;
  rooms: Room[];
}; 
