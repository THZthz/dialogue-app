import React from 'react';
import { DialogueOption } from '../types/dialogue';
import { motion } from 'motion/react';

interface Props {
  options: DialogueOption[];
  onSelect: (option: DialogueOption) => void;
}

const parseDialogueContent = (text: string) => {
  const fragments: { type: 'text' | 'hint'; content: string }[] = [];
  const regex = /\[([^\]]+)\]/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      fragments.push({
        type: 'text',
        content: text.substring(lastIndex, match.index),
      });
    }
    fragments.push({
      type: 'hint',
      content: `[${match[1]}]`,
    });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    fragments.push({
      type: 'text',
      content: text.substring(lastIndex),
    });
  }

  return fragments;
};

export const DialogueOptions: React.FC<Props> = ({ options, onSelect }) => {
  return (
    <div className="mt-12 space-y-0 font-serif">
      {options.map((option, index) => {
        const isRedCheck = option.check?.isRed;
        
        if (option.isContinue) {
          return (
            <motion.button
              key={option.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              onClick={() => onSelect(option)}
              className="mt-8 relative h-12 w-full max-w-md group"
            >
              {/* Painterly background bar with feathered edge */}
              <div className="absolute inset-0 bg-[#e63946] opacity-90 transition-colors group-hover:bg-[#ff4d5a]" 
                   style={{ 
                     clipPath: 'polygon(0% 0%, 98% 0%, 100% 50%, 98% 100%, 0% 100%)',
                     boxShadow: 'inset 0 0 20px rgba(0,0,0,0.2)'
                   }} />
              
              <div className="absolute inset-0 flex items-center justify-between px-6">
                <span className="text-white font-sans font-bold uppercase tracking-[0.3em] text-[16px]">
                  CONTINUE
                </span>
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="flex items-center"
                >
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                      <path d="M5 3L19 12L5 21V3Z" />
                   </svg>
                </motion.div>
              </div>
              
              {/* Subtle texture overlay */}
              <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]" />
            </motion.button>
          );
        }

        const skillCheckHint = option.check 
          ? `[${option.check.skill} - ${option.check.difficultyText || 'Unknown'} ${option.check.difficulty}]`
          : null;

        const fragments = parseDialogueContent(option.text);

        return (
          <motion.button
            key={option.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * index }}
            onClick={() => onSelect(option)}
            className={`group block w-full text-left text-[18px] transition-colors p-2 -ml-2 rounded-sm ${
              isRedCheck 
                ? 'bg-[#d34b34] text-white hover:bg-[#e05a44]' 
                : 'text-[#ff6b35] hover:text-[#ff8d61]'
            }`}
          >
            <div className="flex gap-2 items-start">
              <span className={`${isRedCheck ? 'text-white' : 'opacity-70'} whitespace-nowrap`}>{index + 1}. -</span>
              <span className={`flex-1 ${!isRedCheck && 'group-hover:underline underline-offset-4 decoration-1 decoration-[#ff6b35]/40 text-pretty'}`}>
                {skillCheckHint && (
                  <span className="font-bold mr-1">{skillCheckHint}</span>
                )}
                {fragments.map((fragment, i) => (
                  <React.Fragment key={i}>
                    {fragment.type === 'hint' ? (
                      <span className="font-bold">{fragment.content}</span>
                    ) : (
                      fragment.content
                    )}
                  </React.Fragment>
                ))}
              </span>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};
