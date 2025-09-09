# Log Service Dockerfile
FROM node:18-alpine

# 設置工作目錄
WORKDIR /app

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝依賴
RUN npm ci --only=production

# 複製源代碼
COPY . .

# 創建日誌目錄
RUN mkdir -p logs

# 暴露端口
EXPOSE 3018 3017

# 設置環境變數
ENV NODE_ENV=production
ENV PORT=3018
ENV WS_PORT=3017

# 啟動命令
CMD ["npm", "start"]
