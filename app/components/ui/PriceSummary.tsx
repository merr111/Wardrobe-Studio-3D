"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
} from "@heroicons/react/24/outline";
import useWardrobeStore from "../../store/wardrobeStore";
import { Project, WardrobeConfiguration } from "../../types/wardrobe";
import { generateCutList } from "../utils/cutlistGenerator";
import { exportCutListCSV } from "../utils/exportCutListCSV";
import { downloadFile } from "../utils/downloadFile";

const PriceSummary: React.FC = () => {
  const { configuration, calculatePrice, loadConfiguration, project, activeRoomId, activeFurnitureId } =
    useWardrobeStore();
  const { price, type, dimensions, components } = configuration;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const totalRooms = project.rooms.length;
  const totalFurniture = project.rooms.reduce(
    (sum, room) => sum + room.furniture.length,
    0
  );
  const projectTotal = project.rooms.reduce(
    (sum, room) =>
      sum +
      room.furniture.reduce((roomSum, item) => roomSum + (item.configuration.price || 0), 0),
    0
  );
  const activeRoom = project.rooms.find((room) => room.id === activeRoomId);
  const activeFurniture = activeRoom?.furniture.find(
    (item) => item.id === activeFurnitureId
  );

  // Recalculate price when configuration changes
  useEffect(() => {
    calculatePrice();
  }, [type, dimensions, components, calculatePrice]);

  // Function to save the current design as a JSON file
  const handleSaveDesign = () => {
    // Create a JSON blob from the current configuration
    const configToSave = {
      ...project,
      savedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(configToSave, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    // Create a temporary link element to trigger the download
    const link = document.createElement("a");
    link.href = url;
    link.download = `project-${project.id.slice(0, 8)}.json`;
    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyShareLink = async () => {
    try {
      const encoded = btoa(JSON.stringify(project));
      const url = `${window.location.origin}${window.location.pathname}?project=${encodeURIComponent(encoded)}`;
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy share link:", error);
      alert("Unable to copy share link. Please try again.");
    }
  };

  const handlePrintSummary = () => {
    window.print();
  };

  // Function to trigger the file input click
  const handleLoadButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Function to handle the file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const loadedConfig = JSON.parse(content) as
          | WardrobeConfiguration
          | Project;
        loadConfiguration(loadedConfig);

        // Reset the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch (error) {
        console.error("Error loading design:", error);
        alert(
          "Failed to load design. The file might be corrupted or in an invalid format."
        );
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="w-full rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">Price Summary</h2>

      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-700">Active furniture:</span>
          <span className="font-medium text-gray-900">
            {activeFurniture?.name || type.charAt(0).toUpperCase() + type.slice(1)}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-700">Dimensions:</span>
          <span className="font-medium text-gray-900">
            {dimensions.width} × {dimensions.height} × {dimensions.depth} cm
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-700">Components:</span>
          <span className="font-medium text-gray-900">{components.length}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-700">Rooms:</span>
          <span className="font-medium text-gray-900">{totalRooms}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-700">Furniture items:</span>
          <span className="font-medium text-gray-900">{totalFurniture}</span>
        </div>

        <div className="border-t border-gray-200 pt-2 mt-2">
          <div className="flex justify-between text-lg">
            <span className="font-semibold text-gray-800">Active item:</span>
            <span className="font-bold text-slate-900">${price}</span>
          </div>
          <div className="mt-1 flex justify-between text-sm text-slate-600">
            <span>Project total:</span>
            <span className="font-semibold text-slate-700">${projectTotal}</span>
          </div>
        </div>
        <button
          onClick={() => {
            const cutList = generateCutList(configuration);
            const csv = exportCutListCSV(cutList);
            downloadFile(csv, `cutlist-${configuration.id.slice(0, 8)}.csv`);
          }}
          className="w-full py-2 flex items-center justify-center gap-2 rounded-full bg-slate-900 text-white transition hover:bg-slate-800"
        >
          Download Cut List (CSV)
        </button>
      </div>

      <div className="mt-4 space-y-2">
        <button
          onClick={handleSaveDesign}
          className="w-full py-2 flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-300"
        >
          <ArrowDownTrayIcon className="h-5 w-5" />
          <span>Save Project</span>
        </button>

        <button
          onClick={handleLoadButtonClick}
          className="w-full py-2 flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-300"
        >
          <ArrowUpTrayIcon className="h-5 w-5" />
          <span>Load Project</span>
        </button>
        <button
          onClick={handleCopyShareLink}
          className="w-full py-2 flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-300"
        >
          {shareCopied ? "Share Link Copied" : "Copy Share Link"}
        </button>
        <button
          onClick={handlePrintSummary}
          className="w-full py-2 flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-300"
        >
          Print Summary
        </button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json"
          className="hidden"
        />
      </div>
    </div>
  );
};

export default PriceSummary;
