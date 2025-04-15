/**
 * Функции обработки данных об абитуриентах и их направлениях
 */

/**
 * Извлекает информацию о направлении из текста ячейки
 * 
 * @param {string} cellValue - Значение ячейки
 * @return {Object|null} - Объект с информацией {code, name, profile} или null
 */
function extractDirectionInfoFromCell(cellValue) {
  try {
    if (!cellValue) return null;
    
    const processedText = normalizeText(handleSpecialCharacters(cellValue));
    
    // Ищем код направления
    const codeMatch = processedText.match(/(\d{2}[\.,\-]?\d{2}[\.,\-]?\d{2})/);
    if (!codeMatch) {
      return null; // Не удалось найти код
    }
    
    const rawCode = codeMatch[1];
    const normalizedCode = normalizeDirectionCode(rawCode);
    
    // Получаем информацию из словаря
    const directionInfo = findDirectionByCode(normalizedCode);
    const code = directionInfo.wasFound ? directionInfo.code : normalizedCode;
    const name = directionInfo.wasFound ? directionInfo.name : normalizeDirectionName(normalizedCode);
    
    // Извлекаем профиль (удаляем код из строки перед поиском профиля)
    const textWithoutCode = processedText.replace(rawCode, '').trim();
    const extractedProfile = extractProfile(textWithoutCode, name.toLowerCase());
    const profile = normalizeProfileName(extractedProfile);
    
    return {
      code: code,
      name: name,
      profile: profile || null // Возвращаем null, если профиль не извлечен
    };

  } catch (error) {
    console.error("Ошибка при извлечении информации о направлении:", error);
    console.log("Значение ячейки:", cellValue);
    return null;
  }
}

/**
 * Обрабатывает лист данных, создавая массив объектов абитуриентов
 * 
 * @param {SpreadsheetApp.Sheet} sheet - Лист таблицы
 * @param {string} formType - Тип формы обучения ("очная" или "заочная")
 * @return {Array<Object>} - Массив объектов абитуриентов
 */
function processSheetForStudents(sheet, formType) {
  if (!sheet) return [];
  
  const students = [];
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();

  // Проверяем, есть ли данные
  if (lastRow <= 1 || lastCol <= 0) {
    console.log("Лист пуст или содержит только заголовки:", sheet.getName());
    return [];
  }

  const data = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  const headerRow = data[0];

  // Определяем ключевые столбцы
  const fioColumn = findFioColumn(headerRow, sheet);
  const directionColumns = findDirectionColumns(sheet);
  const docColumns = findDocumentColumns(headerRow);

  if (fioColumn === -1 || directionColumns.length === 0) {
    console.error(`Не удалось определить структуру листа ${sheet.getName()}. Пропущен.`);
    return [];
  }

  // Обрабатываем каждую строку (абитуриента), начиная со второй
  for (let row = 1; row < data.length; row++) {
    const rowData = data[row];
    const studentName = String(rowData[fioColumn] || "").trim();

    // Пропускаем строки без ФИО
    if (!studentName) {
      continue;
    }
    
    const student = {
      id: `${formType}_${sheet.getName()}_${row}`, // Простой уникальный ID
      name: studentName,
      form: formType,
      documents: {},
      directions: []
    };

    // Обработка документов
    for (const docType in docColumns) {
      const colIndex = docColumns[docType];
      if (colIndex !== -1 && colIndex < rowData.length) {
        // Считаем документ предоставленным, если в ячейке есть "есть" или "+" (без учета регистра)
        const docValue = String(rowData[colIndex] || "").toLowerCase().trim();
        student.documents[docType] = docValue === "есть" || docValue === "+";
      } else {
        student.documents[docType] = false; // Если столбец не найден, считаем документ отсутствующим
      }
    }
    
    // Обработка направлений
    let priority = 1;
    for (const col of directionColumns) {
       if (col < rowData.length) { 
         const cellValue = rowData[col];
         if (cellValue) {
           const directionInfo = extractDirectionInfoFromCell(cellValue);
           if (directionInfo) {
             student.directions.push({
               ...directionInfo,
               priority: priority++
             });
           }
         }
       }
    }

    // Добавляем абитуриента в список, только если у него есть хотя бы одно направление
    if (student.directions.length > 0) {
       students.push(student);
    } else {
      console.log(`Абитуриент ${studentName} на листе ${sheet.getName()} пропущен (нет направлений).`);
    }
  }

  return students;
}

/**
 * Собирает данные об абитуриентах со всех нужных листов
 * 
 * @param {SpreadsheetApp.Sheet} fullTimeSheet - Лист очной формы
 * @param {SpreadsheetApp.Sheet} partTimeSheet - Лист заочной формы
 * @return {Array<Object>} - Общий массив объектов абитуриентов
 */
function processData(fullTimeSheet, partTimeSheet) {
  let allStudents = [];
  
  console.log("Начало обработки листа очной формы...");
  const fullTimeStudents = processSheetForStudents(fullTimeSheet, 'очная');
  console.log(`Обработано ${fullTimeStudents.length} абитуриентов с листа очной формы.`);
  allStudents = allStudents.concat(fullTimeStudents);
  
  console.log("Начало обработки листа заочной формы...");
  const partTimeStudents = processSheetForStudents(partTimeSheet, 'заочная');
  console.log(`Обработано ${partTimeStudents.length} абитуриентов с листа заочной формы.`);
  allStudents = allStudents.concat(partTimeStudents);
  
  console.log(`Всего обработано уникальных абитуриентов: ${allStudents.length}`);
  return allStudents;
} 