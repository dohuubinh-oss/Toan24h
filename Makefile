.PHONY: dev-frontend dev-backend up down logs sync-db sync-uploads sync-all push-db push-uploads push-all

up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f

dev-frontend:
	cd frontend && npm run dev

dev-backend:
	cd backend && go run cmd/api/main.go

# -------------------------------------------------------------
# 📥 KÉO DỮ LIỆU TỪ VPS VỀ LOCAL (VPS -> LOCAL)
# -------------------------------------------------------------

# Kéo cơ sở dữ liệu từ VPS về Local
sync-db:
	@echo "🔄 Đang đồng bộ cơ sở dữ liệu từ VPS về Localhost..."
	@ssh dokku@160.236.192.96 postgres:export toan6789-db | docker-compose exec -T postgres pg_restore --clean --if-exists --no-owner --no-privileges -U admin -d toan24h
	@echo "✅ Đồng bộ thành công 100% dữ liệu từ VPS vào Database Local!"

# Kéo hình ảnh/tài liệu từ VPS về Local
sync-uploads:
	@echo "🖼️  Đang tải toàn bộ hình ảnh và tài liệu upload từ VPS về Localhost..."
	@mkdir -p backend/uploads
	@rsync -avz --delete root@160.236.192.96:/var/lib/dokku/data/storage/toan6789-uploads/ backend/uploads/
	@echo "✅ Đồng bộ hình ảnh từ VPS về Localhost thành công!"

# Đồng bộ toàn bộ (Database + Hình ảnh) từ VPS về Local
sync-all: sync-db sync-uploads
	@echo "🎉 Hoàn tất đồng bộ toàn diện (Database + Hình ảnh) từ VPS về Localhost!"

# -------------------------------------------------------------
# 📤 ĐẨY DỮ LIỆU TỪ LOCAL LÊN VPS (LOCAL -> VPS)
# -------------------------------------------------------------

# Đẩy cơ sở dữ liệu từ Local lên VPS
push-db:
	@echo "🚀 Đang đẩy cơ sở dữ liệu từ Localhost lên VPS..."
	@docker-compose exec -T postgres pg_dump -U admin -d toan24h -Fc | ssh dokku@160.236.192.96 postgres:import toan6789-db
	@echo "✅ Đã đẩy cơ sở dữ liệu từ Localhost lên VPS thành công!"

# Đẩy hình ảnh/tài liệu từ Local lên VPS
push-uploads:
	@echo "🚀 Đang tải toàn bộ hình ảnh từ Localhost lên VPS..."
	@rsync -avz --delete backend/uploads/ root@160.236.192.96:/var/lib/dokku/data/storage/toan6789-uploads/
	@echo "✅ Đã tải hình ảnh từ Localhost lên VPS thành công!"

# Đẩy toàn bộ (Database + Hình ảnh) từ Local lên VPS
push-all: push-db push-uploads
	@echo "🎉 Hoàn tất đẩy toàn diện (Database + Hình ảnh) từ Localhost lên VPS!"




