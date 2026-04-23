import React, { useState } from 'react';
import { Message } from '../types/dialogue';
import { motion, AnimatePresence } from 'motion/react';
import { DieFace } from './DiceRoller';
import { ObjectLink } from './ObjectLink';

interface Props {
  message: Message;
}

export const DialogueMessage: React.FC<Props> = ({ message }) => {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const isInnerVoice = message.type === 'INNER_VOICE';
  const isYou = message.type === 'YOU';
  const isSystem = message.type === 'SYSTEM';

  const getSpeakerColor = () => {
    if (isInnerVoice) return 'text-[#9081e3]'; // Light Purple
    if (isSystem) return 'text-gray-400';
    return 'text-white font-medium';
  };

  const renderText = (text: string) => {
    // 1. Split for italics: *text*
    // 2. Split for object links: [display](#id)
    // We combine these into a robust parsing strategy
    
    // First, identify all special patterns and split the text
    // Regex matches either *italic* or [object](#id)
    const pattern = /(\*.*?\*|\[.*?\]\(#.*?\))/g;
    const parts = text.split(pattern);

    return parts.map((part, i) => {
      // Handle Italics
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} className="italic opacity-90">{part.slice(1, -1)}</em>;
      }
      
      // Handle Object Links: [name](#id)
      const objMatch = part.match(/\[(.*?)\]\(#(.*?)\)/);
      if (objMatch) {
        const [, displayName, objectId] = objMatch;
        return <ObjectLink key={i} displayName={displayName} objectId={objectId} />;
      }
      
      return part;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-8 font-serif leading-relaxed text-[18px]"
    >
      <div className="flex flex-wrap items-baseline gap-2">
        <span className={`${getSpeakerColor()} uppercase tracking-wider text-[16px] mr-2`}>
          {message.speaker}
        </span>
        {message.skillCheck && (
          <div 
            className="relative inline-block"
            onMouseEnter={() => setIsTooltipVisible(true)}
            onMouseLeave={() => setIsTooltipVisible(false)}
          >
            <span className="text-gray-400 text-[14px] mr-2 uppercase cursor-help hover:text-gray-200 transition-colors">
              [{message.skillCheck.difficulty}: <span className="text-gray-200">{message.skillCheck.success ? 'Success' : 'Failure'}</span>]
            </span>
            
            <AnimatePresence>
              {isTooltipVisible && message.rollResult && (
                <motion.div
                  initial={{ opacity: 0, y: 5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute bottom-full left-0 mb-2 p-3 bg-[#1a1a1a] border border-gray-700 rounded shadow-xl z-50 min-w-[120px]"
                >
                  <div className="flex gap-2 mb-2">
                    {message.rollResult.dice.map((val, idx) => (
                      <div key={idx} className="w-8 h-8 rounded border border-gray-600 bg-[#222] flex items-center justify-center">
                        <DieFace value={val} size="sm" />
                      </div>
                    ))}
                  </div>
                  <div className={`text-[10px] uppercase tracking-widest font-bold whitespace-nowrap ${message.rollResult.success ? 'text-green-500' : 'text-red-500'}`}>
                    Total: {message.rollResult.total} / req. {message.rollResult.difficulty}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
      <div className={`${isInnerVoice ? 'text-[#9081e3]' : 'text-gray-100'} mt-1`}>
        {renderText(message.text)}
      </div>
    </motion.div>
  );
};
