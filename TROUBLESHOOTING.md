# 🔧 故障排除指南

## 问题 1：看不到动画背景

### 症状
- 没有浮动的粒子
- 背景是纯色

### 解决方案

**步骤 1：检查配置**
```toml
# 在 hugo.toml 中确保有这些配置
[params.animations]
  enabled = true
  particleCount = 25
  enableMouseTracking = true
```

**步骤 2：检查浏览器控制台**
1. 按 `F12` 打开开发者工具
2. 点击 "Console" 标签
3. 查看是否有红色错误信息

**步骤 3：检查文件**
确保这些文件存在：
- `assets/css/animations.css`
- `static/js/particles.js`
- `layouts/partials/extend_head.html`
- `layouts/partials/extend_footer.html`

**步骤 4：清除缓存并重启**
```bash
# 停止 Hugo 服务器 (Ctrl+C)
# 清除 Hugo 缓存
rm -r resources/_gen

# 重新启动
hugo server
```

---

## 问题 2：看不到音乐播放器

### 症状
- 右下角没有 🎵 按钮
- 没有播放器界面

### 解决方案

**步骤 1：检查配置**
```toml
# 在 hugo.toml 中确保有这些配置
[params.musicPlayer]
  enabled = true
  autoplay = false
```

**步骤 2：检查浏览器控制台**
1. 按 `F12` 打开开发者工具
2. 点击 "Console" 标签
3. 查看是否有错误信息
4. 应该看到：`✅ 音乐播放器已初始化，歌单已加载`

**步骤 3：检查文件**
确保这些文件存在：
- `assets/css/music-player.css`
- `static/js/music-player.js`
- `static/js/music-init.js`
- `layouts/partials/extend_head.html`
- `layouts/partials/extend_footer.html`

**步骤 4：检查 HTML**
在浏览器中按 `F12`，查看 Elements/Inspector 标签：
- 搜索 `music-player`
- 应该能找到播放器的 HTML 元素

---

## 问题 3：音乐无法播放

### 症状
- 点击播放按钮没有反应
- 没有声音
- 进度条不动

### 解决方案

**步骤 1：检查网络**
1. 打开浏览器控制台（F12）
2. 点击 "Network" 标签
3. 点击播放按钮
4. 查看是否有音乐文件的请求
5. 检查状态码是否为 200

**步骤 2：检查音乐 URL**
在浏览器地址栏直接访问音乐 URL：
```
https://music.163.com/song/media/outer/url?id=167876.mp3
```

如果无法访问，可能是：
- URL 错误
- 网络问题
- 音乐已下架

**步骤 3：检查 CORS**
如果看到 CORS 错误，可能需要：
- 使用支持 CORS 的音乐源
- 设置代理
- 使用本地音乐文件

**步骤 4：检查浏览器权限**
某些浏览器可能需要允许自动播放：
1. 点击地址栏左边的锁图标
2. 查看 "Sound" 或 "Media" 权限
3. 改为 "Allow"

---

## 问题 4：动画卡顿

### 症状
- 粒子动画不流畅
- 页面响应缓慢
- CPU 占用率高

### 解决方案

**步骤 1：减少粒子数量**
在 `hugo.toml` 中修改：
```toml
[params.animations]
  particleCount = 10  # 从 25 改为 10
```

**步骤 2：禁用鼠标跟踪**
在 `hugo.toml` 中修改：
```toml
[params.animations]
  enableMouseTracking = false
```

**步骤 3：在移动设备上禁用**
编辑 `static/js/particles.js`，在初始化代码前添加：
```javascript
// 在移动设备上禁用粒子
if (window.innerWidth < 768) {
  console.log('移动设备，禁用粒子动画');
  // 注释掉下面的代码
  // const particleSystem = new ParticleSystem(...);
}
```

---

## 问题 5：样式不正确

### 症状
- 播放器位置不对
- 颜色不对
- 按钮太大或太小

### 解决方案

**步骤 1：检查 CSS 文件**
确保 CSS 文件被正确加载：
1. 按 `F12` 打开开发者工具
2. 点击 "Sources" 标签
3. 查看 `css/music-player.css` 是否在列表中

**步骤 2：检查 CSS 冲突**
可能与主题的 CSS 冲突：
1. 按 `F12` 打开开发者工具
2. 右键点击播放器
3. 选择 "Inspect" 或 "检查元素"
4. 查看应用的 CSS 规则

**步骤 3：自定义样式**
编辑 `assets/css/music-player.css`，修改颜色、大小等

---

## 问题 6：脚本加载顺序错误

### 症状
- 控制台显示 `window.musicPlayer is undefined`
- 动画不工作

### 解决方案

**步骤 1：检查脚本加载顺序**
在浏览器中按 `F12`，查看 "Network" 标签：
1. 刷新页面
2. 查看脚本加载顺序
3. 应该是：
   - `music-player.js` 先加载
   - `music-init.js` 后加载

**步骤 2：检查 extend_footer.html**
确保脚本按正确顺序加载：
```html
<!-- 先加载播放器核心 -->
<script defer src="{{ "js/music-player.js" | relURL }}"></script>

<!-- 再加载初始化脚本 -->
<script defer src="{{ "js/music-init.js" | relURL }}"></script>
```

---

## 问题 7：Hugo 构建失败

### 症状
- `hugo server` 报错
- 页面无法加载

### 解决方案

**步骤 1：查看错误信息**
```bash
hugo server
# 查看输出中的错误信息
```

**步骤 2：检查 TOML 语法**
确保 `hugo.toml` 语法正确：
```bash
# 使用在线 TOML 验证器
# https://www.toml-lint.com/
```

**步骤 3：检查文件编码**
确保所有文件都是 UTF-8 编码

**步骤 4：清除缓存**
```bash
rm -r resources/_gen
hugo server
```

---

## 快速诊断清单

- [ ] `hugo.toml` 中有 `[params.animations]` 配置
- [ ] `hugo.toml` 中有 `[params.musicPlayer]` 配置
- [ ] `layouts/partials/extend_head.html` 存在
- [ ] `layouts/partials/extend_footer.html` 存在
- [ ] `assets/css/animations.css` 存在
- [ ] `assets/css/music-player.css` 存在
- [ ] `static/js/particles.js` 存在
- [ ] `static/js/music-player.js` 存在
- [ ] `static/js/music-init.js` 存在
- [ ] 浏览器控制台没有红色错误
- [ ] 右下角有 🎵 按钮
- [ ] 背景有浮动粒子

---

## 获取帮助

如果以上步骤都不能解决问题：

1. **查看浏览器控制台** — 复制完整的错误信息
2. **查看 Hugo 输出** — 复制完整的错误信息
3. **检查网络** — 确保能访问音乐 URL
4. **尝试其他浏览器** — 确认是否是浏览器问题
5. **清除所有缓存** — 包括浏览器缓存和 Hugo 缓存

---

## 常用命令

```bash
# 启动 Hugo 服务器
hugo server

# 清除 Hugo 缓存
rm -r resources/_gen

# 构建静态网站
hugo

# 查看 Hugo 版本
hugo version

# 查看 Hugo 配置
hugo config
```

---

**最后更新：** 2026-03-25
