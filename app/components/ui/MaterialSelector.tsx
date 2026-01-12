"use client";

import React from 'react';
import { Listbox } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import useWardrobeStore from '../../store/wardrobeStore';

const MaterialSelector: React.FC = () => {
  const { configuration, availableMaterials, setMaterial } = useWardrobeStore();
  const { materials } = configuration;
  
  // Material categories
  const categories = [
    { key: 'body', label: 'Body Material' },
    { key: 'doors', label: 'Door Material' },
    { key: 'handles', label: 'Handle Material' },
  ] as const;
  
  // Function to get material by ID
  const getMaterialById = (id: string) => {
    return availableMaterials.find(material => material.id === id);
  };

  return (
    <div className="w-full p-4">
      <h2 className="text-xl font-semibold mb-6 text-gray-900">Select Materials</h2>
      
      <div className="space-y-6">
        {categories.map((category) => {
          const selectedMaterial = getMaterialById(materials[category.key]);
          
          return (
            <div key={category.key} className="mb-4">
              <h3 className="text-lg font-medium mb-2 text-gray-900">{category.label}</h3>
              
              <Listbox value={materials[category.key]} onChange={(materialId) => setMaterial(category.key, materialId)}>
                <div className="relative mt-1">
                  <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white py-3 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 border border-gray-200">
                    {selectedMaterial && (
                      <div className="flex items-center">
                        <div 
                          className="w-8 h-8 rounded-md border border-gray-300 mr-3" 
                          style={{ backgroundColor: selectedMaterial.color }}
                        />
                        <span className="block truncate font-medium text-gray-900">{selectedMaterial.name}</span>
                        <span className="ml-2 text-gray-700">${selectedMaterial.price}</span>
                      </div>
                    )}
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <ChevronUpDownIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
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
                          <>
                            <div className="flex items-center">
                              <div 
                                className="w-8 h-8 rounded-md border border-gray-300 mr-3" 
                                style={{ backgroundColor: material.color }}
                              />
                              <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'} text-gray-900`}>
                                {material.name}
                              </span>
                              <span className="ml-2 text-gray-700">${material.price}</span>
                            </div>
                            
                            {selected && (
                              <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-700">
                                <CheckIcon className="h-5 w-5" aria-hidden="true" />
                              </span>
                            )}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </div>
              </Listbox>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MaterialSelector; 