"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import WardrobeScene from './wardrobe/WardrobeScene';
import WardrobeTypeSelector from './ui/WardrobeTypeSelector';
import DimensionsControl from './ui/DimensionsControl';
import MaterialSelector from './ui/MaterialSelector';
import ComponentsManager from './ui/ComponentsManager';
import PriceSummary from './ui/PriceSummary';
import TemplateSelector from './ui/TemplateSelector';
import { ArrowUturnLeftIcon, ArrowUturnRightIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import useWardrobeStore from '../store/wardrobeStore';
import { FurnitureType, RoomType } from '../types/wardrobe';

const WardrobeDesigner: React.FC = () => {
  const [leftPanelWidth, setLeftPanelWidth] = useState<number>(66); // Default to 66% (2/3)
  const [isDesktop, setIsDesktop] = useState<boolean>(false);
  const [isHoveringResizer, setIsHoveringResizer] = useState<boolean>(false);
  const [showTooltip, setShowTooltip] = useState<boolean>(true);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);
  const {
    undo,
    redo,
    historyIndex,
    history,
    project,
    activeRoomId,
    activeFurnitureId,
    addRoom,
    renameRoom,
    setActiveRoom,
    addFurniture,
    renameFurniture,
    duplicateFurniture,
    removeFurniture,
    combineFurniture,
    splitCombinedFurniture,
    setActiveFurniture,
    loadConfiguration,
  } = useWardrobeStore();
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const activeRoom = project.rooms.find((room) => room.id === activeRoomId) ?? project.rooms[0];
  const activeFurniture = activeRoom?.furniture.find((item) => item.id === activeFurnitureId);
  const [newRoomType, setNewRoomType] = useState<RoomType>('bedroom');
  const [newFurnitureType, setNewFurnitureType] = useState<FurnitureType>('wardrobe');
  const [roomNameInput, setRoomNameInput] = useState('');
  const [furnitureNameInput, setFurnitureNameInput] = useState('');
  const [combineTargetId, setCombineTargetId] = useState('');
  const [includeDivider, setIncludeDivider] = useState(true);

  const roomTypeLabels: Record<RoomType, string> = {
    bedroom: 'Bedroom',
    kitchen: 'Kitchen',
    living: 'Living Room',
    hallway: 'Hallway / Storage',
    custom: 'Custom',
  };

  const furnitureTypeLabels: Record<FurnitureType, string> = {
    wardrobe: 'Wardrobe',
    cabinet: 'Cabinet',
    sideboard: 'Sideboard',
    shelving: 'Open Shelving',
  };

  const furnitureByRoom: Record<RoomType, FurnitureType[]> = {
    bedroom: ['wardrobe', 'shelving'],
    kitchen: ['cabinet'],
    living: ['sideboard', 'shelving'],
    hallway: ['wardrobe', 'shelving'],
    custom: ['wardrobe', 'cabinet', 'sideboard', 'shelving'],
  };

  useEffect(() => {
    if (!activeRoom) return;
    const allowed = furnitureByRoom[activeRoom.type];
    if (!allowed.includes(newFurnitureType)) {
      setNewFurnitureType(allowed[0]);
    }
  }, [activeRoom, newFurnitureType]);

  useEffect(() => {
    if (!activeRoom) return;
    setRoomNameInput(activeRoom.name);
    if (activeRoom.furniture.length > 1) {
      const fallback = activeRoom.furniture.find(
        (item) => item.id !== activeFurniture?.id
      );
      setCombineTargetId(fallback?.id ?? '');
    } else {
      setCombineTargetId('');
    }
  }, [activeRoom?.id, activeRoom?.name, activeRoom?.furniture.length, activeFurniture?.id]);

  useEffect(() => {
    if (!activeFurniture) return;
    setFurnitureNameInput(activeFurniture.name);
  }, [activeFurniture?.id, activeFurniture?.name]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get('project');
    if (!encoded) return;
    try {
      const decoded = JSON.parse(atob(decodeURIComponent(encoded)));
      loadConfiguration(decoded);
    } catch (error) {
      console.error('Failed to load shared project.', error);
    }
  }, [loadConfiguration]);
  
  // Check if we're on desktop
  useEffect(() => {
    const checkIfDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    
    checkIfDesktop();
    window.addEventListener('resize', checkIfDesktop);
    
    return () => {
      window.removeEventListener('resize', checkIfDesktop);
    };
  }, []);
  
  // Hide tooltip after 5 seconds
  useEffect(() => {
    if (isDesktop) {
      const timer = setTimeout(() => {
        setShowTooltip(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isDesktop]);
  
  // Use useCallback to memoize the event handlers
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const mouseX = e.clientX - containerRect.left;
    
    // Calculate percentage (clamped between 30% and 80%)
    const newWidthPercent = Math.min(Math.max((mouseX / containerWidth) * 100, 30), 80);
    setLeftPanelWidth(newWidthPercent);
  }, []);
  
  // We need to use a ref for handleMouseMove to avoid circular dependencies
  const handleMouseMoveRef = useRef(handleMouseMove);
  
  // Update the ref when handleMouseMove changes
  useEffect(() => {
    handleMouseMoveRef.current = handleMouseMove;
  }, [handleMouseMove]);
  
  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    document.removeEventListener('mousemove', handleMouseMoveRef.current);
    document.removeEventListener('mouseup', handleMouseUp);
  }, []);
  
  // Handle mouse down on the resize handle
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    setShowTooltip(false);
    document.addEventListener('mousemove', handleMouseMoveRef.current);
    document.addEventListener('mouseup', handleMouseUp);
  }, [handleMouseUp]);
  
  // Clean up event listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMoveRef.current);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseUp]);
  
  return (
    <div ref={containerRef} className="min-h-screen bg-[#f7f4ee] text-slate-800">
      <div className="px-4 py-4 lg:px-6 lg:py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Wardrobe Studio</h1>
            <p className="text-sm text-slate-600">Design your wardrobe with real materials and precise control.</p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            <button
              onClick={undo}
              disabled={!canUndo}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium shadow-sm transition ${
                canUndo
                  ? 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  : 'border-slate-100 bg-slate-50 text-slate-300'
              }`}
            >
              <ArrowUturnLeftIcon className="h-4 w-4" />
              Undo
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium shadow-sm transition ${
                canRedo
                  ? 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  : 'border-slate-100 bg-slate-50 text-slate-300'
              }`}
            >
              <ArrowUturnRightIcon className="h-4 w-4" />
              Redo
            </button>
            <button
              onClick={() => setIsTemplateModalOpen(true)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 sm:w-auto"
            >
              <BookOpenIcon className="h-4 w-4" />
              Browse templates
            </button>
          </div>
        </div>
        <div className="mt-4 grid gap-3 rounded-3xl border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur md:grid-cols-[1fr_1fr]">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Rooms</div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <select
                value={activeRoom?.id || ''}
                onChange={(event) => setActiveRoom(event.target.value)}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-300 focus:outline-none"
              >
                {project.rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
              <select
                value={newRoomType}
                onChange={(event) => setNewRoomType(event.target.value as RoomType)}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-300 focus:outline-none"
              >
                {(Object.keys(roomTypeLabels) as RoomType[]).map((roomType) => (
                  <option key={roomType} value={roomType}>
                    {roomTypeLabels[roomType]}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => addRoom(newRoomType)}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              >
                Add room
              </button>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                value={roomNameInput}
                onChange={(event) => setRoomNameInput(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-300 focus:outline-none sm:w-auto"
                placeholder="Room name"
              />
              <button
                type="button"
                onClick={() => activeRoom && renameRoom(activeRoom.id, roomNameInput.trim() || activeRoom.name)}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              >
                Rename room
              </button>
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Furniture in room</div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <select
                value={activeFurniture?.id || ''}
                onChange={(event) => setActiveFurniture(event.target.value)}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-300 focus:outline-none"
              >
                {activeRoom?.furniture.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                )) ?? null}
              </select>
              <select
                value={newFurnitureType}
                onChange={(event) =>
                  setNewFurnitureType(event.target.value as FurnitureType)
                }
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-300 focus:outline-none"
              >
                {(activeRoom
                  ? furnitureByRoom[activeRoom.type]
                  : ['wardrobe'])?.map((furnitureType) => (
                  <option key={furnitureType} value={furnitureType}>
                    {furnitureTypeLabels[furnitureType]}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => addFurniture(newFurnitureType)}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              >
                Add furniture
              </button>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                value={furnitureNameInput}
                onChange={(event) => setFurnitureNameInput(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-300 focus:outline-none sm:w-auto"
                placeholder="Furniture name"
              />
              <button
                type="button"
                onClick={() =>
                  activeFurniture &&
                  renameFurniture(activeFurniture.id, furnitureNameInput.trim() || activeFurniture.name)
                }
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              >
                Rename item
              </button>
              {activeFurniture && (
                <>
                  <button
                    type="button"
                    onClick={() => duplicateFurniture(activeFurniture.id)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    Duplicate
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFurniture(activeFurniture.id)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-rose-600 shadow-sm transition hover:border-rose-200 hover:bg-rose-50"
                  >
                    Remove
                  </button>
                </>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <select
                value={combineTargetId}
                onChange={(event) => setCombineTargetId(event.target.value)}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-300 focus:outline-none"
                disabled={!activeRoom || activeRoom.furniture.length < 2}
              >
                {activeRoom?.furniture
                  .filter((item) => item.id !== activeFurniture?.id)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  )) ?? (
                  <option value="">No other items</option>
                )}
              </select>
              <label className="flex items-center gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={includeDivider}
                  onChange={(event) => setIncludeDivider(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900"
                />
                Add divider at join
              </label>
              <button
                type="button"
                onClick={() =>
                  activeFurniture && combineTargetId
                    ? combineFurniture(activeFurniture.id, combineTargetId, includeDivider)
                    : null
                }
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-100 disabled:bg-slate-50 disabled:text-slate-300"
                disabled={!activeFurniture || !combineTargetId}
              >
                Combine
              </button>
              {activeFurniture?.combinedFrom && (
                <button
                  type="button"
                  onClick={() => splitCombinedFurniture(activeFurniture.id)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Split
                </button>
              )}
            </div>
            <div className="mt-2 text-xs text-slate-500">
              Active: {activeRoom?.name || 'Room'} · {activeFurniture?.name || 'Furniture'}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pb-6 lg:px-6">
        <div className="grid gap-4 lg:items-start lg:grid-cols-[240px_minmax(0,1fr)_320px] xl:grid-cols-[280px_minmax(0,1fr)_360px]">
          {/* Left Tools */}
          <aside className="order-3 rounded-3xl border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur lg:order-none lg:sticky lg:top-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Wardrobe Type</h2>
                <div className="mt-3">
                  <WardrobeTypeSelector />
                </div>
              </div>

              <ComponentsManager mode="add" />
            </div>
          </aside>

          {/* Center Canvas */}
          <div className="relative order-1 lg:order-none">
            <div className="absolute left-4 top-4 z-10 hidden items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-xs font-medium text-slate-600 shadow-sm backdrop-blur lg:flex">
              Click a component to edit. Drag to reposition. Hold Shift for larger steps.
            </div>
            <div className="h-[52vh] sm:h-[62vh] lg:h-[76vh] xl:h-[78vh]">
              <WardrobeScene />
            </div>
          </div>

          {/* Right Inspector */}
          <aside className="order-2 flex h-full flex-col gap-4 rounded-3xl border border-white/60 bg-white/80 p-4 shadow-sm backdrop-blur lg:order-none lg:sticky lg:top-6">
            <ComponentsManager mode="edit" />

            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <details className="group" open>
                <summary className="cursor-pointer list-none text-sm font-semibold text-gray-700">
                  Dimensions
                </summary>
                <div className="mt-3">
                  <DimensionsControl />
                </div>
              </details>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <details className="group">
                <summary className="cursor-pointer list-none text-sm font-semibold text-gray-700">
                  Materials
                </summary>
                <div className="mt-3">
                  <MaterialSelector />
                </div>
              </details>
            </div>

            <div className="hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm lg:block">
              <PriceSummary />
            </div>
          </aside>
        </div>
      </div>

      <div className="sticky bottom-0 z-20 border-t border-white/60 bg-white/90 px-4 py-3 shadow-[0_-12px_30px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden">
        <PriceSummary />
      </div>

      {/* Template Selector Modal */}
      <TemplateSelector 
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
      />
    </div>
  );
};

export default WardrobeDesigner; 
