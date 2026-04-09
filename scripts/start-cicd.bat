@echo off
REM ============================================
REM  启动 Jenkins Blue Ocean CI/CD 环境
REM ============================================

echo ===========================================
echo   启动 Jenkins Blue Ocean CI/CD 环境
echo ===========================================

REM 检查 Docker 是否安装
echo [1/3] 检查 Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker 未安装或未启动!
    pause
    exit /b 1
)
echo [OK] Docker 已安装

REM 进入 docker 目录
cd /d "%~dp0docker"

REM 启动服务
echo.
echo [2/3] 启动 Jenkins Blue Ocean + Registry...
docker compose up -d

REM 等待服务启动
echo.
echo [3/3] 等待 Jenkins 启动 (约30秒)...
timeout /t 30 /nobreak >nul

REM 检查服务状态
docker compose ps

REM 显示访问信息
echo.
echo ===========================================
echo   启动完成!
echo ===========================================
echo.
echo   Jenkins Classic UI: http://localhost:8080
echo   Jenkins Blue Ocean: http://localhost:8080/blue
echo   Registry API:       http://localhost:5000/v2/_catalog
echo.
echo   获取 Jenkins 密码:
echo   docker exec jenkins-blueocean cat /var/jenkins_home/secrets/initialAdminPassword
echo.
echo ===========================================

start http://localhost:8080/blue

pause
