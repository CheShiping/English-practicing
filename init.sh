#!/bin/bash
set -e

echo "=== Harness 初始化 ==="

echo "=== npm install ==="
npm install

echo "=== npx tsc --noEmit ==="
npx tsc --noEmit

echo "=== npm run build ==="
npm run build

echo "=== 验证完成 ==="
echo ""
echo "下一步："
echo "1. 阅读 feature_list.json 查看当前功能状态"
echo "2. 挑选一个未完成的「单一功能」着手"
echo "3. 只实现该功能"
echo "4. 在声称完成前重新运行验证"
