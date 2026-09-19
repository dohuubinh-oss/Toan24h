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

---

## 💡 BƯỚC 10: Bảng tổng hợp các lệnh Dokku thường dùng & Ý nghĩa Chi tiết

Dưới đây là danh sách các lệnh **Dokku** phổ biến được phân loại theo nhóm chức năng để quản lý, vận hành và debug ứng dụng trên VPS:

### 1. Quản lý Ứng dụng (App Management)
| Lệnh Dokku | Ý nghĩa & Mục đích sử dụng |
| :--- | :--- |
| `dokku apps:list` | Liệt kê tất cả ứng dụng đang tồn tại trên Dokku VPS. |
| `dokku apps:create <app-name>` | Khởi tạo một ứng dụng mới trên Dokku. |
| `dokku apps:destroy <app-name>` | Xóa hoàn toàn ứng dụng và tất cả cấu hình liên quan. |
| `dokku apps:rename <old-name> <new-name>` | Đổi tên ứng dụng đang chạy. |

### 2. Theo dõi Trạng thái & Quản lý Tiến trình (Process & Monitoring)
| Lệnh Dokku | Ý nghĩa & Mục đích sử dụng |
| :--- | :--- |
| `dokku ps:report <app-name>` | Hiển thị báo cáo chi tiết trạng thái (Deploy: true/false, Running: true/false, số lượng process, port, IP). |
| `dokku ps:restart <app-name>` | Khởi động lại container của ứng dụng (không rebuild lại source code). |
| `dokku ps:rebuild <app-name>` | Tải lại source code và thực hiện build lại container từ đầu. |
| `dokku ps:stop <app-name>` | Dừng tạm thời ứng dụng. |
| `dokku ps:start <app-name>` | Bật lại ứng dụng sau khi đã stop. |
| `dokku ps:scale <app-name> web=2` | Thay đổi số lượng container instance chạy ứng dụng (Scale up/down). |

### 3. Xem Nhật ký Log & Debug (Logs & Troubleshooting)
| Lệnh Dokku | Ý nghĩa & Mục đích sử dụng |
| :--- | :--- |
| `dokku logs <app-name>` | In ra log gần nhất của ứng dụng. |
| `dokku logs <app-name> -t` (hoặc `--tail`) | Theo dõi log trực tiếp theo thời gian thực (Real-time stream logs). |
| `dokku logs <app-name> --tail --num 100` | In ra 100 dòng log gần nhất và tiếp tục stream log mới. |
| `dokku enter <app-name> web` | Truy cập trực tiếp vào SSH terminal bên trong container đang chạy để debug. |

### 4. Quản lý Biến Môi Trường (Config & Env Vars)
| Lệnh Dokku | Ý nghĩa & Mục đích sử dụng |
| :--- | :--- |
| `dokku config:show <app-name>` | Hiển thị tất cả danh sách các biến môi trường của ứng dụng. |
| `dokku config:set <app-name> KEY=VALUE` | Cấu hình hoặc cập nhật giá trị biến môi trường (Ví dụ: `JWT_SECRET`, `PORT`). |
| `dokku config:get <app-name> KEY` | Lấy giá trị của một biến môi trường cụ thể. |
| `dokku config:unset <app-name> KEY` | Xóa một biến môi trường khỏi ứng dụng. |

### 5. Quản lý Tên miền (Domains & Routing)
| Lệnh Dokku | Ý nghĩa & Mục đích sử dụng |
| :--- | :--- |
| `dokku domains:report <app-name>` | Xem báo cáo danh sách tên miền đang trỏ vào ứng dụng. |
| `dokku domains:set <app-name> domain.com` | Thiết lập lại toàn bộ tên miền gán cho ứng dụng. |
| `dokku domains:add <app-name> domain.com` | Bổ sung thêm một tên miền phụ/tên miền mới vào ứng dụng. |
| `dokku domains:remove <app-name> domain.com` | Hủy bỏ một tên miền khỏi ứng dụng. |

### 6. Quản lý SSL HTTPS (Let's Encrypt Plugin)
| Lệnh Dokku | Ý nghĩa & Mục đích sử dụng |
| :--- | :--- |
| `dokku letsencrypt:enable <app-name>` | Đăng ký và kích hoạt chứng chỉ SSL HTTPS miễn phí cho ứng dụng. |
| `dokku letsencrypt:disable <app-name>` | Tắt SSL HTTPS của ứng dụng (chuyển về HTTP). |
| `dokku letsencrypt:auto-renew <app-name>` | Thực hiện gia hạn SSL tự động cho một ứng dụng cụ thể. |
| `dokku letsencrypt:cron-job --add` | Đăng ký Cronjob trên VPS để tự động gia hạn SSL cho tất cả app định kỳ. |
| `dokku letsencrypt:list` | Liệt kê danh sách tất cả SSL đã được cấp và ngày hết hạn. |

### 7. Quản lý Cơ sở Dữ liệu & Cache (Postgres & Redis Plugins)
| Lệnh Dokku | Ý nghĩa & Mục đích sử dụng |
| :--- | :--- |
| `dokku postgres:create <db-name>` | Tạo một cơ sở dữ liệu PostgreSQL mới độc lập trên VPS. |
| `dokku postgres:link <db-name> <app-name>` | Kết nối Database với app (tự động tiêm biến `DATABASE_URL`). |
| `dokku postgres:unlink <db-name> <app-name>` | Ngắt kết nối Database khỏi app. |
| `dokku postgres:connect <db-name>` | Truy cập trực tiếp vào giao diện CLI (`psql`) của Database. |
| `dokku postgres:export <db-name> > backup.sql` | Xuất dữ liệu Database ra file SQL để sao lưu/backup. |
| `dokku postgres:import <db-name> < backup.sql` | Nạp dữ liệu từ file SQL vào Database trên VPS. |
| `dokku redis:create <redis-name>` | Tạo một cụm cache Redis mới độc lập trên VPS. |
| `dokku redis:link <redis-name> <app-name>` | Kết nối Redis với app (tự động tiêm biến `REDIS_URL`). |

### 8. Quản lý Ổ đĩa Lưu trữ (Persistent Storage Volume)
| Lệnh Dokku | Ý nghĩa & Mục đích sử dụng |
| :--- | :--- |
| `dokku storage:list <app-name>` | Danh sách các đường dẫn đĩa cứng ngoài VPS được mount vào container. |
| `dokku storage:mount <app-name> /vps/path:/container/path` | Gán thư mục ngoài VPS vào thư mục bên trong container (ví dụ: `/app/uploads`). |
| `dokku storage:unmount <app-name> /vps/path:/container/path` | Gỡ bỏ mount thư mục khỏi container. |

### 9. Quản lý Khóa SSH Truy cập Dokku (SSH Keys)
| Lệnh Dokku | Ý nghĩa & Mục đích sử dụng |
| :--- | :--- |
| `dokku ssh-keys:list` | Danh sách các Public SSH Key được quyền deploy/chạy lệnh Dokku từ xa. |
| `dokku ssh-keys:add <key-name> /path/to/key.pub` | Thêm SSH Public Key mới cho Developer hoặc CI/CD runner. |
| `dokku ssh-keys:remove <key-name>` | Gỡ bỏ một SSH key khỏi Dokku. |

