# 使用官方的 Node.js 镜像作为基础
FROM node:20-bookworm-slim

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install --production

# 复制源代码
COPY . .

# 设置可执行权限
RUN chmod +x bin/media-renamer

# 设置入口点
ENTRYPOINT ["./bin/media-renamer"]