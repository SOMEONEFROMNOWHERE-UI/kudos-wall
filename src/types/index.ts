export type KudosCategory = '🔥' | '💎' | '🚀' | '🧠' | '🫂';

export interface KudosData {
  _id?: string;
  sender: string;
  receiver: string;
  message: string;
  category: KudosCategory;
  isAnonymous: boolean;
  createdAt?: string;
}

export interface UserProfile {
  _id?: string;
  name: string;
  email?: string;
  image?: string;
  streak: number;
  lastKudosGiven: string | null;
  createdAt?: string;
}

export interface CategoryInfo {
  icon: KudosCategory;
  label: string;
  color: string;
  glow: string;
}

export const CATEGORIES: CategoryInfo[] = [
  { icon: '🔥', label: 'On Fire', color: 'var(--color-red)', glow: 'var(--glow-red)' },
  { icon: '💎', label: 'Hidden Gem', color: 'var(--color-blue)', glow: 'var(--glow-blue)' },
  { icon: '🚀', label: 'Rocket Energy', color: 'var(--color-purple)', glow: 'var(--glow-purple)' },
  { icon: '🧠', label: 'Big Brain', color: 'var(--color-green)', glow: 'var(--glow-green)' },
  { icon: '🫂', label: 'Heart of Team', color: 'var(--color-gold)', glow: 'var(--glow-gold)' },
];
