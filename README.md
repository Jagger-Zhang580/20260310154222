# English Talks TMC - CI/CD 自动化部署指南

## 🎯 概述

本项目实现了完全自动化的 CI/CD 流程，代码推送到 GitHub 后会自动部署到 CloudStudio。

## 🔄 自动化流程

```
代码 Push → GitHub Actions → 自动构建 → 自动部署 → CloudStudio
```

## 🚀 快速开始

### 1. 创建 GitHub 仓库

```bash
# 创建新仓库（在 GitHub 上操作）
# 然后在本地执行：

cd c:\Users\v-jaggerzhang\CodeBuddy\20260310154222
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/english-talks-tmc.git
git push -u origin main
```

### 2. 配置 GitHub Secrets

在 GitHub 仓库中依次点击：
**Settings → Secrets and variables → Actions → New repository secret**

添加以下 Secrets：

| Secret Name | Description | Example |
|------------|-------------|---------|
| `DEPLOY_URL` | 部署后的访问地址 | `https://xxx.codebuddy.cloudstudio.run` |
| `SERVER_HOST` | 服务器 IP（如果使用 SSH） | `192.168.1.1` |
| `SERVER_USER` | 服务器用户名（如果使用 SSH） | `root` |
| `SERVER_PASSWORD` | 服务器密码或 SSH 密钥 | `***` |
| `CLOUDSTUDIO_TOKEN` | CloudStudio API Token（如果有） | `***` |

### 3. 启用 GitHub Actions

推送到 main 分支后，GitHub Actions 会自动：
1. 检出代码
2. 运行测试（可选）
3. 部署到服务器
4. 发送通知

## 📁 项目结构

```
├── index.html              # 会议邀请页面
├── deploy-demo.html        # 部署演示页面
├── scripts/
│   └── deploy.sh          # 本地部署脚本
└── .github/
    └── workflows/
        ├── auto-deploy.yml    # 自动化部署工作流
        └── deploy.yml         # 基础部署工作流
```

## 🔧 自定义配置

### 修改部署命令

编辑 `.github/workflows/auto-deploy.yml`：

```yaml
- name: Deploy to CloudStudio
  run: |
    # 添加你的部署命令
    rsync -avz ./ user@server:/path/
```

### 添加更多步骤

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Install dependencies
        run: npm install
      
      - name: Build
        run: npm run build
      
      - name: Deploy
        run: ./scripts/deploy.sh
      
      - name: Test
        run: curl -I ${{ secrets.DEPLOY_URL }}
```

## 📊 工作流状态

在 GitHub 仓库的 Actions 页面可以查看：
- 部署历史
- 实时日志
- 失败原因

## 🔐 安全建议

1. **不要提交敏感信息**：使用 GitHub Secrets
2. **限制部署权限**：只允许 main 分支触发
3. **添加审批流程**：对于生产环境，可以添加 manual approval

## 🆘 故障排除

### 部署失败
1. 检查 GitHub Actions 日志
2. 确认 Secrets 配置正确
3. 验证服务器连接

### 权限问题
```bash
# 本地脚本需要执行权限
chmod +x scripts/deploy.sh
```

## 📞 联系方式

如有问题，请提交 Issue 或联系维护者。

---

**English Talks TMC - Where Leaders Are Made! 🎯**
