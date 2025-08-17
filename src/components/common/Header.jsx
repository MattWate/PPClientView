// src/components/common/Header.jsx
import React from 'react';

export default function Header({ title }) {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <h2 className="text-2xl font-semibold text-gray-800 capitalize">{title}</h2>
      <div className="flex items-center space-x-4">
        <button className="relative">
          <i className="fas fa-bell text-xl text-gray-600"></i>
          <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
        </button>
      </div>
    </header>
  );
}
