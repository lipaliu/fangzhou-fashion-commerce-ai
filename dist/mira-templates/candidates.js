// Research leads, not verified daily rankings or published templates.
export const candidates = [
  {
    id: "floating",
    title: "悬浮搭配 · 模特片场",
    platform: "douyin",
    creator: "小椰爆爆🥥",
    url: "https://www.douyin.com/video/7692089168440581489",
    poster: "assets/floating-cover.jpg",
    evidence: "用户提供 · 已逐段研究",
    note: "短暂睡衣反差，整套搭配上身后进入模特展示与拍摄花絮。",
    instruction:
      "先确定完成后的整套模特造型，包括实际穿搭中的墨镜。开头约1–2秒为睡衣反差，睡衣款式不重要。搭配悬浮上身后，用pose、补妆、摄影花絮展示，场景和动作可换，最终是一条完整视频。",
    reviewed: true,
  },
  {
    id: "camera-change",
    title: "运镜换装",
    platform: "douyin",
    creator: "吉子范范",
    poster: "assets/camera-change.jpg",
    url: "https://www.douyin.com/video/7596268631147804406",
    evidence: "原片画面与作者已核对 · 待深度拆解",
    note: "标题线索：站着不动就换装。需观看原片确认运镜与换装机制。",
  },
  {
    id: "beat-change",
    title: "六秒卡点换装",
    platform: "douyin",
    creator: "北欧时刻官方旗舰店",
    poster: "assets/beat-change.jpg",
    url: "https://www.douyin.com/video/7511971418955992335",
    evidence: "原片画面与作者已核对 · 待深度拆解",
    note: "标题线索：六秒变装、多巴胺穿搭。具体节奏、镜头和可复用性待拆解。",
  },
  {
    id: "look-card",
    title: "穿搭模卡转场 · 教程线索",
    platform: "douyin",
    creator: "周大仙",
    poster: "assets/look-card.jpg",
    url: "https://www.douyin.com/video/7660202114127285555",
    evidence: "原片画面与作者已核对 · 教程类待筛选",
    note: "检索摘要提及先准备人物与单品素材，再组合穿搭转场。不是已验证的成片模板。",
  },
];
export const statusLabels = {
  pending: "待筛选",
  selected: "已选中",
  request: "待接入模型",
  deferred: "暂不做",
};
export const canManage = (role) => ["admin", "superadmin"].includes(role);
export function makeAnalysisRequest(candidate, instruction, role) {
  if (!canManage(role)) throw new Error("仅管理员与超级管理员可创建拆解任务");
  if (!candidate?.id || !candidate?.url) throw new Error("缺少候选来源");
  return {
    schemaVersion: "mira.template-analysis-request.v1",
    candidateId: candidate.id,
    sourceUrl: candidate.url,
    sourceMediaStatus: "requires-authorized-video-ingest",
    operatorInstruction: instruction.trim(),
    humanSelected: true,
    modelPolicy: { tier: "pro", allowLite: false, allowSilentDowngrade: false },
    status: "pending_backend",
    publicationStatus: "not_published",
    requiredOutput: [
      "source_observations_with_timestamps",
      "operator_interpretation",
      "reusable_mechanics",
      "replaceable_slots",
      "shot_rules",
      "template_prompt",
      "conflicts",
      "render_test_plan",
    ],
  };
}
