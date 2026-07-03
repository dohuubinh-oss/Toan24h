Cấu trúc JSON gửi từ trang tạo bài giảng lên Backend API POST /api/v1/lectures: 
{
    "title": "Tên bài giảng (vd: Phương trình bậc 2)",
    "grade": "Lớp 9",
    "category": "Đại số",
    "basicConcept": "<p>Nội dung khái niệm cơ bản (định dạng HTML)...</p>",
    "coverImage": "/uploads/temp/anh-bia-123.jpg",
    "videoUrl": "https://youtube.com/watch?v=...",
    "examples": [
        {
            "id": "uuid-cua-bai-tap-mau-1",
            "problemImage": "/uploads/temp/anh-de-bai-1.jpg",
            "solutionImage": "/uploads/temp/anh-loi-giai-1.jpg",
            "exercise": {
                "problem": "<p>Nội dung đề bài (định dạng HTML)...</p>",
                "conclusion": "<p>Nội dung kết luận/đáp số (định dạng HTML)...</p>",
                "steps": [
                    {
                        "step": 1,
                        "title": "Tìm tập xác định",
                        "content": "<p>Giải thích cách tìm tập xác định...</p>",
                        "formula": "D = \\mathbb{R}"
                    },
                    {
                        "step": 2,
                        "title": "Tính Delta",
                        "content": "<p>Áp dụng công thức tính delta...</p>",
                        "formula": "\\Delta = b^2 - 4ac"
                    }
                ]
            }
        }
    ]
}

Query (truy vấn) bài giảng này từ Database ra, dữ liệu dưới dạng JSON:
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Tên bài giảng (vd: Phương trình bậc 2)",
  "grade": "Lớp 9",
  "category": "Đại số",
  "basicConcept": "<p>Nội dung khái niệm cơ bản (định dạng HTML)...</p>",
  "coverImage": "/uploads/lecture/06-2026/123e4567-e89b-12d3-a456-426614174000/anh-bia-123_abc123.jpg",
  "videoUrl": "https://youtube.com/watch?v=...",
  "createdAt": "2026-06-08T09:00:00Z",
  "updatedAt": "2026-06-08T09:00:00Z",
  "examples": [
    {
      "id": "987e6543-e21b-12d3-a456-426614174000",
      "lectureId": "123e4567-e89b-12d3-a456-426614174000",
      "problem": "<p>Nội dung đề bài (định dạng HTML)...</p>",
      "conclusion": "<p>Nội dung kết luận/đáp số (định dạng HTML)...</p>",
      "tips": "<p>Nội dung mẹo giải/gợi ý (định dạng HTML)...</p>",
      "problemImage": "/uploads/lecture/06-2026/123e4567-e89b-12d3-a456-426614174000/anh-de-bai-1_xyz789.jpg",
      "solutionImage": "/uploads/lecture/06-2026/123e4567-e89b-12d3-a456-426614174000/anh-loi-giai-1_def456.jpg",
      "steps": "[{\"step\":1,\"title\":\"Tìm tập xác định\",\"content\":\"<p>Giải thích cách tìm tập xác định...</p>\",\"formula\":\"D = \\\\mathbb{R}\"},{\"step\":2,\"title\":\"Tính Delta\",\"content\":\"<p>Áp dụng công thức tính delta...</p>\",\"formula\":\"\\\\Delta = b^2 - 4ac\"}]",
      "createdAt": "2026-06-08T09:00:00Z",
      "updatedAt": "2026-06-08T09:00:00Z"
    }
  ]
}
