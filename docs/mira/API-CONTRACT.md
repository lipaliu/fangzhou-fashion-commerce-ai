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

提示：版本1.0.0在此仅为契约示例，当前配方为0.1.0-proposal。

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

`discovered → analyzed → recipe_draft → test_rendering → reviewed → published`

失败/歧义进入 `needs_review`，下架用 `unpublished`。客户端只见published。每次模型或模板版本变化，应重跑核心素材回归集后发布。

## 热榜任务

每日调度在正式后端部署后配置；本提案不创建本机定时任务。源适配器分别报告可覆盖范围和最后成功同步时间。保存多次指标快照计算增长，不凭单次点赞推断“今天暴涨”。预览中平台筛选无样本时明确空态。
