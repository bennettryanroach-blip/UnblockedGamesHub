export interface Game {
  id: string;
  title: string;
  description: string;
  category: string;
  iframeUrl: string;
  author: string;
  emoji: string;
  instructions: string;
  controls: string[];
  popular: boolean;
}

export type CategoryFilter = 'All' | 'Puzzle' | 'Retros' | 'Arcades' | 'Skills' | 'Boards' | 'Favorites';
