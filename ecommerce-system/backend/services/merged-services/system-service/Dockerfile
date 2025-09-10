# 使用官方 Node.js 18 Alpine 鏡像
FROM node:18-alpine

# 設置工作目錄
WORKDIR /app

# 安裝系統依賴
RUN apk add --no-cache \
    curl \
    bash \
    python3 \
    make \
    g++ \
    vips-dev

# 複製 package.json 和 package-lock.json
COPY system-service/package*.json ./

# 安裝 Node.js 依賴
RUN npm ci --only=production && npm cache clean --force

# 複製共享配置和應用代碼
COPY shared-config ./shared-config
COPY system-service/ .

# 創建必要的目錄
RUN mkdir -p logs uploads backups exports

# 設置權限
RUN chown -R node:node /app

# 切換到非 root 用戶
USER node

# 暴露端口
EXPOSE 3005

# 健康檢查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3005/api/v1/health || exit 1

# 啟動應用
CMD ["npm", "start"]
