@echo off
REM ============================================
REM  AML 反洗钱系统 - 启动脚本
REM ============================================

echo ===========================================
echo   AML 反洗钱端到端学习系统 - 启动
echo ===========================================

REM 检查 Docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker 未安装或未启动!
    pause
    exit /b 1
)

REM 进入项目目录
cd /d "%~dp0"

REM 启动基础服务 (数据库 + 缓存)
echo.
echo [1/3] 启动数据存储层...
docker compose up -d postgres neo4j redis minio

REM 等待数据库就绪
echo [等待] 数据库启动中 (15秒)...
timeout /t 15 /nobreak >nul

REM 启动计算层
echo.
echo [2/3] 启动计算引擎 + DataWorks...
docker compose up -d spark-master spark-worker dataworks-sim

REM 等待 Spark 就绪
echo [等待] Spark 启动中 (20秒)...
timeout /t 20 /nobreak >nul

REM 启动学习层
echo.
echo [3/3] 启动 Jupyter + Grafana...
docker compose up -d jupyter grafana

REM 检查状态
echo.
echo ===========================================
echo   服务状态
echo ===========================================
docker compose ps

REM 显示访问信息
echo.
echo ===========================================
echo   启动完成!
echo ===========================================
echo.
echo   Jupyter Notebook:  http://localhost:8888  (密码: aml_learning)
echo   Neo4j Browser:     http://localhost:7474  (neo4j / aml_neo4j123)
echo   MinIO Console:     http://localhost:9001  (aml_admin / aml_minio123)
echo   Spark Master:      http://localhost:8081
echo   Grafana:           http://localhost:3000  (admin / aml_grafana123)
echo   DataWorks Sim:     http://localhost:8082
echo.
echo   PostgreSQL:        localhost:5432 (aml_user / aml_pass123 / aml_db)
echo   Redis:             localhost:6379
echo.
echo   下一步:
echo     1. 打开 Jupyter 开始学习
echo     2. 查看 DataWorks 调度日志: docker logs -f aml-dataworks
echo.
echo ===========================================

start http://localhost:8888
pause
