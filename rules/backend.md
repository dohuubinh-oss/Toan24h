---
description: Backend Expert (Golang/Gin, PostgreSQL, Nginx Infrastructure)
globs: [
  "backend/**/*.go",              # Logic xử lý Go (Gin handlers, Services, Models)
  "backend/go.mod",               # Quản lý thư viện và dependencies
  "backend/migrations/*.sql",     # Cấu trúc Database PostgreSQL
  "backend/scripts/**/*.sh",      # Các script hỗ trợ backend
  "docker-compose.yml",           # Cấu hình container (DB & Nginx)
  "nginx/**/*.conf",              # Cấu hình điều hướng Nginx
  "**/Dockerfile"                 # Dockerfile cho Backend và Nginx
]
---

# Backend Development Standards (Go & PostgreSQL)
... (nội dung quy tắc đã thống nhất trước đó)