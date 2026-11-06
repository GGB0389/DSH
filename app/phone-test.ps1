# 手机 USB 调试测试脚本
# 用法：手机开「USB 调试」并连上电脑后，在本目录运行：
#   powershell -ExecutionPolicy Bypass -File .\phone-test.ps1

Write-Host "检查 ADB 设备..." -ForegroundColor Cyan
adb start-server | Out-Null
$devices = adb devices | Select-Object -Skip 1 | Where-Object { $_ -match "device$" }

if (-not $devices) {
  Write-Host ""
  Write-Host "没有检测到手机。请按下面做：" -ForegroundColor Yellow
  Write-Host "1. 手机开启 开发者选项 -> USB 调试"
  Write-Host "2. 用数据线连接电脑，弹窗点「允许」"
  Write-Host "3. 再重新运行本脚本"
  Write-Host ""
  adb devices -l
  exit 1
}

Write-Host "已连接设备：" -ForegroundColor Green
$devices | ForEach-Object { Write-Host "  $_" }

Write-Host "设置端口反代 5173 ..." -ForegroundColor Cyan
adb reverse --remove-all 2>$null
adb reverse tcp:5173 tcp:5173

Write-Host ""
Write-Host "成功！请在手机浏览器打开：" -ForegroundColor Green
Write-Host "  http://127.0.0.1:5173/" -ForegroundColor White
Write-Host ""
Write-Host "保持本窗口和电脑上的 npm run dev 不要关。" -ForegroundColor DarkGray
