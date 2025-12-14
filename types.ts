
export interface Article {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  category: ArticleCategory;
  summary: string; // Acts as "Quick Look"
  content: string; // Full content used for RAG context
  imageUrl: string;
  images?: string[]; // Array of images for carousel
  author?: string;
  keyTakeaways?: string[]; // Bullet points for structured summary
  whyItMatters?: string; // Broader implications
}

export enum ArticleCategory {
  ALL = 'All',
  AI = 'Artificial Intelligence',
  IOT = 'IoT',
  CLOUD = 'Cloud Computing',
  CYBERSECURITY = 'Cybersecurity',
  VLSI = 'VLSI & Hardware',
  QUANTUM = 'Quantum Computing',
  BLOCKCHAIN = 'Blockchain & Web3',
  ROBOTICS = 'Robotics',
  BIOTECH = 'Biotech & Health',
  SPACE = 'Space Tech',
  CLEANTECH = 'Clean Energy',
  TELECOM = '5G & Connectivity'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isThinking?: boolean;
}

export interface RAGContext {
  articles: Article[];
}

export interface SearchFilters {
  dateRange: 'any' | 'today' | 'week' | 'month';
  sortBy: 'relevance' | 'newest';
  source: 'all' | 'TechCrunch' | 'The Verge' | 'Wired' | 'Reuters' | 'Bloomberg' | 'VentureBeat';
}
