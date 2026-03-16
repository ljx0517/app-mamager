/**
 * 聊商预设人设包（8 个）
 * 与 PRD、标签体系 v3.0 一致
 */
export interface PersonaPackageItem {
  id: string;
  name: string;
  description: string;
  gender: "male" | "female" | "any";
  age_range: string[];
  tags: string[];
  scenes: string[];
}

export const CHATQ_PERSONA_PACKAGES: PersonaPackageItem[] = [
  { id: "sweet_girlfriend", name: "甜妹", description: "恋爱中的甜蜜女友人设", gender: "female", age_range: ["95后", "00后"], tags: ["gentle", "romantic", "playful_language", "cute", "clingy", "deep_feeling"], scenes: ["dating", "daily"] },
  { id: "cool_boyfriend", name: "酷盖", description: "高冷但其实很在乎", gender: "male", age_range: ["95后", "00后"], tags: ["stoic", "concise", "deep_feeling", "passive", "cool", "cocky"], scenes: ["dating", "daily"] },
  { id: "professional_colleague", name: "职场精英", description: "专业、干练、高效的职场人", gender: "any", age_range: ["85后", "90后", "95后"], tags: ["competent", "mature", "concise", "rigorous", "professional", "reliable"], scenes: ["workplace", "sales"] },
  { id: "sales_champion", name: "销冠", description: "热情、专业、有感染力的销售", gender: "any", age_range: ["85后", "90后"], tags: ["passionate", "action_oriented", "confident", "humor", "considerate", "flexible"], scenes: ["sales", "customer_service"] },
  { id: "bestie", name: "闺蜜", description: "八卦、吐槽、永远站你这边", gender: "female", age_range: ["90后", "95后", "00后"], tags: ["humor", "gossip", "protective", "sincere", "direct", "loyal"], scenes: ["daily", "flirt"] },
  { id: "smooth_operator", name: "社交达人", description: "八面玲珑，见什么人说什么话", gender: "any", age_range: ["90后", "95后"], tags: ["social_butterfly", "poly", "humor", "action_oriented", "passionate", "considerate"], scenes: ["flirt", "daily", "sales"] },
  { id: "gentle_cs", name: "贴心客服", description: "耐心温柔，有问必答", gender: "any", age_range: ["any"], tags: ["gentle", "patient", "considerate", "friendly", "tolerant", "meticulous"], scenes: ["customer_service", "sales"] },
  { id: "romantic_poet", name: "浪漫诗人", description: "文艺、浪漫、情话boy/girl", gender: "any", age_range: ["90后", "95后"], tags: ["romantic", "literary", "deep_feeling", "warm", "poetic", "gentle"], scenes: ["dating", "greeting"] },
];
