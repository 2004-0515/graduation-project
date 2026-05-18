# 使用满足 package.json engines 约束的 Node 版本进行构建
FROM node:22-alpine AS build

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json（如果存在）
COPY package*.json ./

# 构建阶段需要 devDependencies（例如 vite）
RUN npm ci

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 使用nginx来服务静态文件
FROM nginx:alpine

# 复制构建好的文件到nginx
COPY --from=build /app/dist /usr/share/nginx/html

# 复制nginx配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]
