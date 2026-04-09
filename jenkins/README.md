# Jenkins 本地 CI/CD 配置指南

## 📋 前提条件

- Docker Desktop 已启动
- Jenkins 镜像已拉取

## 🚀 启动 Jenkins

### 方法1：Docker Compose（推荐）

```powershell
cd c:\Users\v-jaggerzhang\CodeBuddy\20260310154222\docker
docker compose up -d
```

### 方法2：Docker Run

```powershell
# 启动 Jenkins
docker run -d --name jenkins ^
  -p 8080:8080 -p 50000:50000 ^
  -v jenkins_home:/var/jenkins_home ^
  -v /var/run/docker.sock:/var/run/docker.sock ^
  jenkins/jenkins:2.452.3-lts

# 启动 Registry
docker run -d --name registry -p 5000:5000 registry:2
```

## 🔑 获取 Jenkins 密码

```powershell
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

## ⚙️ Jenkins 初始配置

### 1. 安装插件

首次登录后，选择 **Install suggested plugins**，等待安装完成。

然后额外安装以下插件：
- **Pipeline** (通常已包含)
- **Git Plugin** (通常已包含)
- **Docker Pipeline** (用于 Docker 构建)
- **Blue Ocean** (可选，美化界面)

路径：Manage Jenkins → Plugins → Available plugins

### 2. 创建管理员账户

按提示设置用户名和密码。

## 📁 创建 Pipeline Job（SCM 方式）

### Step 1: 新建 Job

1. Jenkins 首页 → **New Item**
2. 输入名称：`english-talks-tmc`
3. 选择 **Pipeline**
4. 点击 **OK**

### Step 2: 配置 SCM

1. 在 **Pipeline** 部分：
   - **Definition**: 选择 `Pipeline script from SCM`
   - **SCM**: 选择 `Git`
   - **Repository URL**: 输入你的 Git 仓库地址
     - HTTPS: `https://github.com/JaggerZhang/english-talks-tmc.git`
     - 或本地路径: `c:/Users/v-jaggerzhang/CodeBuddy/20260310154222`
   - **Credentials**: 如果是私有仓库，添加 Git 凭据
   - **Branch**: `*/main`
   - **Script Path**: `jenkins/Jenkinsfile`
2. 点击 **Save**

### Step 3: 构建触发器（可选）

在 **Build Triggers** 中可以配置：
- **Poll SCM**: `H/5 * * * *` (每5分钟检查一次)
- **GitHub hook trigger**: 接收 GitHub Webhook

### Step 4: 运行构建

1. 进入 Job 页面
2. 点击 **Build Now**
3. 查看构建日志

## 📝 Pipeline 文件说明

| 文件 | 说明 | 适用场景 |
|------|------|----------|
| `Jenkinsfile-Simple` | 最简版本 | 初学入门 |
| `Jenkinsfile-Parallel` | 并行测试 | 中级 |
| `Jenkinsfile-Docker` | Docker 构建 | 中级 |
| `Jenkinsfile` | 完整 CI/CD | 生产级 |

## 🔧 常用配置

### 添加 Git 凭据

1. Manage Jenkins → Credentials → System → Global credentials
2. Add Credentials:
   - Kind: Username with password
   - Username: 你的 GitHub 用户名
   - Password: Personal Access Token (不是密码)
   - ID: github-token

### 配置 Docker 支持

确保 Jenkins 容器能访问 Docker：

```powershell
# 方法1: 挂载 Docker socket（已在 docker-compose.yml 中配置）
-v /var/run/docker.sock:/var/run/docker.sock

# 方法2: 在 Jenkins 容器中安装 Docker CLI
docker exec -u root jenkins bash -c "curl -fsSL https://get.docker.com | sh"
```

### 配置本地 Git 仓库

如果不用 GitHub，可以直接用本地 Git 仓库：

1. 在 Pipeline 配置中：
   - SCM: Git
   - Repository URL: `/var/jenkins_home/workspace/my-repo`
   - 或使用 Jenkins 的 "Pipeline script" 直接粘贴 Jenkinsfile 内容

## 🐛 常见问题

### Q: Pipeline 报错 "checkout scm" 失败？
确保：
1. Git Plugin 已安装
2. Repository URL 正确
3. Credentials 已配置（私有仓库）

### Q: Docker 命令不可用？
```powershell
# 进入 Jenkins 容器安装 Docker CLI
docker exec -u root -it jenkins bash
curl -fsSL https://get.docker.com | sh
```

### Q: Registry 推送失败？
```powershell
# 检查 Registry 是否运行
curl http://localhost:5000/v2/_catalog

# 配置 Docker insecure registry
# Docker Desktop → Settings → Docker Engine:
{
  "insecure-registries": ["localhost:5000"]
}
```

## 📊 服务地址

| 服务 | 地址 |
|------|------|
| Jenkins | http://localhost:8080 |
| Registry API | http://localhost:5000/v2/_catalog |

## 🎯 下一步

1. 创建第一个 Pipeline Job
2. 运行 `Jenkinsfile-Simple` 验证环境
3. 逐步切换到更复杂的 Pipeline
4. 配置自动构建触发器
5. 添加通知（邮件/Slack）

---

**Happy CI/CD! 🚀**
