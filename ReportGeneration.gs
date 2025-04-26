/**
 * Функции для расчета статистики, генерации отчетов и валидации данных
 */

/**
 * Рассчитывает статистику на основе данных об абитуриентах
 * 
 * @param {Array<Object>} students - Массив объектов абитуриентов
 * @return {Object} - Объект с рассчитанной статистикой
 */
function calculateStats(students) {
  const stats = {
    totalApplicants: { fullTime: 0, partTime: 0, total: 0 },
    byDirection: {}, // Статистика по каждому направлению
    priorityInfo09_03_02: { // Информация о приоритетных заявлениях для 09.03.02
      total: { fullTime: 0, partTime: 0, total: 0 },
      profiles: {}  // Будет содержать счетчики по каждому профилю
    }
    // Можно добавить другие виды статистики по необходимости (факультеты, документы и т.д.)
  };

  if (!students || students.length === 0) {
    return stats; // Возвращаем пустую статистику, если нет данных
  }

  // Подсчет общего количества абитуриентов и инициализация статистики по направлениям
  students.forEach(student => {
    // Общий счетчик
    if (student.form === "очная") {
      stats.totalApplicants.fullTime++;
    } else {
      stats.totalApplicants.partTime++;
    }
    stats.totalApplicants.total++;

    // Обработка направлений абитуриента
    student.directions.forEach(direction => {
      const code = direction.code;
      const profile = direction.profile || "Без указания профиля";

      // Инициализация статистики для направления, если его еще нет
      if (!stats.byDirection[code]) {
        stats.byDirection[code] = {
          name: direction.name,
          applicants: { fullTime: 0, partTime: 0, total: 0 }, // Счетчик уникальных абитуриентов
          applications: { fullTime: 0, partTime: 0, total: 0 }, // Счетчик заявлений (для информации)
          byPriority: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          profiles: {}
        };
      }
      
      // Инициализация статистики для профиля, если его еще нет
      if (!stats.byDirection[code].profiles[profile]) {
        stats.byDirection[code].profiles[profile] = {
          applicants: { fullTime: 0, partTime: 0, total: 0 },
          applications: { fullTime: 0, partTime: 0, total: 0 }
        };
      }
      
      // --- Подсчет статистики --- 
      const directionStats = stats.byDirection[code];
      const profileStats = directionStats.profiles[profile];
      
      // Увеличиваем счетчик заявлений для направления и профиля
      if (student.form === "очная") {
        directionStats.applications.fullTime++;
        profileStats.applications.fullTime++;
      } else {
        directionStats.applications.partTime++;
        profileStats.applications.partTime++;
      }
      directionStats.applications.total++;
      profileStats.applications.total++;
      
      // Увеличиваем счетчик приоритетов
      if (direction.priority <= 5) {
        directionStats.byPriority[direction.priority]++;
      }

      // --- Добавлено: Подсчет приоритетных заявлений для 09.03.02 ---
      if (code === "09.03.02" && direction.priority === 1) {
        // Обработка общего счетчика приоритетных заявлений
        if (student.form === "очная") {
          stats.priorityInfo09_03_02.total.fullTime++;
        } else {
          stats.priorityInfo09_03_02.total.partTime++;
        }
        stats.priorityInfo09_03_02.total.total++;
        
        // Обработка счетчика по профилям для приоритетных заявлений
        if (!stats.priorityInfo09_03_02.profiles[profile]) {
          stats.priorityInfo09_03_02.profiles[profile] = { 
            fullTime: 0, partTime: 0, total: 0 
          };
        }
        
        if (student.form === "очная") {
          stats.priorityInfo09_03_02.profiles[profile].fullTime++;
        } else {
          stats.priorityInfo09_03_02.profiles[profile].partTime++;
        }
        stats.priorityInfo09_03_02.profiles[profile].total++;
      }
      // --- Конец добавленного кода ---
    });
  });

  // Подсчет уникальных абитуриентов для каждого направления и профиля
  // Создаем временные наборы для отслеживания уникальных абитуриентов
  const uniqueApplicantsByDirection = {};
  const uniqueApplicantsByProfile = {};

  students.forEach(student => {
    student.directions.forEach(direction => {
      const code = direction.code;
      const profile = direction.profile || "Без указания профиля";
      const studentId = student.id; // Используем ID абитуриента
      const form = student.form;

      // --- Уникальные абитуриенты по направлениям ---
      if (!uniqueApplicantsByDirection[code]) {
        uniqueApplicantsByDirection[code] = { fullTime: new Set(), partTime: new Set() };
      }
      if (form === "очная") {
        uniqueApplicantsByDirection[code].fullTime.add(studentId);
      } else {
        uniqueApplicantsByDirection[code].partTime.add(studentId);
      }
      
      // --- Уникальные абитуриенты по профилям --- 
      const profileKey = `${code}_${profile}`;
      if (!uniqueApplicantsByProfile[profileKey]) {
        uniqueApplicantsByProfile[profileKey] = { fullTime: new Set(), partTime: new Set() };
      }
      if (form === "очная") {
        uniqueApplicantsByProfile[profileKey].fullTime.add(studentId);
      } else {
        uniqueApplicantsByProfile[profileKey].partTime.add(studentId);
      }
    });
  });
  
  // Записываем количество уникальных абитуриентов в основную статистику
  for (const code in uniqueApplicantsByDirection) {
     if (stats.byDirection[code]) { // Доп. проверка на всякий случай
        stats.byDirection[code].applicants.fullTime = uniqueApplicantsByDirection[code].fullTime.size;
        stats.byDirection[code].applicants.partTime = uniqueApplicantsByDirection[code].partTime.size;
        stats.byDirection[code].applicants.total = stats.byDirection[code].applicants.fullTime + stats.byDirection[code].applicants.partTime; 
     }
  }
  
  for (const profileKey in uniqueApplicantsByProfile) {
      const [code, profile] = profileKey.split('_');
      if (stats.byDirection[code] && stats.byDirection[code].profiles[profile]) { // Доп. проверка
          stats.byDirection[code].profiles[profile].applicants.fullTime = uniqueApplicantsByProfile[profileKey].fullTime.size;
          stats.byDirection[code].profiles[profile].applicants.partTime = uniqueApplicantsByProfile[profileKey].partTime.size;
          stats.byDirection[code].profiles[profile].applicants.total = stats.byDirection[code].profiles[profile].applicants.fullTime + stats.byDirection[code].profiles[profile].applicants.partTime; 
      }
  }

  return stats;
}

/**
 * Генерирует основной отчет на основе рассчитанной статистики
 * 
 * @param {SpreadsheetApp.Sheet} reportSheet - Лист для отчета
 * @param {Object} stats - Объект статистики, полученный от calculateStats
 */
function generateReport(reportSheet, stats) {
  if (!reportSheet || !stats || !stats.byDirection) {
      console.error("Некорректные данные для генерации отчета.");
      reportSheet.getRange(1,1).setValue("Ошибка: Не удалось сгенерировать отчет. Недостаточно данных.");
      return;
  }
  
  // Подготовка заголовков - убираем дублирующие столбцы заявлений
  reportSheet.getRange(1, 1, 1, 6).setValues([[
      'Код', 'Направление', 'Профиль', 
      'Абитуриенты (Очная)', 'Абитуриенты (Заочная)', 
      'Абитуриенты (Всего)'
  ]]);
  
  // Заполнение данных
  let row = 2;
  let data = [];
  
  // Сортируем направления по коду
  const sortedCodes = Object.keys(stats.byDirection).sort();
  
  for (const code of sortedCodes) {
    const directionData = stats.byDirection[code];
    
    // Пропускаем направления без данных
    if (!directionData || !directionData.profiles) {
      continue;
    }
    
    // Добавляем строку "Всего" для направления
    data.push([
        code,
        directionData.name,
        "--- ВСЕГО по направлению ---",
        directionData.applicants.fullTime,
        directionData.applicants.partTime,
        directionData.applicants.total
    ]);
    
    // Добавляем строку с приоритетными заявлениями для 09.03.02
    if (code === "09.03.02") {
      data.push([
        "", 
        "",
        "--- В том числе ПРИОРИТЕТНЫЕ (Приоритет 1) ---",
        stats.priorityInfo09_03_02.total.fullTime,
        stats.priorityInfo09_03_02.total.partTime,
        stats.priorityInfo09_03_02.total.total
      ]);
      
      // Добавляем строки по профилям с приоритетными заявлениями
      const priorityProfiles = Object.keys(stats.priorityInfo09_03_02.profiles).sort();
      for (const profile of priorityProfiles) {
        const profileData = stats.priorityInfo09_03_02.profiles[profile];
        data.push([
          "", 
          "",
          `${profile} (Приоритет 1)`,
          profileData.fullTime,
          profileData.partTime,
          profileData.total
        ]);
      }
    }
    
    // Сортируем профили по алфавиту
    const sortedProfiles = Object.keys(directionData.profiles).sort();
    
    for (const profile of sortedProfiles) {
        const profileData = directionData.profiles[profile];
        data.push([
          "", // Пусто для кода
          "", // Пусто для названия направления
          profile,
          profileData.applicants.fullTime,
          profileData.applicants.partTime,
          profileData.applicants.total
        ]);
    }
    // Добавляем пустую строку для визуального разделения направлений
    data.push(Array(6).fill("")); 
  }
  
  // Записываем все данные одним запросом (оптимизация)
  if (data.length > 0) {
    reportSheet.getRange(2, 1, data.length, 6).setValues(data);
    // Обновляем счетчик строк
    row += data.length;
  } else {
      reportSheet.getRange(2,1).setValue("Нет данных для отображения в отчете.");
      row = 2;
  }
  
  // Добавляем итоговую строку по всем абитуриентам
  const totalRow = row;
  reportSheet.getRange(totalRow, 1, 1, 6).setValues([
    ["ИТОГО", "", "", 
     stats.totalApplicants.fullTime,
     stats.totalApplicants.partTime, 
     stats.totalApplicants.total
    ]
  ]);
  
  // Форматирование отчета
  formatReport(reportSheet, totalRow);
}

/**
 * Форматирует отчет
 * 
 * @param {SpreadsheetApp.Sheet} sheet - Лист отчета
 * @param {number} totalRow - Номер строки с итогами
 */
function formatReport(sheet, totalRow) {
  const lastCol = 6; // Теперь у нас 6 столбцов
  
  // Форматирование заголовков
  const headerRange = sheet.getRange(1, 1, 1, lastCol);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#f3f3f3');
  headerRange.setHorizontalAlignment('center');
  headerRange.setVerticalAlignment('middle');
  headerRange.setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
  
  // Форматирование итоговой строки
  const totalRange = sheet.getRange(totalRow, 1, 1, lastCol);
  totalRange.setFontWeight('bold');
  totalRange.setBackground('#f3f3f3');
  
  // Основные данные
  const dataRange = sheet.getRange(2, 1, Math.max(1, totalRow - 1), lastCol);
  dataRange.setHorizontalAlignment('center');
  dataRange.setVerticalAlignment('middle');
  
  // Выравнивание по левому краю для названий
  sheet.getRange(2, 2, Math.max(1, totalRow - 1), 1).setHorizontalAlignment('left'); // Направление
  sheet.getRange(2, 3, Math.max(1, totalRow - 1), 1).setHorizontalAlignment('left'); // Профиль
  
  // Форматирование строк "Всего по направлению"
  const dataValues = dataRange.getValues();
  for (let i = 0; i < dataValues.length; i++) {
    const cellText = String(dataValues[i][2] || "");
    if (cellText.includes("--- ВСЕГО по направлению ---")) {
      sheet.getRange(i + 2, 1, 1, lastCol).setFontWeight('bold');
    } else if (cellText.includes("--- В том числе ПРИОРИТЕТНЫЕ")) {
      // Выделяем строку с общим количеством приоритетных заявлений
      sheet.getRange(i + 2, 1, 1, lastCol).setBackground('#e6f7ff').setFontWeight('bold');
    } else if (cellText.includes("(Приоритет 1)")) {
      // Выделяем строки с приоритетными заявлениями по профилям
      sheet.getRange(i + 2, 1, 1, lastCol).setBackground('#f0f8ff'); // Светло-голубой фон
    }
  }
  
  // Автоматическая настройка ширины столбцов
  sheet.autoResizeColumns(1, lastCol);
  
  // Выделение контура для таблицы
  sheet.getRange(1, 1, totalRow, lastCol).setBorder(true, true, true, true, true, true, "#000000", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  
  // Удаляем фильтры, если они есть, и создаем новые
  const filter = sheet.getFilter();
  if (filter) {
    filter.remove();
  }
  sheet.getRange(1, 1, totalRow, lastCol).createFilter();
}

/**
 * Проверяет данные абитуриентов на наличие проблем
 * 
 * @param {Array<Object>} students - Массив объектов абитуриентов
 * @return {boolean} - true, если найдены потенциальные проблемы
 */
function validateResults(students) {
  // Создаем или очищаем лист логов
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let logSheet = ss.getSheetByName('Лог');
  if (!logSheet) {
    logSheet = ss.insertSheet('Лог');
  } else {
    logSheet.clear();
  }
  
  // Заголовки лога
  const headers = ['Тип', 'Абитуриент', 'Описание', 'Детали', 'Рекомендации'];
  logSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  const logMessages = []; // Массив для сбора сообщений лога
  let hasIssues = false;

  if (!students || students.length === 0) {
      logMessages.push(['ИНФОРМАЦИЯ', '-', 'Нет данных абитуриентов для проверки', '', '']);
  } else {
      // Проверяем каждого абитуриента
      students.forEach(student => {
        const studentName = student.name;
        // Проверка направлений абитуриента
        student.directions.forEach(direction => {
          const code = direction.code;
          const profile = direction.profile;
          
          // 1. Проверка наличия кода в словаре
          const directionInfo = findDirectionByCode(code);
          if (!directionInfo.wasFound) {
            logMessages.push(['ВНИМАНИЕ', studentName, 
                     `Код направления ${code} не найден в словаре`, 
                     `Направление: ${direction.name || "Не указано"}`,
                     'Проверьте правильность кода направления']);
            hasIssues = true;
          }
          
          // 2. Проверка профиля на соответствие словарю (если профиль есть)
          if (profile) { 
              if (directionInfo.wasFound && !isProfileValid(code, profile)) {
                const closestProfile = findClosestProfile(code, profile);
                if (closestProfile) {
                  logMessages.push(['ИНФОРМАЦИЯ', studentName,
                           `Профиль "${profile}" для ${code} не найден в словаре`, 
                           `Возможно, имелось в виду: "${closestProfile}"?`,
                           'Проверьте написание профиля или обновите словарь.']);
                } else {
                  logMessages.push(['ИНФОРМАЦИЯ', studentName,
                           `Профиль "${profile}" для ${code} не найден в словаре`, 
                           `Направление: ${direction.name}`,
                           'Возможно, это новый профиль или опечатка']);
                }
                hasIssues = true;
              }
          }
        });
        
        // Пример проверки документов (раскомментировать при необходимости)
        // if (!student.documents.application) {
        //   logMessages.push(['ВНИМАНИЕ', studentName, 'Отсутствует заявление', '', 'Проверьте наличие заявления']);
        //   hasIssues = true;
        // }
        // if (!student.documents.consent) {
        //   logMessages.push(['ВНИМАНИЕ', studentName, 'Отсутствует согласие', '', 'Проверьте наличие согласия']);
        //   hasIssues = true;
        // }
      });
  }
  
  // Если нет проблем, добавляем запись "Проблем не обнаружено"
  if (!hasIssues && logMessages.length === 0) { // Добавляем сообщение только если массив пуст
    logMessages.push(['ИНФОРМАЦИЯ', '-', 'Проблем не обнаружено', 'Все данные корректны', '']);
  }

  // Записываем все сообщения лога одним вызовом
  if (logMessages.length > 0) {
      logSheet.getRange(2, 1, logMessages.length, headers.length).setValues(logMessages);
  }
  
  // Форматирование лога
  const lastRow = logMessages.length + 1; // +1 из-за заголовка
  formatLogSheet(logSheet, lastRow);
  
  return hasIssues;
}

/**
 * Добавляет запись в лог - БОЛЬШЕ НЕ ИСПОЛЬЗУЕТСЯ НАПРЯМУЮ
 * Оставлена для обратной совместимости или будущих нужд, 
 * но validateResults теперь использует пакетную запись.
 * 
 * @param {SpreadsheetApp.Sheet} logSheet - Лист лога
 * @param {number} row - Номер строки
 * @param {string} type - Тип записи (ВНИМАНИЕ, ИНФОРМАЦИЯ и т.д.)
 * @param {string} studentName - ФИО абитуриента
 * @param {string} description - Описание проблемы
 * @param {string} details - Детали
 * @param {string} recommendation - Рекомендации
 */
function logIssue(logSheet, row, type, studentName, description, details, recommendation) {
   // Эта функция больше не используется для основной записи логов в validateResults
   // Оставлена здесь на случай, если понадобится точечная запись в других местах
   console.warn("Функция logIssue вызвана, но validateResults использует пакетную запись.");
   try {
      logSheet.getRange(row, 1, 1, 5).setValues([
         [type, studentName, description, details, recommendation]
       ]);
   } catch(e) {
      console.error("Ошибка при попытке использовать logIssue:", e);
   }
}

/**
 * Форматирует лист лога
 * 
 * @param {SpreadsheetApp.Sheet} logSheet - Лист лога
 * @param {number} lastRow - Последняя строка с данными
 */
function formatLogSheet(logSheet, lastRow) {
  const lastCol = 5; // Теперь 5 столбцов в логе
  // Форматирование заголовков
  logSheet.getRange(1, 1, 1, lastCol).setFontWeight('bold');
  logSheet.getRange(1, 1, 1, lastCol).setBackground('#f3f3f3');
  
  // Выделение цветом разных типов записей
  const typeRange = logSheet.getRange(2, 1, Math.max(1, lastRow - 1), 1);
  const typeValues = typeRange.getValues();
  
  for (let i = 0; i < typeValues.length; i++) {
    const cell = logSheet.getRange(i + 2, 1);
    if (typeValues[i][0] === 'ВНИМАНИЕ') {
      cell.setBackground('#FFCCCB'); // Светло-красный для предупреждений
    } else if (typeValues[i][0] === 'ИНФОРМАЦИЯ') {
      cell.setBackground('#FFFFCC'); // Светло-желтый для информации
    }
  }
  
  // Автоматическая настройка ширины столбцов
  logSheet.autoResizeColumns(1, lastCol);
  
  // Выделение контура для таблицы
  logSheet.getRange(1, 1, lastRow, lastCol).setBorder(true, true, true, true, true, true, "#000000", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  
   // Удаляем фильтры, если они есть, и создаем новые
  const filter = logSheet.getFilter();
  if (filter) {
    filter.remove();
  }
  logSheet.getRange(1, 1, lastRow, lastCol).createFilter();
} 