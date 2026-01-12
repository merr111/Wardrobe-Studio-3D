"use client";

import React, { useState, useEffect } from 'react';
import useWardrobeStore from '../../store/wardrobeStore';

// Simple direct input component
const DirectInput: React.FC<{
  id: string;
  value: number;
  min: number;
  max: number;
  label: string;
  onChange: (value: number) => void;
}> = ({ id, value, min, max, label, onChange }) => {
  // Local state to track the input value
  const [inputValue, setInputValue] = useState(value.toString());
  const [error, setError] = useState(false);
  
  // Update local state when external value changes
  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);
  
  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };
  
  // Handle blur - apply the change
  const handleBlur = () => {
    applyChange();
  };
  
  // Handle key down - apply on Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyChange();
    }
  };
  
  // Apply the change
  const applyChange = () => {
    const newValue = parseInt(inputValue);
    if (!isNaN(newValue)) {
      // Validate and clamp the value
      if (newValue < min || newValue > max) {
        setError(true);
        // Clamp the value
        const clampedValue = Math.min(Math.max(newValue, min), max);
        setInputValue(clampedValue.toString());
        onChange(clampedValue);
      } else {
        setError(false);
        onChange(newValue);
      }
    } else {
      // Reset to previous value if not a number
      setInputValue(value.toString());
      setError(false);
    }
  };
  
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-base font-bold text-gray-800 mb-2">
        {label}
      </label>
      <div className="flex items-center">
        <input
          type="text"
          id={id}
          value={inputValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`block w-full border rounded-md px-3 py-2 text-lg font-semibold ${
            error 
              ? 'border-red-500 focus:border-red-500 bg-red-50 text-red-700' 
              : 'border-gray-400 focus:border-blue-500 bg-white text-gray-900'
          } focus:ring-1 focus:ring-blue-500 focus:ring-opacity-50 focus:outline-none`}
        />
        <span className="ml-2 text-gray-800 font-medium">cm</span>
      </div>
      {error && (
        <p className="text-xs text-red-600 font-medium mt-1">
          Value must be between {min} and {max} cm
        </p>
      )}
    </div>
  );
};

const DimensionsControl: React.FC = () => {
  const { configuration, setDimensions } = useWardrobeStore();
  const { dimensions } = configuration;
  
  // Direct handlers that update the store immediately
  const handleWidthChange = (width: number) => {
    setDimensions({
      ...dimensions,
      width
    });
  };
  
  const handleHeightChange = (height: number) => {
    setDimensions({
      ...dimensions,
      height
    });
  };
  
  const handleDepthChange = (depth: number) => {
    setDimensions({
      ...dimensions,
      depth
    });
  };
  
  return (
    <div className="w-full p-4">
      <h2 className="text-xl font-semibold mb-6 text-gray-900">Adjust Dimensions (cm)</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-4 rounded-lg border border-gray-300 shadow-sm">
          <DirectInput
            id="width"
            value={dimensions.width}
            min={50}
            max={400}
            label="Width"
            onChange={handleWidthChange}
          />
          <div className="text-xs text-gray-700 font-medium">
            Recommended: 150-250 cm for standard wardrobes
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-300 shadow-sm">
          <DirectInput
            id="height"
            value={dimensions.height}
            min={100}
            max={300}
            label="Height"
            onChange={handleHeightChange}
          />
          <div className="text-xs text-gray-700 font-medium">
            Recommended: 200-240 cm for standard ceiling height
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-300 shadow-sm">
          <DirectInput
            id="depth"
            value={dimensions.depth}
            min={30}
            max={300}
            label="Depth"
            onChange={handleDepthChange}
          />
          <div className="text-xs text-gray-700 font-medium">
            Recommended: 50-70 cm for clothes storage
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mt-6">
        <div className="text-base text-gray-900 font-medium">
          Current dimensions: <span className="font-bold">{dimensions.width} × {dimensions.height} × {dimensions.depth} cm</span>
        </div>
      </div>
    </div>
  );
};

export default DimensionsControl; 