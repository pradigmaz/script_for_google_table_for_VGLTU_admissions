/**
 * Словарь направлений и профилей
 */

// Словарь с направлениями и профилями
const DIRECTIONS_MAP = {
  "23.03.03": {
    name: "Эксплуатация транспортно-технологических машин и комплексов",
    profiles: [
      "Автомобили и автомобильное хозяйство",
      "Автомобильный сервис",
      "Сервис транспортных и транспортно-технологических машин и оборудования (Лесной комплекс)"
    ]
  },
  "23.03.01": {
    name: "Технология транспортных процессов",
    profiles: [
      "Организация и безопасность движения",
      "Расследование и экспертиза дорожно-транспортных происшествий",
      "Организация перевозок и управление на автомобильном транспорте",
      "Международные перевозки и таможенное оформление на автомобильном транспорте"
    ]
  },
  "27.03.04": {
    name: "Управление в технических системах",
    profiles: [
      "Управление в транспортных системах"
    ]
  },
  "23.05.01": {
    name: "Наземные транспортно-технологические средства",
    profiles: [
      "Автомобильная техника в транспортных технологиях"
    ]
  },
  "23.04.01": {
    name: "Технология транспортных процессов",
    profiles: [
      "Технология транспортных процессов"
    ]
  },
  "35.03.01": {
    name: "Лесное дело",
    profiles: [
      "Государственное управление лесами",
      "Защита леса и охотоведение",
      "Биотехнология"
    ]
  },
  "35.03.10": {
    name: "Ландшафтная архитектура",
    profiles: [
      "Ландшафтное проектирование и строительство",
      "Декоративное древоводство и питомниководство"
    ]
  },
  "05.03.06": {
    name: "Экология и природопользование",
    profiles: [
      "Экология"
    ]
  },
  "35.03.02": {
    name: "Технология лесозаготовительных и деревоперерабатывающих производств",
    profiles: [
      "Технологии деревоперерабатывающих производств",
      "Дизайн мебели",
      "Лесоинженерное дело",
      "Лесопромышленный бизнес"
    ]
  },
  "19.03.01": {
    name: "Биотехнология",
    profiles: [
      "Промышленная экология"
    ]
  },
  "54.03.01": {
    name: "Дизайн",
    profiles: [
      "Дизайн. Дом. Интерьер"
    ]
  },
  "15.03.02": {
    name: "Технологические машины и оборудование",
    profiles: [
      "Инжиниринг технологического оборудования"
    ]
  },
  "15.03.04": {
    name: "Автоматизация технологических процессов и производств",
    profiles: [
      "Автоматизация и управление в технологических системах"
    ]
  },
  "15.03.06": {
    name: "Мехатроника и робототехника",
    profiles: [
      "Управление в мехатронных и робототехнических системах"
    ]
  },
  "20.03.01": {
    name: "Техносферная безопасность",
    profiles: [
      "Охрана труда и пожарная профилактика"
    ]
  },
  "15.05.01": {
    name: "Проектирование технологических машин и комплексов",
    profiles: []
  },
  "09.03.02": {
    name: "Информационные системы и технологии",
    profiles: [
      "Технологии и проектирование информационных систем",
      "Информационные системы и технологии в микроэлектронике"
    ]
  },
  "38.03.01": {
    name: "Экономика",
    profiles: [
      "Учет, анализ и аудит",
      "Внешнеэкономическая деятельность",
      "Корпоративные финансы"
    ]
  },
  "38.03.02": {
    name: "Менеджмент",
    profiles: [
      "Менеджмент организаций",
      "Государственное и муниципальное управление"
    ]
  },
  "27.03.05": {
    name: "Инноватика",
    profiles: [
      "Управление инновациями"
    ]
  },
  "43.03.02": {
    name: "Туризм",
    profiles: [
      "Технология и организация туристских услуг"
    ]
  },
  "40.03.01": {
    name: "Юриспруденция",
    profiles: [
      "Гражданско-правовой"
    ]
  },
  "38.05.01": {
    name: "Экономическая безопасность",
    profiles: [
      "Экономико-правовое обеспечение экономической безопасности"
    ]
  }
};

/**
 * Расширенная функция поиска направления по коду
 * Поддерживает частичные совпадения
 * 
 * @param {string} code - Код направления
 * @return {Object} - Информация о направлении
 */
function findDirectionByCode(code) {
  // Нормализуем код
  const normalizedCode = normalizeDirectionCode(code);
  
  // Прямое соответствие в словаре
  if (DIRECTIONS_MAP[normalizedCode]) {
    return {
      code: normalizedCode,
      name: DIRECTIONS_MAP[normalizedCode].name,
      profiles: DIRECTIONS_MAP[normalizedCode].profiles,
      wasFound: true
    };
  }
  
  // Пытаемся найти частичное соответствие (первые два компонента)
  if (normalizedCode.includes('.')) {
    const prefix = normalizedCode.split('.').slice(0, 2).join('.');
    
    // Ищем все коды, начинающиеся с этого префикса
    const possibleCodes = Object.keys(DIRECTIONS_MAP)
      .filter(key => key.startsWith(prefix));
    
    if (possibleCodes.length === 1) {
      // Если найден только один вариант, считаем его подходящим
      const matchedCode = possibleCodes[0];
      return {
        code: matchedCode,
        name: DIRECTIONS_MAP[matchedCode].name,
        profiles: DIRECTIONS_MAP[matchedCode].profiles,
        wasFound: true,
        wasPartialMatch: true
      };
    } else if (possibleCodes.length > 1) {
      // Если найдено несколько вариантов, возвращаем список возможных совпадений
      return {
        code: normalizedCode,
        possibleMatches: possibleCodes,
        wasFound: false,
        wasPartialMatch: true
      };
    }
  }
  
  // Направление не найдено
  return {
    code: normalizedCode,
    wasFound: false
  };
}

/**
 * Проверяет, является ли профиль валидным для указанного направления
 * 
 * @param {string} code - Код направления
 * @param {string} profile - Название профиля
 * @return {boolean} - Результат проверки
 */
function isProfileValid(code, profile) {
  if (!profile || profile === "Без указания профиля") {
    return true; // Пустой профиль или стандартное "Без указания профиля" считаем валидным
  }
  
  const normalizedProfile = normalizeProfileName(profile);
  
  // Проверяем наличие направления в словаре
  const directionInfo = findDirectionByCode(code);
  if (!directionInfo.wasFound) {
    return false; // Направление не найдено
  }
  
  // Если у направления нет профилей в словаре, считаем любой профиль допустимым
  if (!directionInfo.profiles || directionInfo.profiles.length === 0) {
    return true;
  }
  
  // Проверяем соответствие профиля одному из допустимых профилей для данного направления
  return directionInfo.profiles.some(validProfile => 
    normalizeText(validProfile) === normalizedProfile
  );
}

/**
 * Находит ближайший профиль в словаре на основе нечеткого сравнения
 * 
 * @param {string} code - Код направления
 * @param {string} profile - Название профиля для поиска
 * @return {string|null} - Найденный ближайший профиль или null
 */
function findClosestProfile(code, profile) {
  if (!profile) return null;
  
  const normalizedProfile = normalizeProfileName(profile);
  
  // Получаем информацию о направлении
  const directionInfo = findDirectionByCode(code);
  if (!directionInfo.wasFound || !directionInfo.profiles || directionInfo.profiles.length === 0) {
    return null;
  }
  
  // Находим ближайший профиль по мере сходства (по количеству совпадающих слов)
  let bestMatch = { profile: null, score: 0 };
  
  for (const validProfile of directionInfo.profiles) {
    const normalizedValidProfile = normalizeText(validProfile);
    
    // --- УЛУЧШЕНИЕ: Очистка слов от пунктуации перед сравнением ---
    const cleanWord = (word) => word.replace(/[.,!?;:()]/g, '');
    
    // Создаем множества очищенных слов (длиннее 2 символов)
    const profileWords = new Set(
        normalizedProfile.split(' ').map(cleanWord).filter(w => w.length > 2)
    );
    const validProfileWords = new Set(
        normalizedValidProfile.split(' ').map(cleanWord).filter(w => w.length > 2)
    );
    // --- Конец улучшения ---
    
    // Находим пересечение множеств
    const intersection = [...profileWords].filter(word => validProfileWords.has(word));
    
    // Вычисляем коэффициент сходства (можно использовать коэффициент Жаккара)
    const unionSize = profileWords.size + validProfileWords.size - intersection.length;
    const score = unionSize > 0 ? intersection.length / unionSize : 0; // Коэффициент Жаккара
    
    // Debug log (можно раскомментировать для отладки)
    // console.log(`Сравнение: "${normalizedProfile}" vs "${normalizedValidProfile}" | Score: ${score} | Intersection: ${[...intersection]}`);

    if (score > bestMatch.score) {
      bestMatch = { profile: validProfile, score: score };
    }
  }
  
  // Возвращаем профиль только если степень сходства достаточно высока (поднимем порог немного)
  const SIMILARITY_THRESHOLD = 0.25; // Порог для коэффициента Жаккара
  return bestMatch.score >= SIMILARITY_THRESHOLD ? bestMatch.profile : null;
} 