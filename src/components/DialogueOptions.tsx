import React from 'react';
import { DialogueOption } from '../types/dialogue';
import { motion } from 'motion/react';

interface Props {
  options: DialogueOption[];
  onSelect: (option: DialogueOption) => void;
}

export const DialogueOptions: React.FC<Props> = ({ options, onSelect }) => {
  return (
    <div className="mt-12 space-y-4 font-serif">
      {options.map((option, index) => (
        <motion.button
          key={option.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 * index }}
          onClick={() => onSelect(option)}
          className="group block w-full text-left text-[18px] text-[#ff6b35] hover:text-[#ff8d61] transition-colors"
        >
          <div className="flex gap-4">
            <span className="opacity-70">{index + 1}.</span>
            <span className="flex-1 group-hover:underline underline-offset-4 decoration-1">
              {option.check ? (
                <>
                  <span className="font-bold mr-1">
                    [{option.check.skill}: {option.check.difficultyText || 'Unknown'}]
                  </span>{' '}
                  {option.text}
                </>
              ) : (
                option.text
              )}
            </span>
          </div>
        </motion.button>
      ))}
    </div>
  );
};
