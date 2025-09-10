# 使用 Node.js 18 Ubuntu 作為基礎鏡像 (TensorFlow 兼容性更好)
FROM node:18-bullseye-slim

# 設置工作目錄
WORKDIR /app

# 安裝系統依賴 (包含 TensorFlow 需要的庫)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    curl \
    bash \
    && rm -rf /var/lib/apt/lists/*

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝 Node.js 依賴
RUN npm ci --only=production

# 複製應用程式代碼
COPY src/ ./src/

# 創建必要的目錄
RUN mkdir -p logs models

# 設置環境變數
ENV NODE_ENV=production
ENV PORT=3004

# 暴露端口
EXPOSE 3004

# 健康檢查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3004/health || exit 1

# 啟動應用程式
CMD ["node", "src/app.js"]
