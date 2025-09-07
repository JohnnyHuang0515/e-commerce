# 🛒 電商系統 Makefile

.PHONY: help dev stop build test clean deploy

# 預設目標
help: ## 顯示幫助訊息
	@echo "🛒 電商系統 - 可用命令"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# 開發環境
dev: ## 啟動開發環境
	@echo "🚀 啟動開發環境..."
	docker-compose up -d
	@echo "✅ 開發環境已啟動"
	@echo "📊 監控儀表板:"
	@echo "   - Grafana: http://localhost:3000"
	@echo "   - Prometheus: http://localhost:9090"
	@echo "   - Kibana: http://localhost:5601"

dev-build: ## 建構並啟動開發環境
	@echo "🔨 建構並啟動開發環境..."
	docker-compose up -d --build
	@echo "✅ 開發環境已建構並啟動"

stop: ## 停止所有服務
	@echo "🛑 停止所有服務..."
	docker-compose down
	@echo "✅ 所有服務已停止"

restart: ## 重新啟動所有服務
	@echo "🔄 重新啟動所有服務..."
	docker-compose restart
	@echo "✅ 所有服務已重新啟動"

# 建構相關
build: ## 建構所有服務
	@echo "🔨 建構所有服務..."
	docker-compose build
	@echo "✅ 所有服務已建構完成"

build-no-cache: ## 建構所有服務 (不使用快取)
	@echo "🔨 建構所有服務 (不使用快取)..."
	docker-compose build --no-cache
	@echo "✅ 所有服務已建構完成"

# 測試相關
test: ## 運行所有測試
	@echo "🧪 運行所有測試..."
	@echo "📁 後端測試..."
	cd backend/services/product-service && npm test
	cd backend/services/order-service && npm test
	cd backend/services/user-service && npm test
	@echo "📁 AI 服務測試..."
	cd backend/services/ai-search-service && python -m pytest
	cd ai-services/recommendation-service && python -m pytest
	cd ai-services/analytics-service && python -m pytest
	@echo "📁 前端測試..."
	cd frontend && npm test
	@echo "✅ 所有測試已完成"

test-unit: ## 運行單元測試
	@echo "🧪 運行單元測試..."
	npm run test:unit
	@echo "✅ 單元測試已完成"

test-integration: ## 運行整合測試
	@echo "🧪 運行整合測試..."
	npm run test:integration
	@echo "✅ 整合測試已完成"

test-e2e: ## 運行端到端測試
	@echo "🧪 運行端到端測試..."
	npm run test:e2e
	@echo "✅ 端到端測試已完成"

# 資料庫相關
db-migrate: ## 執行資料庫遷移
	@echo "🗄️ 執行資料庫遷移..."
	cd backend/services/product-service && npm run migrate
	cd backend/services/order-service && npm run migrate
	cd backend/services/user-service && npm run migrate
	@echo "✅ 資料庫遷移已完成"

db-seed: ## 執行資料庫種子
	@echo "🌱 執行資料庫種子..."
	cd backend/services/product-service && npm run seed
	cd backend/services/order-service && npm run seed
	cd backend/services/user-service && npm run seed
	@echo "✅ 資料庫種子已完成"

db-reset: ## 重置資料庫
	@echo "🔄 重置資料庫..."
	docker-compose down -v
	docker-compose up -d mongodb postgres redis
	sleep 10
	$(MAKE) db-migrate
	$(MAKE) db-seed
	@echo "✅ 資料庫已重置"

# 清理相關
clean: ## 清理所有容器和映像檔
	@echo "🧹 清理所有容器和映像檔..."
	docker-compose down -v --rmi all
	docker system prune -f
	@echo "✅ 清理完成"

clean-logs: ## 清理日誌檔案
	@echo "🧹 清理日誌檔案..."
	find . -name "*.log" -delete
	@echo "✅ 日誌檔案已清理"

# 部署相關
deploy-dev: ## 部署到開發環境
	@echo "🚀 部署到開發環境..."
	docker-compose -f docker-compose.dev.yml up -d
	@echo "✅ 開發環境部署完成"

deploy-prod: ## 部署到生產環境
	@echo "🚀 部署到生產環境..."
	kubectl apply -f infrastructure/kubernetes/
	@echo "✅ 生產環境部署完成"

# 監控相關
monitor: ## 啟動監控系統
	@echo "📊 啟動監控系統..."
	docker-compose -f infrastructure/monitoring/docker-compose.yml up -d
	@echo "✅ 監控系統已啟動"
	@echo "📊 監控儀表板:"
	@echo "   - Grafana: http://localhost:3000"
	@echo "   - Prometheus: http://localhost:9090"
	@echo "   - Kibana: http://localhost:5601"

logs: ## 查看所有服務日誌
	@echo "📋 查看所有服務日誌..."
	docker-compose logs -f

logs-product: ## 查看商品服務日誌
	@echo "📋 查看商品服務日誌..."
	docker-compose logs -f product-service

logs-order: ## 查看訂單服務日誌
	@echo "📋 查看訂單服務日誌..."
	docker-compose logs -f order-service

logs-user: ## 查看用戶服務日誌
	@echo "📋 查看用戶服務日誌..."
	docker-compose logs -f user-service

logs-ai-search: ## 查看AI搜尋服務日誌
	@echo "📋 查看AI搜尋服務日誌..."
	docker-compose logs -f ai-search-service

logs-log-service: ## 查看日誌服務日誌
	@echo "📋 查看日誌服務日誌..."
	docker-compose logs -f log-service

logs-notification-service: ## 查看通知服務日誌
	@echo "📋 查看通知服務日誌..."
	docker-compose logs -f notification-service

logs-utility-service: ## 查看工具服務日誌
	@echo "📋 查看工具服務日誌..."
	docker-compose logs -f utility-service

# 健康檢查
health: ## 檢查所有服務健康狀態
	@echo "🏥 檢查服務健康狀態..."
	@echo "📊 Product Service:"
	@curl -s http://localhost:3001/api/v1/health || echo "❌ Product Service 無回應"
	@echo "📊 Order Service:"
	@curl -s http://localhost:3002/api/v1/health || echo "❌ Order Service 無回應"
	@echo "📊 User Service:"
	@curl -s http://localhost:3003/api/v1/health || echo "❌ User Service 無回應"
	@echo "📊 AI Search Service:"
	@curl -s http://localhost:3014/api/v1/health || echo "❌ AI Search Service 無回應"
	@echo "📊 Notification Service:"
	@curl -s http://localhost:3017/api/v1/health || echo "❌ Notification Service 無回應"
	@echo "📊 Log Service:"
	@curl -s http://localhost:3018/api/v1/health || echo "❌ Log Service 無回應"
	@echo "📊 Utility Service:"
	@curl -s http://localhost:3019/api/v1/health || echo "❌ Utility Service 無回應"

# 文檔相關
docs: ## 生成 API 文檔
	@echo "📚 生成 API 文檔..."
	cd backend/services/product-service && npm run docs
	cd backend/services/order-service && npm run docs
	cd backend/services/user-service && npm run docs
	@echo "✅ API 文檔已生成"

docs-serve: ## 啟動文檔服務器
	@echo "📚 啟動文檔服務器..."
	cd docs && python -m http.server 8080
	@echo "📖 文檔服務器: http://localhost:8080"

# 安全相關
security-scan: ## 執行安全掃描
	@echo "🔒 執行安全掃描..."
	npm audit
	@echo "✅ 安全掃描完成"

# 性能相關
performance-test: ## 執行性能測試
	@echo "⚡ 執行性能測試..."
	npm run test:performance
	@echo "✅ 性能測試完成"

# 備份相關
backup: ## 備份資料庫
	@echo "💾 備份資料庫..."
	./scripts/backup/backup-databases.sh
	@echo "✅ 資料庫備份完成"

restore: ## 還原資料庫
	@echo "🔄 還原資料庫..."
	./scripts/backup/restore-databases.sh
	@echo "✅ 資料庫還原完成"

# 開發工具
install: ## 安裝所有依賴
	@echo "📦 安裝所有依賴..."
	cd frontend && npm install
	cd backend/services/product-service && npm install
	cd backend/services/order-service && npm install
	cd backend/services/user-service && npm install
	cd backend/services/payment-service && npm install
	cd backend/services/ai-search-service && pip install -r requirements.txt
	cd ai-services/recommendation-service && pip install -r requirements.txt
	cd ai-services/analytics-service && pip install -r requirements.txt
	@echo "✅ 所有依賴已安裝"

update: ## 更新所有依賴
	@echo "🔄 更新所有依賴..."
	cd frontend && npm update
	cd backend/services/product-service && npm update
	cd backend/services/order-service && npm update
	cd backend/services/user-service && npm update
	cd backend/services/payment-service && npm update
	@echo "✅ 所有依賴已更新"

# 快速命令
quick-start: ## 快速啟動 (建構 + 啟動 + 種子)
	@echo "🚀 快速啟動..."
	$(MAKE) build
	$(MAKE) dev
	@echo "⏳ 等待服務啟動..."
	sleep 30
	$(MAKE) db-seed
	@echo "✅ 快速啟動完成"

quick-stop: ## 快速停止
	@echo "🛑 快速停止..."
	$(MAKE) stop
	$(MAKE) clean-logs
	@echo "✅ 快速停止完成"

# 狀態檢查
status: ## 檢查所有服務狀態
	@echo "📊 檢查服務狀態..."
	docker-compose ps
	@echo ""
	@echo "🔗 API 端點:"
	@echo "   - Product Service: http://localhost:3001"
	@echo "   - Order Service: http://localhost:3002"
	@echo "   - User Service: http://localhost:3003"
	@echo "   - Search Service: http://localhost:3004"
	@echo "   - Frontend: http://localhost:3000"

# 開發輔助
shell-product: ## 進入商品服務容器
	@echo "🐳 進入商品服務容器..."
	docker-compose exec product-service sh

shell-order: ## 進入訂單服務容器
	@echo "🐳 進入訂單服務容器..."
	docker-compose exec order-service sh

shell-user: ## 進入用戶服務容器
	@echo "🐳 進入用戶服務容器..."
	docker-compose exec user-service sh

# 預設目標
.DEFAULT_GOAL := help
