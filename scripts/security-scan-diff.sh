#!/usr/bin/env bash
# ==============================================================================
# Security Scan Diff (Pre-Push & Pre-Commit Hook)
# Quét bảo mật cục bộ chỉ trên nhóm file có thay đổi chuẩn bị đẩy lên Git
# ==============================================================================

set -eo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${BLUE}${BOLD}🛡️  [Security Guard] Bắt đầu quét bảo mật trên nhóm file thay đổi...${NC}"

# Xác định danh sách file thay đổi
# 1. Nếu biến môi trường CHANGED_FILES đã có
# 2. Nếu có argument truyền vào là commit range (từ pre-push)
# 3. Hoặc unpushed commits so với upstream/origin
# 4. Hoặc staged/modified files trong working tree khi chạy thủ công
if [ -z "${CHANGED_FILES:-}" ]; then
    if [ -n "${1:-}" ] && [ -n "${2:-}" ] && [ "$1" != "0000000000000000000000000000000000000000" ]; then
        # Được gọi từ pre-push hook với remote_sha và local_sha
        CHANGED_FILES=$(git diff --name-only --diff-filter=d "$1" "$2" 2>/dev/null || true)
    elif git rev-parse --verify "@{u}" >/dev/null 2>&1 && [ -n "$(git diff --name-only --diff-filter=d "@{u}...HEAD" 2>/dev/null)" ]; then
        CHANGED_FILES=$(git diff --name-only --diff-filter=d "@{u}...HEAD" 2>/dev/null || true)
    elif git rev-parse --verify "origin/main" >/dev/null 2>&1 && [ -n "$(git diff --name-only --diff-filter=d "origin/main...HEAD" 2>/dev/null)" ]; then
        CHANGED_FILES=$(git diff --name-only --diff-filter=d "origin/main...HEAD" 2>/dev/null || true)
    elif [ -n "$(git diff --name-only --cached --diff-filter=d 2>/dev/null)" ]; then
        # File đã git add (staged)
        CHANGED_FILES=$(git diff --name-only --cached --diff-filter=d 2>/dev/null || true)
    else
        # File đang sửa đổi chưa commit (working tree)
        CHANGED_FILES=$(git diff --name-only --diff-filter=d 2>/dev/null || true)
    fi
fi

# Nếu không có file nào thay đổi
if [ -z "${CHANGED_FILES}" ]; then
    echo -e "${GREEN}✅ Không có file nào thay đổi cần quét. Cho phép tiếp tục.${NC}"
    exit 0
fi

FILE_COUNT=$(echo "${CHANGED_FILES}" | wc -l | tr -d ' ')
echo -e "${BLUE}📁 Đang kiểm tra ${BOLD}${FILE_COUNT}${NC}${BLUE} file chuẩn bị đẩy lên:${NC}"
echo "${CHANGED_FILES}" | sed 's/^/   - /'
echo ""

VIOLATIONS=0

# ==============================================================================
# 1. KIỂM TRA FILE NHẠY CẢM (Sensitive Files)
# ==============================================================================
for file in ${CHANGED_FILES}; do
    # Bỏ qua file ví dụ / template
    if [[ "$file" == *".env.example"* ]] || [[ "$file" == *"test"* ]] || [[ "$file" == *"scratch/"* ]]; then
        continue
    fi

    # Chặn các file .env thật
    if [[ "$file" =~ \.env(\..+)?$ ]]; then
        echo -e "${RED}❌ [CRITICAL] Phát hiện file cấu hình nhạy cảm: ${BOLD}${file}${NC}"
        echo -e "   -> Không bao giờ commit file .env thật chứa thông tin bí mật lên Git!"
        VIOLATIONS=$((VIOLATIONS + 1))
    fi

    # Chặn private key, certs
    if [[ "$file" =~ \.(pem|key|p12|pkcs12)$ ]] || [[ "$file" =~ id_rsa ]]; then
        echo -e "${RED}❌ [CRITICAL] Phát hiện file khóa/chứng chỉ bảo mật: ${BOLD}${file}${NC}"
        VIOLATIONS=$((VIOLATIONS + 1))
    fi

    # Chặn database dump có thể chứa dữ liệu thật
    if [[ "$file" =~ \.(dump|sql\.gz)$ ]]; then
        echo -e "${YELLOW}⚠️  [WARNING] Phát hiện file database dump: ${BOLD}${file}${NC}"
        echo -e "   -> Hãy chắc chắn file dump này không chứa dữ liệu khách hàng thực tế!"
    fi
done

# ==============================================================================
# 2. KIỂM TRA LỘ SECRETS / API KEYS TRONG DIFF
# ==============================================================================
for file in ${CHANGED_FILES}; do
    [ -f "$file" ] || continue

    DIFF_CONTENT=""
    if git rev-parse --verify HEAD >/dev/null 2>&1; then
        DIFF_CONTENT=$(git diff HEAD -- "$file" 2>/dev/null || true)
        if [ -z "$DIFF_CONTENT" ]; then
            DIFF_CONTENT=$(git diff --cached -- "$file" 2>/dev/null || true)
        fi
        if [ -z "$DIFF_CONTENT" ]; then
            DIFF_CONTENT=$(git diff HEAD~1 -- "$file" 2>/dev/null || true)
        fi
    fi
    if [ -z "$DIFF_CONTENT" ] && [ -f "$file" ]; then
        DIFF_CONTENT=$(cat "$file")
    fi

    # Kiểm tra Google API Key (AIza...)
    if echo "$DIFF_CONTENT" | grep -E -q 'AIza[-0-9A-Za-z_]{30,40}'; then
        echo -e "${RED}❌ [SECRET LEAK] Phát hiện Google API Key trong file: ${BOLD}${file}${NC}"
        echo -e "   -> Tìm thấy chuỗi giống 'AIzaSy...'. Hãy chuyển vào biến môi trường (.env)."
        VIOLATIONS=$((VIOLATIONS + 1))
    fi

    # Kiểm tra OpenAI Secret Key (sk-...)
    if echo "$DIFF_CONTENT" | grep -E -q 'sk-[a-zA-Z0-9]{30,}'; then
        echo -e "${RED}❌ [SECRET LEAK] Phát hiện OpenAI API Key trong file: ${BOLD}${file}${NC}"
        echo -e "   -> Tìm thấy chuỗi giống 'sk-...'. Hãy chuyển vào biến môi trường."
        VIOLATIONS=$((VIOLATIONS + 1))
    fi

    # Kiểm tra GitHub Token (ghp_...)
    if echo "$DIFF_CONTENT" | grep -E -q 'ghp_[a-zA-Z0-9]{30,}'; then
        echo -e "${RED}❌ [SECRET LEAK] Phát hiện GitHub Personal Access Token trong file: ${BOLD}${file}${NC}"
        VIOLATIONS=$((VIOLATIONS + 1))
    fi

    # Kiểm tra Private Key block
    if echo "$DIFF_CONTENT" | grep -E -q -e '-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----'; then
        echo -e "${RED}❌ [SECRET LEAK] Phát hiện Private Key Block trong file: ${BOLD}${file}${NC}"
        VIOLATIONS=$((VIOLATIONS + 1))
    fi
done

# ==============================================================================
# 3. KIỂM TRA LỖ HỔNG MÃ NGUỒN CỤC BỘ (SAST Light-weight)
# ==============================================================================
for file in ${CHANGED_FILES}; do
    [ -f "$file" ] || continue

    # A. Frontend XSS: dangerouslySetInnerHTML mà không có DOMPurify / sanitize
    if [[ "$file" =~ \.(tsx|jsx|js|ts)$ ]] && [[ "$file" != *".test."* ]]; then
        DIFF_ADDED=$(git diff HEAD~1 -- "$file" 2>/dev/null | grep -E '^\+' || grep 'dangerouslySetInnerHTML' "$file" || true)
        if echo "$DIFF_ADDED" | grep -q 'dangerouslySetInnerHTML'; then
            # Kiểm tra xem file có import hoặc gọi DOMPurify/sanitize không
            if ! grep -E -q '(DOMPurify|sanitize|isomorphic-dompurify)' "$file"; then
                echo -e "${RED}❌ [SAST XSS] File: ${BOLD}${file}${NC} sử dụng ${YELLOW}dangerouslySetInnerHTML${NC} nhưng KHÔNG có DOMPurify/sanitize!"
                echo -e "   -> Nguy cơ Stored XSS. Vui lòng wrap qua DOMPurify.sanitize(...) trước khi render."
                VIOLATIONS=$((VIOLATIONS + 1))
            fi
        fi
    fi

    # B. Backend Path Traversal: filepath.Join với TrimPrefix mà thiếu filepath.Base
    if [[ "$file" =~ \.go$ ]] && [[ "$file" != *"_test.go"* ]]; then
        DIFF_ADDED=$(git diff HEAD~1 -- "$file" 2>/dev/null | grep -E '^\+' || true)
        if echo "$DIFF_ADDED" | grep -q 'filepath.Join.*temp' && echo "$DIFF_ADDED" | grep -q 'TrimPrefix'; then
            if ! echo "$DIFF_ADDED" | grep -q 'filepath.Base'; then
                echo -e "${RED}❌ [SAST PATH TRAVERSAL] File: ${BOLD}${file}${NC} xử lý đường dẫn file từ client mà thiếu ${YELLOW}filepath.Base(...)${NC}!"
                echo -e "   -> Nguy cơ Path Traversal (../). Hãy dùng 'filepath.Base(fileName)' để chuẩn hóa."
                VIOLATIONS=$((VIOLATIONS + 1))
            fi
        fi
    fi
done

# ==============================================================================
# KẾT LUẬN & QUYẾT ĐỊNH
# ==============================================================================
echo ""
if [ "$VIOLATIONS" -gt 0 ]; then
    echo -e "${RED}${BOLD}🚨 PHÁT HIỆN $VIOLATIONS LỖ HỔNG BẢO MẬT TRONG NHÓM FILE THAY ĐỔI!${NC}"
    echo -e "${RED}⛔ Lệnh 'git push' đã bị chặn để bảo vệ an toàn cho hệ thống.${NC}"
    echo -e "${YELLOW}👉 Hãy khắc phục các vấn đề liệt kê ở trên trước khi đẩy code.${NC}"
    echo -e "${BLUE}💡 Lưu ý: Nếu có trường hợp ngoại lệ bắt buộc, có thể bỏ qua bằng: ${BOLD}git push --no-verify${NC}"
    echo ""
    exit 1
else
    echo -e "${GREEN}${BOLD}✅ [SECURITY SCAN PASSED] Toàn bộ ${FILE_COUNT} file thay đổi đều an toàn! Tiến hành push...${NC}"
    echo ""
    exit 0
fi
