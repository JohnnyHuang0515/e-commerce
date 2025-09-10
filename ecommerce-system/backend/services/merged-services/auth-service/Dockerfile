FROM node:18-alpine

# 設定工作目錄
WORKDIR /app

# 安裝必要的系統依賴
RUN apk add --no-cache \
    curl \
    bash

# 複製 package.json 和 package-lock.json
COPY auth-service/package*.json ./

# 安裝依賴
RUN npm ci --only=production && npm cache clean --force

# 複製共享配置和應用程式代碼
COPY shared-config ./shared-config
COPY auth-service/ .

# 創建必要的目錄
RUN mkdir -p logs uploads

# 設定非 root 使用者
RUN chown -R node:node /app
USER node

# 暴露端口
EXPOSE 3002

# 健康檢查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3002/health || exit 1

# 啟動命令
CMD ["npm", "start"]
