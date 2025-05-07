// components/map-section.tsx
"use client";

import dynamic from "next/dynamic";
import {
  Navigation,
  Layers,
  Info,
  Maximize,
  Minimize,
  Map as MapIcon,
} from "lucide-react";
import { useState } from "react";

// Dynamic import with SSR disabled for VietnamMap
const VietnamMapWithNoSSR = dynamic(() => import("./map/VietnamMap"), {
  ssr: false,
});

export default function MapSection() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`h-[98%] bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden flex flex-col ${
        isExpanded ? "fixed inset-4 z-50" : ""
      }`}
    >
      {/* Map Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-600">
            <MapIcon size={18} />
          </div>
          <h3 className="font-medium text-gray-800 font-serif">
            Khám phá Việt Nam
          </h3>
        </div>
      </div>

      {/* Map Content */}
      <div className="flex-1 relative">
        {/* Quick Selection */}
        <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-md border border-gray-100 py-1 px-2">
          <select className="text-sm text-gray-700 bg-transparent border-none outline-none pr-6 appearance-none cursor-pointer">
            <option>Toàn quốc</option>
            <option>Miền Bắc</option>
            <option>Miền Trung</option>
            <option>Miền Nam</option>
          </select>
        </div>
        <VietnamMapWithNoSSR />
      </div>

      {/* Legend */}
      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
        <div className="flex items-center space-x-4 text-xs text-gray-600">
          <div className="flex items-center">
            <span className="w-3 h-3 bg-teal-500 rounded-full inline-block mr-1"></span>
            <span>Địa điểm nổi tiếng</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-teal-700 rounded-full inline-block mr-1"></span>
            <span>Đang khám phá</span>
          </div>
        </div>
      </div>
    </div>
  );
}
