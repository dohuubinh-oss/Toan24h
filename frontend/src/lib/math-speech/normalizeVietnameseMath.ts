const DIGIT_MAP: Record<string, number> = {
  'không': 0,
  'một': 1,
  'mốt': 1,
  'hai': 2,
  'ba': 3,
  'bốn': 4,
  'tư': 4,
  'năm': 5,
  'lăm': 5,
  'sáu': 6,
  'bảy': 7,
  'bẩy': 7,
  'tám': 8,
  'chín': 9,
}

const GREEK_WORDS: Record<string, string> = {
  'an pha': '\\alpha',
  'alpha': '\\alpha',
  'bê ta': '\\beta',
  'beta': '\\beta',
  'gam ma': '\\gamma',
  'gamma': '\\gamma',
  'đen ta': '\\Delta',
  'delta': '\\Delta',
  'pi': '\\pi',
  'theta': '\\theta',
  'thê ta': '\\theta',
  'ô mê ga': '\\omega',
  'omega': '\\omega',
}

const VARIABLE_WORDS: Record<string, string> = {
  'ít xì': 'x',
  'ích xì': 'x',
  'xờ': 'x',
  'i dài': 'y',
  'y gờ rét': 'y',
  'dê': 'z',
  'dét': 'z',
}

function replaceWord(text: string, word: string, replacement: string): string {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(^|[^a-zA-Z0-9_àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ\\\\])(${escaped})($|[^a-zA-Z0-9_àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ])`, 'gi')
  return text.replace(regex, (_m, p1, _p2, p3) => `${p1}${replacement}${p3}`)
}

export function convertVietnameseNumberWords(inputText: string): string {
  let text = inputText

  // 1. Hàng trăm: "[một..chín] trăm (linh|lẻ) [một..chín]"
  text = text.replace(/(một|hai|ba|bốn|năm|sáu|bảy|bẩy|tám|chín)\s+trăm\s+(?:linh|lẻ)\s+(một|mốt|hai|ba|bốn|tư|năm|lăm|sáu|bảy|bẩy|tám|chín)/gi, (_m, h, u) => {
    return String(DIGIT_MAP[h.toLowerCase()] * 100 + DIGIT_MAP[u.toLowerCase()])
  })

  // 2. Hàng trăm + chục + đơn vị: "[một..chín] trăm [hai..chín] mươi [một..chín]"
  text = text.replace(/(một|hai|ba|bốn|năm|sáu|bảy|bẩy|tám|chín)\s+trăm\s+(hai|ba|bốn|năm|sáu|bảy|bẩy|tám|chín)\s+mươi\s+(một|mốt|hai|ba|bốn|tư|năm|lăm|sáu|bảy|bẩy|tám|chín)/gi, (_m, h, t, u) => {
    return String(DIGIT_MAP[h.toLowerCase()] * 100 + DIGIT_MAP[t.toLowerCase()] * 10 + DIGIT_MAP[u.toLowerCase()])
  })

  // 3. Hàng trăm tròn chục: "[một..chín] trăm [hai..chín] mươi"
  text = text.replace(/(một|hai|ba|bốn|năm|sáu|bảy|bẩy|tám|chín)\s+trăm\s+(hai|ba|bốn|năm|sáu|bảy|bẩy|tám|chín)\s+mươi/gi, (_m, h, t) => {
    return String(DIGIT_MAP[h.toLowerCase()] * 100 + DIGIT_MAP[t.toLowerCase()] * 10)
  })

  // 4. Hàng trăm chẵn: "[một..chín] trăm"
  text = text.replace(/(một|hai|ba|bốn|năm|sáu|bảy|bẩy|tám|chín)\s+trăm/gi, (_m, h) => {
    return String(DIGIT_MAP[h.toLowerCase()] * 100)
  })

  // 5. Hàng chục + đơn vị: "[hai..chín] mươi [một..chín]"
  text = text.replace(/(hai|ba|bốn|năm|sáu|bảy|bẩy|tám|chín)\s+mươi\s+(một|mốt|hai|ba|bốn|tư|năm|lăm|sáu|bảy|bẩy|tám|chín)/gi, (_m, t, u) => {
    return String(DIGIT_MAP[t.toLowerCase()] * 10 + DIGIT_MAP[u.toLowerCase()])
  })

  // 6. Hàng chục chẵn: "[hai..chín] mươi"
  text = text.replace(/(hai|ba|bốn|năm|sáu|bảy|bẩy|tám|chín)\s+mươi/gi, (_m, t) => {
    return String(DIGIT_MAP[t.toLowerCase()] * 10)
  })

  // 7. Mười [một..chín]: "mười hai", "mười lăm", "mười một"
  text = text.replace(/mười\s+(một|mốt|hai|ba|bốn|tư|năm|lăm|sáu|bảy|bẩy|tám|chín)/gi, (_m, u) => {
    return String(10 + DIGIT_MAP[u.toLowerCase()])
  })

  // 8. "mười" đứng riêng lẻ
  text = replaceWord(text, 'mười', '10')

  // 9. Chữ số đơn lẻ
  for (const [w, d] of Object.entries(DIGIT_MAP)) {
    text = replaceWord(text, w, String(d))
  }

  return text
}

export function normalizeVietnameseMath(rawText: string): string {
  if (!rawText) return ''
  let text = rawText.trim()

  // 1. Loại bỏ các từ đệm mở đầu / kết nối
  const fillers = ['ta có', 'xét thấy', 'suy ra rằng', 'suy ra là', 'thì', 'được']
  for (const filler of fillers) {
    text = replaceWord(text, filler, '')
  }

  // 2. Chuẩn hóa biến số và chữ Hy Lạp
  for (const [key, val] of Object.entries(GREEK_WORDS)) {
    text = replaceWord(text, key, val)
  }
  for (const [key, val] of Object.entries(VARIABLE_WORDS)) {
    text = replaceWord(text, key, val)
  }

  // 3. Chuẩn hóa số thập phân trước: "không phẩy hai lăm" -> "0.25", "ba phẩy mười bốn" -> "3.14"
  text = text.replace(/(không|\d+)\s+phẩy\s+hai\s+lăm/gi, '$1.25')
  text = text.replace(/(không|\d+)\s+phẩy\s+mười\s+bốn/gi, '$1.14')
  text = text.replace(/(không|\d+)\s+phẩy\s+năm/gi, '$1.5')

  // 4. Chuyển đổi các từ chỉ số tiếng Việt sang dạng số
  text = convertVietnameseNumberWords(text)

  // 5. Xử lý dấu phẩy thập phân sau khi đã convert số: "0 phẩy 25" -> "0.25", "3 phẩy 14" -> "3.14"
  text = text.replace(/(\d+)\s+phẩy\s+(\d+)/gi, '$1.$2')

  // 6. Xử lý số âm hoặc dấu âm trước biến: "âm 5" -> "-5", "âm b" -> "-b"
  text = text.replace(/(^|\s+)âm\s+([a-zA-Z0-9_\\]+)/gi, '$1-$2')

  // Dọn dẹp khoảng trắng
  return text.replace(/\s+/g, ' ').trim()
}
