// T011: 分类体系常量

export const CATEGORY_GROUPS: Record<string, string[]> = {
  设施类: ["房间设施", "公共设施", "餐饮设施"],
  服务类: ["前台服务", "客房服务", "退房/入住效率"],
  位置类: ["交通便利性", "周边配套", "景观/朝向"],
  价格类: ["性价比", "价格合理性"],
  体验类: ["整体满意度", "安静程度", "卫生状况"],
};

export const ALL_CATEGORIES: string[] = Object.values(CATEGORY_GROUPS).flat();
