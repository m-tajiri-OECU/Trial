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
