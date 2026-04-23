import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WorldObject } from '../types/worldObject';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';

interface Props {
  object: WorldObject;
  onClose?: () => void;
}

export const ObjectTooltip: React.FC<Props> = ({ object }) => {
  const [showLongDesc, setShowLongDesc] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      className="absolute bottom-full left-0 pb-4 z-[100] w-72 overflow-visible"
      id={`object-tooltip-${object.id}`}
    >
      <div className="bg-[#0a0a0a]/95 backdrop-blur-md border border-gray-800 rounded-lg shadow-2xl p-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between mb-3 border-b border-gray-800 pb-2">
          <div>
            <h3 className="text-white font-serif font-bold text-lg leading-tight">
              {object.displayName}
            </h3>
            <span className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-mono">
              {object.id}
            </span>
          </div>
          <Info size={16} className="text-gray-600" />
        </div>

        {/* Short Description */}
        <p className="text-gray-300 text-sm leading-relaxed mb-4">
          {object.shortDescription}
        </p>

        {/* Attributes Grid */}
        <div className="grid grid-cols-1 gap-2 mb-4 bg-black/40 p-2 rounded border border-gray-900">
          {Object.entries(object.attributes).map(([key, value]) => (
            <div key={key} className="flex justify-between items-baseline text-[11px]">
              <span className="text-gray-500 uppercase tracking-wider font-mono italic">{key}</span>
              <span className="text-gray-200 font-medium">{value}</span>
            </div>
          ))}
        </div>

        {/* Expandable Long Description */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowLongDesc(!showLongDesc);
          }}
          className="w-full flex items-center justify-between text-[11px] text-gray-400 hover:text-white transition-colors py-1 px-2 bg-gray-900/50 rounded border border-gray-800"
        >
          <span>{showLongDesc ? 'HIDE DETAILS' : 'VIEW FULL DESCRIPTION'}</span>
          {showLongDesc ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>

        <AnimatePresence>
          {showLongDesc && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-3 text-gray-400 text-xs italic leading-relaxed font-serif">
                {object.longDescription}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Decorative pulse element */}
        <div className="absolute top-0 right-0 w-1 h-1 bg-cyan-500 rounded-full animate-pulse m-2 opacity-50" />
      </div>
    </motion.div>
  );
};
