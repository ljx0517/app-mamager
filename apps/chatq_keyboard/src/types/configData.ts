/**
 * ChatQ 主数据类型（与后端 chatq.configData 出参一致）
 */

export interface SceneItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  compatibleTagIds?: string[];
}

export interface RelationItem {
  id: string;
  name: string;
  description?: string;
}

export interface PersonaTagItem {
  id: string;
  name: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  weight_default: number;
  description: string;
}

export interface PersonaDimensionItem {
  id: string;
  name: string;
  description: string;
  sort: number;
  tags: PersonaTagItem[];
}

export interface PersonaPackageItem {
  id: string;
  name: string;
  description: string;
  gender: 'male' | 'female' | 'any';
  age_range: string[];
  tags: string[];
  scenes: string[];
}

export interface ConfigDataCache {
  scenes: SceneItem[];
  relations: RelationItem[];
  dimensions: PersonaDimensionItem[];
  personaPackages: PersonaPackageItem[];
  fetchedAt: number;
}
