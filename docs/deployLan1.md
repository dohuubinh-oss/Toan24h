# Hướng dẫn Triển khai Chi tiết Toàn tập toan6789.vn với Dokku (PaaS)

Tài liệu này chi tiết hóa toàn bộ quy trình đóng gói, cấu hình cơ sở dữ liệu, lưu trữ file tĩnh, tự động hóa SSL HTTPS và triển khai ứng dụng **toan6789.vn** (Next.js + Go + PostgreSQL + Redis) lên VPS `160.236.192.96` bằng **Dokku PaaS**.

---

## 🌐 Sơ đồ Kiến trúc Hạ tầng trên Dokku

```mermaid
flowchart TD
    subgraph Client Access
        USER[Khách Hàng - Web / Mobile Browser] -->|HTTPS| NGINX[NGINX Reverse Proxy của Dokku]
    end

    subgraph Dokku PaaS Applications
        NGINX -->|toan6789.vn / :3000| FE[App 1: toan6789-frontend - Next.js]
        NGINX -->|api.toan6789.vn / :8080| BE[App 2: toan6789-backend - Go Gin API]
    end

    subgraph Dokku Datastores & Storage
        BE -->|Internal TCP :5432| DB[(Dokku Plugin: Postgres toan6789-db)]
        BE -->|Internal TCP :6379| REDIS[(Dokku Plugin: Redis toan6789-redis)]
        BE -->|Volume Mount| STORAGE[Persistent Storage: /app/uploads]
    end
```

---

## BƯỚC 1: Cài đặt Dokku & Plugins trên VPS

Kết nối SSH vào VPS (`ssh root@160.236.192.96`) và thực hiện lần lượt các lệnh:

### 1.1 Cài đặt Dokku bản mới nhất
```bash
# Tải và chạy script cài đặt Dokku tự động
wget -NP /tmp https://dokku.com/install/v0.34.x/bootstrap.sh
sudo DOKKU_TAG=v0.34.x bash /tmp/bootstrap.sh

# Cấu hình SSH key của bạn vào Dokku để cho phép push code
cat ~/.ssh/authorized_keys | dokku ssh-keys:add admin
```

### 1.2 Cài đặt các Plugin quản lý Database, Redis & SSL
```bash
# 1. Plugin Postgres
sudo dokku plugin:install https://github.com/dokku/dokku-postgres.git postgres

# 2. Plugin Redis
sudo dokku plugin:install https://github.com/dokku/dokku-redis.git redis

# 3. Plugin Let's Encrypt (SSL HTTPS Miễn phí)
sudo dokku plugin:install https://github.com/dokku/dokku-letsencrypt.git letsencrypt
```

---

## BƯỚC 2: Khởi tạo Database & Redis Datastore

Tạo dịch vụ PostgreSQL và Redis độc lập bằng Dokku:

```bash
# 1. Tạo Database PostgreSQL
dokku postgres:create toan6789-db

# 2. Tạo Redis Cache
dokku redis:create toan6789-redis
```

---

## BƯỚC 3: Khởi tạo & Cấu hình App Backend (`toan6789-backend`)

### 3.1 Tạo App Backend & Link Database/Redis
```bash
# 1. Tạo App Backend
dokku apps:create toan6789-backend

# 2. Link Database & Redis vào Backend
dokku postgres:link toan6789-db toan6789-backend
dokku redis:link toan6789-redis toan6789-backend
```

### 3.2 Gán Ổ đĩa Lưu trữ Ổn định (Persistent Storage) cho Ảnh/Đề thi Uploads
```bash
# Tạo thư mục ngoài host VPS và gán vào container backend
dokku storage:ensure-directory toan6789-uploads
dokku storage:mount toan6789-backend /var/lib/dokku/data/storage/toan6789-uploads:/app/uploads
```

### 3.3 Thiết lập Biến Môi Trường (Environment Variables) cho Backend
```bash
# Lấy chuỗi kết nối Postgres do Dokku tạo ra gán vào DB_DSN
DATABASE_URL=$(dokku config:get toan6789-backend DATABASE_URL)
REDIS_URL=$(dokku config:get toan6789-backend REDIS_URL)

dokku config:set toan6789-backend \
  DB_DSN="$DATABASE_URL" \
  REDIS_URL="$REDIS_URL" \
  JWT_SECRET="ThayBangChuoiRandomBaoMat32KyTuTroLen!" \
  FRONTEND_URL="https://toan6789.vn" \
  GIN_MODE="release" \
  PORT="8080" \
  GEMINI_API_KEY="YOUR_GEMINI_API_KEY" \
  TELEGRAM_BOT_TOKEN="YOUR_TELEGRAM_BOT_TOKEN" \
  TELEGRAM_BOT_USERNAME="YOUR_BOT_USERNAME" \
  SEPAY_WEBHOOK_TOKEN="YOUR_SEPAY_WEBHOOK_SECRET"
```

---

## BƯỚC 4: Khởi tạo & Cấu hình App Frontend (`toan6789-frontend`)

```bash
# 1. Tạo App Frontend
dokku apps:create toan6789-frontend

# 2. Cấu hình biến môi trường
dokku config:set toan6789-frontend \
  NEXT_PUBLIC_API_URL="https://api.toan6789.vn/api/v1" \
  BACKEND_URL="https://api.toan6789.vn"
```

---

## BƯỚC 5: Cấu hình Domain & Kích hoạt SSL HTTPS

```bash
# 1. Gán Domain cho Frontend & Backend
dokku domains:set toan6789-frontend toan6789.vn www.toan6789.vn
dokku domains:set toan6789-backend api.toan6789.vn

# 2. Cấu hình Email để nhận thông báo gia hạn SSL
dokku letsencrypt:set toan6789-frontend email admin@toan6789.vn
dokku letsencrypt:set toan6789-backend email admin@toan6789.vn

# 3. Kích hoạt Cronjob tự động gia hạn SSL Let's Encrypt
dokku letsencrypt:cron-job --add
```

---

## BƯỚC 6: Thêm Git Remotes trên Máy Local

```bash
# Thêm 2 remote trỏ về Dokku VPS
git remote add dokku-backend dokku@160.236.192.96:toan6789-backend
git remote add dokku-frontend dokku@160.236.192.96:toan6789-frontend
```

---

## BƯỚC 7: Cấu hình Tự động hóa CI/CD với GitHub Actions

File `.github/workflows/deploy-dokku.yml` đã được tạo sẵn trong repository.

Bạn chỉ cần thêm 2 Secrets trong GitHub (**Settings > Secrets and variables > Actions**):
- `VPS_HOST`: `160.236.192.96`
- `VPS_SSH_KEY`: Nội dung SSH Private Key kết nối vào VPS

---

## BƯỚC 8: Hướng dẫn Truy cập Ứng dụng sau khi Deploy CI/CD

### 8.1 Commit & Push Code lên GitHub
```bash
git add .
git commit -m "ci: setup dokku deployment workflow for toan6789.vn"
git push origin main
```

### 8.2 Theo dõi Tiến trình Deploy tự động
Vào tab **Actions** trên GitHub Repository để xem workflow tự động đẩy ứng dụng lên Dokku.

### 8.3 Truy cập Ứng dụng
- Web Frontend: `https://toan6789.vn`
- API Backend: `https://api.toan6789.vn/api/v1/exams`

---

## BƯỚC 9: Bật SSL HTTPS bảo mật

Chạy 2 lệnh sau trên VPS sau khi app chạy thành công lần đầu:

```bash
dokku letsencrypt:enable toan6789-backend
dokku letsencrypt:enable toan6789-frontend
```
