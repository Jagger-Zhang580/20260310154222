@echo off
REM ============================================
REM  AML 反洗钱系统 - 停止脚本
REM ============================================

cd /d "%~dp0"

echo 停止 AML 系统所有服务...
docker compose down

echo.
echo 所有服务已停止!
pause
