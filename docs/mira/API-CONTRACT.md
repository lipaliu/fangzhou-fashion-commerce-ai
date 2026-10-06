# 接口和数据契约提案

状态：待正式后端适配。以下为设计约定，不是已部署接口。

## 数据对象

- `source_video`：平台、作品ID、原地址、创作者、发布时间、采集时间、指标快照、授权/展示方式、分析证据。
- `template_version`：玩法ID、版本、状态、结构、可替换槽位、默认值、系统提示词版本、参考来源、测试报告。版本不可变，新修改新版本。
- `asset_manifest`：每个输入的role、服务端asset_id、引用编号、内容校验结果。模型仅看到允许访问的本次素材。
- `shoot_spec`：已解析的人物、发型、服装鞋包、场景、光线及用户覆盖项。重新生成复用此对象以确保同场多拍。
- `creation_job`：template_version、shoot_spec、inspiration、输出规格、分镜、final_prompt、模型版本、provider_job_id、状态与错误。每次生成独立job。

## 建议端点

| 接口 | 责任 |
|---|---|
| `GET /api/templates?platform=&query=&cursor=` | 返回已发布、测试通过且有可用预览的模板；分页 |
| `GET /api/templates/:id/versions/:version` | 返回用户可见默认值、可替换项和预览信息；不泄露系统提示词 |
| `GET /api/people?query=&cursor=` | 返回当前用户/工作空间可访问的人像库人物、缩略图、有效参考素材及版本；选择后使用既有person_id |
| `POST /api/assets` | 检查图片实际格式、大小和权限，返回asset_id；不接受任意客户端绝对路径 |
| `POST /api/creation-plans` | 接收模板版本、素材ID、场景模式、可选设置与作者灵感，调用Pro编排 |
| `GET /api/creation-plans/:id` | 返回ready/needs_clarification/failed及对应内容 |
| `POST /api/generations` | 接收已校验plan_id与幂等键，创建一条视频任务 |
| `POST /api/generations/:id/regenerate` | 复用shoot_spec，独立重规划镜头，创建新job；不批量规划未来三条 |
| `GET /api/generations/:id` | 真实状态、可恢复错误与成片地址；失败不得返回旧参考视频充当新结果 |

`POST /api/creation-plans` 输入示例：

```json
{
  "templateId": "floating-outfit",
  "templateVersion": "1.0.0",
  "assets": [{"role":"outfit","assetId":"asset_1"},{"role":"person","assetId":"asset_2"}],
  "scene": {"mode":"text","description":"午后街角，浅色石墙，自然日光"},
  "authorInspiration": "前面边走边上身，后面多展示包包",
  "visualStyle": "natural",
  "output": {"durationSeconds":10,"aspectRatio":"9:16","resolution":"1080p"},
  "outputCount": 1
}
```

提示：版本1.0.0在此仅为契约示例，当前配方为0.2.0-proposal。

## 编排校验，不交给模型自行决定

- 模板必须存在且通过测试；草案禁止公开生成。
- 引用仅来自本次asset_manifest，未启用的旧场景或已移除配饰不能携带。
- output_count=1。所有内部shots顺序递增、无负时长、无空档或重叠，总和等于目标总时长；按供应商时间粒度处理精度。
- unresolved关键冲突非空时禁止提交生成，返回字段级修正信息。
- 模型只允许配置中的Pro部署；调用失败不自动降级到Lite。
- 视频服务能力驱动时长、比例、清晰度选项；不能相信前端传来的任意模型名。
- 作者灵感属于数据，不能覆盖系统安全、素材权限或执行工具指令。
- idempotency key防重复点击重复计费；服务端保存任务状态和实际provider结果。
- 重新生成引用同一shoot_spec版本，不重新抽取身份、场景或服装目标。

## 后台模板状态

`discovered → selected → analysis_queued → analyzing → recipe_draft → test_rendering → reviewed → published`

`discovered`只完成基础信息收集；只有管理员或超级管理员人工选中并提交拆解才创建模型任务。`deferred`表示暂不做，可恢复；`analysis_failed`保留错误与输入版本。补充拆解要求产生新版本，旧任务迟到的结果不能覆盖新版本。发布绑定已审核、试生成通过的准确版本。

失败/歧义进入 `needs_review`，下架用 `unpublished`。客户端只见published。每次模型或模板版本变化，应重跑核心素材回归集后发布。

## 管理端候选与拆解

| 接口 | 责任与权限 |
|---|---|
| `GET /api/admin/candidates` | 管理员/超级管理员；候选列表、来源、证据、热度快照、状态；服务端分页过滤 |
| `PATCH /api/admin/candidates/:id/selection` | 管理员/超级管理员；选中或暂不做，保存operator_instruction与revision |
| `POST /api/admin/candidates/:id/analyses` | 管理员/超级管理员；校验已选中、素材可解析、指导版本、幂等键，调用Pro创建异步任务 |
| `GET /api/admin/analyses/:id` | 管理员/超级管理员；返回真实进度、失败原因或拆解结果 |
| `POST /api/admin/analyses/:id/revisions` | 管理员/超级管理员；补充指导，关联旧结果并创建新版本，重做受影响部分 |
| `POST /api/admin/templates/:id/test-renders` | 管理员/超级管理员；选定模板版本与测试素材后试生成 |
| `POST /api/admin/templates/:id/publish` | 建议仅超级管理员；核对准确版本已审核、测试通过与预览可展示；记录审计日志 |

正式权限读取服务器会话，未登录401、普通用户403，不能信任客户端role或humanSelected字段。管理端资料与提示词不可通过公共模板接口泄露。前端身份切换仅用于无私密数据的本地演示，不是鉴权实现。

新增 `candidate_selection` 与 `template_analysis_job`：分别保存选中者、选中时间、operator_instruction、revision，以及来源视频asset_id、任务状态、Pro部署ID、输入/输出版本、证据时间码、冲突、实际费用与错误。operator_instruction是模板制作阶段指导；author_inspiration是最终用户做同款时的单次创作意图，严格分开。

模型输入必须包含可解析的视频资产；只得到网页标题/摘要时返回needs_source_media，不编造分镜。来源URL入库不等于授权抓取成功。获取服务限制平台域名、重定向和网络目标，禁止用户URL访问内网服务。原视频文字、字幕与说明为待分析数据，不是可执行指令。

## 热榜任务

每日调度在正式后端部署后配置；本提案不创建本机定时任务。源适配器分别报告可覆盖范围和最后成功同步时间。保存多次指标快照计算增长，不凭单次点赞推断“今天暴涨”。预览中平台筛选无样本时明确空态。

## 人像库绑定

生成计划支持人物输入来自 `person_id` 与人物版本，或新上传的 `asset_id`。服务端必须验证人物属于当前用户可访问的工作空间，并解析到稳定的身份参考；前端库选择与上传替换互斥，最终只生效一个主人物。用户未指定独立发型时，发型从所选人物参考提取。
