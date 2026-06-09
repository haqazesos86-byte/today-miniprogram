# Today 微信小程序 — 精简 1:1 移植 iOS SwiftUI 原版

从 [Today-iOS-SwiftUI](https://github.com/haqazesos86-byte/Today-iOS) 1:1 移植的微信小程序版。
原 iOS 项目用 SwiftData + iCloud 同步，小程序版改用 wx.setStorage 本地存储。

## 架构对照

| iOS SwiftUI 原版 | 微信小程序版 |
|---|---|
| TodayApp.swift | app.js |
| ContentView.swift | pages/index/index.wxml |
| TaskListViewModel.swift | pages/index/index.js |
| TaskItem.swift (SwiftData) | utils/storage.js |
| Date 扩展 | utils/date.js |
| DateHeaderView / EmptyStateView / TaskRowView / DividerView | 全部在 index.wxml 内联 |

## 核心交互（与 iOS 完全一致）

- 大标题「今天」+ 副标题「6月9日 星期二」+ 左右切换箭头
- 任务列表：未完成在上，已完成在分割线下方（按完成时间倒序）
- 圆圈勾选 + 文字 + 弹簧动画
- 滑动切日期（横向 dx > 100px）
- 左滑删除（红色「删除」按钮）
- 底部固定输入栏：「+ 写下来」，回车提交
- 空状态：「今天可以偷个懒了 ☕️」

## 怎么跑

1. 装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 「导入项目」选这个目录，AppID 选「测试号」即可
3. Ctrl+B 编译，扫码预览

**零 AppID、零云开发、零依赖**。直接跑。
