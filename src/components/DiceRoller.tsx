import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCharacter } from '../context/CharacterContext';

interface Props {
  skill: string;
  difficulty: number;
  difficultyText: string;
  diceCount: number;
  isRed?: boolean;
  conditions?: {
    expression: string;
    stepId: string;
    label?: string;
    color?: string;
  }[];
  onComplete: (total: number, success: boolean, dice: number[]) => void;
}

// Helper to calculate 2D6 probabilities
const calculate2D6Probability = (target: number, bonus: number) => {
  const neededOnDice = target - bonus;
  if (neededOnDice <= 2) return 100;
  if (neededOnDice > 12) return 0;
  
  // Total outcomes: 36
  let successes = 0;
  for (let d1 = 1; d1 <= 6; d1++) {
    for (let d2 = 1; d2 <= 6; d2++) {
      if (d1 + d2 >= neededOnDice) successes++;
    }
  }
  return Math.round((successes / 36) * 100);
};

export const DieFace: React.FC<{ value: number; size?: 'sm' | 'md' | 'lg' | 'xs' }> = ({ value, size = 'md' }) => {
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
  const sizes = {
    xs: { container: 'w-3 h-3', dot: 'w-0.5 h-0.5', gap: 'gap-0' },
    sm: { container: 'w-5 h-5', dot: 'w-1 h-1', gap: 'gap-0.5' },
    md: { container: 'w-8 h-8', dot: 'w-1.5 h-1.5', gap: 'gap-1' },
    lg: { container: 'w-12 h-12', dot: 'w-2 h-2', gap: 'gap-1.5' },
  };
  
  const currentSize = sizes[size];

  return (
    <div className={`grid grid-cols-3 grid-rows-3 ${currentSize.gap} ${currentSize.container} pointer-events-none`}>
      {[...Array(9)].map((_, i) => (
        <div key={i} className="flex items-center justify-center">
          {dots.includes(i) && (
            <div className={`${currentSize.dot} rounded-full bg-white shadow-[0_0_2px_rgba(255,255,255,0.5)]`} />
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
  isRed,
  conditions,
  onComplete 
}) => {
  const { getStatBySkillName } = useCharacter();
  const skillBonus = getStatBySkillName(skill);
  const [dice, setDice] = useState<number[]>(new Array(diceCount).fill(1));
  const [isRolling, setIsRolling] = useState(false);
  const [hasRolled, setHasRolled] = useState(false);
  const [rollCount, setRollCount] = useState(0);

  const probability = calculate2D6Probability(difficulty, skillBonus);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRolling) {
      interval = setInterval(() => {
        setDice(prev => prev.map(() => Math.floor(Math.random() * 6) + 1));
        setRollCount(c => c + 1);
        
        // Stop rolling after ~1.5 seconds
        if (rollCount > 15) {
          setIsRolling(false);
          setHasRolled(true);
          const finalDice = new Array(diceCount).fill(0).map(() => Math.floor(Math.random() * 6) + 1);
          setDice(finalDice);
          const diceTotal = finalDice.reduce((a, b) => a + b, 0);
          const totalWithBonus = diceTotal + skillBonus;
          
          // Slight delay before completing to show final result
          setTimeout(() => {
            onComplete(totalWithBonus, totalWithBonus >= difficulty, finalDice);
          }, 2000);
        }
      }, 80);
    }
    return () => clearInterval(interval);
  }, [isRolling, rollCount, skillBonus, difficulty, diceCount, onComplete]);

  const getOutcome = () => {
    const diceTotal = dice.reduce((a, b) => a + b, 0);
    const total = diceTotal + skillBonus;
    const success = total >= difficulty;
    
    if (conditions && hasRolled) {
      for (const cond of conditions) {
        try {
          const evaluator = new Function('dice', 'total', 'success', 'diceLen', `return ${cond.expression}`);
          if (evaluator(dice, total, success, dice.length)) {
            return {
              label: cond.label || 'Special Outcome',
              color: cond.color || 'text-purple-400',
              isSuccess: success
            };
          }
        } catch (e) {
          console.error('Error evaluating outcome:', e);
        }
      }
    }

    return success 
      ? { label: 'Succeeded', color: 'text-[#9eff9e]', isSuccess: true }
      : { label: 'Failed', color: 'text-[#ff6b6b]', isSuccess: false };
  };

  const outcome = getOutcome();
  const diceTotal = dice.reduce((a, b) => a + b, 0);
  const currentTotal = diceTotal + skillBonus;

  if (isRed && !isRolling && !hasRolled) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="my-12 relative flex justify-center"
      >
        <div className="w-80 bg-[#151515] border border-white/10 shadow-2xl overflow-hidden rounded-sm relative group cursor-pointer" onClick={() => setIsRolling(true)}>
           {/* Top bar */}
           <div className="bg-[#4fb0c6] px-4 py-2 text-white font-sans font-bold uppercase tracking-[0.2em] text-center text-[14px]">
             {skill}: {skillBonus}
           </div>
           
           <div className="p-8 flex flex-col items-center text-center">
             <div className="text-[#ff4d4d] text-[20px] uppercase tracking-widest font-black mb-2">LOW</div>
             <div className="text-[64px] font-bold text-white leading-none mb-4">{probability}%</div>
             
             <div className="w-full h-[1px] bg-white/10 mb-6" />
             
             <div className="text-gray-400 text-[12px] font-serif italic mb-8 max-w-[200px]">
                This is a Red Check. It can not be retried.
             </div>
             
             <div className="flex justify-between w-full opacity-40">
                <div className="flex flex-col items-center gap-1">
                   <div className="flex gap-1">
                      <div className="w-5 h-5 bg-white/10 rounded-sm flex items-center justify-center">
                        <DieFace value={1} size="xs" />
                      </div>
                      <div className="w-5 h-5 bg-white/10 rounded-sm flex items-center justify-center">
                        <DieFace value={1} size="xs" />
                      </div>
                   </div>
                   <span className="text-[8px] uppercase">Always Loses</span>
                </div>
                
                <div className="flex flex-col items-center gap-1">
                   <div className="flex gap-1">
                      <div className="w-5 h-5 bg-white/10 rounded-sm flex items-center justify-center">
                        <DieFace value={6} size="xs" />
                      </div>
                      <div className="w-5 h-5 bg-white/10 rounded-sm flex items-center justify-center">
                        <DieFace value={6} size="xs" />
                      </div>
                   </div>
                   <span className="text-[8px] uppercase">Always Wins</span>
                </div>
             </div>
           </div>
           
           {/* Pulsing prompt */}
           <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
             <div className="text-white text-[12px] font-bold tracking-widest uppercase">Click to Enforce</div>
           </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="my-12 flex flex-col items-center"
    >
      {!hasRolled && !isRolling && !isRed && (
        <button 
          onClick={() => setIsRolling(true)}
          className="mb-4 px-8 py-4 bg-[#1a1a1a] border border-white/10 text-elysian-orange font-bold uppercase tracking-widest hover:bg-[#222] transition-all"
        >
          Check {skill} ({probability}%)
        </button>
      )}

      {isRolling && (
        <div className="flex gap-6 mb-8">
          {dice.map((value, i) => (
            <motion.div
              key={i}
              animate={{
                rotate: [0, 90, 180, 270, 360],
                scale: [1, 1.1, 1],
                y: [0, -5, 0]
              }}
              transition={{ duration: 0.15, repeat: Infinity }}
              className="w-16 h-16 bg-[#222] border-2 border-white/20 rounded-md shadow-lg flex items-center justify-center"
            >
              <DieFace value={value} size="md" />
            </motion.div>
          ))}
        </div>
      )}

      {hasRolled && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative"
        >
          {/* Backdrop blur effect */}
          <div className="absolute -inset-4 bg-black/40 blur-xl rounded-full" />
          
          <div className="relative w-80 bg-black border border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden rounded-sm">
            {/* Texture overlay */}
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]" />
            
            <div className="p-8 flex flex-col items-center text-center relative z-10">
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={`text-[28px] font-black uppercase tracking-[0.3em] mb-6 ${outcome.color}`}
              >
                {outcome.label}
              </motion.div>
              
              <div className="w-full h-[1px] bg-white/20 mb-6" />
              
              <div className="space-y-4 font-serif">
                <div className="text-gray-400 text-[18px]">
                  {difficultyText}: <span className="text-white font-sans font-bold ml-2">{difficulty}</span>
                </div>
                
                <div className="text-gray-500 text-[14px] italic">vs</div>
                
                <div className="text-gray-400 text-[18px]">
                  Your Total: <span className="text-white font-sans font-bold ml-2">{currentTotal}</span>
                </div>
              </div>

              {/* Reveal the final dice at the bottom */}
              <div className="mt-8 flex gap-2">
                 {dice.map((v, i) => (
                   <div key={i} className="w-8 h-8 rounded border border-white/10 bg-white/5 flex items-center justify-center opacity-50">
                     <DieFace value={v} size="sm" />
                   </div>
                 ))}
                 <div className="w-8 h-8 rounded border border-white/10 bg-white/5 flex items-center justify-center font-bold text-[14px] text-[#4fb0c6] opacity-50">
                   +{skillBonus}
                 </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
