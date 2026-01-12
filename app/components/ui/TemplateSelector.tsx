"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import wardrobeTemplates from '../../data/wardrobeTemplates';
import useWardrobeStore from '../../store/wardrobeStore';
import { RoomType } from '../../types/wardrobe';

interface TemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ isOpen, onClose }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const { project, activeRoomId } = useWardrobeStore();
  const activeRoom = project.rooms.find((room) => room.id === activeRoomId);
  const [activeFilter, setActiveFilter] = useState<RoomType | 'all'>(
    activeRoom?.type ?? 'all'
  );
  const { resetConfiguration, setWardrobeType, setDimensions, addComponent, setMaterial } = useWardrobeStore();
  const roomFilters: { id: RoomType | 'all'; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'bedroom', label: 'Bedroom' },
    { id: 'kitchen', label: 'Kitchen' },
    { id: 'living', label: 'Living Room' },
    { id: 'hallway', label: 'Hallway' },
    { id: 'custom', label: 'Custom' },
  ];
  const filteredTemplates =
    activeFilter === 'all'
      ? wardrobeTemplates
      : wardrobeTemplates.filter((template) =>
          template.roomTypes.includes(activeFilter as RoomType)
        );

  useEffect(() => {
    if (!activeRoom) return;
    setActiveFilter(activeRoom.type);
  }, [activeRoom]);

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
  };

  const handleApplyTemplate = () => {
    if (!selectedTemplate) return;
    
    const template = wardrobeTemplates.find(t => t.id === selectedTemplate);
    if (!template) return;
    
    // Reset current configuration
    resetConfiguration();
    
    // Apply template configuration
    setWardrobeType(template.configuration.type);
    setDimensions(template.configuration.dimensions);
    
    // Set materials
    setMaterial('body', template.configuration.materials.body);
    setMaterial('doors', template.configuration.materials.doors);
    setMaterial('handles', template.configuration.materials.handles);
    
    // Add all components
    template.configuration.components.forEach(component => {
      addComponent({
        type: component.type,
        position: component.position,
        dimensions: component.dimensions,
        material: component.material,
        rotation: component.rotation
      });
    });
    
    onClose();
  };

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center mb-6">
                  <Dialog.Title as="h3" className="text-2xl font-semibold leading-6 text-gray-900">
                    Room Templates
                  </Dialog.Title>
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                
                <div className="mb-6">
                  <p className="text-gray-600">
                    Select a template to start with a pre-designed room-ready unit. You can customize it further after applying.
                  </p>
                </div>

                <div className="mb-6 flex flex-wrap gap-2">
                  {roomFilters.map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setActiveFilter(filter.id)}
                      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                        activeFilter === filter.id
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {filteredTemplates.length === 0 && (
                    <div className="col-span-full rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
                      No templates for this room yet. Try another category.
                    </div>
                  )}
                  {filteredTemplates.map((template) => (
                    <div 
                      key={template.id}
                      className={`border rounded-lg overflow-hidden cursor-pointer transition-all ${
                        selectedTemplate === template.id 
                          ? 'border-blue-500 ring-2 ring-blue-500 shadow-lg' 
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                      onClick={() => handleSelectTemplate(template.id)}
                    >
                      <div className="relative h-48 bg-gray-100">
                        <Image 
                          src={template.imageUrl} 
                          alt={template.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="p-4">
                        <h4 className="font-medium text-lg text-gray-900">{template.name}</h4>
                        <p className="text-gray-600 text-sm mt-1">{template.description}</p>
                        <div className="mt-2 text-xs text-gray-500">
                          <span className="inline-block bg-gray-100 rounded-full px-2 py-1 mr-1">
                            {template.configuration.type}
                          </span>
                          <span className="inline-block bg-gray-100 rounded-full px-2 py-1 mr-1">
                            {template.roomTypes.map((room) => room.charAt(0).toUpperCase() + room.slice(1)).join(', ')}
                          </span>
                          <span className="inline-block bg-gray-100 rounded-full px-2 py-1">
                            {template.configuration.dimensions.width}×{template.configuration.dimensions.height}×{template.configuration.dimensions.depth} cm
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={`inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white ${
                      selectedTemplate 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-blue-300 cursor-not-allowed'
                    }`}
                    onClick={handleApplyTemplate}
                    disabled={!selectedTemplate}
                  >
                    Apply Template
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default TemplateSelector; 
