// Preview-only recipe. Production publishes recipes only after generation validation.
export const template = {
  id: "floating-outfit",
  version: "0.2.0-proposal",
  title: "悬浮搭配",
  outputCount: 1,
  publicationStatus: "proposal",
  validationStatus: "not-render-tested",
  platform: "douyin",
  author: "小椰爆爆🥥",
  sourceUrl: "https://www.douyin.com/video/7692089168440581489",
  poster: "assets/floating-cover.jpg",
  media: "local-media/floating.mp4",
  sourceDuration: 22.754,
  uniqueCycleDuration: 5.683,
  defaults: {
    scene: "柔光浅色摄影棚，统一背景与地面，柔和环境光",
    opening:
      "简洁宽松、不透明的睡衣或家居服，仅用于开场反差，具体款式无需复刻；上身后被目标穿搭替换",
    action: "跟随模板",
    style: "跟随模板",
    duration: 10,
    ratio: "9:16",
    quality: "1080p",
  },
  mechanics: [
    "目标单品悬浮出现、展示并上身",
    "完成造型后像模特进入拍摄状态，以pose、补妆和摄影花絮展示整套搭配",
  ],
  fixed: [
    "一个玩法最终输出一条完整视频",
    "目标单品在悬浮与穿戴状态保持一致",
    "完成上身后锁定人物、发型、穿搭及场景",
  ],
  flexible: [
    "人物身份",
    "目标发型",
    "衣服及鞋包配饰",
    "场景",
    "人物动作",
    "具体机位与镜头组合",
    "视觉质感",
    "目标时长",
  ],
  observedPhases: [
    {
      start: 0,
      end: 1.35,
      kind: "effect",
      description: "相对稳定全身景别，服装、包、靴子依次上身",
    },
    {
      start: 1.35,
      end: 5.683,
      kind: "montage",
      description:
        "造型、俯拍、单品、补妆、自拍和杂志等短镜头快切；原片个别道具不作为模板强制项",
    },
  ],
};
export const styles = {
  跟随模板: "使用模板默认的清透自然影调，服装颜色准确，细节清晰",
  自然: "自然光色，真实肤质，适度对比与景深，保留面料细节",
  胶片: "柔和高光过渡、细腻颗粒与轻微暖调，保持服装固有色",
  CCD: "轻量数码相机的直接成像感，清晰边缘与适度直闪感，匹配场景受光",
  富士感: "清透层次、柔和色彩过渡与细腻肤色，保持服装真实颜色",
  电影感: "有层次的明暗与适度浅景深，人物和服装展示部位保持清晰",
};
export function validateForm(s) {
  const errors = [];
  if (!s.assets.outfit) errors.push("请先上传衣服参考图，或试用示例穿搭。");
  if (!s.assets.person) errors.push("请先上传人物参考图，或试用示例人物。");
  if (s.sceneMode === "text" && !s.sceneText.trim())
    errors.push("请填写场地描述，或切回模板场景。");
  if (s.sceneMode === "image" && !s.assets.scene)
    errors.push("请上传场景图，或切回模板场景。");
  if (![8, 10, 12, 15].includes(Number(s.duration)))
    errors.push("请选择支持的时长。");
  if (!["9:16", "16:9", "1:1"].includes(s.ratio))
    errors.push("请选择支持的比例。");
  return errors;
}
export function buildRequest(s) {
  const errors = validateForm(s);
  if (errors.length) throw new Error(errors.join("\n"));
  const refs = [];
  const add = (role) => {
    const a = s.assets[role];
    if (a)
      refs.push({
        role,
        ref: `@Image${refs.length + 1}`,
        fileName: a.name,
        origin: a.origin,
        ...(a.libraryPersonId ? { libraryPersonId: a.libraryPersonId } : {}),
      });
  };
  ["person", "outfit", "hair", "bag", "shoes", "accessory"].forEach(add);
  if (s.sceneMode === "image") add("scene");
  const ref = (role) => refs.find((a) => a.role === role)?.ref;
  const duration = Number(s.duration),
    transitionEnd = 1.5;
  const scene =
    s.sceneMode === "text"
      ? s.sceneText.trim()
      : s.sceneMode === "image"
        ? `以 ${ref("scene")} 建立真实三维场景`
        : template.defaults.scene;
  const roleLabels = {
    hair: "发型",
    bag: "包袋",
    shoes: "鞋履",
    accessory: "配饰",
  };
  const lines = [
    `输出一条 ${duration} 秒、${s.ratio}、${s.quality} 的完整悬浮搭配视频。`,
    `${ref("person")} 只提供主人物身份${ref("hair") ? "" : "及发型"}；${ref("outfit")} 提供目标服装和整套穿搭。`,
    `识别衣服参考是否为拼图，不按左右或上下位置硬编码；同类单品单独展示区域优先于模特身上偶然出现的单品，无独立区域时沿用全身穿搭。`,
    ...["hair", "bag", "shoes", "accessory"]
      .filter((k) => ref(k))
      .map(
        (k) =>
          `${ref(k)} 是本次明确指定的${roleLabels[k]}参考，完全采用该类别的可见设计，替换衣服拼图或其他参考中的同类内容。${k === "hair" ? "只提取发型，不采用这张图的人脸。" : ""}`,
      ),
    `场景：${scene}。匹配环境的光向、色温、接触阴影与反光，保持人脸身份及服装固有色；机位变化时呈现自然透视，不将场景图当固定平面。`,
    `画面质感：${styles[s.style] || styles["跟随模板"]}。`,
    `先确定完成后的模特造型：服装、鞋包、配饰、发型和整体妆容形成同一套完整目标造型；眼镜等单品按实际目标穿搭提取。这一终态是上身效果和所有后续镜头的统一依据。`,
    `开场状态：${template.defaults.opening}。开场已佩戴的目标配饰可保留，不再重复出现或上身。`,
    `第一部分（0–${transitionEnd} 秒）：${s.action === "自然行走" ? "人物自然向前走，相机平稳后退配合；" : s.action === "原地转身" ? "人物在原地自然转身，相机以小幅侧移配合；" : "人物放松站立并自然抬手，相机保持清晰全身构图；"}目标单品悬浮出现并依穿戴关系分组上身。过程保持对应单品款式、结构和颜色；落位后不留重复副本。`,
    `第二部分（${transitionEnd}–${duration} 秒）：完成上身后，人物像进入正式拍摄的模特，自然切换站姿、重心、侧身和回头等pose，展示完整造型与单品。穿插化妆师局部入画补妆、摄影师相机前景或拍摄间隙调整姿态等片场瞬间，默认至少安排一个明确花絮镜头。以全身、半身、俯拍或侧后方短镜头利落组接，保持拍摄现场感。辅助人员只服务拍摄，不替换主人物。身份、服装、配饰、发型和场景保持一致。可以在摄影棚或外景拍摄，动作随本次场地与单品适配。`,
    `两部分组成同一条完整视频，不输出两条视频；镜头内部动作与空间连续，镜头之间允许明确剪切。按照目标总时长组织正常速率动作，不用重复原片、慢动作或静帧补时长。`,
  ];
  return {
    schemaVersion: "mira.creation-request.v1",
    mode: "preview",
    templateId: template.id,
    templateVersion: template.version,
    outputCount: 1,
    planningModelPolicy: {
      tier: "pro",
      allowLite: false,
      allowSilentDowngrade: false,
      modelId: null,
    },
    assets: refs,
    scene: { mode: s.sceneMode, value: scene },
    authorInspiration: s.inspiration.trim(),
    output: { durationSeconds: duration, ratio: s.ratio, quality: s.quality },
    style: s.style,
    action: s.action,
    compiledBasePrompt: lines.join("\n\n"),
    planningStatus: "requires-multimodal-planner",
    internalStructure: [
      {
        from: 0,
        to: transitionEnd,
        title: "睡衣反差 → 完整造型",
        description: "短暂睡衣开场，目标搭配悬浮上身；睡衣款式不是展示重点。",
      },
      {
        from: transitionEnd,
        to: duration,
        title: "模特展示与片场花絮",
        description:
          "保持完成后的造型，以pose、补妆、摄影花絮和细节快切完成同一条视频。",
      },
    ],
    notes: [
      "这是预览请求，不是已生成视频。",
      "图片内容尚未经过大模型识别。",
      "作者灵感是待编排输入，生产端须融合并校验，不能把它直接追加到最终提示词。",
      "本地预览不上传素材。",
    ],
  };
}
