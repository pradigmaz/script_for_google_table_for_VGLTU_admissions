/**
 * Функции обработки и нормализации текста
 */

/**
 * Нормализует текст: приводит к нижнему регистру, заменяет английские буквы на русские,
 * убирает лишние пробелы и переносы строк
 * 
 * @param {string} text - Исходный текст
 * @return {string} - Нормализованный текст
 */
function normalizeText(text) {
  if (!text) return "";
  
  // Заменяем переносы строк на пробелы
  let normalized = String(text).replace(/\n/g, ' ');
  
  // Приводим к нижнему регистру для единообразия
  normalized = normalized.toLowerCase();
  
  // Замена английских букв на русские аналоги
  const replacements = {
    'a': 'а', 'b': 'б', 'c': 'с', 'e': 'е', 'h': 'н', 
    'k': 'к', 'm': 'м', 'o': 'о', 'p': 'р', 'r': 'р', 
    't': 'т', 'x': 'х', 'y': 'у'
  };
  
  for (const [eng, rus] of Object.entries(replacements)) {
    normalized = normalized.replace(new RegExp(eng, 'g'), rus);
  }
  
  // Удаляем лишние пробелы
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  // --- Специальная обработка известных паттернов ---
  // Добавляем специальную обработку для известных профилей с правильным склонением
  const specialPatterns = [
    {
      pattern: /(технологии и проектирование) ис\b/i,
      replacement: "$1 информационных систем"
    },
    // Можно добавить другие паттерны при необходимости
  ];
  
  // Обработка специальных паттернов
  for (const {pattern, replacement} of specialPatterns) {
    normalized = normalized.replace(pattern, replacement);
  }
  
  // --- Добавляем обработку сокращений ---
  // ИНСТРУКЦИЯ: Чтобы добавить новые сокращения, просто добавьте новую пару "сокращение": "полная форма" в объект ниже.
  // Сокращения нужно указывать в нижнем регистре, так как весь текст предварительно приводится к нижнему регистру.
  // Примеры:
  // "сокр": "сокращение" - заменит слово "сокр" на "сокращение"
  // "ин.яз": "иностранный язык" - заменит "ин.яз" на "иностранный язык"
  // "комп. науки": "компьютерные науки" - заменит "комп. науки" на "компьютерные науки"
  const abbreviations = {
    "ис": "информационные системы",
    "ит": "информационные технологии", // Пример другого сокращения
    // Добавьте другие сокращения сюда в формате "сокр": "полное название"
  };

  for (const [abbr, full] of Object.entries(abbreviations)) {
    // Используем \b для поиска целых слов
    normalized = normalized.replace(new RegExp(`\\b${abbr}\\b`, 'g'), full);
  }
  // --- Конец обработки сокращений ---
  
  return normalized;
}

/**
 * Нормализует название профиля
 * 
 * @param {string} profile - Название профиля
 * @param {string} code - Код направления (опционально)
 * @return {string} - Нормализованное название профиля
 */
function normalizeProfileName(profile, code) {
  if (!profile) return "";
  
  // Используем общую функцию нормализации текста
  return normalizeText(profile);
}

/**
 * Нормализует код направления, приводя его к стандартному формату XX.XX.XX
 * 
 * @param {string} code - Код направления
 * @return {string} - Нормализованный код
 */
function normalizeDirectionCode(code) {
  if (!code) return "";
  
  // Очищаем от лишних пробелов
  let normalizedCode = String(code).trim();
  
  // Заменяем различные разделители на точки
  normalizedCode = normalizedCode.replace(/[,\-\/\\]/g, '.');
  
  // Приводим к формату XX.XX.XX, добавляя недостающие нули, если необходимо
  const parts = normalizedCode.split('.');
  if (parts.length === 3) {
    return parts.map(part => part.padStart(2, '0')).join('.');
  }
  
  return normalizedCode;
}

/**
 * Получает нормализованное название направления по коду
 * 
 * @param {string} code - Код направления
 * @return {string} - Название направления
 */
function normalizeDirectionName(code) {
  // Нормализуем код
  const normalizedCode = normalizeDirectionCode(code);
  
  // Если направление есть в словаре, используем его официальное название
  if (DIRECTIONS_MAP[normalizedCode]) {
    return DIRECTIONS_MAP[normalizedCode].name;
  }
  
  // Если направление не найдено, логируем и возвращаем пустую строку
  console.log("Ненормализованное направление", {code: code});
  return "";
}

/**
 * Извлекает профиль из текста
 * 
 * @param {string} text - Исходный текст
 * @param {string} directionName - Название направления (для поиска профиля после названия)
 * @return {string|null} - Извлеченный профиль или null, если профиль не найден
 */
function extractProfile(text, directionName) {
  // Удаляем комментарии в квадратных скобках [..] перед обработкой
  const textWithoutComments = text.replace(/\[.*?\]/g, '').trim();
  
  // 1. Поиск текста в скобках
  const profileMatches = textWithoutComments.match(/\(([^)]+)\)/g);
  
  if (profileMatches && profileMatches.length > 0) {
    // Берем самый длинный текст в скобках как наиболее вероятный профиль
    let longestMatch = "";
    for (const match of profileMatches) {
      // Удаляем скобки
      const profile = match.substring(1, match.length - 1).trim();
      if (profile.length > longestMatch.length) {
        longestMatch = profile;
      }
    }
    
    if (longestMatch) {
      return longestMatch;
    }
  }
  
  // 2. Поиск после названия направления
  if (directionName && textWithoutComments.includes(directionName)) {
    // Находим текст после названия направления
    let remainingText = textWithoutComments.substring(textWithoutComments.indexOf(directionName) + directionName.length).trim();
    
    // Удаляем потенциальные префиксы вроде "профиль:" или "профиль -"
    remainingText = remainingText.replace(/^[\s\-:]*профиль[\s\-:]*/i, '').trim();
    
    // Если после удаления остался значимый текст, считаем его профилем
    if (remainingText && !remainingText.match(/^\s*$/)) {
      return remainingText;
    }
  }
  
  return null;
}

/**
 * Обрабатывает специальные символы, возникающие при сканировании
 * 
 * @param {string} text - Исходный текст
 * @return {string} - Текст с обработанными специальными символами
 */
function handleSpecialCharacters(text) {
  if (!text) return "";
  
  // Замена специальных символов, возникающих при сканировании
  const specialCharReplacements = {
    '\u00A0': ' ',  // Неразрывный пробел
    '\u2013': '-',  // Среднее тире
    '\u2014': '-',  // Длинное тире
    '\u2026': '...', // Многоточие
    '\u2212': '-',  // Математический минус
    '\u2018': "'",  // Левая одинарная кавычка
    '\u2019': "'",  // Правая одинарная кавычка
    '\u201C': '"',  // Левая двойная кавычка
    '\u201D': '"'   // Правая двойная кавычка
  };
  
  let normalized = String(text);
  for (const [special, replacement] of Object.entries(specialCharReplacements)) {
    normalized = normalized.replace(new RegExp(special, 'g'), replacement);
  }
  
  return normalized;
} 