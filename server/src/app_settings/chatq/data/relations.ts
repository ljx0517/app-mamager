/**
 * 聊商预设关系主数据（10 个）
 * 与 PRD 一致
 */
export interface RelationItem {
  id: string;
  name: string;
  description?: string;
}

export const CHATQ_RELATIONS: RelationItem[] = [
  { id: "lover", name: "恋人" },
  { id: "ambiguous", name: "暧昧对象" },
  { id: "bestie", name: "闺蜜/死党" },
  { id: "friend", name: "普通朋友" },
  { id: "colleague", name: "同事" },
  { id: "superior", name: "上级" },
  { id: "subordinate", name: "下级" },
  { id: "customer", name: "客户" },
  { id: "prospect", name: "潜在客户" },
  { id: "stranger", name: "陌生人" },
];
