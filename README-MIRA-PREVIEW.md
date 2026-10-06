# Mira 爆款模板 · vNext 独立版本提案

以用户提供的小椰爆爆「悬浮搭配」抖音作品为例，展示「每日热榜 → 效果预览 → 做同款 → 换衣服/换脸/换场地 → 可选调整 → 制作方案」的完整交互。

**本分支只供评审和开发交接，不是生产发布。** main和现有 `dist/index.html` 保持原状。新页面位于 `dist/mira-templates/`。

## 运行预览

无需安装依赖，仓库根目录执行：

```sh
python3 -m http.server 8873 --bind 127.0.0.1 --directory dist
```

打开 http://127.0.0.1:8873/mira-templates/ 。这是本地预览地址，不是公网网址。

1. 点击「悬浮搭配」卡片看效果，再点「做同款」。
2. 上传图片或点击「试用示例穿搭」「从人像库选择」。
3. 换场地，展开可选调整，输入灵感、选择质感。
4. 点「生成」，查看并下载制作请求JSON。这里只生成本地方案，不调用视频模型。

原片视频不随Git发布。若本地已有合法可用的研究片段，可放在 `dist/mira-templates/local-media/floating.mp4`；没有本地视频时页面保留参考截图，并提供原作者链接，不会假装生成了新视频。`.gitignore` 排除该视频目录内容。原片首轮约5.68秒，完整作品约22.75秒重复四轮。

## 开发入口

- [完整设想与开发顺序](docs/mira/VNEXT-PROPOSAL.md)
- [API及数据契约](docs/mira/API-CONTRACT.md)
- [大模型系统提示词](templates/mira/planner-system.md)
- [悬浮搭配配方](templates/mira/floating-outfit.recipe.json)
- [页面代码](dist/mira-templates/index.html)
- [制作请求编译逻辑](dist/mira-templates/template.js)
- [验收记录](docs/mira/VALIDATION.md)

## 已有与待接入

已有：响应式页面、效果弹窗、本地图片预览、人像库选择/搜索/添加、可选单品、场景模式切换、作者灵感、质感与输出选择、收藏、草稿、输入校验、请求JSON下载。新增界面沿用线上Mira截图中的浅紫色、圆角和左侧导航语汇，独立实现；未引入第三方UI源码。

待接入：每日采集、图片内容理解、Pro模型语义融合、真实分镜编排、视频生成、成片一致性检查、正式模板上架流程。前端确定性基础要求不冒充大模型融合结果。

上传素材仅在页面内保留；收藏和制作请求草稿存于localStorage。草稿包含文件名与填写文字，不包含图片二进制；刷新后若继续制作需重新选择本地文件。私密内容不应作为公开示例提交仓库。

## 素材来源

`assets/floating-cover.jpg`、`outfit.jpg`、`phase-one.jpg`、`phase-two.jpg`为上述公开作品的少量分析截图，保留原有标记，仅用于本提案解释与评审；不宣称我们拥有原作品或其商用授权。原作者链接：https://www.douyin.com/video/7692089168440581489 。正式产品预览素材需用获准展示的来源或自己的模板测试成片。

示例人物沿用本仓库已有 `dist/assets/fashion-model.png`，不作为新生成结果。新增内容不改变这些素材原有权利状态。
