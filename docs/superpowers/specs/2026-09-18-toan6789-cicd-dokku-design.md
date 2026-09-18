# Thiết kế Hạ tầng CI/CD & Deploy Dokku cho Dự án toan6789.vn

Tài liệu thiết kế chi tiết quy trình CI/CD tự động hóa đóng gói và triển khai ứng dụng **toan6789.vn** (Next.js Frontend + Go API Backend + PostgreSQL + Redis) lên máy chủ VPS `160.236.192.96` bằng **Dokku PaaS** và **GitHub Actions**.

---

## 1. Tổng quan Kiến trúc Hệ thống (Architecture Diagram)

```mermaid
flowchart TD
    subgraph Developer & Repository
        DEV[Developer Push Code] -->|git push origin main| GH[GitHub Repository: toan6789.vn]
    end

    subgraph GitHub Actions CI/CD Pipeline
        GH -->|Trigger| GHA[.github/workflows/deploy-dokku.yml]
        GHA -->|SSH Subtree Push backend| BE_DEPLOY[Dokku App: toan6789-backend]
        GHA -->|SSH Subtree Push frontend| FE_DEPLOY[Dokku App: toan6789-frontend]
    end

    subgraph VPS Dokku PaaS (160.236.192.96)
        FE_DEPLOY --> NGINX[Dokku NGINX Reverse Proxy]
        BE_DEPLOY --> NGINX
        
        NGINX -->|toan6789.vn + SSL| FE_CONTAINER[Frontend Container :3000]
        NGINX -->|api.toan6789.vn + SSL| BE_CONTAINER[Backend Container :8080]
        
        BE_CONTAINER --> DB[(PostgreSQL Plugin: toan6789-db)]
        BE_CONTAINER --> REDIS[(Redis Plugin: toan6789-redis)]
        BE_CONTAINER --> STORAGE[Persistent Volume: /app/uploads]
    end
```

---

## 2. Thành phần Dịch vụ trên Dokku

| Tên Dịch vụ / App | Loại Dịch vụ | Tên miền / Cổng | Mô tả |
| :--- | :--- | :--- | :--- |
| `toan6789-frontend` | Dokku App (Node 20 / Next.js) | `toan6789.vn`<br>`www.toan6789.vn` | Giao diện người dùng Next.js App Router |
| `toan6789-backend` | Dokku App (Go 1.22 / Gin) | `api.toan6789.vn` | RESTful API server |
| `toan6789-db` | Dokku Postgres Plugin | Nội bộ VPS `:5432` | Cơ sở dữ liệu PostgreSQL 15 |
| `toan6789-redis` | Dokku Redis Plugin | Nội bộ VPS `:6379` | Cache & Quản lý Queue / Session |
| `toan6789-uploads` | Persistent Volume | Mount `/app/uploads` | Lưu trữ file bài tập, ảnh tải lên |

---

## 3. Danh sách Biến Môi trường Sản xuất (Production Environment)

### 3.1 Cấu hình Backend (`toan6789-backend`)
```bash
# Biến hệ thống tự động sinh bởi Dokku khi link datastore
DB_DSN="$DATABASE_URL"
REDIS_URL="$REDIS_URL"

# Biến môi trường ứng dụng
GIN_MODE="release"
PORT="8080"
FRONTEND_URL="https://toan6789.vn"
JWT_SECRET="ChuoiRandomBaoMatJWTtoan6789Min32Chars!"
GEMINI_API_KEY="AIzaSy...YourKey"
TELEGRAM_BOT_TOKEN="YourTelegramBotToken"
TELEGRAM_BOT_USERNAME="YourBotUsername"
SEPAY_WEBHOOK_TOKEN="YourSepaySecretKey"
```

### 3.2 Cấu hình Frontend (`toan6789-frontend`)
```bash
NEXT_PUBLIC_API_URL="https://api.toan6789.vn/api/v1"
BACKEND_URL="https://api.toan6789.vn"
```

---

## 4. Quy trình Triển khai Từng bước (Execution Roadmap)

### Bước 4.1: Khởi tạo Dokku Apps & Services trên VPS
Run SSH commands on VPS `160.236.192.96`:
1. Tạo 2 Dokku Apps: `toan6789-backend` & `toan6789-frontend`.
2. Tạo 2 Datastores: `toan6789-db` (Postgres) & `toan6789-redis` (Redis).
3. Link `toan6789-db` và `toan6789-redis` vào `toan6789-backend`.
4. Gán persistent storage `/var/lib/dokku/data/storage/toan6789-uploads:/app/uploads`.
5. Gán domain `toan6789.vn` cho frontend và `api.toan6789.vn` cho backend.
6. Cấu hình các biến môi trường cho cả 2 app.

### Bước 4.2: Cấu hình SSH Key & GitHub Secrets
1. Tạo cặp SSH Key `vps_toan6789` trên máy local: `ssh-keygen -t rsa -b 4096 -C "deploy@toan6789.vn" -f ~/.ssh/vps_toan6789 -N ""`.
2. Đẩy Public Key lên VPS và gán cho Dokku: `dokku ssh-keys:add admin ~/.ssh/vps_toan6789.pub`.
3. Thêm 2 Secrets vào GitHub Repository (**Settings > Secrets and variables > Actions**):
   - `VPS_HOST`: `160.236.192.96`
   - `VPS_SSH_KEY`: Nội dung đầy đủ của file `~/.ssh/vps_toan6789`.

### Bước 4.3: Tạo File CI/CD Workflow (`.github/workflows/deploy-dokku.yml`)
Workflow kích hoạt khi push code `main`, thực hiện deploy độc lập 2 thư mục `./backend` và `./frontend` sang Dokku.

### Bước 4.4: Kích hoạt SSL HTTPS miễn phí Let's Encrypt
Sau khi deploy thành công lần đầu, kích hoạt SSL miễn phí:
```bash
dokku letsencrypt:set toan6789-frontend email admin@toan6789.vn
dokku letsencrypt:set toan6789-backend email admin@toan6789.vn
dokku letsencrypt:enable toan6789-frontend
dokku letsencrypt:enable toan6789-backend
```

---

## 5. Tiêu chí Kiểm thử & Nghiệm thu (Verification)
- [ ] Backend API phản hồi clean `200 OK` tại `https://api.toan6789.vn/api/v1/exams`.
- [ ] Frontend Next.js render hoàn chỉnh tại `https://toan6789.vn`.
- [ ] Ảnh tải lên được lưu bền vững tại `/app/uploads` không bị mất khi redeploy.
- [ ] Chứng chỉ SSL HTTPS hợp lệ và tự động gia hạn qua cronjob.
