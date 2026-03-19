export interface SectionDto {
  id: number;
  slug: string;
  title: string;
  icon: string;
  description: string;
  categories: string[];
  order: number;
}

export interface StudyDto {
  id: number;
  slug: string;
  title: string;
  category: string;
  description: string;
  available: boolean;
  icon: string;
  order: number;
}
