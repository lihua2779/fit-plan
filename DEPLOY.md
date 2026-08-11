# 部署指南：让别人也能用你的 FitPlan

FitPlan 是纯前端静态网站（HTML + CSS + JS + GIF），不需要服务器和数据库。只要把整个 `fitness-planner` 文件夹发布到任何一个静态托管服务，手机和电脑打开网址就能用。

## 方式一：GitHub Pages（推荐，免费、稳定、长期有效）

1. 注册并登录 [GitHub](https://github.com)，右上角「+」→ New repository，仓库名随意（例如 `fitplan`），选择 Public，点 Create repository。
2. 把 `fitness-planner` 文件夹里的所有内容上传到仓库：
   - 简单方式：仓库页面点「Add file → Upload files」，把文件夹里所有文件和文件夹拖进去（不要只拖文件夹本身，要拖里面的内容），提交。
   - 命令行方式：在项目目录执行：
     ```
     git init
     git add .
     git commit -m "fitplan"
     git branch -M main
     git remote add origin https://github.com/<你的用户名>/fitplan.git
     git push -u origin main
     ```
3. 打开仓库 Settings → Pages → Source 选 `main` 分支、目录选 `/ (root)` → Save。
4. 等 1–2 分钟，访问 `https://<你的用户名>.github.io/fitplan/`，把网址发给别人即可。

## 方式二：Netlify Drop（最简单，不需要命令行）

1. 用浏览器打开 <https://app.netlify.com/drop>。
2. 把 `fitness-planner` 文件夹直接拖进页面。
3. 几秒后得到一个 `https://xxx.netlify.app` 网址，复制发给别人即可。
4. 免费额度对个人使用完全足够；想要长期保留网址，建议注册一个免费账号后部署（Deploy → 连接站点）。

## 方式三：局域网临时分享（同一 WiFi 下）

适合自己多台设备或家里小范围试用，电脑必须保持开机：

1. 打开命令行，进入 `fitness-planner` 目录：
   ```
   python -m http.server 8000
   ```
2. 查看电脑局域网 IP（Windows：`ipconfig` 里的 IPv4 地址，例如 `192.168.1.5`）。
3. 手机连同一 WiFi，浏览器打开 `http://192.168.1.5:8000/`。

局域网方式只在电脑开机且在同一网络时可用，正式分享请用方式一或方式二。

## 手机上的使用体验（PWA）

项目已支持 PWA（安装到主屏幕、离线使用）：

- **iPhone**：Safari 打开网址 → 分享按钮 → 「添加到主屏幕」，之后像 App 一样打开。
- **Android**：Chrome 打开网址 → 菜单 → 「安装应用」或「添加到主屏幕」。
- 首次打开后页面和 GIF 会被自动缓存，之后即使没网也能用（更新内容时刷新一次即可）。

## 注意事项

- **桌面提醒**：需要在浏览器里授权通知，且部分手机浏览器只允许 https 网站使用通知；`.ics` 导出日历不受影响。
- **数据存储**：计划数据保存在各设备的浏览器 localStorage 中，按网址（域名）隔离，不同人之间的数据互不影响；换设备不会自动同步。
- **URL 路径**：已使用相对路径，部署到子目录（如 `用户名.github.io/fitplan/`）也能正常加载图片和样式。
