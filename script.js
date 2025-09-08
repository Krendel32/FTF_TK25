function getWeekType() {
  const startOfSemester = new Date(2025, 1, 3); // например, 3 февраля 2025
  const now = new Date();
  const diffWeeks = Math.floor((now - startOfSemester) / (7 * 24 * 60 * 60 * 1000));
  return diffWeeks % 2 === 0 ? "even" : "odd";
}

function getDayName(date) {
  const days = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
  return days[date.getDay()];
}

function renderToday() {
  const today = new Date();
  const weekType = getWeekType();
  const dayName = getDayName(today);

  const lessons = schedule[weekType][dayName] || [];
  const container = document.getElementById("today-schedule");

  if (!container) return;

  if (lessons.length === 0) {
    container.innerHTML = "<p>Сегодня пар нет 🎉</p>";
    return;
  }

  container.innerHTML = "";
  lessons.forEach(lesson => {
    const div = document.createElement("div");
    div.className = "lesson";
    div.innerHTML = `<strong>${lesson.subject}</strong><br>${lesson.start} - ${lesson.end}`;

    // Подсветка текущей пары
    if (isActiveLesson(lesson)) {
      div.classList.add("active");
    }

    container.appendChild(div);
  });
}

function renderWeek(weekType) {
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
    sunday: "Воскресенье"
  };

  const today = new Date();
  const todayName = getDayName(today);

  for (let day in schedule[weekType]) {
    const dayDiv = document.createElement("div");
    dayDiv.innerHTML = `<h2>${daysRu[day]}</h2>`;

    schedule[weekType][day].forEach(lesson => {
      const div = document.createElement("div");
      div.className = "lesson";
      div.innerHTML = `<strong>${lesson.subject}</strong><br>${lesson.start} - ${lesson.end}`;

      // Подсветка только если это сегодня и пара активна
      if (day === todayName && isActiveLesson(lesson)) {
        div.classList.add("active");
      }

      dayDiv.appendChild(div);
    });

    container.appendChild(dayDiv);
  }
}

// 🔹 Вынес проверку в отдельную функцию
function isActiveLesson(lesson) {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const start = parseInt(lesson.start.split(":")[0]) * 60 + parseInt(lesson.start.split(":")[1]);
  const end = parseInt(lesson.end.split(":")[0]) * 60 + parseInt(lesson.end.split(":")[1]);
  return currentMinutes >= start && currentMinutes <= end;
}

document.addEventListener("DOMContentLoaded", () => {
  renderToday();
  renderWeek(getWeekType());

  const switchBtn = document.getElementById("week-switch");
  if (switchBtn) {
    let current = getWeekType();
    switchBtn.addEventListener("click", () => {
      current = current === "even" ? "odd" : "even";
      renderWeek(current);
    });
  }

  // 🔹 Автообновление подсветки каждую минуту
  setInterval(() => {
    renderToday();
    renderWeek(getWeekType());
  }, 60 * 1000);
});