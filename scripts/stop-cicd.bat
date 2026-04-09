@echo off
REM ============================================
REM  停止 CI/CD + n8n 环境 (Windows)
REM ============================================

cd /d "%~dp0docker"

echo 停止 CI/CD + n8n 服务...
docker-compose down

echo.
echo 所有服务已停止! (Jenkins + Registry + n8n)
pause
