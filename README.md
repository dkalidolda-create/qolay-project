# Qolay — Умный мониторинг комфорта в атриуме NU

Full-stack сервис, который превращает поток сырых сообщений с датчиков (температура, освещение, шум) в понятный дашборд с 3D-визуализацией атриума. Помогает студентам и сотрудникам университета решить, подходит ли атриум прямо сейчас для учёбы, встречи или отдыха.

Разработано для **Code Girl Summer 2026 Hackathon** (NU Impact Foundation × ACM-W).

## 🔗 Ссылки

- **Frontend (демо):** https://qolay-project.vercel.app/
- **Backend (API):** https://qolay-project-production.up.railway.app
- **GitHub-репозиторий:** https://github.com/dkalidolda-create/qolay-project

## 🧱 Архитектура
qolay-project/
├── backend/              # FastAPI + SQLModel + SQLite
│   ├── app/
│   │   ├── main.py       # REST API эндпоинты
│   │   ├── models.py     # Модели Reading, Report
│   │   ├── comfort.py    # Формула Comfort Score
│   │   ├── database.py   # Подключение к SQLite
│   │   └── seed.py       # Импорт result.json в БД
│   ├── data/result.json  # Исходный экспорт Telegram-канала
│   └── requirements.txt
└── frontend/             # React + TypeScript + Vite
└── src/
├── pages/         # Dashboard, History, Analytics, Reports
├── components/    # 3D-сцена, Sidebar, ControlPanel, графики
├── api.ts         # HTTP-клиент к backend
├── comfort.ts     # Comfort Score на фронте (для Timeline)
└── theme.ts       # Цветовая палитра приложения

Frontend получает **все** данные через REST API — статичных/захардкоженных показаний в коде нет.

## 🗄 Схема базы данных

**Reading** (одно измерение датчика)
| Поле | Тип | Описание |
|---|---|---|
| id | int | первичный ключ |
| measured_at | datetime | время измерения |
| location | enum | `atrium` \| `outside` |
| temperature | float | температура, °C |
| brightness | string \| null | категория освещения (отсутствует для `outside`) |
| noise | string \| null | категория шума (отсутствует для `outside`) |

**Report** (отзыв пользователя об условиях)
| Поле | Тип | Описание |
|---|---|---|
| id | int | первичный ключ |
| created_at | datetime | время создания |
| category | enum | too_hot / too_noisy / too_bright / too_dark / comfortable / other |
| comment | string \| null | комментарий пользователя |
| status | enum | `open` \| `resolved` |

Данные из `result.json` парсятся из текста Telegram-сообщений (эмодзи-теги 🌡/💡/🔉) и сохраняются в SQLite через `seed.py` при первом запуске.

## 🌡 Формула Comfort Score

Собственный алгоритм, **не является официальной медицинской/санитарной рекомендацией** — это оценка удобства пространства для учёбы/отдыха, придуманная командой.

Стартуем со 100 баллов и вычитаем штрафы по трём независимым факторам:

**Температура** (комфортная зона — 20–24°C):
- 20–24°C → 0 (комфортно)
- 24–26°C → −10 («Жарко»)
- >26°C → −25 («Очень жарко»)
- 18–20°C → −10 («Прохладно»)
- <18°C → −25 («Очень холодно»)

**Шум:**
- Тихо → 0 · Немного шума → −5 · Шумно → −20 · Очень шумно → −30

**Освещение:**
- Темно → −15 · Приглушённо → −5 · Нормально → 0 · Ярко → −5 · Очень ярко → −15

`score = max(0, 100 + temp_penalty + noise_penalty + brightness_penalty)`

Итоговый текстовый лейбл: «Комфортно» при score ≥ 85, иначе — самый весомый штраф среди трёх факторов (например «Очень жарко»).

Разбивка по каждому фактору отображается на дашборде (`StatsRow`) — это осознанное решение для объяснимости алгоритма: пользователь и жюри видят не просто число, а из чего оно сложилось.

Формула продублирована на backend (`comfort.py`, Python) и на frontend (`comfort.ts`, TypeScript) — фронтенд использует её при выборе исторической точки на Timeline, чтобы не делать лишний запрос к серверу на каждый клик.

## 🔌 REST API

| Метод | Маршрут | Описание |
|---|---|---|
| GET | `/api/readings` | список измерений, фильтры: `location`, `date_from`, `date_to`, `noise`, `brightness`, `temp_min`, `temp_max`; сортировка: `sort_by` (`measured_at`\|`temperature`), `order` (`asc`\|`desc`) |
| GET | `/api/readings/{id}` | одно измерение по id |
| GET | `/api/summary` | текущее состояние + аналитика за день |
| GET | `/api/reports` | список отчётов, фильтры: `status`, `category` |
| POST | `/api/reports` | создать отчёт |
| PATCH | `/api/reports/{id}` | изменить отчёт |
| DELETE | `/api/reports/{id}` | удалить отчёт |

Все эндпоинты возвращают JSON, корректные HTTP-коды (404 при отсутствии записи, валидация входных данных через Pydantic-схемы).

## 🖥 Локальный запуск

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1        # Windows PowerShell
pip install -r requirements.txt
python -m app.seed                # импорт result.json в SQLite
uvicorn app.main:app --reload     # http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev                       # http://localhost:5173 (или другой свободный порт)
```

Frontend по умолчанию обращается к `http://localhost:8000`. Для работы с задеплоенным backend создай `frontend/.env`:
VITE_API_URL=https://qolay-project-production.up.railway.app

## ✅ Реализованные обязательные требования

- [x] Импорт `result.json` → SQLite через ORM (SQLModel)
- [x] Текущее состояние атриума + текстовая оценка комфорта
- [x] История измерений: фильтры (дата, место, шум) + сортировка (время, температура)
- [x] Аналитика: min/max/avg температура за день + собственный вывод (Comfort Score, самое прохладное время)
- [x] Полный CRUD отчётов пользователей
- [x] REST API по спецификации кейса
- [x] Frontend states: loading / error / empty / success
- [x] Адаптивный интерфейс
- [x] Деплой frontend (Vercel) + backend (Railway)

## ✨ Бонусные функции

- **Интерактивная 3D-модель атриума** (React Three Fiber) — 4 переключаемых режима визуализации: температура внутри/снаружи (анимированный поток частиц), освещение (интенсивность света), шум (анимированная волновая сетка)
- **Timeline-селектор** — просмотр архивных измерений с полной пересборкой 3D-сцены и Comfort Score под выбранный момент времени, плюс режим "Live"
- **Графики Recharts** — температура в атриуме/на улице по времени, разница индор/аутдор
- **Тёмная/светлая тема**
- **Glassmorphism-интерфейс**, анимации Framer Motion
- **Круговой Comfort Score индикатор** (0–100)

## 👥 Команда

- **Kalidolda Damilya** — backend, 3D-визуализация / дизайн
- **Tussupova Nazyly** — frontend
- **Gulnur Maksot** — презентация, исследование информации

## 🛠 Стек

React · TypeScript · Vite · Tailwind CSS · React Three Fiber (Three.js) · Framer Motion · React Router · Recharts — FastAPI · SQLModel · SQLite · Python
