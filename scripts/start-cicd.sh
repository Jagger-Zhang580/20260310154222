#!/bin/bash
# ============================================
#  本地 CI/CD + n8n 自动化环境启动脚本 (Linux/Mac)
# ============================================

set -e

echo "==========================================="
echo "  本地 CI/CD + n8n 自动化环境启动脚本"
echo "==========================================="

# 检查 Docker 是否安装
echo "[1/4] 检查 Docker..."
if ! command -v docker &> /dev/null; then
    echo "[ERROR] Docker 未安装!"
    exit 1
fi

echo "[OK] Docker 已安装"

# 检查 Docker Compose 是否安装
echo "[2/4] 检查 Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    echo "[ERROR] Docker Compose 未安装!"
    exit 1
fi

echo "[OK] Docker Compose 已安装"

# 进入 docker 目录
cd "$(dirname "$0")/docker"

# 启动服务
echo ""
echo "[3/4] 启动 Docker 服务 (Jenkins + Registry + n8n)..."
docker-compose up -d

# 等待服务启动
echo ""
echo "[4/4] 等待服务启动..."
sleep 10

# 检查服务状态
echo ""
echo "==========================================="
echo "  服务状态"
echo "==========================================="
docker-compose ps

# 获取 Jenkins 初始密码
echo ""
echo "==========================================="
echo "  启动完成!"
echo "==========================================="
echo ""
echo "  Jenkins:       http://localhost:8080"
echo "  Blue Ocean:    http://localhost:8080/blue"
echo "  Registry API:  http://localhost:5000"
echo "  n8n 自动化:    http://localhost:5678"
echo "    (用户名: admin / 密码: admin123)"
echo ""
echo "  获取 Jenkins 密码:"
echo "  docker exec jenkins-blueocean cat /var/jenkins_home/secrets/initialAdminPassword"
echo ""

# 打开浏览器 (Linux)
if command -v xdg-open &> /dev/null; then
    echo "正在打开浏览器..."
    xdg-open http://localhost:8080
elif command -v open &> /dev/null; then
    echo "正在打开浏览器..."
    open http://localhost:8080
fi

echo ""
echo "==========================================="
