# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

delegated: existing static HTML/CSS/JS in `dist/index.html`, retained for a fast dual-device prototype and future API integration

## Users

女装内容团队与运营人员。他们通常只有一件衣服、一张模特脸或一个参考视频，希望快速得到一条能够把衣服演绎对的短视频。

## Product Purpose

方舟女装视频智能体把“衣服应该被怎样演绎”的判断变成可复用的工作流：用户选择找参考或直接使用自己的参考，上传衣服与模特素材，选择输出模型、清晰度和时长，得到一条可继续迭代的视频。成功不是展示复杂的 AI 技术，而是让用户在每一步都知道下一步该做什么。

## Positioning

产品的核心不是单纯模仿画面，而是从金标准案例中提炼人物状态、动作、场景、氛围、能量密度与衣服匹配度，再将这种“服装演绎方式”迁移到新的衣服和模特上。

## Operating Context

用户可在手机或电脑上完成同一套 step-by-step 流程。当前第一批金标准来自用户提供的 Excel，共 199 条素材记录、198 个唯一素材 ID，时长主要集中在 6–10 秒；链接来源主要为抖音号主页素材。系统内部的检索、打码、换脸和生成逻辑对用户保持黑盒，只呈现清晰的工作状态。

## Capabilities and Constraints

- 两种模式：帮我找参考；我已有参考。
- 找参考模式先返回约 10 个可选方向，用户选择后再生成。
- 已有参考模式跳过推荐，直接进入生成设置。
- 生成设置包含模型、480/720/1080 清晰度、视频时长，以及保留原动作、场景、画质/风格等选择。
- 人脸马赛克与后续替换使用本地 Skill，默认不把源视频上传到第三方。
- 当前原型使用本地金标准数据和模拟检索，真实向量库、模型 API、视频处理队列将在后续接入。
- 不把成交数、曝光量、点击率伪装成已有字段；当前案例只标记为用户确认的优质样本。

## Evidence on Hand

- `/Users/lipaliu/Library/Containers/com.tencent.xinWeChat/Data/Documents/xwechat_files/liuchangchang123_1828/temp/drag/女装挂车短视频.xlsx`
- `/Users/lipaliu/Documents/AIGC/local-face-mosaic-tracking-portable-20260911-v3.zip`
- `/Users/lipaliu/.codex/visualizations/2026/09/12/01a0940b-1cc6-7dc2-88d6-825a4af54ab7/女装视频智能体-录音完整逻辑解读-2026-09-18.md`

## Product Principles

1. 先把衣服放进正确的情绪、场景与人物状态，再谈生成。
2. 技术复杂度留在黑盒里，用户只面对下一步明确的选择。
3. 同一套核心逻辑在移动端和电脑端都完整可用，而不是把手机端当作缩水版。
4. 金标准案例用于复用服装演绎结构，不是复制某一条视频的表面。

## Accessibility & Inclusion

关键操作使用真实按钮、标签和键盘焦点；移动端触控目标不小于 44px；颜色不是唯一的状态提示。
