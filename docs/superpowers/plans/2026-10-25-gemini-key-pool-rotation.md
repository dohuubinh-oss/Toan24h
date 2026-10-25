# Gemini Key Pool Rotation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng module quản lý xoay vòng API key Gemini theo cơ chế tuần tự (sticky key), tự động đưa key bị lỗi hạn mức (HTTP 429/503/RESOURCE_EXHAUSTED) vào trạng thái nghỉ 6 tiếng và chuyển sang key kế tiếp trong suốt với người dùng cho toàn bộ 5 dịch vụ AI backend.

**Architecture:** Tạo `GeminiPoolManager` lưu trữ in-memory trong `backend/internal/utils/gemini_pool.go` bảo vệ bởi `sync.RWMutex`. Cung cấp phương thức `ExecuteWithRetry` bọc ngoài các cuộc gọi HTTP đến Google Gemini API, tự động nhận diện mã lỗi Quota/Rate Limit và tráo key kế tiếp trong suốt với người dùng. Cập nhật đồng bộ cho 5 services: `ai_grader`, `ocr_service`, `question_extractor`, `lecture_extractor`, `geometry_visualizer_service`.

**Tech Stack:** Go 1.26, `sync.RWMutex`, `net/http`, Go standard testing with `-race`.

**Spec:** `docs/superpowers/specs/2026-10-25-gemini-key-pool-rotation-design.md`

## Global Constraints

- **Storage:** Chỉ lưu trạng thái trong RAM (In-Memory với `sync.RWMutex`), không dùng Redis hay PostgreSQL.
- **Sequential Priority:** Không dùng round-robin per-request; dùng Key[i] liên tục cho đến khi dính lỗi hạn mức.
- **Cooldown Duration:** Mặc định 6 tiếng (`6 * time.Hour`).
- **Error Discrimination:** Chỉ phạt cooldown khi gặp lỗi hạn mức hoặc server quá tải (`HTTP 429`, `HTTP 503`, `"RESOURCE_EXHAUSTED"`, `"Quota exceeded"`, `"rateLimitExceeded"`). Tuyệt đối không phạt key với lỗi `HTTP 400 Bad Request` hoặc payload lỗi.
- **Failover:** Tự động retry với key kế tiếp khi key trước dính lỗi 429; nếu tất cả keys cạn kiệt, trả về lỗi tiếng Việt: `"Hệ thống AI đang tạm thời quá tải hạn mức, vui lòng thử lại sau ít phút"`.
- **Backward Compatibility:** Đọc `GEMINI_API_KEYS` từ `.env` (ngăn cách bởi dấu phẩy), nếu không có thì fallback về `GEMINI_API_KEY` đơn lẻ.

## Review Focus

1. **Empty/Whitespace Keys:** Chuỗi cấu hình có khoảng trắng hoặc dấu phẩy thừa (ví dụ `"key1, , key2,"`) -> Parser phải tự động lọc bỏ rác, không lưu key rỗng.
2. **False Alarm on 400 Bad Request:** Request sai cú pháp làm Gemini trả về HTTP 400 -> Hệ thống không được phạt cooldown key.
3. **Simultaneous Concurrency on Key Exhaustion:** Nhiều goroutines cùng lúc nhận 429 từ cùng một key -> Mutex phải đảm bảo chuyển key an toàn, các goroutines khác chuyển sang key mới mà không bị nhảy cóc nhiều lần.
4. **Time Simulation for 6h Cooldown:** Key hết hạn 6h tự động phục hồi -> Kiểm thử bằng clock ảo/`nowFunc` để test chạy tức thì không cần sleep thật.
5. **Zero-Key Configuration:** Cả `GEMINI_API_KEYS` và `GEMINI_API_KEY` đều không được khai báo -> Báo lỗi cấu hình rõ ràng, không panic.

---

### Task 1: Khởi tạo Cấu trúc Dữ liệu & Bộ nhận diện lỗi (Pool Struct & Error Classifier)

**Files:**
- Create: `backend/internal/utils/gemini_pool.go`
- Test: `backend/internal/utils/gemini_pool_test.go`

**Interfaces:**
- Produces:
  - `type KeyState struct { Key string; CooldownUntil time.Time; FailCount int; TotalSuccess int64 }`
  - `type GeminiPoolManager struct { ... }`
  - `func NewGeminiPoolManager(keysStr string, cooldown time.Duration) *GeminiPoolManager`
  - `func IsQuotaError(statusCode int, responseBody string) bool`
  - `var ErrAllGeminiKeysExhausted = errors.New("Hệ thống AI đang tạm thời quá tải hạn mức, vui lòng thử lại sau ít phút")`

- [x] **Step 1: Write the failing test**
Viết test trong `backend/internal/utils/gemini_pool_test.go`:
- Test khởi tạo parser: truyền chuỗi `"key1, key2, , key3 "` -> Pool phải có đúng 3 keys sạch (`"key1"`, `"key2"`, `"key3"`).
- Test fallback: truyền chuỗi rỗng và đặt `os.Setenv("GEMINI_API_KEY", "fallback-key")` -> Pool có đúng 1 key `"fallback-key"`.
- Test `IsQuotaError`: HTTP 429 -> true; HTTP 503 -> true; HTTP 200 có body `RESOURCE_EXHAUSTED` -> true; HTTP 400 -> false; HTTP 200 OK -> false.

- [x] **Step 2: Run test to verify it fails**
Chạy: `cd backend && go test ./internal/utils/... -run TestGeminiPool_InitAndErrorClassifier`
Kỳ vọng: FAIL (undefined `NewGeminiPoolManager`, `IsQuotaError`).

- [x] **Step 3: Implement minimal code in `gemini_pool.go`**
Cài đặt `KeyState`, `GeminiPoolManager`, `NewGeminiPoolManager`, và hàm `IsQuotaError`.

- [x] **Step 4: Run test to verify it passes**
Chạy: `cd backend && go test ./internal/utils/... -run TestGeminiPool_InitAndErrorClassifier`
Kỳ vọng: PASS.

- [x] **Step 5: Commit**
`git add backend/internal/utils/gemini_pool.go backend/internal/utils/gemini_pool_test.go && git commit -m "feat(gemini): implement pool manager struct and quota error classifier"`

---

### Task 2: Cơ chế Lấy Key Tuần tự, Cooldown 6h & Tự phục hồi (Sticky Key & Cooldown Logic)

**Files:**
- Modify: `backend/internal/utils/gemini_pool.go`
- Modify: `backend/internal/utils/gemini_pool_test.go`

**Interfaces:**
- Consumes: Task 1 structs
- Produces:
  - `func (m *GeminiPoolManager) GetActiveKey() (string, error)`
  - `func (m *GeminiPoolManager) MarkKeyFailure(key string, statusCode int, responseBody string) bool`
  - `func (m *GeminiPoolManager) MarkKeySuccess(key string)`
  - `func (m *GeminiPoolManager) SetNowFunc(fn func() time.Time)` (phục vụ test ảo hóa thời gian)

- [x] **Step 1: Write the failing test**
Viết test trong `gemini_pool_test.go`:
- Test sticky sequential: Gọi `GetActiveKey()` 5 lần liên tiếp -> Đều trả về `"key1"`.
- Test cooldown: Gọi `MarkKeyFailure("key1", 429, "rateLimitExceeded")` -> Trả về `true`, Key 1 bị cooldown 6 tiếng.
- Test auto switch: Gọi `GetActiveKey()` tiếp theo -> Lập tức trả về `"key2"`.
- Test ignore 400: Gọi `MarkKeyFailure("key2", 400, "bad request")` -> Trả về `false`, Key 2 vẫn là active key.
- Test all exhausted: Đánh dấu cả `"key2"` và `"key3"` bị lỗi 429 -> Gọi `GetActiveKey()` trả về `ErrAllGeminiKeysExhausted`.
- Test auto recovery: Dùng `SetNowFunc` tua nhanh 6 giờ 1 giây -> Gọi `GetActiveKey()` -> Key 1 tự động hết hạn cooldown và phục vụ lại.

- [x] **Step 2: Run test to verify it fails**
Chạy: `cd backend && go test ./internal/utils/... -run TestGeminiPool_StickyAndCooldown`
Kỳ vọng: FAIL (undefined `GetActiveKey`, `MarkKeyFailure`).

- [x] **Step 3: Implement minimal code in `gemini_pool.go`**
Cài đặt `GetActiveKey()`, `MarkKeyFailure()`, `MarkKeySuccess()` với `sync.RWMutex` và hỗ trợ `nowFunc`.

- [x] **Step 4: Run test to verify it passes**
Chạy: `cd backend && go test ./internal/utils/... -run TestGeminiPool_StickyAndCooldown`
Kỳ vọng: PASS.

- [x] **Step 5: Commit**
`git add backend/internal/utils/gemini_pool.go backend/internal/utils/gemini_pool_test.go && git commit -m "feat(gemini): implement sticky key selection and 6-hour cooldown recovery"`

---

### Task 3: Hàm Wrapper `ExecuteWithRetry` & Global Instance

**Files:**
- Modify: `backend/internal/utils/gemini_pool.go`
- Modify: `backend/internal/utils/gemini_pool_test.go`

**Interfaces:**
- Consumes: Task 2 methods
- Produces:
  - `var GlobalGeminiPool *GeminiPoolManager`
  - `func InitGlobalGeminiPool()`
  - `func (m *GeminiPoolManager) ExecuteWithRetry(executeFunc func(apiKey string) (*http.Response, error)) (*http.Response, error)`

- [x] **Step 1: Write the failing test**
Viết test trong `gemini_pool_test.go`:
- Dùng `httptest.Server` giả lập:
  - Khi request gửi với `"key1"`: trả về HTTP 429 (`"RESOURCE_EXHAUSTED"`).
  - Khi request gửi với `"key2"`: trả về HTTP 200 OK với body JSON hợp lệ.
- Gọi `pool.ExecuteWithRetry(...)` -> Hàm phải tự động bắt lỗi từ key1, chuyển sang key2, và trả về kết quả 200 thành công cho caller.
- Test đồng thời đa luồng (Concurrent Concurrency Test) với 20 goroutines chạy cùng lúc qua `-race`.

- [x] **Step 2: Run test to verify it fails**
Chạy: `cd backend && go test -race ./internal/utils/... -run TestGeminiPool_ExecuteWithRetry`
Kỳ vọng: FAIL (undefined `ExecuteWithRetry`).

- [x] **Step 3: Implement minimal code in `gemini_pool.go`**
Cài đặt `ExecuteWithRetry` thực hiện vòng lặp retry qua các keys khả dụng. Thêm `InitGlobalGeminiPool()` khởi tạo `GlobalGeminiPool` trong hàm `init()`.

- [x] **Step 4: Run test to verify it passes**
Chạy: `cd backend && go test -race ./internal/utils/... -run TestGeminiPool_ExecuteWithRetry`
Kỳ vọng: PASS không có race condition.

- [x] **Step 5: Commit**
`git add backend/internal/utils/gemini_pool.go backend/internal/utils/gemini_pool_test.go && git commit -m "feat(gemini): implement ExecuteWithRetry wrapper with concurrency safety"`

---

### Task 4: Tích hợp vào Dịch vụ Chấm thi Tự luận (`ai_grader.go`)

**Files:**
- Modify: `backend/internal/services/ai_grader.go`
- Test: `backend/internal/services/ai_grader_test.go`

**Interfaces:**
- Consumes: `utils.GlobalGeminiPool`

- [x] **Step 1: Write/Update test in `ai_grader_test.go`**
Viết test kiểm tra hàm chấm thi tự luận khi key đầu tiên trả về 429 và key thứ hai thành công.

- [x] **Step 2: Run test to verify failure / baseline**
Chạy: `cd backend && go test ./internal/services/... -run TestAIGrader`
Kỳ vọng: FAIL hoặc baseline test.

- [x] **Step 3: Update `ai_grader.go`**
Thay thế việc đọc biến đơn lẻ `os.Getenv("GEMINI_API_KEY")` trong `gradeEssayChunk` và `gradeStepByStepChunk` bằng `utils.GlobalGeminiPool.ExecuteWithRetry(...)` (hoặc lấy active key và xử lý failover khi resp.StatusCode là 429/503).

- [x] **Step 4: Run test to verify it passes**
Chạy: `cd backend && go test -race ./internal/services/... -run TestAIGrader`
Kỳ vọng: PASS.

- [x] **Step 5: Commit**
`git add backend/internal/services/ai_grader.go backend/internal/services/ai_grader_test.go && git commit -m "feat(grader): integrate GeminiKeyPool failover into essay grading service"`

---

### Task 5: Tích hợp vào 4 Dịch vụ AI còn lại (`ocr`, `question_extractor`, `lecture_extractor`, `geometry_visualizer`)

**Files:**
- Modify: `backend/internal/services/ocr_service.go`
- Modify: `backend/internal/services/question_extractor.go`
- Modify: `backend/internal/services/lecture_extractor.go`
- Modify: `backend/internal/services/geometry_visualizer_service.go`
- Test: Existing service test suites (`lecture_extractor_test.go`, `geometry_visualizer_service_test.go`, `question_extractor_test.go`)

**Interfaces:**
- Consumes: `utils.GlobalGeminiPool`

- [x] **Step 1: Write/Update service test checks**
Đảm bảo các bài test hiện tại trong các services kiểm tra chính xác khả năng hoạt động với `GlobalGeminiPool`.

- [x] **Step 2: Run test baseline**
Chạy: `cd backend && go test ./internal/services/... -run "TestGeometry|TestLecture"`
Kỳ vọng: Kiểm tra trạng thái hiện tại.

- [x] **Step 3: Update 4 services**
- Thay thế `os.Getenv("GEMINI_API_KEY")` trong `ocr_service.go`, `question_extractor.go`, `lecture_extractor.go`, `geometry_visualizer_service.go` sang dùng `utils.GlobalGeminiPool`.
- Ghi nhận `MarkKeyFailure` khi nhận HTTP 429/503 để kích hoạt xoay vòng sang key kế tiếp.

- [x] **Step 4: Run all service tests to verify passes**
Chạy: `cd backend && go test ./internal/services/...`
Kỳ vọng: Tất cả tests trong `services` đều PASS.

- [x] **Step 5: Commit**
`git add backend/internal/services/ocr_service.go backend/internal/services/question_extractor.go backend/internal/services/lecture_extractor.go backend/internal/services/geometry_visualizer_service.go && git commit -m "feat(services): integrate GeminiKeyPool across ocr, extractor and geometry services"`

---

### Task 6: Cấu hình Môi trường, Tài liệu & Kiểm thử Toàn diện (Full System Verification)

**Files:**
- Modify: `backend/.env.example`
- Test: Toàn bộ test suite backend (`backend/...`)

- [x] **Step 1: Update `.env.example`**
Cập nhật hướng dẫn biến môi trường:
```bash
# Gemini AI API Keys (Hỗ trợ danh sách nhiều key xoay vòng tự động, phân tách bằng dấu phẩy)
GEMINI_API_KEYS="key_pro_1,key_pro_2,key_flash_backup"
GEMINI_MODEL="gemini-3.8-flash"
```

- [x] **Step 2: Run full backend test suite with race detector**
Chạy: `cd backend && go test -race ./...`
Kỳ vọng: 100% tests PASS, 0 race condition warnings.

- [x] **Step 3: Run linter / build test**
Chạy: `cd backend && go build -o /dev/null ./cmd/api/main.go`
Kỳ vọng: Biên dịch thành công không có lỗi hoặc cảnh báo.

- [x] **Step 4: Commit**
`git add backend/.env.example && git commit -m "chore(config): document GEMINI_API_KEYS in .env.example"`
