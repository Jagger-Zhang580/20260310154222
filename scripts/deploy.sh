#!/bin/bash
# CloudStudio 自动部署脚本
# 使用方法: ./deploy.sh

# 配置
DEPLOY_URL="http://7f815ba87d034cd6afa7c86384290a08.codebuddy.cloudstudio.run"
SERVER_USER="root"
SERVER_HOST="your-server-ip"
SERVER_PATH="/workspace"

echo "🚀 Starting deployment..."

# 构建项目（如果是静态文件，这步可以省略）
echo "📦 Building project..."

# 部署到服务器
echo "📤 Uploading files to server..."
rsync -avz --delete \
  --exclude='.git' \
  --exclude='.github' \
  --exclude='node_modules' \
  ./ ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/

echo "✅ Deployment completed!"
echo "🌐 Preview: ${DEPLOY_URL}"
