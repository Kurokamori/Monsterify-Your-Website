/**
 * Monster "Can Talk" Constants
 * Defines speech progression levels and user-selectable descriptors
 */

export const CAN_TALK_LEVELS: Record<number, { default: string; label: string }> = {
  0: { default: 'Unable to Speak', label: 'Level 0 - Cannot Communicate' },
  1: { default: 'Knows Some Letters', label: 'Level 1 - Basic Awareness' },
  2: { default: 'Forming Simple Words and Sentences', label: 'Level 2 - Basic Communication' },
  3: { default: 'Able to Generally Converse', label: 'Level 3 - Conversational' },
};

export const CAN_TALK_DESCRIPTORS: Record<number, string[]> = {
  0: [
    'Unable to Speak',
    'Communicates Through Body Language',
    'Makes Sounds But No Words',
    'Responds to Commands Only',
    'Understands But Cannot Respond',
    'Sign Language (Receptive Only)',
  ],
  1: [
    'Knows Some Letters',
    'Can Write a Few Symbols',
    'Mimics Simple Sounds',
    'Recognizes Written Words',
    'Understands Short Phrases',
    'Basic Sign Language',
    'Basic Sign Language + Vocalizations',
  ],
  2: [
    'Forming Simple Words and Sentences',
    'Recognizes Some Words',
    'Reading Picture Books',
    'Babbles Nonsense',
    'Speaks in Broken Phrases',
    'Can Read Simple Text',
    'Writes Short Notes',
    'Intermediate Sign Language',
    'Sign Language + Simple Speech',
  ],
  3: [
    'Able to Generally Converse',
    'Fully Literate - Reads and Writes Fluently',
    'Speaks Fluently But Cannot Read',
    'Reads Fluently But Cannot Speak',
    'Speaks Poorly But Understands Everything',
    'Eloquent Speaker and Writer',
    'Can Speak But Not Write',
    'Fluent Sign Language',
    'Fluent Sign Language + Speaking',
  ],
};

export const CAN_TALK_MIN = 0;
export const CAN_TALK_MAX = 3;
