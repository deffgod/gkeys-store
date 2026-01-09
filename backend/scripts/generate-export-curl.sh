#!/bin/bash

# Скрипт для генерации curl команды для экспорта игр из G2A Export API
# Использует продакшн ключи из переменных окружения

# Загружаем переменные окружения из backend/.env
if [ -f .env ]; then
  set -a
  source .env 2>/dev/null || true
  set +a
fi

# Проверяем наличие необходимых переменных
if [ -z "$G2A_API_KEY" ] || [ -z "$G2A_EMAIL" ] || [ -z "$G2A_API_HASH" ]; then
  echo "❌ Ошибка: Необходимы переменные окружения:"
  echo "   G2A_API_KEY - G2A Client ID"
  echo "   G2A_EMAIL - Email для генерации API ключа"
  echo "   G2A_API_HASH - G2A Client Secret"
  echo ""
  echo "Установите их в backend/.env или экспортируйте в текущей сессии"
  exit 1
fi

# Генерируем API ключ: SHA256(ClientId + Email + ClientSecret)
API_KEY=$(echo -n "${G2A_API_KEY}${G2A_EMAIL}${G2A_API_HASH}" | shasum -a 256 | awk '{print $1}')

# URL для продакшн G2A Export API
API_URL="https://api.g2a.com/v1/products"

# Параметры запроса (можно изменить)
PAGE=${1:-1}
PER_PAGE=${2:-20}

echo "🔑 Сгенерированный API ключ: ${API_KEY:0:20}..."
echo ""
echo "📋 Готовая curl команда:"
echo ""
echo "curl -X GET '${API_URL}?page=${PAGE}&perPage=${PER_PAGE}&minQty=1&includeOutOfStock=false' \\"
echo "  -H 'Authorization: ${G2A_API_KEY}, ${API_KEY}' \\"
echo "  -H 'Content-Type: application/json'"
echo ""
echo "📋 Или с дополнительными параметрами:"
echo ""
echo "curl -X GET '${API_URL}?page=${PAGE}&perPage=${PER_PAGE}&minQty=1&includeOutOfStock=false&platform=steam' \\"
echo "  -H 'Authorization: ${G2A_API_KEY}, ${API_KEY}' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  | jq '.'"
echo ""
echo "💡 Примеры использования:"
echo "   # Получить первую страницу (20 игр)"
echo "   curl -X GET '${API_URL}?page=1&perPage=20&minQty=1' \\"
echo "     -H 'Authorization: ${G2A_API_KEY}, ${API_KEY}' \\"
echo "     -H 'Content-Type: application/json'"
echo ""
echo "   # Получить все игры на странице 1 (100 игр)"
echo "   curl -X GET '${API_URL}?page=1&perPage=100&minQty=1' \\"
echo "     -H 'Authorization: ${G2A_API_KEY}, ${API_KEY}' \\"
echo "     -H 'Content-Type: application/json'"
echo ""
echo "   # Сохранить результат в файл"
echo "   curl -X GET '${API_URL}?page=1&perPage=100&minQty=1' \\"
echo "     -H 'Authorization: ${G2A_API_KEY}, ${API_KEY}' \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -o games-export.json"
echo ""
