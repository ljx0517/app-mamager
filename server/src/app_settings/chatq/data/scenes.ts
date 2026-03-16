/**
 * 聊商场景主数据（8 个）
 * 与 PRD、标签体系 v3.0 一致
 */
export interface SceneItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  compatibleTagIds?: string[];
}

export const CHATQ_SCENES: SceneItem[] = [
  { id: "daily", name: "日常聊天", description: "朋友、恋人、家人间的日常沟通", icon: "💬", color: "#4CAF50" },
  { id: "workplace", name: "职场沟通", description: "工作场景的专业沟通", icon: "💼", color: "#2196F3" },
  { id: "sales", name: "销售咨询", description: "商业咨询、客户跟进、成交转化", icon: "📈", color: "#FF9800" },
  { id: "customer_service", name: "客服服务", description: "客户咨询、问题处理、售后服务", icon: "🎧", color: "#9C27B0" },
  { id: "dating", name: "恋爱亲密", description: "追求期、甜蜜期、暧昧期对话", icon: "💕", color: "#E91E63" },
  { id: "flirt", name: "社交破冰", description: "新认识的人开启对话", icon: "✨", color: "#00BCD4" },
  { id: "apology", name: "道歉和解", description: "矛盾、道歉、求和、修复关系", icon: "🤝", color: "#795548" },
  { id: "greeting", name: "节日问候", description: "逢年过节的祝福和问候", icon: "🎉", color: "#FF5722" },
];
