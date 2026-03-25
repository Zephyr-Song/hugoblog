#!/usr/bin/env powershell
# Hugo 博客增强功能诊断脚本

Write-Host "🔍 Hugo 博客增强功能诊断" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 检查文件
$files = @(
    @{ path = "assets/css/animations.css"; name = "动画样式" },
    @{ path = "assets/css/music-player.css"; name = "播放器样式" },
    @{ path = "static/js/particles.js"; name = "粒子系统" },
    @{ path = "static/js/music-player.js"; name = "播放器核心" },
    @{ path = "static/js/music-init.js"; name = "播放器初始化" },
    @{ path = "layouts/partials/extend_head.html"; name = "头部扩展" },
    @{ path = "layouts/partials/extend_footer.html"; name = "页脚扩展" }
)

Write-Host "📁 文件检查：" -ForegroundColor Green
$allExists = $true
foreach ($file in $files) {
    $fullPath = Join-Path (Get-Location) $file.path
    if (Test-Path $fullPath) {
        Write-Host "  ✓ $($file.name)" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $($file.name) (缺失)" -ForegroundColor Red
        $allExists = $false
    }
}

Write-Host ""

# 检查 hugo.toml 配置
Write-Host "⚙️  配置检查：" -ForegroundColor Green
$tomlPath = "hugo.toml"
if (Test-Path $tomlPath) {
    $content = Get-Content $tomlPath -Raw
    
    if ($content -match '\[params\.animations\]') {
        Write-Host "  ✓ 动画配置存在" -ForegroundColor Green
    } else {
        Write-Host "  ✗ 动画配置缺失" -ForegroundColor Red
    }
    
    if ($content -match '\[params\.musicPlayer\]') {
        Write-Host "  ✓ 播放器配置存在" -ForegroundColor Green
    } else {
        Write-Host "  ✗ 播放器配置缺失" -ForegroundColor Red
    }
} else {
    Write-Host "  ✗ hugo.toml 不存在" -ForegroundColor Red
}

Write-Host ""

# 检查 extend_head.html 内容
Write-Host "📝 extend_head.html 内容检查：" -ForegroundColor Green
$headPath = "layouts/partials/extend_head.html"
if (Test-Path $headPath) {
    $headContent = Get-Content $headPath -Raw
    if ($headContent -match 'animations\.css') {
        Write-Host "  ✓ 动画样式加载" -ForegroundColor Green
    } else {
        Write-Host "  ✗ 动画样式未加载" -ForegroundColor Red
    }
    
    if ($headContent -match 'music-player\.css') {
        Write-Host "  ✓ 播放器样式加载" -ForegroundColor Green
    } else {
        Write-Host "  ✗ 播放器样式未加载" -ForegroundColor Red
    }
}

Write-Host ""

# 检查 extend_footer.html 内容
Write-Host "📝 extend_footer.html 内容检查：" -ForegroundColor Green
$footerPath = "layouts/partials/extend_footer.html"
if (Test-Path $footerPath) {
    $footerContent = Get-Content $footerPath -Raw
    if ($footerContent -match 'particles\.js') {
        Write-Host "  ✓ 粒子脚本加载" -ForegroundColor Green
    } else {
        Write-Host "  ✗ 粒子脚本未加载" -ForegroundColor Red
    }
    
    if ($footerContent -match 'music-player\.js') {
        Write-Host "  ✓ 播放器脚本加载" -ForegroundColor Green
    } else {
        Write-Host "  ✗ 播放器脚本未加载" -ForegroundColor Red
    }
    
    if ($footerContent -match 'music-init\.js') {
        Write-Host "  ✓ 初始化脚本加载" -ForegroundColor Green
    } else {
        Write-Host "  ✗ 初始化脚本未加载" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🚀 下一步：" -ForegroundColor Cyan
Write-Host "1. 运行: hugo server" -ForegroundColor White
Write-Host "2. 访问: http://localhost:1313" -ForegroundColor White
Write-Host "3. 按 F12 打开开发者工具" -ForegroundColor White
Write-Host "4. 查看 Console 标签是否有错误" -ForegroundColor White
Write-Host "5. 查看右下角是否有 🎵 按钮" -ForegroundColor White
Write-Host ""

if ($allExists) {
    Write-Host "✅ 所有文件已就位！" -ForegroundColor Green
} else {
    Write-Host "⚠️  部分文件缺失，请检查。" -ForegroundColor Yellow
}
