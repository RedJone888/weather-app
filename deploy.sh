#!/usr/bin/env sh

# 确保脚本抛出遇到的错误
set -e

# 生成静态文件
npm run build

# 进入生成的文件夹
cd dist

# 如果是发布到自定义域名
# echo 'www.example.com' > CNAME

git init
git add -A
git commit -m 'deploy'

# 强制推送 dist 文件夹的内容到 gh-pages 分支
git push -f git@github.com:RedJone888/weather-app.git HEAD:gh-pages

# 返回到项目根目录
cd -

