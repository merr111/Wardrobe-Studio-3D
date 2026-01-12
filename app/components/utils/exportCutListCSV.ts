// src/utils/exportCutListCSV.ts
import { CutItem } from "./cutlistGenerator";

export function exportCutListCSV(items: CutItem[]): string {
  const header = "Part,Width (mm),Height (mm),Quantity\n";

  const rows = items
    .map((i) => `${i.part},${i.width},${i.height},${i.quantity}`)
    .join("\n");

  return header + rows;
}
