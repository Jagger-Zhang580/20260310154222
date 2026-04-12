@echo off
REM ============================================================
REM  CDC Pipeline 管理 (Windows 版)
REM ============================================================
set CONNECT_URL=http://localhost:8083

if "%1"=="" goto help
if "%1"=="list" goto list
if "%1"=="register-all" goto register_all
if "%1"=="status" goto status
if "%1"=="topics" goto topics
if "%1"=="help" goto help
goto help

:list
echo [INFO] 已注册的 Connectors:
curl -sf "%CONNECT_URL%/connectors" 2>nul
echo.
echo [INFO] 详细状态:
for /f %%c in ('curl -sf "%CONNECT_URL%/connectors" 2^>nul') do (
    echo %%c
)
goto end

:register_all
echo [INFO] 注册所有 Source Connectors...
for %%f in (connectors\source-*.json) do (
    echo [INFO] 注册: %%f
    curl -sf -X POST "%CONNECT_URL%/connectors" -H "Content-Type: application/json" -d @%%f 2>nul
    echo.
    timeout /t 2 /nobreak >nul
)
echo.
echo [INFO] 注册所有 Sink Connectors...
for %%f in (connectors\sink-*.json) do (
    echo [INFO] 注册: %%f
    curl -sf -X POST "%CONNECT_URL%/connectors" -H "Content-Type: application/json" -d @%%f 2>nul
    echo.
    timeout /t 2 /nobreak >nul
)
echo [INFO] 注册完成! 运行 cdc list 查看
goto end

:status
if "%2"=="" (echo 用法: cdc status ^<connector-name^>) else (
    curl -sf "%CONNECT_URL%/connectors/%2/status" 2>nul
    echo.
)
goto end

:topics
echo [INFO] CDC Kafka Topics:
docker exec cdc-kafka kafka-topics --bootstrap-server localhost:9092 --list 2>nul
goto end

:help
echo.
echo   CDC Pipeline 管理工具 (Windows)
echo.
echo   用法: cdc ^<命令^> [参数]
echo.
echo   命令:
echo     list            列出所有 Connector
echo     register-all    注册所有 Connector
echo     status ^<name^>   查看 Connector 状态
echo     topics          列出 Kafka Topics
echo     help            显示帮助
echo.
goto end

:end
