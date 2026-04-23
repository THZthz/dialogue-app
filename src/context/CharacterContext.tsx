import { ReactNode, createContext, useContext, useState } from 'react';

export interface CharacterStats {
  logic: number;
  rhetoric: number;
  empathy: number;
  perception: number;
  volition: number;
  endurance: number;
  inland_empire: number;
  suggestion: number;
  half_light: number;
  physical_instrument: number;
}

export interface Character {
  name: string;
  stats: CharacterStats;
}

interface CharacterContextType {
  character: Character;
  updateStat: (stat: keyof CharacterStats, value: number) => void;
  incrementStat: (stat: keyof CharacterStats) => void;
  getStatBySkillName: (skillName: string) => number;
}

const defaultCharacter: Character = {
  name: 'YOU',
  stats: {
    logic: 3,
    rhetoric: 2,
    empathy: 3,
    perception: 4,
    volition: 2,
    endurance: 3,
    inland_empire: 5,
    suggestion: 4,
    half_light: 1,
    physical_instrument: 2,
  },
};

const CharacterContext = createContext<CharacterContextType | undefined>(undefined);

export function CharacterProvider({ children }: { children: ReactNode }) {
  const [character, setCharacter] = useState<Character>(defaultCharacter);

  const updateStat = (stat: keyof CharacterStats, value: number) => {
    setCharacter((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        [stat]: value,
      },
    }));
  };

  const incrementStat = (stat: keyof CharacterStats) => {
    setCharacter((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        [stat]: prev.stats[stat] + 1,
      },
    }));
  };

  const getStatBySkillName = (skillName: string): number => {
    const formatKey = skillName.toLowerCase().replace(/\s+/g, '_') as keyof CharacterStats;
    return character.stats[formatKey] || 0;
  };

  return (
    <CharacterContext.Provider value={{ character, updateStat, incrementStat, getStatBySkillName }}>
      {children}
    </CharacterContext.Provider>
  );
}

export function useCharacter() {
  const context = useContext(CharacterContext);
  if (context === undefined) {
    throw new Error('useCharacter must be used within a CharacterProvider');
  }
  return context;
}
