/**
 * Вспомогательные функции для работы с листами таблицы
 */

/**
 * Ищет листы с данными очной и заочной формы
 * 
 * @param {SpreadsheetApp.Spreadsheet} ss - Таблица
 * @return {Object} - Объект с найденными листами
 */
function findSheets(ss) {
  const sheets = ss.getSheets();
  let fullTimeSheet = null;
  let partTimeSheet = null;
  
  // Возможные названия для листа очной формы
  const fullTimeNames = [
    "очная форма", "очная", "очники", "очка", "очное", "дневная", "дневное",
    "очн", "дневн", "дневники", "дневное обучение", "очное обучение"
  ];
  
  // Возможные названия для листа заочной формы
  const partTimeNames = [
    "заочная форма", "заочная", "заочники", "заочка", "заочное",
    "заочн", "заочное обучение", "вечернее", "вечерка"
  ];
  
  // Создаем регулярные выражения для более гибкого поиска
  const fullTimeRegex = new RegExp(fullTimeNames.join("|"), "i");
  const partTimeRegex = new RegExp(partTimeNames.join("|"), "i");
  
  // Создаем объекты для хранения совпадений с весами
  const fullTimeMatches = [];
  const partTimeMatches = [];
  
  // Ищем листы с подходящими названиями
  for (const sheet of sheets) {
    const name = sheet.getName();
    const nameLower = name.toLowerCase();
    
    // Поиск совпадений для очной формы
    if (fullTimeRegex.test(nameLower)) {
      // Оцениваем "вес" совпадения (насколько хорошо название подходит)
      let weight = 0;
      for (const pattern of fullTimeNames) {
        if (nameLower.includes(pattern.toLowerCase())) {
          // Точное вхождение дает больший вес
          weight += pattern.length;
        }
      }
      
      fullTimeMatches.push({
        sheet: sheet,
        weight: weight
      });
    }
    
    // Поиск совпадений для заочной формы
    if (partTimeRegex.test(nameLower)) {
      // Оцениваем "вес" совпадения
      let weight = 0;
      for (const pattern of partTimeNames) {
        if (nameLower.includes(pattern.toLowerCase())) {
          weight += pattern.length;
        }
      }
      
      partTimeMatches.push({
        sheet: sheet,
        weight: weight
      });
    }
  }
  
  // Сортируем совпадения по весу (от большего к меньшему)
  fullTimeMatches.sort((a, b) => b.weight - a.weight);
  partTimeMatches.sort((a, b) => b.weight - a.weight);
  
  // Выбираем листы с наибольшим весом
  if (fullTimeMatches.length > 0) {
    fullTimeSheet = fullTimeMatches[0].sheet;
  }
  
  if (partTimeMatches.length > 0) {
    partTimeSheet = partTimeMatches[0].sheet;
  }
  
  // Если не нашли листы по названиям, пробуем использовать первые два листа
  if (!fullTimeSheet && !partTimeSheet && sheets.length >= 2) {
    fullTimeSheet = sheets[0];
    partTimeSheet = sheets[1];
    
    // Логируем информацию о том, что используем первые листы
    console.log("Не удалось найти листы по названиям, используем первые два листа:", {
      fullTime: fullTimeSheet.getName(),
      partTime: partTimeSheet.getName()
    });
  } else if (!fullTimeSheet && sheets.length >= 1) {
    // Если нашли только заочную форму или не нашли ни одной, но есть хотя бы один лист
    fullTimeSheet = sheets[0];
    console.log("Не удалось найти лист очной формы, используем первый лист:", fullTimeSheet.getName());
  } else if (!partTimeSheet && sheets.length >= 2) {
    // Если нашли только очную форму, используем второй лист для заочной
    partTimeSheet = sheets[1];
    console.log("Не удалось найти лист заочной формы, используем второй лист:", partTimeSheet.getName());
  }
  
  return {
    fullTimeSheet: fullTimeSheet,
    partTimeSheet: partTimeSheet
  };
}

/**
 * Ищет столбцы с направлениями
 * 
 * @param {SpreadsheetApp.Sheet} sheet - Лист таблицы
 * @return {Array<number>} - Массив индексов столбцов (0-based)
 */
function findDirectionColumns(sheet) {
  if (!sheet) return [];
  
  const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const directionColumns = [];
  
  // Ключевые слова для поиска в заголовках
  const keywords = [
    "направление", "специальность", "направл", "спец", 
    "профиль", "образовательная программа", "программа"
  ];
  
  // Сначала ищем по ключевым словам в заголовках
  for (let i = 0; i < headerRow.length; i++) {
    const header = String(headerRow[i]).toLowerCase();
    
    for (const keyword of keywords) {
      if (header.includes(keyword.toLowerCase())) {
        directionColumns.push(i);
        break; // Найдено ключевое слово, переходим к следующему столбцу
      }
    }
  }
  
  // Если не нашли по заголовкам, ищем в первых строках листа
  if (directionColumns.length === 0) {
    // Получаем данные первых 5 строк (или меньше, если строк меньше)
    const rowCount = Math.min(5, sheet.getLastRow());
    if (rowCount > 1) { // Если есть строки кроме заголовка
      const sampleRange = sheet.getRange(2, 1, rowCount-1, sheet.getLastColumn());
      const sampleValues = sampleRange.getValues();
      
      // Проверяем каждый столбец на наличие кодов направлений
      for (let col = 0; col < headerRow.length; col++) {
        for (let row = 0; row < sampleValues.length; row++) {
          const cellValue = String(sampleValues[row][col] || "");
          // Ищем паттерн XX.XX.XX (код направления)
          if (cellValue.match(/\d{2}[\.,\-]?\d{2}[\.,\-]?\d{2}/)) {
            if (!directionColumns.includes(col)) {
              directionColumns.push(col);
              break; // Переходим к следующему столбцу
            }
          }
        }
      }
    }
  }
  
  // Если всё ещё не нашли столбцы, используем стандартные столбцы (I, J, K, L, M)
  if (directionColumns.length === 0) {
    const defaultColumns = [8, 9, 10, 11, 12]; // Индексы столбцов I, J, K, L, M (0-based)
    
    // Проверяем, существуют ли эти столбцы в таблице
    const existingColumns = defaultColumns.filter(col => col < sheet.getLastColumn());
    
    if (existingColumns.length > 0) {
      directionColumns.push(...existingColumns);
      console.log("Не удалось определить столбцы с направлениями, используем стандартные столбцы:", 
                  existingColumns.map(col => columnToLetter(col + 1)).join(", "));
    } else {
      // Если и стандартные столбцы не подходят, берем все столбцы
      for (let i = 0; i < Math.min(sheet.getLastColumn(), 15); i++) {
        directionColumns.push(i);
      }
      console.log("Не найдены подходящие столбцы, используем все столбцы");
    }
  }
  
  return directionColumns;
}

/**
 * Преобразует номер столбца в буквенное обозначение
 * 
 * @param {number} column - Номер столбца (1-based)
 * @return {string} - Буквенное обозначение
 */
function columnToLetter(column) {
  let temp, letter = '';
  while (column > 0) {
    temp = (column - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    column = (column - temp - 1) / 26;
  }
  return letter;
}

/**
 * Ищет столбец с ФИО
 * 
 * @param {Array<string>} headerRow - Массив заголовков
 * @param {SpreadsheetApp.Sheet} sheet - Лист для проверки содержимого (опционально)
 * @return {number} - Индекс столбца ФИО (0-based) или -1, если не найден
 */
function findFioColumn(headerRow, sheet) {
  const fioKeywords = ["фио", "ф.и.о.", "фамилия имя отчество", "абитуриент", "участник"];
  
  // Ищем по ключевым словам в заголовках
  for (let i = 0; i < headerRow.length; i++) {
    const header = String(headerRow[i]).toLowerCase();
    for (const keyword of fioKeywords) {
      if (header.includes(keyword)) {
        return i;
      }
    }
  }
  
  // Если не нашли по заголовку, можно добавить проверку содержимого
  // Например, искать строки, похожие на "Фамилия Имя Отчество"
  // (пропущено для простоты в этой версии)
  
  // Если не нашли, возвращаем первый столбец как наиболее вероятный
  console.log("Не удалось найти столбец ФИО по заголовку, используется первый столбец (A)");
  return 0; 
}

/**
 * Ищет столбцы с информацией о документах
 * 
 * @param {Array<string>} headerRow - Массив заголовков
 * @return {Object} - Объект с индексами столбцов для каждого типа документа
 */
function findDocumentColumns(headerRow) {
  const documentKeywords = {
    application: ["заявление", "заявл"],
    consent: ["согласие", "согл"],
    photo: ["фото"],
    passport: ["паспорт", "пасп"],
    snils: ["снилс"],
    inn: ["инн"],
    target: ["целевое", "цел"]
    // Добавьте другие ключевые слова при необходимости
  };
  
  const documentColumns = {};

  for (let i = 0; i < headerRow.length; i++) {
    const header = String(headerRow[i]).toLowerCase().trim();
    
    for (const docType in documentKeywords) {
      if (documentKeywords[docType].some(keyword => header.includes(keyword))) {
        documentColumns[docType] = i;
        break; // Нашли соответствие для этого столбца
      }
    }
  }
  
  // Проверяем, все ли типы документов найдены
  for (const docType in documentKeywords) {
    if (!(docType in documentColumns)) {
      console.log(`Не удалось найти столбец для документа: ${docType}. Проверьте заголовки.`);
      documentColumns[docType] = -1; // Устанавливаем -1, если столбец не найден
    }
  }

  return documentColumns;
} 