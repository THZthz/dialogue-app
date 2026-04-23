export type SpeakerType = 'YOU' | 'INNER_VOICE' | 'CHARACTER' | 'SYSTEM' | 'ROLL';

export interface Message {
  id: string;
  speaker: string;
  type: SpeakerType;
  text: string;
  skillCheck?: {
    skill: string;
    difficulty: string;
    success: boolean;
  };
  rollResult?: {
    dice: number[];
    total: number;
    difficulty: number;
    success: boolean;
    skill: string;
  };
}

export interface DialogueOption {
  id: string;
  text: string;
  nextStepId?: string; // Standard transition
  isAiTrigger?: boolean; // If true, request response from LLM
  check?: {
    skill: string;
    difficulty: number;
    difficultyText: string;
    diceCount: number;
    conditions: {
      expression: string; // e.g. "success", "total < difficulty", "dice[0] === 1"
      stepId: string;
      label?: string; // Optional label for display
      color?: string; // Optional color for display
    }[];
  };
}

export interface DialogueStep {
  id: string;
  messages: Omit<Message, 'id'>[];
  options: DialogueOption[];
}
