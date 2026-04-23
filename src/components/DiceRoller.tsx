import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  skill: string;
  difficulty: number;
  difficultyText: string;
  diceCount: number;
  conditions?: {
    expression: string;
    stepId: string;
    label?: string;
    color?: string;
  }[];
  onComplete: (total: number, success: boolean, dice: number[]) => void;
}

export const DieFace: React.FC<{ value: number; size?: 'sm' | 'md' }> = ({ value, size = 'md' }) => {
  // Map values to 3x3 grid positions (0-8)
  const dotPositions: Record<number, number[]> = {
    1: [4],
    2: [2, 6],
    3: [2, 4, 6],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 3, 6, 2, 5, 8],
  };

  const dots = dotPositions[value] || [];
  const containerSize = size === 'sm' ? 'w-5 h-5' : 'w-8 h-8';
  const dotSize = size === 'sm' ? 'w-1 h-1' : 'w-1.5 h-1.5';
  const gap = size === 'sm' ? 'gap-0.5' : 'gap-1';

  return (
    <div className={`grid grid-cols-3 grid-rows-3 ${gap} ${containerSize} pointer-events-none`}>
      {[...Array(9)].map((_, i) => (
        <div key={i} className="flex items-center justify-center">
          {dots.includes(i) && (
            <div className={`${dotSize} rounded-full bg-white shadow-[0_0_2px_rgba(255,255,255,0.5)]`} />
          )}
        </div>
      ))}
    </div>
  );
};

export const DiceRoller: React.FC<Props> = ({ 
  skill, 
  difficulty, 
  difficultyText, 
  diceCount,
  conditions,
  onComplete 
}) => {
  const [dice, setDice] = useState<number[]>(new Array(diceCount).fill(1));
  const [isRolling, setIsRolling] = useState(true);
  const [rollCount, setRollCount] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRolling) {
      interval = setInterval(() => {
        setDice(prev => prev.map(() => Math.floor(Math.random() * 6) + 1));
        setRollCount(c => c + 1);
        
        // Stop rolling after ~1.5 seconds
        if (rollCount > 15) {
          setIsRolling(false);
          const finalDice = new Array(diceCount).fill(0).map(() => Math.floor(Math.random() * 6) + 1);
          setDice(finalDice);
          const total = finalDice.reduce((a, b) => a + b, 0);
          
          // Slight delay before completing to show final result
          setTimeout(() => {
            onComplete(total, total >= difficulty, finalDice);
          }, 3200);
        }
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isRolling, rollCount]);

  const getOutcome = () => {
    const total = dice.reduce((a, b) => a + b, 0);
    const success = total >= difficulty;
    
    // Check conditions first for customized outcomes
    if (conditions && !isRolling) {
      for (const cond of conditions) {
        try {
          const evaluator = new Function('dice', 'total', 'success', 'diceLen', `return ${cond.expression}`);
          if (evaluator(dice, total, success, dice.length)) {
            return {
              label: cond.label || 'Special Outcome',
              color: cond.color || 'text-purple-400'
            };
          }
        } catch (e) {
          console.error('Error evaluating outcome:', e);
        }
      }
    }

    return success 
      ? { label: 'Success', color: 'text-green-500' }
      : { label: 'Failure', color: 'text-red-500' };
  };

  const outcome = getOutcome();

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="my-8 p-6 border-2 border-[#ff6b35]/30 bg-[#121212] rounded-sm flex flex-col items-center gap-4"
    >
      <div className="text-center font-sans">
        <div className="text-[#ff6b35] text-[12px] uppercase tracking-[0.2em] mb-1">Skill Check: {skill}</div>
        <div className="text-gray-400 text-[14px]">{difficultyText} (Difficulty: {difficulty})</div>
      </div>

      <div className="flex gap-4">
        {dice.map((value, i) => (
          <motion.div
            key={i}
            animate={isRolling ? {
              rotate: [0, 90, 180, 270, 360],
              scale: [1, 1.1, 1],
            } : { rotate: 0, scale: 1 }}
            transition={{ duration: 0.2, repeat: isRolling ? Infinity : 0 }}
            className="w-14 h-14 bg-[#222] border-2 border-gray-600 rounded-md flex items-center justify-center text-white"
          >
            <DieFace value={value} />
          </motion.div>
        ))}
      </div>

      {!isRolling && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="text-[24px] font-bold font-sans text-white mb-1">
            Total: {dice.reduce((a, b) => a + b, 0)}
          </div>
          <div className={`text-[18px] font-bold font-sans uppercase tracking-widest ${outcome.color}`}>
            {outcome.label}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
