import { DialogueStep } from '../types/dialogue';

export const sampleDialogue: Record<string, DialogueStep> = {
  start: {
    id: 'start',
    messages: [
      {
        speaker: 'INLAND EMPIRE',
        type: 'INNER_VOICE',
        text: 'Good, these people know your *true* name. Looks like it has proceeded you, Mr Sunset. More on that later.',
        skillCheck: {
          skill: 'Inland Empire',
          difficulty: 'Easy',
          success: true
        }
      },
      {
        speaker: 'HORRIFIC NECKTIE',
        type: 'CHARACTER',
        text: 'I like this guy. You should, too. He *respects* you by calling you by your [true name](#tequila_sunset). Also, your [tie](#horrific_necktie) is vibrating.'
      },
      {
        speaker: 'YOU',
        type: 'YOU',
        text: '"Not too hot. I\'m on a 50-year losing streak."'
      },
      {
        speaker: 'IDIOT DOOM SPIRAL',
        type: 'CHARACTER',
        text: '"That\'s harsh. I\'m like three or maybe four years into mine. Wait no, make it five." He looks at his shit-stained [Lickra(TM)](#lickra_brand) with a grim expression.'
      },
      {
        speaker: 'SYSTEM',
        type: 'SYSTEM',
        text: '"Things aren\'t going super well for Idiot Doom Spiral, either. Haven\'t found those keys yet; haven\'t won that great piece of ass back. No word from my business-buddies..." He takes a sip from his [beer](#unknown_obj).'
      },
      {
        speaker: 'SUGGESTION',
        type: 'INNER_VOICE',
        text: 'This guy\'s your buddy-buddy. You feel it immediately: you belong to an organization. A fraternity. Of *drunks*.',
        skillCheck: {
          skill: 'Suggestion',
          difficulty: 'Easy',
          success: true
        }
      }
    ],
    options: [
      {
        id: 'opt1',
        text: '"What do you guys do around here?"',
        nextStepId: 'about_here'
      },
      {
        id: 'opt2',
        text: '"What is a... Tequila Sunset? You keep saying it."',
        nextStepId: 'tequila_sunset'
      },
      {
        id: 'opt_check',
        text: '"Wait, Doom Spiral. If you\'re here, and your friends are here... then who is at the pawn shop?"',
        check: {
          skill: 'Logic',
          difficulty: 8,
          difficultyText: 'Medium',
          diceCount: 2,
          conditions: [
            {
              expression: "dice[0] === 1 && dice[1] === 1",
              stepId: 'snake_eyes',
              label: 'Critical Failure',
              color: 'text-red-700'
            },
            {
              expression: "total >= 12",
              stepId: 'logic_success',
              label: 'Critical Success',
              color: 'text-cyan-400'
            },
            {
              expression: "success",
              stepId: 'logic_success',
              label: 'Success',
              color: 'text-green-500'
            },
            {
              expression: "total >= 6",
              stepId: 'logic_partial',
              label: 'Partial Success',
              color: 'text-yellow-500'
            },
            {
              expression: "true", // Default fallback for any failure
              stepId: 'logic_failure',
              label: 'Failure',
              color: 'text-red-500'
            }
          ]
        }
      },
      {
        id: 'opt3',
        text: '"Be seein\' you." [Leave.]',
        nextStepId: 'leave'
      }
    ]
  },
  logic_partial: {
    id: 'logic_partial',
    messages: [
      {
        speaker: 'LOGIC',
        type: 'INNER_VOICE',
        text: 'The connection is there, but it\'s fraying. You manage to plant a seed of doubt without quite knowing why.',
        skillCheck: { skill: 'Logic', difficulty: 'Medium', success: true }
      },
      {
        speaker: 'IDIOT DOOM SPIRAL',
        type: 'CHARACTER',
        text: '"The shop? Well, Roy was supposed to be there. But now that you mention it... I haven\'t seen Roy since the sun was up. Hmm. Probably nothing."'
      }
    ],
    options: [
      { id: 'back', text: '"Let\'s hope it\'s nothing. Another thing..."', nextStepId: 'start' }
    ]
  },
  snake_eyes: {
    id: 'snake_eyes',
    messages: [
      {
        speaker: 'LOGIC',
        type: 'INNER_VOICE',
        text: 'SNAKE EYES. The gears in your head grind to a halt with a sound like a car crash. You forgot your own name for a second, let alone the pawn shop.',
        skillCheck: { skill: 'Logic', difficulty: 'Medium', success: false }
      },
      {
        speaker: 'IDIOT DOOM SPIRAL',
        type: 'CHARACTER',
        text: '"You okay, Harry? You\'ve been staring at that beer for three minutes without blinking. It\'s not going to drink itself, you know."'
      }
    ],
    options: [
      { id: 'back', text: '"I... I need a moment."', nextStepId: 'start' }
    ]
  },
  logic_success: {
    id: 'logic_success',
    messages: [
      {
        speaker: 'LOGIC',
        type: 'INNER_VOICE',
        text: 'You got him. He freezes, beer halfway to his lips.',
        skillCheck: { skill: 'Logic', difficulty: 'Medium', success: true }
      },
      {
        speaker: 'IDIOT DOOM SPIRAL',
        type: 'CHARACTER',
        text: '"The... the pawn shop? Right. Roy! Roy is at the pawn shop. Or... no, Roy was with us at the harbour... oh god. THE SHOP IS UNGUARDED!"'
      }
    ],
    options: [
      { id: 'back', text: '"Anyway, let\'s move on."', nextStepId: 'start' }
    ]
  },
  logic_failure: {
    id: 'logic_failure',
    messages: [
      {
        speaker: 'LOGIC',
        type: 'INNER_VOICE',
        text: 'The gears turn, but they\'re clogged with whatever that liquid is in your flask. You lose the thread.',
        skillCheck: { skill: 'Logic', difficulty: 'Medium', success: false }
      },
      {
        speaker: 'IDIOT DOOM SPIRAL',
        type: 'CHARACTER',
        text: '"What pawn shop? I don\'t know any pawn shop. Are you looking for a pawn shop, officer? Because I can tell you where one *was*, back in \'42."'
      }
    ],
    options: [
      { id: 'back', text: '"My mistake. Another thing..."', nextStepId: 'start' }
    ]
  },
  about_here: {
    id: 'about_here',
    messages: [
      {
        speaker: 'IDIOT DOOM SPIRAL',
        type: 'CHARACTER',
        text: '"Oh, you know. We survive. We drink. We wait for the apocalypse to finally put us out of our misery. It\'s a full-time job, really."'
      }
    ],
    options: [
      {
         id: 'back',
         text: '"I had another question..."',
         nextStepId: 'start'
      }
    ]
  },
  tequila_sunset: {
    id: 'tequila_sunset',
    messages: [
      {
        speaker: 'IDIOT DOOM SPIRAL',
        type: 'CHARACTER',
        text: '"It\'s a cocktail, officer. And a philosophy. One part tragedy, two parts forgetting everything that happened before Tuesday. You\'re wearing it well."'
      }
    ],
    options: [
      {
         id: 'back',
         text: '"I see. I had another question..."',
         nextStepId: 'start'
      }
    ]
  },
  leave: {
    id: 'leave',
    messages: [
      {
        speaker: 'SYSTEM',
        type: 'SYSTEM',
        text: 'You turn away. The smell of stale beer and regret follows you for a few steps before fading into the cold night air.'
      }
    ],
    options: [
      {
        id: 'restart',
        text: '[Approach him again]',
        nextStepId: 'start'
      }
    ]
  }
};
