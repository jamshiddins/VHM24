import React from 'react';

interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export default function Logo({
  size = 40,
  showText = true,
  className = '
}: LogoProps) {
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Лого HUB */}
      <div
        className="relative flex items-center justify-center rounded-full bg-orange-500"
        style={{ width: size, height: size }}
      >
        {/* Текст hub */}
        <span className="font-bold text-white" style={{ fontSize: size * 0.3 }}>
          hub
        </span>

        {/* Автомат */}
        <div
          className="absolute border-2 border-gray-800 rounded"
          style={{
            width: size * 0.4,
            height: size * 0.5,
            right: size * 0.1,
            top: size * 0.25
          }}
        >
          {/* Экран */}
          <div
            className="bg-orange-400 rounded-sm mt-1 mx-1"
            style={{ height: size * 0.15 }}
          />

          {/* Кнопки */}
          <div className="flex flex-col items-end pr-1 mt-1 space-y-0.5">
            <div
              className="bg-orange-400 rounded-full"
              style={{ width: size * 0.04, height: size * 0.04 }}
            />
            <div
              className="bg-orange-400 rounded-full"
              style={{ width: size * 0.04, height: size * 0.04 }}
            />
            <div
              className="bg-orange-400 rounded-sm"
              style={{ width: size * 0.08, height: size * 0.06 }}
            />
          </div>

          {/* Выдача */}
          <div
            className="absolute bottom-1 left-1 bg-orange-400 rounded-sm"
            style={{ width: size * 0.15, height: size * 0.04 }}
          />
        </div>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className="text-xl font-bold text-gray-900">VHM24</span>
          <span className="text-sm text-gray-500">Hub Management</span>
        </div>
      )}
    </div>
  
}
