export interface Skill {
  id: string;
  name: string;
  category: string;
  summary: string;
  description: string;
  howToUse: string[];
  inputs: string[];
  tags: string[];
  department: string;
  enabled: boolean;
  updatedAt: string;
}

export interface ReikiArticle {
  label: string;
  caption?: string;
  text: string;
}

export interface ReikiDocument {
  fileId: string;
  fileName: string;
  title: string;
  lawNum?: string;
  articles: ReikiArticle[];
  rawText: string;
}

export interface ReikiSearchMatch {
  articleLabel?: string;
  snippet: string;
}

export interface ReikiSearchHit {
  fileId: string;
  fileName: string;
  title: string;
  lawNum?: string;
  matches: ReikiSearchMatch[];
}
