FROM node:20.15.0

RUN mkdir -p /app

# 设置工作目录
WORKDIR /app

# 设置淘宝镜像
RUN npm config set registry http://registry.npm.taobao.org/

# 安装 pnpm
RUN npm install -g pnpm@8.15.8

# 复制所有文件到工作目录
COPY . .

# 安装所有依赖
RUN pnpm install

# 构建项目
RUN pnpm run build

# 启动应用（根据实际情况调整启动命令）
CMD ["pnpm", "start:prod"]