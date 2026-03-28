# GitHub Actions 修复说明

## 问题诊断

你的 GitHub Actions 工作流失效的原因：

1. **权限配置不完整** — 缺少 `pages` 和 `id-token` 权限
2. **部署方式过时** — 使用了 `peaceiris/actions-gh-pages` 而不是官方的 GitHub Pages 部署方式
3. **缺少并发控制** — 没有防止并发部署导致的冲突

## 修复内容

### 更新的 `.github/workflows/deploy.yml`

✅ **改进点：**

1. **权限配置** — 添加了正确的权限：
   ```yaml
   permissions:
     contents: read
     pages: write
     id-token: write
   ```

2. **并发控制** — 防止多个部署同时运行：
   ```yaml
   concurrency:
     group: "pages"
     cancel-in-progress: false
   ```

3. **官方部署方式** — 使用 GitHub 官方的部署 Actions：
   - `actions/upload-pages-artifact@v3` — 上传构建产物
   - `actions/deploy-pages@v4` — 部署到 GitHub Pages

4. **工作流分离** — 分为 `build` 和 `deploy` 两个 job，更清晰且更安全

5. **手动触发** — 添加了 `workflow_dispatch` 支持，可以手动触发部署

## 下一步

1. **提交更改**：
   ```bash
   git add .github/workflows/deploy.yml
   git commit -m "fix: update github actions workflow for pages deployment"
   git push origin main
   ```

2. **检查 GitHub 仓库设置**：
   - 进入 Settings → Pages
   - 确保 "Build and deployment" 的 Source 设置为 "GitHub Actions"
   - 确保自定义域名设置为 `zephyrsong.qzz.io`

3. **查看部署日志**：
   - 进入 Actions 标签页
   - 查看最新的工作流运行日志
   - 如果仍有问题，检查具体的错误信息

## 验证清单

- ✅ CNAME 文件存在：`static/CNAME` → `zephyrsong.qzz.io`
- ✅ Hugo 配置正确：`hugo.toml` 已验证
- ✅ 主题已安装：`themes/PaperMod` 存在
- ✅ 工作流文件已更新

## 常见问题

**Q: 为什么要用官方的 GitHub Pages Actions？**
A: 官方方式更稳定、更新更及时、权限管理更安全，且与 GitHub Pages 的最新功能完全兼容。

**Q: 如果还是失败怎么办？**
A: 检查 GitHub 仓库的 Actions 日志，查看具体的错误信息。常见原因包括：
- 分支名称不对（确保是 `main` 而不是 `master`）
- 权限不足（检查 token 权限）
- 构建失败（检查 Hugo 构建日志）
