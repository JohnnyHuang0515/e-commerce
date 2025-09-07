# Utility Service Dockerfile
FROM node:18-alpine

# 設置工作目錄
WORKDIR /app

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝依賴
RUN npm ci --only=production

# 複製應用程式碼
COPY . .

# 創建必要目錄
RUN mkdir -p logs uploads/{images,documents,archives,data,other} backups

# 設置權限
RUN chmod +x start.sh

# 暴露端口
EXPOSE 3019

# 健康檢查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3019/api/v1/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# 啟動命令
CMD ["npm", "start"]
