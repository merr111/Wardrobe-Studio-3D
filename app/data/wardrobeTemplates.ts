"use client";

import { v4 as uuidv4 } from "uuid";
import { RoomType, WardrobeConfiguration } from "../types/wardrobe";

// Template wardrobe configurations
export const wardrobeTemplates: {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  roomTypes: RoomType[];
  configuration: Omit<WardrobeConfiguration, "id">;
}[] = [
  {
    id: "template-minimalist",
    name: "Minimalist Wardrobe",
    description:
      "A clean, simple design with essential storage for a minimalist lifestyle.",
    imageUrl: "/images/templates/minimalist.png",
    roomTypes: ["bedroom", "hallway", "custom"],
    configuration: {
      type: "standard",
      dimensions: { width: 200, height: 220, depth: 60 },
      components: [
        // Rail for hanging clothes
        {
          id: uuidv4(),
          type: "rail",
          position: { x: -49, y: 180, z: 0 },
          dimensions: { width: 100, height: 5, depth: 55 },
          material: "mat6",
          rotation: { x: 90, y: 0, z: 90 },
        },
        // Shelves for folded items
        {
          id: uuidv4(),
          type: "shelf",
          position: { x: 51, y: 60, z: 0 },
          dimensions: { width: 95, height: 2, depth: 55 },
          material: "mat5",
          rotation: { x: 0, y: 0, z: 0 },
        },
        {
          id: uuidv4(),
          type: "shelf",
          position: { x: 51, y: 120, z: 0 },
          dimensions: { width: 95, height: 2, depth: 55 },
          material: "mat5",
          rotation: { x: 0, y: 0, z: 0 },
        },
        {
          id: uuidv4(),
          type: "shelf",
          position: { x: 51, y: 180, z: 0 },
          dimensions: { width: 95, height: 2, depth: 55 },
          material: "mat5",
          rotation: { x: 0, y: 0, z: 0 },
        },
        // Drawers
        {
          id: uuidv4(),
          type: "drawer",
          position: { x: -49, y: 40, z: 0 },
          dimensions: { width: 100, height: 20, depth: 55 },
          material: "mat5",
          rotation: { x: 0, y: 0, z: 0 },
        },
        {
          id: uuidv4(),
          type: "drawer",
          position: { x: -49, y: 65, z: 0 },
          dimensions: { width: 100, height: 20, depth: 55 },
          material: "mat5",
          rotation: { x: 0, y: 0, z: 0 },
        },
        // Center divider
        {
          id: uuidv4(),
          type: "divider",
          position: { x: 2, y: 110, z: 0 },
          dimensions: { width: 2, height: 218, depth: 55 },
          material: "mat5",
          rotation: { x: 0, y: 0, z: 0 },
        },
        // Additional shelf
        {
          id: uuidv4(),
          type: "shelf",
          position: { x: -49, y: 80, z: 0 },
          dimensions: { width: 100, height: 2, depth: 50 },
          material: "mat5",
          rotation: { x: 0, y: 0, z: 0 },
        },
      ],
      materials: {
        body: "mat5",
        doors: "mat5",
        handles: "mat6",
      },
      price: 0,
    },
  },
  {
    id: "template-double-hang",
    name: "Classic Double Hang",
    description:
      "A practical wardrobe with double hanging rails and top storage shelves.",
    imageUrl: "/images/templates/minimalist.png",
    roomTypes: ["bedroom", "custom"],
    configuration: {
      type: "standard",
      dimensions: { width: 200, height: 220, depth: 60 },
      components: [
        // Top hanging rail
        {
          id: uuidv4(),
          type: "rail",
          position: { x: -50, y: 160, z: 0 },
          dimensions: { width: 100, height: 5, depth: 55 },
          material: "mat6",
          rotation: { x: 90, y: 0, z: 90 },
        },
        // Bottom hanging rail
        {
          id: uuidv4(),
          type: "rail",
          position: { x: -50, y: 90, z: 0 },
          dimensions: { width: 100, height: 5, depth: 55 },
          material: "mat6",
          rotation: { x: 90, y: 0, z: 90 },
        },
        // Right side shelves
        {
          id: uuidv4(),
          type: "shelf",
          position: { x: 50, y: 60, z: 0 },
          dimensions: { width: 95, height: 2, depth: 55 },
          material: "mat5",
          rotation: { x: 0, y: 0, z: 0 },
        },
        {
          id: uuidv4(),
          type: "shelf",
          position: { x: 50, y: 120, z: 0 },
          dimensions: { width: 95, height: 2, depth: 55 },
          material: "mat5",
          rotation: { x: 0, y: 0, z: 0 },
        },
        {
          id: uuidv4(),
          type: "shelf",
          position: { x: 50, y: 180, z: 0 },
          dimensions: { width: 95, height: 2, depth: 55 },
          material: "mat5",
          rotation: { x: 0, y: 0, z: 0 },
        },
        // Top shelf across full width
        {
          id: uuidv4(),
          type: "shelf",
          position: { x: 0, y: 210, z: 0 },
          dimensions: { width: 198, height: 2, depth: 55 },
          material: "mat5",
          rotation: { x: 0, y: 0, z: 0 },
        },
        {
          id: uuidv4(),
          type: "divider",
          position: { x: 0, y: 110, z: 0 },
          dimensions: { width: 2, height: 218, depth: 55 },
          material: "mat5",
          rotation: { x: 0, y: 0, z: 0 },
        },
      ],
      materials: {
        body: "mat5",
        doors: "mat5",
        handles: "mat6",
      },
      price: 0,
    },
  },
  {
    id: "template-kitchen-base",
    name: "Base Cabinet Drawers",
    description: "A kitchen base cabinet with deep drawers and soft-close fronts.",
    imageUrl: "/images/templates/minimalist.png",
    roomTypes: ["kitchen", "custom"],
    configuration: {
      type: "standard",
      dimensions: { width: 120, height: 90, depth: 60 },
      components: [
        {
          id: uuidv4(),
          type: "drawer",
          position: { x: 0, y: 25, z: 0 },
          dimensions: { width: 110, height: 22, depth: 55 },
          material: "mat2",
          rotation: { x: 0, y: 0, z: 0 },
        },
        {
          id: uuidv4(),
          type: "drawer",
          position: { x: 0, y: 50, z: 0 },
          dimensions: { width: 110, height: 22, depth: 55 },
          material: "mat2",
          rotation: { x: 0, y: 0, z: 0 },
        },
        {
          id: uuidv4(),
          type: "drawer",
          position: { x: 0, y: 75, z: 0 },
          dimensions: { width: 110, height: 22, depth: 55 },
          material: "mat2",
          rotation: { x: 0, y: 0, z: 0 },
        },
      ],
      materials: {
        body: "mat5",
        doors: "mat2",
        handles: "mat6",
      },
      price: 0,
    },
  },
  {
    id: "template-kitchen-wall",
    name: "Wall Cabinet Double Door",
    description: "A compact wall cabinet with adjustable shelves.",
    imageUrl: "/images/templates/minimalist.png",
    roomTypes: ["kitchen", "custom"],
    configuration: {
      type: "standard",
      dimensions: { width: 90, height: 70, depth: 40 },
      components: [
        {
          id: uuidv4(),
          type: "shelf",
          position: { x: 0, y: 30, z: 0 },
          dimensions: { width: 86, height: 2, depth: 36 },
          material: "mat1",
          rotation: { x: 0, y: 0, z: 0 },
        },
        {
          id: uuidv4(),
          type: "shelf",
          position: { x: 0, y: 50, z: 0 },
          dimensions: { width: 86, height: 2, depth: 36 },
          material: "mat1",
          rotation: { x: 0, y: 0, z: 0 },
        },
        {
          id: uuidv4(),
          type: "door",
          position: { x: -22, y: 35, z: 20 },
          dimensions: { width: 44, height: 66, depth: 2 },
          material: "mat1",
          rotation: { x: 0, y: 0, z: 0 },
        },
        {
          id: uuidv4(),
          type: "door",
          position: { x: 22, y: 35, z: 20 },
          dimensions: { width: 44, height: 66, depth: 2 },
          material: "mat1",
          rotation: { x: 0, y: 0, z: 0 },
        },
      ],
      materials: {
        body: "mat1",
        doors: "mat1",
        handles: "mat6",
      },
      price: 0,
    },
  },
  {
    id: "template-kitchen-pantry",
    name: "Tall Pantry Cabinet",
    description: "Full-height pantry with shelves and a pull-out basket.",
    imageUrl: "/images/templates/minimalist.png",
    roomTypes: ["kitchen", "custom"],
    configuration: {
      type: "standard",
      dimensions: { width: 80, height: 220, depth: 60 },
      components: [
        {
          id: uuidv4(),
          type: "shelf",
          position: { x: 0, y: 60, z: 0 },
          dimensions: { width: 76, height: 2, depth: 55 },
          material: "mat5",
          rotation: { x: 0, y: 0, z: 0 },
        },
        {
          id: uuidv4(),
          type: "shelf",
          position: { x: 0, y: 110, z: 0 },
          dimensions: { width: 76, height: 2, depth: 55 },
          material: "mat5",
          rotation: { x: 0, y: 0, z: 0 },
        },
        {
          id: uuidv4(),
          type: "shelf",
          position: { x: 0, y: 160, z: 0 },
          dimensions: { width: 76, height: 2, depth: 55 },
          material: "mat5",
          rotation: { x: 0, y: 0, z: 0 },
        },
        {
          id: uuidv4(),
          type: "pull_out",
          position: { x: 0, y: 30, z: 20 },
          dimensions: { width: 70, height: 18, depth: 40 },
          material: "mat5",
          rotation: { x: 0, y: 0, z: 0 },
        },
        {
          id: uuidv4(),
          type: "door",
          position: { x: 0, y: 110, z: 30 },
          dimensions: { width: 76, height: 210, depth: 2 },
          material: "mat5",
          rotation: { x: 0, y: 0, z: 0 },
        },
      ],
      materials: {
        body: "mat5",
        doors: "mat5",
        handles: "mat6",
      },
      price: 0,
    },
  },
  {
    id: "template-living-sideboard",
    name: "Living Room Sideboard",
    description: "Low storage sideboard with sliding fronts and open shelves.",
    imageUrl: "/images/templates/minimalist.png",
    roomTypes: ["living", "custom"],
    configuration: {
      type: "standard",
      dimensions: { width: 180, height: 80, depth: 45 },
      components: [
        {
          id: uuidv4(),
          type: "shelf",
          position: { x: -45, y: 40, z: 0 },
          dimensions: { width: 80, height: 2, depth: 40 },
          material: "mat3",
          rotation: { x: 0, y: 0, z: 0 },
        },
        {
          id: uuidv4(),
          type: "shelf",
          position: { x: 45, y: 40, z: 0 },
          dimensions: { width: 80, height: 2, depth: 40 },
          material: "mat3",
          rotation: { x: 0, y: 0, z: 0 },
        },
        {
          id: uuidv4(),
          type: "door",
          position: { x: -45, y: 40, z: 22 },
          dimensions: { width: 80, height: 70, depth: 2 },
          material: "mat3",
          rotation: { x: 0, y: 0, z: 0 },
        },
        {
          id: uuidv4(),
          type: "door",
          position: { x: 45, y: 40, z: 22 },
          dimensions: { width: 80, height: 70, depth: 2 },
          material: "mat3",
          rotation: { x: 0, y: 0, z: 0 },
        },
      ],
      materials: {
        body: "mat3",
        doors: "mat3",
        handles: "mat6",
      },
      price: 0,
    },
  },
  {
    id: "template-hallway-storage",
    name: "Hallway Storage Tower",
    description: "Slim storage unit with shelves and mirror front.",
    imageUrl: "/images/templates/minimalist.png",
    roomTypes: ["hallway", "custom"],
    configuration: {
      type: "standard",
      dimensions: { width: 70, height: 200, depth: 50 },
      components: [
        {
          id: uuidv4(),
          type: "shelf",
          position: { x: 0, y: 70, z: 0 },
          dimensions: { width: 64, height: 2, depth: 45 },
          material: "mat1",
          rotation: { x: 0, y: 0, z: 0 },
        },
        {
          id: uuidv4(),
          type: "shelf",
          position: { x: 0, y: 120, z: 0 },
          dimensions: { width: 64, height: 2, depth: 45 },
          material: "mat1",
          rotation: { x: 0, y: 0, z: 0 },
        },
        {
          id: uuidv4(),
          type: "mirror",
          position: { x: 0, y: 130, z: 25 },
          dimensions: { width: 60, height: 120, depth: 2 },
          material: "mat1",
          rotation: { x: 0, y: 0, z: 0 },
        },
      ],
      materials: {
        body: "mat1",
        doors: "mat1",
        handles: "mat6",
      },
      price: 0,
    },
  },
];

export default wardrobeTemplates;
