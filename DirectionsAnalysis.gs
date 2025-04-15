/**
 * Скрипт для анализа данных о направлениях и профилях обучения
 * Автоматически находит и обрабатывает информацию о направлениях в таблице
 */

// Добавляем пункт меню при открытии таблицы
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Анализ направлений')
    .addItem('Запустить анализ', 'runDirectionsAnalysis')
    .addToUi();
}

/**
 * Основная функция анализа направлений
 * Запускается при нажатии на пункт меню
 */
function runDirectionsAnalysis() {
  try {
    // Получение активной таблицы
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Поиск нужных листов (очная/заочная форма обучения)
    const {fullTimeSheet, partTimeSheet} = findSheets(ss);
    
    // Создание или очистка листа отчёта
    let reportSheet = ss.getSheetByName('Отчёт по абитуриентам');
    if (!reportSheet) {
      reportSheet = ss.insertSheet('Отчёт по абитуриентам');
    } else {
      reportSheet.clear();
    }
    
    // Обработка данных и получение массива абитуриентов
    const students = processData(fullTimeSheet, partTimeSheet);
    
    // Проверка данных на корректность
    const hasIssues = validateResults(students);
    
    // Расчет статистики
    const stats = calculateStats(students);
    
    // Генерация отчёта
    generateReport(reportSheet, stats);
    
    // Уведомление пользователя
    const reportSheetName = reportSheet.getName();
    if (hasIssues) {
      SpreadsheetApp.getUi().alert(`Анализ завершён. Результаты доступны на листе "${reportSheetName}". Обнаружены потенциальные проблемы, проверьте лист "Лог".`);
    } else {
      SpreadsheetApp.getUi().alert(`Анализ завершён. Результаты доступны на листе "${reportSheetName}".`);
    }
    
  } catch (error) {
    console.error('Ошибка в процессе анализа:', error);
    Logger.log("Ошибка: %s\n%s", error.message, error.stack);
    SpreadsheetApp.getUi().alert('Произошла ошибка: ' + error.message + ". Подробности в логах.");
  }
} 