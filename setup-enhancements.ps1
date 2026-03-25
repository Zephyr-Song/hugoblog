#!/usr/bin/env powershell
# Hugo 博客增强功能快速配置脚本

Write-Host "🎨 Hugo 博客增强功能配置" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 检查文件是否存在
$files = @(
    "assets/css/animations.css",
    "assets/css/music-player.css",
    "static/js/particles.js",
    "static/js/music-player.js",
    "static/js/music-init.js",
    "layouts/partials/enhancements.html"
)

Write-Host "✅ 检查文件..." -ForegroundColor Green
$allExists = $true
foreach ($file in $files) {
    $path = Join-Path (Get-Location) $file
    if (Test-Path $path) {
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file (缺失)" -ForegroundColor Red
        $allExists = $false
    }
}

Write-Host ""
if ($allExists) {
    Write-Host "✅ 所有文件已就位！" -ForegroundColor Green
} else {
    Write-Host "⚠️  部分文件缺失，请检查。" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📝 配置步骤：" -ForegroundColor Cyan
Write-Host "1. 编辑 hugo.toml，确保包含以下配置：" -ForegroundColor White
Write-Host ""
Write-Host "   [params.animations]" -ForegroundColor Yellow
Write-Host "     enabled = true" -ForegroundColor Yellow
Write-Host "     particleCount = 25" -ForegroundColor Yellow
Write-Host "" -ForegroundColor Yellow
Write-Host "   [params.musicPlayer]" -ForegroundColor Yellow
Write-Host "     enabled = true" -ForegroundColor Yellow
Write-Host "     autoplay = false" -ForegroundColor Yellow
Write-Host ""

Write-Host "2. 在你的 Hugo 主题模板中加载脚本：" -ForegroundColor White
Write-Host ""
Write-Host "   在 layouts/_default/baseof.html 或 layouts/partials/head.html 的 </head> 前添加：" -ForegroundColor Yellow
Write-Host "   {{ partial ""enhancements.html"" . }}" -ForegroundColor Yellow
Write-Host ""

Write-Host "3. 编辑 static/js/music-init.js，添加你的歌曲：" -ForegroundColor White
Write-Host ""
Write-Host "   const myPlaylist = [" -ForegroundColor Yellow
Write-Host "     {" -ForegroundColor Yellow
Write-Host "       title: '歌曲名'," -ForegroundColor Yellow
Write-Host "       artist: '艺术家'," -ForegroundColor Yellow
Write-Host "       url: 'https://music-url.mp3'," -ForegroundColor Yellow
Write-Host "       cover: 'https://cover-url.jpg'" -ForegroundColor Yellow
Write-Host "     }" -ForegroundColor Yellow
Write-Host "   ];" -ForegroundColor Yellow
Write-Host ""

Write-Host "4. 本地测试：" -ForegroundColor White
Write-Host "   hugo server" -ForegroundColor Yellow
Write-Host ""

Write-Host "5. 构建并部署：" -ForegroundColor White
Write-Host "   hugo" -ForegroundColor Yellow
Write-Host ""

Write-Host "📚 详细文档：" -ForegroundColor Cyan
Write-Host "   查看 MUSIC_AND_ANIMATIONS_GUIDE.md" -ForegroundColor White
Write-Host ""

Write-Host "🎉 完成！你的博客现在有了动态效果和音乐播放器！" -ForegroundColor Green
