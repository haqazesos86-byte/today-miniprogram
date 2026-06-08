#!/usr/bin/env bash
# 一键跑所有单元测试
set -e
cd "$(dirname "$0")/.."

echo "=============================="
echo "Today 项目单元测试"
echo "=============================="

pass=0; fail=0
for f in tests/*.test.js; do
  echo ""
  echo "--- $f ---"
  if node "$f"; then pass=$((pass+1)); else fail=$((fail+1)); fi
done

echo ""
echo "=============================="
echo "结果: $pass 个文件通过, $fail 个文件失败"
echo "=============================="
[ $fail -eq 0 ]
