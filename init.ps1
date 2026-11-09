$ErrorActionPreference = 'Stop'

Write-Host '=== Harness 初始化 ==='

Write-Host '=== npm install ==='
npm install
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host '=== npx tsc --noEmit ==='
npx tsc --noEmit
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host '=== npm run build ==='
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host '=== 验证完成 ==='
Write-Host ''
Write-Host '下一步：'
Write-Host '1. 阅读 feature_list.json 查看当前功能状态'
Write-Host '2. 挑选一个未完成的「单一功能」着手'
Write-Host '3. 只实现该功能'
Write-Host '4. 在声称完成前重新运行验证'
