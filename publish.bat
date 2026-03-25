@echo off
echo 正在生成博客网站...
hugo --gc

echo 正在复制文件到 hugoblog 仓库...
xcopy /E /Y "D:\hugo\myblog\public\*" "D:\hugoblog\"

echo 正在上传到 GitHub...
cd /d "D:\hugoblog"
git add .
git commit -m "发布新文章"
git push

echo.
echo ✅ 发布成功！等待1分钟博客更新
echo.
pause