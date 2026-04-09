@echo off
REM ============================================
REM  停止 CI/CD 环境脚本 (Windows)
REM ============================================

cd /d "%~dp0docker"

echo 停止 CI/CD 服务...
docker-compose down

echo.
echo 所有服务已停止!
pause
