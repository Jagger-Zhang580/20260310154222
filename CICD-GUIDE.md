# GitHub Actions CI/CD 学习指南

## 📚 Demo 列表

| Demo | 文件名 | 功能 | 触发方式 |
|------|--------|------|----------|
| 1 | `demo-01-hello.yml` | Hello World 入门 | push / manual |
| 2 | `demo-02-env.yml` | 环境变量使用 | push / manual |
| 3 | `demo-03-matrix.yml` | Matrix 并行构建 | push / manual |
| 4 | `demo-04-artifacts.yml` | 构建产物上传下载 | push / manual |
| 5 | `demo-05-cache.yml` | 依赖缓存 | push / manual |
| 6 | `demo-06-condition.yml` | 条件执行 | push / manual |
| 7 | `demo-07-secrets.yml` | Secrets 安全使用 | push / manual |
| 8 | `demo-08-parallel.yml` | 并行任务 | push / manual |
| 9 | `demo-09-schedule.yml` | 定时任务 | schedule / manual |
| 10 | `demo-10-complete-cicd.yml` | 完整 CI/CD 流水线 | push |

## 🚀 快速开始

### 1. 推送到 GitHub

```bash
cd c:\Users\v-jaggerzhang\CodeBuddy\20260310154222
git add .
git commit -m "Add CI/CD learning demos"
git remote add origin https://github.com/JaggerZhang/english-talks-tmc.git
git push -u origin main
```

### 2. 查看运行结果

1. 访问 https://github.com/JaggerZhang/english-talks-tmc/actions
2. 点击任意 workflow 查看运行日志

### 3. 手动触发

在 GitHub Actions 页面，点击 `workflow_dispatch` 触发器右侧的 "Run workflow" 按钮。

## 📖 每个 Demo 详解

### Demo 1: Hello World
最简单的 CI 示例，演示 GitHub Actions 的基本结构。

```yaml
# 关键点
on: push  # 触发条件
runs-on: ubuntu-latest  # 运行环境
steps:
  - uses: actions/checkout@v4  # 检出代码
  - run: echo "Hello"  # 执行命令
```

### Demo 2: 环境变量
学习如何在 workflow 中设置和使用环境变量。

```yaml
# 设置变量
echo "VAR_NAME=value" >> $GITHUB_ENV

# 使用变量
run: echo $VAR_NAME
```

### Demo 3: Matrix 构建
使用矩阵策略同时测试多个 Node.js 版本。

```yaml
strategy:
  matrix:
    node-version: [16.x, 18.x, 20.x]
```

### Demo 4: Artifacts
学习如何上传和下载构建产物。

```yaml
# 上传
- uses: actions/upload-artifact@v4
  with:
    name: my-artifact
    path: dist/

# 下载
- uses: actions/download-artifact@v4
  with:
    name: my-artifact
```

### Demo 5: Cache
使用缓存加速依赖安装。

```yaml
- uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-npm-${{ hashFiles('**/package-lock.json') }}
```

### Demo 6: 条件执行
根据分支或输入决定是否运行任务。

```yaml
# 条件任务
if: github.ref == 'refs/heads/main'

# workflow_dispatch 带输入
inputs:
  deploy_env:
    type: choice
    options: [staging, production]
```

### Demo 7: Secrets
安全使用敏感信息。

```yaml
# 引用 secret（不会在日志中显示）
secrets.API_KEY

# 安全使用示例
run: |
  curl -H "Authorization: Bearer ${{ secrets.API_KEY }}" \
       https://api.example.com
```

### Demo 8: 并行任务
多个 job 并行执行，通过 `needs` 声明依赖。

```yaml
jobs:
  test-1: ...
  test-2: ...
  deploy:
    needs: [test-1, test-2]  # 等待并行任务完成
```

### Demo 9: 定时任务
使用 cron 表达式设置定时触发。

```yaml
schedule:
  - cron: '0 1 * * *'  # 每天 UTC 1:00 = 北京时间 9:00
```

### Demo 10: 完整流水线
整合所有概念的完整 CI/CD 流程。

```
Lint → Test → Build → Deploy → Report
```

## 🔧 常用配置

### 触发条件

```yaml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * *'
  workflow_dispatch:  # 允许手动触发
  repository_dispatch:  # API 触发
```

### 常用 Actions

| Action | 用途 |
|--------|------|
| `actions/checkout@v4` | 检出代码 |
| `actions/setup-node@v4` | 安装 Node.js |
| `actions/setup-python@v4` | 安装 Python |
| `actions/cache@v4` | 缓存文件 |
| `actions/upload-artifact@v4` | 上传产物 |
| `actions/download-artifact@v4` | 下载产物 |

### 常用环境变量

| 变量 | 说明 |
|------|------|
| `github.sha` | 当前提交 SHA |
| `github.ref` | 分支/标签引用 |
| `github.repository` | 仓库名 |
| `github.actor` | 触发者用户名 |
| `github.run_id` | 运行 ID |
| `github.workspace` | 工作目录 |

## 📝 最佳实践

1. **使用最新版本的 Actions**
   ```yaml
   uses: actions/checkout@v4  # 不是 v2, v3
   ```

2. **缓存依赖**
   ```yaml
   - uses: actions/cache@v4
     with:
       path: ~/.npm
       key: ${{ runner.os }}-npm-${{ hashFiles('**/package-lock.json') }}
   ```

3. **使用 Secrets**
   - 永远不在代码或日志中硬编码敏感信息
   - 使用 `${{ secrets.SECRET_NAME }}`

4. **设置超时**
   ```yaml
   jobs:
     build:
       timeout-minutes: 30
   ```

5. **并行执行**
   - 使用 `needs` 优化执行时间
   - 独立的任务应该并行运行

## 🐛 常见问题

### Q: workflow 没触发？
- 检查 `on` 触发条件
- 确认分支名称正确
- 查看 Actions 日志

### Q: 权限问题？
- 添加必要的权限
  ```yaml
  permissions:
    contents: read  # 检出代码
    packages: write  # 发布包
  ```

### Q: 超时？
- 设置 `timeout-minutes`
- 检查网络连接
- 优化依赖安装

## 🎓 下一步学习

1. 学习使用 Docker in Actions
2. 学习 Kubernetes 部署
3. 学习蓝绿部署/金丝雀发布
4. 学习监控和回滚

---

**祝你学习愉快！有任何问题请提交 Issue。**
