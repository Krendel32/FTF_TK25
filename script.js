/***** НАСТРОЙКИ *****/
const CONFIG = {
  // Первая неделя семестра (локальная дата, ПОНЕДЕЛЬНИК той недели)
  startOfSemester: { y: 2025, m: 9, d: 1 }, // 3 февраля 2025
  firstWeekType: "even", // "even" = чётная, "odd" = нечётная
};

/***** ГЛОБАЛЬНОЕ СОСТОЯНИЕ ДАТЫ ДЛЯ ТЕСТА *****/
let customDate = null; // если null — берём системную дату

function makeLocalDate(y, m, d) {
  // m — 1..12
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

function parseLocalDateFromInput(yyyy_mm_dd) {
  // "2025-09-10" -> локальная дата без UTC-сдвигов
  const [y, m, d] = yyyy_mm_dd.split("-").map(Number);
  return makeLocalDate(y, m, d);
}

function now() {
  // всегда возвращаем НОВЫЙ объект Date (чтобы не мутировать исходник)
  return customDate ? new Date(customDate.getTime()) : new Date();
}

/***** УТИЛИТЫ ДАТ *****/
function startOfMondayWeek(date) {
  // начало недели (понедельник 00:00:00 локально)
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const weekday = (d.getDay() + 6) % 7; // Mon=0..Sun=6
  d.setDate(d.getDate() - weekday);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekType(current = now()) {
  const semesterStart = makeLocalDate(
    CONFIG.startOfSemester.y,
    CONFIG.startOfSemester.m,
    CONFIG.startOfSemester.d
  );
  const w1 = startOfMondayWeek(semesterStart);
  const w2 = startOfMondayWeek(current);
  const diffWeeks = Math.trunc((w2 - w1) / (7 * 24 * 60 * 60 * 1000));

  // 0 недель разницы -> первая неделя семестра
  const sameAsFirst = diffWeeks % 2 === 0;
  if (sameAsFirst) return CONFIG.firstWeekType;
  return CONFIG.firstWeekType === "even" ? "odd" : "even";
}


function renderBreakIndicator(lessons, dt = now()) {
  const indicator = document.getElementById("break-indicator");
  if (!indicator) return;

  indicator.textContent = "";
  indicator.style.display = "none";

  if (!lessons || lessons.length === 0) return;

  const cur = dt.getHours() * 60 + dt.getMinutes();

  // Проверяем, не в паре ли мы (если да — индикатор не нужен)
  if (lessons.some(l => isActiveLesson(l, dt))) return;

  // Проверяем промежутки
  for (let i = 0; i < lessons.length - 1; i++) {
    const end = hmToMinutes(lessons[i].end);
    const startNext = hmToMinutes(lessons[i + 1].start);

    if (cur > end && cur < startNext) {
      indicator.textContent = `Сейчас перерыв (следующая пара в ${lessons[i + 1].start})`;
      indicator.style.display = "block";
      return;
    }
  }

  // Если прошли все пары
  const lastEnd = hmToMinutes(lessons[lessons.length - 1].end);
  if (cur > lastEnd) {
    indicator.textContent = "На сегодня пары закончились ✅";
    indicator.style.display = "block";
    return;
  }

  // Если ещё до первой пары
  const firstStart = hmToMinutes(lessons[0].start);
  if (cur < firstStart) {
    indicator.textContent = `До первой пары (${lessons[0].start})`;
    indicator.style.display = "block";
  }
}



function getDayName(date) {
  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  return days[date.getDay()];
}

function hmToMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/***** ПОДСВЕТКА ТЕКУЩЕЙ ПАРЫ *****/
function isActiveLesson(lesson, dt = now()) {
  const cur = dt.getHours() * 60 + dt.getMinutes();
  const start = hmToMinutes(lesson.start);
  const end = hmToMinutes(lesson.end);
  return cur >= start && cur <= end;
}

/***** РЕНДЕРЫ *****/
function renderToday() {
  const today = now();
  const weekType = getWeekType(today);
  const dayName = getDayName(today);

  const lessons = (schedule[weekType] && schedule[weekType][dayName]) || [];
  const container = document.getElementById("today-schedule");
  if (!container) return;

  if (lessons.length === 0) {
    container.innerHTML = "<p>Сегодня пар нет 🎉</p>";
    return;
  }

  container.innerHTML = "";
  lessons.forEach((lesson) => {
    const div = document.createElement("div");
    div.className = "lesson";
    div.innerHTML = `<strong>${lesson.subject}</strong><br>${lesson.start} - ${lesson.end}`;
    if (isActiveLesson(lesson, today)) div.classList.add("active");
    container.appendChild(div);
    renderBreakIndicator(lessons, today);
  });
}

function renderWeek(weekType, dt = now()) {
  const container = document.getElementById("week-schedule");
  if (!container) return;

  container.innerHTML = "";
  const daysRu = {
    monday: "Понедельник",
    tuesday: "Вторник",
    wednesday: "Среда",
    thursday: "Четверг",
    friday: "Пятница",
    saturday: "Суббота",
    sunday: "Воскресенье",
  };

  const todayName = getDayName(dt);

  for (let day in schedule[weekType]) {
    const dayDiv = document.createElement("div");
    dayDiv.innerHTML = `<h2>${daysRu[day]}</h2>`;

    schedule[weekType][day].forEach((lesson) => {
      const div = document.createElement("div");
      div.className = "lesson";
      div.innerHTML = `<strong>${lesson.subject}</strong><br>${lesson.start} - ${lesson.end}`;

      if (day === todayName && isActiveLesson(lesson, dt)) {
        div.classList.add("active");
      }
      dayDiv.appendChild(div);
    });

    container.appendChild(dayDiv);
  }

  // (опционально) показываем какой тип недели отрисован
  const badge = document.getElementById("week-type-badge");
  if (badge) {
    badge.textContent = weekType === "even" ? "Чётная неделя" : "Нечётная неделя";
  }
  
}

/***** ПРИМЕНЕНИЕ/СБРОС ТЕСТ-ДАТЫ *****/
function applyTestDateFromInput() {
  const inp = document.getElementById("test-date");
  if (!inp || !inp.value) return;

  // Парсим ЛОКАЛЬНО, без UTC-сдвига:
  customDate = parseLocalDateFromInput(inp.value);
  rerenderAll();
}

function resetTestDate() {
  customDate = null;
  const inp = document.getElementById("test-date");
  if (inp) inp.value = "";
  rerenderAll();
}

/***** ПЕРЕРИСОВКА *****/
function rerenderAll() {
  const dt = now();
  const wt = getWeekType(dt);

  // Обе страницы могут вызывать эти функции — просто отрисуется то, что есть
  renderToday();
  renderWeek(wt, dt);
}

/***** ИНИЦИАЛИЗАЦИЯ *****/
document.addEventListener("DOMContentLoaded", () => {
  // Первичная отрисовка
  rerenderAll();

  // Переключатель недели на week.html
  const switchBtn = document.getElementById("week-switch");
  if (switchBtn) {
    let current = getWeekType(now());
    switchBtn.addEventListener("click", () => {
      current = current === "even" ? "odd" : "even";
      renderWeek(current, now());
    });
  }

  // Кнопки тест-даты (если есть на странице)
  const applyBtn = document.getElementById("apply-test-date");
  if (applyBtn) {
    applyBtn.addEventListener("click", applyTestDateFromInput);
  }
  const resetBtn = document.getElementById("reset-test-date");
  if (resetBtn) {
    resetBtn.addEventListener("click", resetTestDate);
  }

  // Автообновление подсветки раз в минуту (использует текущую customDate, если задана)
  setInterval(() => rerenderAll(), 10 * 1000);
});