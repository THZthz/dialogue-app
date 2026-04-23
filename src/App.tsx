/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Message, DialogueStep, DialogueOption } from './types/dialogue';
import { sampleDialogue } from './data/sampleDialogue';
import { DialogueMessage } from './components/DialogueMessage';
import { DialogueOptions } from './components/DialogueOptions';
import { TypingIndicator } from './components/TypingIndicator';
import { DiceRoller } from './components/DiceRoller';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [history, setHistory] = useState<Message[]>([]);
  const [currentStepId, setCurrentStepId] = useState<string>('start');
  const [isTyping, setIsTyping] = useState(false);
  const [currentCheck, setCurrentCheck] = useState<DialogueOption['check'] | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentStep = sampleDialogue[currentStepId];

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history, isTyping, currentCheck]);

  // Handle sequential message display
  const displayMessages = async (messages: Message[]) => {
    setIsTyping(true);
    
    for (const msg of messages) {
      // Calculate delay based on message length (min 1s, max 3s)
      const delay = Math.min(Math.max(msg.text.length * 20, 1000), 3000);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      setHistory(prev => [...prev, msg]);
    }
    
    setIsTyping(false);
  };

  const initializedRef = useRef(false);

  // Initialize with the first step's messages
  useEffect(() => {
    if (currentStep && !initializedRef.current) {
      initializedRef.current = true;
      const initialMessages = currentStep.messages.map((m, i) => ({
        ...m,
        id: `initial-${i}-${Math.random().toString(36).substr(2, 9)}`
      }));
      displayMessages(initialMessages);
    }
  }, []);

  const handleOptionSelect = async (option: DialogueOption) => {
    if (isTyping || currentCheck) return; // Prevent double selecting

    // 1. Add "YOU" message immediately
    // Strip skill hints like [Logic: Medium] but keep action tags like [Leave] if they aren't skill checks
    const cleanText = option.text.replace(/^\[[^\]]*?:[^\]]*?\]\s*/, '');
    
    const youMessage: Message = {
      id: `you-${Date.now()}`,
      speaker: 'YOU',
      type: 'YOU',
      text: cleanText
    };
    setHistory(prev => [...prev, youMessage]);

    // 2. Handle Skill Check or Normal transition
    if (option.check) {
      setCurrentCheck(option.check);
    } else if (option.nextStepId) {
      const nextStep = sampleDialogue[option.nextStepId];
      if (!nextStep) return;

      const nextMessages: Message[] = nextStep.messages.map((m, i) => ({
        ...m,
        id: `${option.nextStepId}-${i}-${Date.now()}`
      }));

      setCurrentStepId(option.nextStepId);
      await displayMessages(nextMessages);
    }
  };

  const handleRollComplete = async (total: number, success: boolean, dice: number[]) => {
    if (!currentCheck) return;
    
    let outcomeStepId: string | null = null;

    // Evaluate conditions to find the first matching path
    for (const condition of currentCheck.conditions) {
      try {
        const evaluator = new Function('dice', 'total', 'success', 'diceLen', `return ${condition.expression}`);
        if (evaluator(dice, total, success, dice.length)) {
          outcomeStepId = condition.stepId;
          break; // Stop at first matching condition
        }
      } catch (e) {
        console.error('Error evaluating roll condition:', e);
      }
    }

    // Default fallback if no conditions match (should usually not happen with good design)
    if (!outcomeStepId) {
      outcomeStepId = success ? 'start' : 'start'; // Fallback to start if everything fails
    }

    const nextStep = sampleDialogue[outcomeStepId];
    
    const rollData = {
      dice,
      total,
      success,
      difficulty: currentCheck.difficulty,
      skill: currentCheck.skill
    };

    setCurrentCheck(null);
    setCurrentStepId(outcomeStepId);

    if (nextStep) {
      const nextMessages: Message[] = nextStep.messages.map((m, i) => ({
        ...m,
        id: `${outcomeStepId}-${i}-${Date.now()}`,
        // Attach roll result to the first message if it has a skillCheck defined
        rollResult: i === 0 && m.skillCheck ? rollData : undefined
      }));
      await displayMessages(nextMessages);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 flex justify-center selection:bg-[#ff6b35] selection:text-white">
      {/* Moody background overlay */}
      <div className="bg-texture" />
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, #444, #000)`,
            filter: 'contrast(120%) brightness(80%)'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
      </div>

      {/* Main Content Area */}
      <main 
        id="dialogue-scroll-container"
        ref={scrollContainerRef}
        className="relative w-full max-w-2xl min-h-screen px-8 py-24 overflow-y-auto scroll-smooth no-scrollbar"
        style={{ scrollbarWidth: 'none' }}
      >
        <div className="flex flex-col min-h-full">
          {/* Logo / Header hint */}
          <div className="mb-16 opacity-30 text-[12px] uppercase tracking-[0.2em] font-sans">
            [ Dialogue State: {currentStepId.replace('_', ' ')} ]
          </div>

          {/* Message History */}
          <div className="flex-1">
            {history.map((msg) => (
              <DialogueMessage key={msg.id} message={msg} />
            ))}
            {currentCheck && (
              <DiceRoller 
                {...currentCheck} 
                onComplete={handleRollComplete} 
              />
            )}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} className="h-4" />
          </div>

          {/* Current Options */}
          <AnimatePresence mode="wait">
            {!isTyping && !currentCheck && currentStep?.options && (
              <DialogueOptions 
                key={currentStepId}
                options={currentStep.options} 
                onSelect={handleOptionSelect} 
              />
            )}
          </AnimatePresence>

          <div className="h-32" /> {/* Bottom spacing */}
        </div>
      </main>

      {/* Side indicators (Electron app aesthetic) */}
      <div className="fixed left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-black/50 to-transparent" />
      <div className="fixed right-0 top-0 bottom-0 w-2 bg-gradient-to-l from-black/50 to-transparent" />
    </div>
  );
}

