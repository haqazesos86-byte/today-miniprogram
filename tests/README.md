# Today 单元测试 (4 文件 31 用例)

运行 `bash scripts/test.sh` 启动测试。

## tests/date.test.js
日期工具单元测试。

## tests/error.test.js
错误处理 + 重试机制。

## tests/taskApi.test.js
云函数调用封装 (mock wx.cloud.callFunction)。

## tests/process-tasks.test.js
任务处理核心业务逻辑 (排序、过滤、过期计算)。
