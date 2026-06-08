# 数据库 Schema — Today

## 集合 1：tasks（任务）

| 字段 | 类型 | 说明 |
|---|---|---|
| `_id` | string | 云数据库自动生成 |
| `_openid` | string | 微信 openid，自动注入 |
| `text` | string | 任务内容（≤500字）|
| `date` | string | 任务日期 YYYY-MM-DD |
| `isDone` | boolean | 是否完成 |
| `doneAt` | number | 完成时间戳 |
| `order` | number | 排序权重 |
| `tag` | string\|null | 标签 (#工作/#生活/#学习) |
| `priority` | string | low / normal / high |
| `dueDate` | string\|null | 截止日期 YYYY-MM-DD |
| `createdAt` | number | 创建时间戳 |
| `updatedAt` | number | 更新时间戳 |

权限：仅创建者可读写。

## 集合 2：subscriptions（订阅状态）

| 字段 | 类型 |
|---|---|
| `_openid` | string |
| `enabled` | boolean |
| `lastAuthAt` | number |
| `createdAt` | number |
| `updatedAt` | number |

## 集合 3：feedback（用户反馈）

| 字段 | 类型 |
|---|---|
| `_openid` | string |
| `type` | string | bug / feature / praise / other |
| `content` | string | ≤1000字 |
| `contact` | string | ≤100字 |
| `status` | string | pending / read / replied |
| `systemInfo` | object | 设备信息 |
| `createdAt` | number |
