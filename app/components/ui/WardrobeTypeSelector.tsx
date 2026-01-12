"use client";

import React from 'react';
import { RadioGroup } from '@headlessui/react';
import useWardrobeStore from '../../store/wardrobeStore';
import { WardrobeType } from '../../types/wardrobe';

const wardrobeTypes: { type: WardrobeType; name: string; description: string }[] = [
  {
    type: 'standard',
    name: 'Standard Wardrobe',
    description: 'A classic wardrobe with doors and internal storage.',
  },
  {
    type: 'corner',
    name: 'Corner Wardrobe',
    description: 'Designed to fit in corners, maximizing space usage.',
  },
  {
    type: 'sliding',
    name: 'Sliding Door Wardrobe',
    description: 'Space-saving wardrobe with sliding doors.',
  },
  {
    type: 'walk-in',
    name: 'Walk-in Wardrobe',
    description: 'Luxurious walk-in wardrobe with extensive storage options.',
  },
];

const WardrobeTypeSelector: React.FC = () => {
  const { configuration, setWardrobeType } = useWardrobeStore();
  const selectedType = configuration.type;

  return (
    <div className="w-full p-4">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Select Wardrobe Type</h2>
      <RadioGroup value={selectedType} onChange={(type: WardrobeType) => setWardrobeType(type)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {wardrobeTypes.map((option) => (
            <RadioGroup.Option
              key={option.type}
              value={option.type}
              className={({ active, checked }) =>
                `${
                  active
                    ? 'ring-2 ring-blue-600 ring-opacity-60 ring-offset-2'
                    : ''
                }
                ${
                  checked
                    ? 'bg-blue-700 text-white'
                    : 'bg-white'
                }
                relative flex cursor-pointer rounded-lg px-5 py-4 shadow-md focus:outline-none`
              }
            >
              {({ checked }) => (
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center">
                    <div className="text-sm">
                      <RadioGroup.Label
                        as="p"
                        className={`font-medium ${
                          checked ? 'text-white' : 'text-gray-900'
                        }`}
                      >
                        {option.name}
                      </RadioGroup.Label>
                      <RadioGroup.Description
                        as="span"
                        className={`inline ${
                          checked ? 'text-blue-100' : 'text-gray-700'
                        }`}
                      >
                        {option.description}
                      </RadioGroup.Description>
                    </div>
                  </div>
                </div>
              )}
            </RadioGroup.Option>
          ))}
        </div>
      </RadioGroup>
    </div>
  );
};

export default WardrobeTypeSelector; 