// src/utils/cutlistGenerator.ts

export type CutItem = {
  part: string;
  width: number; // mm
  height: number; // mm
  quantity: number;
};

const CM_TO_MM = 10;
const PANEL_THICKNESS = 18; // mm

export function generateCutList(config: any): CutItem[] {
  const rawItems: CutItem[] = [];

  config.components.forEach((component: any) => {
    const w = component.dimensions.width * CM_TO_MM;
    const h = component.dimensions.height * CM_TO_MM;
    const d = component.dimensions.depth * CM_TO_MM;

    switch (component.type) {
      case "shelf":
        rawItems.push({
          part: "Shelf",
          width: w,
          height: d,
          quantity: 1,
        });
        break;

      case "divider":
        rawItems.push({
          part: "Vertical Divider",
          width: h,
          height: d,
          quantity: 1,
        });
        break;

      case "door":
        rawItems.push({
          part: "Door Panel",
          width: w,
          height: h,
          quantity: 1,
        });
        break;

      case "drawer":
        rawItems.push(
          { part: "Drawer Front", width: w, height: h, quantity: 1 },
          { part: "Drawer Back", width: w, height: h, quantity: 1 },
          { part: "Drawer Side", width: d, height: h, quantity: 2 },
          {
            part: "Drawer Bottom",
            width: w - 2 * PANEL_THICKNESS,
            height: d - 2 * PANEL_THICKNESS,
            quantity: 1,
          }
        );
        break;

      default:
        // rails, lighting, accessories → no panels
        break;
    }
  });

  return mergeSamePanels(rawItems);
}

function mergeSamePanels(items: CutItem[]): CutItem[] {
  const map = new Map<string, CutItem>();

  items.forEach((item) => {
    const key = `${item.part}-${item.width}x${item.height}`;
    if (!map.has(key)) {
      map.set(key, { ...item });
    } else {
      map.get(key)!.quantity += item.quantity;
    }
  });

  return Array.from(map.values());
}
