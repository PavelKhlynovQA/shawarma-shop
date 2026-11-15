# 🌯 Шаурма-Мастер — учебный интернет-магазин

![CI](https://github.com/PavelKhlynovQA/shawarma-shop/actions/workflows/ci.yml/badge.svg)
![Node](https://img.shields.io/badge/node-%3E%3D24-brightgreen)
![Тесты](https://img.shields.io/badge/tests-98%20passed-success)
![Playwright](https://img.shields.io/badge/E2E-Playwright-2EAD33)

[![Confluence](https://img.shields.io/badge/Confluence-документация-0052CC?logo=confluence&logoColor=white)](https://boysporting.atlassian.net/wiki/spaces/QASHOP)
[![Jira](https://img.shields.io/badge/Jira-85%20тест--кейсов%20·%2010%20багов-0052CC?logo=jira&logoColor=white)](https://boysporting.atlassian.net/jira/software/projects/SCRUM)

Рабочий интернет-магазин шаурмы, созданный как **полигон для функционального и автоматизированного тестирования**. Серверная корзина через REST API, две ветки автотестов — Node.js и Java. Здесь есть реальный backend, база данных, UI, Docker, 63 автотеста и полный цикл QA-документации — от требований до руководства администратора.

> Проект специально сделан так, чтобы на нём было что тестировать: бизнес-правила, граничные значения, состояния заказа, права доступа и два дефекта, найденных автотестами (BUG-009, BUG-010).

---

## 📋 Где смотреть артефакты

| Артефакт | Ссылка | Что внутри |
|---|---|---|
| **Документация** | [Confluence · QA · Шаурма-Мастер](https://boysporting.atlassian.net/wiki/spaces/QASHOP) | 4 раздела, 23 страницы |
| **Все тест-кейсы** | [Фильтр «QA · Тест-кейсы»](https://boysporting.atlassian.net/issues/?filter=10001) | 66 кейсов, 232 шага |
| **Автотесты Java** | [Эпик «☕ Автотесты · Java»](https://boysporting.atlassian.net/browse/SCRUM-88) | 3 класса, 19 тест-кейсов |
| **API-тест-кейсы** | [Фильтр «QA · API-тесты»](https://boysporting.atlassian.net/issues/?filter=10003) | 27 кейсов с JSON запросов и ответов |
| **UI-тест-кейсы** | [Фильтр «QA · UI-тесты»](https://boysporting.atlassian.net/issues/?filter=10004) | 18 кейсов со скриншотами |
| **БД-тест-кейсы** | [Фильтр «QA · БД-тесты»](https://boysporting.atlassian.net/issues/?filter=10005) | 8 SQL-проверок |
| **Баг-репорты** | [Фильтр «QA · Баг-репорты»](https://boysporting.atlassian.net/issues/?filter=10002) | 10 дефектов |
| **Автотесты** | [`tests/`](tests/) | 23 API + 35 E2E + 5 визуальных |
| **Результаты прогонов** | [Actions](https://github.com/PavelKhlynovQA/shawarma-shop/actions) | Allure и Playwright-отчёты |
| **Исходники документации** | [`qa-docs/`](qa-docs/) | Генераторы и данные страниц |

![Confluence](docs/screenshots/confluence-space.png)

> 🔒 Confluence и Jira приватные — доступ по приглашению. Скриншоты ключевых экранов: [`docs/screenshots/`](docs/screenshots/).

---

## 🗂 Как устроены артефакты

**Принцип: один источник правды на каждый тип артефакта.**

| Тип | Где живёт | Почему |
|---|---|---|
| Тест-кейсы и баги | **Jira** | У них есть статус, исполнитель, история и связи — их *исполняют* |
| Требования, проектирование | **Confluence** | Их *читают* и согласовывают |
| Стратегия, план, отчёты, руководства | **Confluence** | Документы для команды |
| Код и автотесты | **GitHub** | Версионирование и CI |

Страницы «Тест-кейсы» и «Баг-репорты» в Confluence — это **индексы со ссылками** на задачи Jira. Дублей нет, навигация сохранена.

### Структура Confluence

```
QA · Шаурма-Мастер
├── 1. Требования          (5 страниц)  постановка, FR, NFR, истории, ТЗ
├── 2. Проектирование      (4 страницы) архитектура, схема БД, API, макеты
├── 3. Тестирование       (10 страниц) стратегия, план, кейсы, чек-листы, баги, отчёт
└── 4. Эксплуатация        (4 страницы) развёртывание, руководства, changelog
```

### Структура Jira

```
Shawarma Project (SCRUM)
├── ☕ Автотесты · Java          SCRUM-88  → 3 класса, 19 тест-кейсов
├── 📁 Тест-кейсы API (27)       SCRUM-72  → TC-API-01…27
├── 📁 Тест-кейсы UI (18)        SCRUM-73  → TC-SHOP, TC-CART, TC-AUTH, TC-ORDER, TC-PAY, TC-ADMIN
├── 📁 Тест-кейсы БД (8)         SCRUM-74  → TC-DB-01…08
├── 🐞 Баг-репорты (10)          SCRUM-71  → BUG-001…010
└── QA: Шаурма-Мастер …          SCRUM-6   → эпик-зонтик
```

Каждый тест-кейс содержит: предусловия, **пошаговые ожидаемые результаты**, эндпоинт с телом запроса и ответом (для API), ссылку на автотест и, где полезно, скриншот.

---

## 🎬 Презентация проекта

Восемь слайдов 1920×1080 о проекте и процессе тестирования: архитектура, артефакты, подход, кейсы, автотесты, нагрузка, итоги.

<table>
  <tr>
    <td width="50%" align="center"><a href="presentation/project-1-1920.png"><img src="presentation/project-1-1920.png" alt="Титул: ключевые цифры проекта" width="100%"></a><br><sub>Титул: ключевые цифры проекта</sub></td>
    <td width="50%" align="center"><a href="presentation/project-2-1920.png"><img src="presentation/project-2-1920.png" alt="Архитектура приложения" width="100%"></a><br><sub>Архитектура приложения</sub></td>
  </tr>
  <tr>
    <td width="50%" align="center"><a href="presentation/project-3-1920.png"><img src="presentation/project-3-1920.png" alt="Архитектура тестовых артефактов" width="100%"></a><br><sub>Архитектура тестовых артефактов</sub></td>
    <td width="50%" align="center"><a href="presentation/project-4-1920.png"><img src="presentation/project-4-1920.png" alt="Подход к тестированию" width="100%"></a><br><sub>Подход к тестированию</sub></td>
  </tr>
  <tr>
    <td width="50%" align="center"><a href="presentation/project-5-1920.png"><img src="presentation/project-5-1920.png" alt="Тест-кейсы по модулям" width="100%"></a><br><sub>Тест-кейсы по модулям</sub></td>
    <td width="50%" align="center"><a href="presentation/project-6-1920.png"><img src="presentation/project-6-1920.png" alt="Автотесты: две ветки" width="100%"></a><br><sub>Автотесты: две ветки</sub></td>
  </tr>
  <tr>
    <td width="50%" align="center"><a href="presentation/project-7-1920.png"><img src="presentation/project-7-1920.png" alt="Нагрузочное тестирование" width="100%"></a><br><sub>Нагрузочное тестирование</sub></td>
    <td width="50%" align="center"><a href="presentation/project-8-1920.png"><img src="presentation/project-8-1920.png" alt="Дефекты и итоги" width="100%"></a><br><sub>Дефекты и итоги</sub></td>
  </tr>
</table>

**Коротко в цифрах:** 85 тест-кейсов · 98 автотестов · 10 баг-репортов · 990 запрос/с при p95 22 мс и 0% ошибок.

Файлы в полном размере — в каталоге [`presentation/`](presentation/).
## 📚 Каталог тест-кейсов

Все кейсы живут в Jira — здесь каталог со ссылками. Полные шаги, ожидаемые результаты и сетевые проверки открываются по ссылке в колонке Jira.

### Витрина

| ID | Что проверяет | Приоритет | Jira |
|---|---|---|---|
| TC-SHOP-001 | Главная страница отображается с шапкой и счётчиком пустой корзины при открытии витрины | High | [SCRUM-7](https://boysporting.atlassian.net/browse/SCRUM-7) |
| TC-SHOP-002 | Hero-блок отображает заголовок и три ключевых показателя при открытии главной страницы | Medium | [SCRUM-75](https://boysporting.atlassian.net/browse/SCRUM-75) |
| TC-SHOP-003 | Панель вкладок отображает пункт «Всё меню» и по одной вкладке на каждую активную категорию | High | [SCRUM-76](https://boysporting.atlassian.net/browse/SCRUM-76) |
| TC-SHOP-004 | Карточка товара в сетке содержит изображение, название, вес, цену и кнопку «В корзину» | High | [SCRUM-77](https://boysporting.atlassian.net/browse/SCRUM-77) |
| TC-SHOP-005 | Сетка отображает только доступные товары, число карточек совпадает с БД | High | [SCRUM-78](https://boysporting.atlassian.net/browse/SCRUM-78) |
| TC-SHOP-T01 | Загрузка витрины не вызывает ошибок JavaScript в консоли браузера | Medium | [SCRUM-79](https://boysporting.atlassian.net/browse/SCRUM-79) |
| TC-SHOP-T02 | Изображения всех карточек загружаются со статусом 200 | High | [SCRUM-80](https://boysporting.atlassian.net/browse/SCRUM-80) |
| TC-SHOP-T03 | Запрос меню возвращает контракт с категориями и полями товара | High | [SCRUM-81](https://boysporting.atlassian.net/browse/SCRUM-81) |
| TC-SHOP-006 | Вкладка категории оставляет в сетке только товары этой категории | High | [SCRUM-8](https://boysporting.atlassian.net/browse/SCRUM-8) |
| TC-SHOP-007 | Карточка острого товара отображает маркер остроты при isSpicy = true | Medium | [SCRUM-9](https://boysporting.atlassian.net/browse/SCRUM-9) |

### Корзина

| ID | Что проверяет | Приоритет | Jira |
|---|---|---|---|
| TC-CART-001 | Счётчик корзины увеличивается на 1 при добавлении товара из карточки | High | [SCRUM-10](https://boysporting.atlassian.net/browse/SCRUM-10) |
| TC-CART-002 | Повторное добавление того же товара увеличивает количество в одной строке корзины | Medium | [SCRUM-12](https://boysporting.atlassian.net/browse/SCRUM-12) |
| TC-CART-003 | Стоимость позиции с дополнителями равна сумме цены товара и дополнителей, умноженной на количество | High | [SCRUM-11](https://boysporting.atlassian.net/browse/SCRUM-11) |
| TC-CART-004 | Позиция удаляется из корзины при уменьшении количества до нуля | Medium | [SCRUM-13](https://boysporting.atlassian.net/browse/SCRUM-13) |
| TC-CART-005 | Корзина сохраняет состав после перезагрузки страницы | Low | [SCRUM-14](https://boysporting.atlassian.net/browse/SCRUM-14) |
| TC-CART-006 | Пустая корзина отображает сообщение и скрывает кнопку оформления заказа | Medium | [SCRUM-82](https://boysporting.atlassian.net/browse/SCRUM-82) |

### Авторизация

| ID | Что проверяет | Приоритет | Jira |
|---|---|---|---|
| TC-AUTH-001 | Вход по номеру телефона выполняется после ввода верного кода из SMS | High | [SCRUM-15](https://boysporting.atlassian.net/browse/SCRUM-15) |
| TC-AUTH-002 | Вход не выполняется при вводе неверного кода подтверждения | High | [SCRUM-16](https://boysporting.atlassian.net/browse/SCRUM-16) |
| TC-AUTH-003 | Запрос кода не отправляется при вводе номера короче 10 цифр | Medium | [SCRUM-83](https://boysporting.atlassian.net/browse/SCRUM-83) |

### Оформление заказа

| ID | Что проверяет | Приоритет | Jira |
|---|---|---|---|
| TC-ORDER-001 | Заказ создаётся и получает номер при заполнении обязательных полей самовывоза | High | [SCRUM-84](https://boysporting.atlassian.net/browse/SCRUM-84) |
| TC-ORDER-002 | Заказ не создаётся при вводе телефона в недопустимом формате | High | [SCRUM-17](https://boysporting.atlassian.net/browse/SCRUM-17) |
| TC-ORDER-003 | Заказ с доставкой не создаётся при сумме ниже минимальной | High | [SCRUM-18](https://boysporting.atlassian.net/browse/SCRUM-18) |

### Оплата

| ID | Что проверяет | Приоритет | Jira |
|---|---|---|---|
| TC-PAY-001 | Оплата заказа картой переводит заказ в статус PAID при валидных данных карты | High | [SCRUM-19](https://boysporting.atlassian.net/browse/SCRUM-19) |
| TC-PAY-002 | Заказ остаётся неоплаченным при отказе банка | High | [SCRUM-20](https://boysporting.atlassian.net/browse/SCRUM-20) |

### Уведомления

| ID | Что проверяет | Приоритет | Jira |
|---|---|---|---|
| TC-NOTIF-001 | Уведомление о готовности появляется при смене статуса заказа на «В доставке» | High | [SCRUM-21](https://boysporting.atlassian.net/browse/SCRUM-21) |

### Администрирование

| ID | Что проверяет | Приоритет | Jira |
|---|---|---|---|
| TC-ADMIN-001 | Администратор входит в панель управления при вводе верных учётных данных | High | [SCRUM-22](https://boysporting.atlassian.net/browse/SCRUM-22) |
| TC-ADMIN-002 | Вход в панель управления не выполняется при неверном пароле | High | [SCRUM-85](https://boysporting.atlassian.net/browse/SCRUM-85) |
| TC-ADMIN-003 | Панель управления отображает карточки статистики с числовыми значениями после входа | Medium | [SCRUM-86](https://boysporting.atlassian.net/browse/SCRUM-86) |
| TC-ADMIN-004 | Статус заказа меняется на «Подтверждён» при нажатии соответствующей кнопки | High | [SCRUM-23](https://boysporting.atlassian.net/browse/SCRUM-23) |
| TC-ADMIN-005 | Недопустимый переход статуса отклоняется сервером с кодом 409 | Medium | [SCRUM-87](https://boysporting.atlassian.net/browse/SCRUM-87) |
| TC-ADMIN-006 | Скрытый товар исчезает из витрины при нажатии «Скрыть» в панели управления | Medium | [SCRUM-24](https://boysporting.atlassian.net/browse/SCRUM-24) |

### API

| ID | Что проверяет | Требование | Jira |
|---|---|---|---|
| TC-API-01 | Проверка работоспособности сервиса | NFR-04 | [SCRUM-25](https://boysporting.atlassian.net/browse/SCRUM-25) |
| TC-API-02 | Получение меню с категориями | FR-01 | [SCRUM-26](https://boysporting.atlassian.net/browse/SCRUM-26) |
| TC-API-03 | Запрос несуществующего товара | FR-01 | [SCRUM-27](https://boysporting.atlassian.net/browse/SCRUM-27) |
| TC-API-04 | Успешный вход администратора | FR-14 | [SCRUM-28](https://boysporting.atlassian.net/browse/SCRUM-28) |
| TC-API-05 | Вход с неверным паролем | FR-14 | [SCRUM-29](https://boysporting.atlassian.net/browse/SCRUM-29) |
| TC-API-06 | Регистрация с невалидным email | FR-14 | [SCRUM-30](https://boysporting.atlassian.net/browse/SCRUM-30) |
| TC-API-07 | Повторная регистрация на занятый email | FR-14 | [SCRUM-31](https://boysporting.atlassian.net/browse/SCRUM-31) |
| TC-API-08 | Создание заказа с расчётом скидки | FR-06, FR-08 | [SCRUM-32](https://boysporting.atlassian.net/browse/SCRUM-32) |
| TC-API-09 | Заказ с доставкой ниже минимальной суммы | FR-07 | [SCRUM-33](https://boysporting.atlassian.net/browse/SCRUM-33) |
| TC-API-10 | Самовывоз без минимальной суммы | FR-07 | [SCRUM-34](https://boysporting.atlassian.net/browse/SCRUM-34) |
| TC-API-11 | Создание заказа с пустой корзиной | FR-06 | [SCRUM-35](https://boysporting.atlassian.net/browse/SCRUM-35) |
| TC-API-12 | Некорректный телефон в заказе | FR-06 | [SCRUM-36](https://boysporting.atlassian.net/browse/SCRUM-36) |
| TC-API-13 | Несуществующий товар в заказе | FR-06 | [SCRUM-37](https://boysporting.atlassian.net/browse/SCRUM-37) |
| TC-API-14 | Прослеживание заказа по номеру | FR-10 | [SCRUM-38](https://boysporting.atlassian.net/browse/SCRUM-38) |
| TC-API-15 | Запрос несуществующего заказа | FR-10 | [SCRUM-39](https://boysporting.atlassian.net/browse/SCRUM-39) |
| TC-API-16 | Просроченный промокод | FR-08 | [SCRUM-40](https://boysporting.atlassian.net/browse/SCRUM-40) |
| TC-API-17 | Неактивный промокод | FR-08 | [SCRUM-41](https://boysporting.atlassian.net/browse/SCRUM-41) |
| TC-API-18 | Успешная оплата заказа | FR-09 | [SCRUM-42](https://boysporting.atlassian.net/browse/SCRUM-42) |
| TC-API-19 | Отказ банка при оплате | FR-09 | [SCRUM-43](https://boysporting.atlassian.net/browse/SCRUM-43) |
| TC-API-20 | Повторная оплата оплаченного заказа | FR-09 | [SCRUM-44](https://boysporting.atlassian.net/browse/SCRUM-44) |
| TC-API-21 | Доступ к админ-API без токена | FR-14 | [SCRUM-45](https://boysporting.atlassian.net/browse/SCRUM-45) |
| TC-API-22 | Доступ с токеном покупателя | FR-14 | [SCRUM-46](https://boysporting.atlassian.net/browse/SCRUM-46) |
| TC-API-23 | Допустимый переход статуса | FR-12 | [SCRUM-47](https://boysporting.atlassian.net/browse/SCRUM-47) |
| TC-API-24 | Недопустимый переход статуса | FR-12 | [SCRUM-48](https://boysporting.atlassian.net/browse/SCRUM-48) |
| TC-API-25 | Статистика продаж | FR-12 | [SCRUM-49](https://boysporting.atlassian.net/browse/SCRUM-49) |
| TC-API-26 | Неизвестный маршрут | NFR-03 | [SCRUM-50](https://boysporting.atlassian.net/browse/SCRUM-50) |
| TC-API-27 | Запрос кода на некорректный телефон | FR-05 | [SCRUM-51](https://boysporting.atlassian.net/browse/SCRUM-51) |

### База данных

| ID | Что проверяет | Требование | Jira |
|---|---|---|---|
| TC-DB-01 | Создание всех таблиц при старте | FR-01 | [SCRUM-52](https://boysporting.atlassian.net/browse/SCRUM-52) |
| TC-DB-02 | Сумма заказа совпадает с суммой позиций | FR-06 | [SCRUM-53](https://boysporting.atlassian.net/browse/SCRUM-53) |
| TC-DB-03 | Итог заказа равен subtotal минус скидка | FR-06 | [SCRUM-54](https://boysporting.atlassian.net/browse/SCRUM-54) |
| TC-DB-04 | Статус заказа совпадает с последней записью истории | FR-12 | [SCRUM-55](https://boysporting.atlassian.net/browse/SCRUM-55) |
| TC-DB-05 | Счётчик использований промокода увеличивается | FR-08 | [SCRUM-56](https://boysporting.atlassian.net/browse/SCRUM-56) |
| TC-DB-06 | Результат оплаты сохраняется в заказе | FR-09 | [SCRUM-57](https://boysporting.atlassian.net/browse/SCRUM-57) |
| TC-DB-07 | Одноразовый код помечается использованным | FR-05 | [SCRUM-58](https://boysporting.atlassian.net/browse/SCRUM-58) |
| TC-DB-08 | Мягкое удаление товара сохраняет историю | FR-13 | [SCRUM-59](https://boysporting.atlassian.net/browse/SCRUM-59) |

### Автотесты на Java

| ID | Проверка | Класс | Jira |
|---|---|---|---|
| TC-AUTO-C01 | GET /api/cart создаёт пустую корзину для нового клиента | `CartApiTest` | [SCRUM-92](https://boysporting.atlassian.net/browse/SCRUM-92) |
| TC-AUTO-C02 | POST /api/cart/items добавляет товар и считает сумму | `CartApiTest` | [SCRUM-93](https://boysporting.atlassian.net/browse/SCRUM-93) |
| TC-AUTO-C03 | Повторное добавление товара увеличивает количество в одной позиции | `CartApiTest` | [SCRUM-94](https://boysporting.atlassian.net/browse/SCRUM-94) |
| TC-AUTO-C04 | Разный набор дополнителей создаёт отдельные позиции корзины | `CartApiTest` | [SCRUM-95](https://boysporting.atlassian.net/browse/SCRUM-95) |
| TC-AUTO-C05 | Стоимость позиции учитывает цены дополнительных ингредиентов | `CartApiTest` | [SCRUM-96](https://boysporting.atlassian.net/browse/SCRUM-96) |
| TC-AUTO-C06 | Нулевое количество отклоняется с ошибкой валидации | `CartApiTest` | [SCRUM-97](https://boysporting.atlassian.net/browse/SCRUM-97) |
| TC-AUTO-C07 | Несуществующий товар возвращает 404 | `CartApiTest` | [SCRUM-98](https://boysporting.atlassian.net/browse/SCRUM-98) |
| TC-AUTO-C08 | PATCH меняет количество, значение 0 удаляет позицию | `CartApiTest` | [SCRUM-99](https://boysporting.atlassian.net/browse/SCRUM-99) |
| TC-AUTO-O01 | POST /api/orders создаёт заказ и возвращает номер | `OrdersApiTest` | [SCRUM-100](https://boysporting.atlassian.net/browse/SCRUM-100) |
| TC-AUTO-O02 | Заказ с доставкой ниже минимальной суммы отклоняется | `OrdersApiTest` | [SCRUM-101](https://boysporting.atlassian.net/browse/SCRUM-101) |
| TC-AUTO-O03 | Некорректный телефон отклоняется с указанием поля | `OrdersApiTest` | [SCRUM-102](https://boysporting.atlassian.net/browse/SCRUM-102) |
| TC-AUTO-O04 | Админский метод без токена возвращает 401 | `OrdersApiTest` | [SCRUM-103](https://boysporting.atlassian.net/browse/SCRUM-103) |
| TC-AUTO-O05 | Созданный заказ доступен по публичному номеру | `OrdersApiTest` | [SCRUM-104](https://boysporting.atlassian.net/browse/SCRUM-104) |
| TC-AUTO-U01 | Главная страница открывается и содержит каталог | `StorefrontUiTest` | [SCRUM-105](https://boysporting.atlassian.net/browse/SCRUM-105) |
| TC-AUTO-U02 | Кнопка «В корзину» открывает модальное окно товара | `StorefrontUiTest` | [SCRUM-106](https://boysporting.atlassian.net/browse/SCRUM-106) |
| TC-AUTO-U03 | Счётчик корзины увеличивается до 1 после добавления | `StorefrontUiTest` | — |
| TC-AUTO-U04 | Вкладка «Напитки» оставляет только 4 карточки | `StorefrontUiTest` | — |
| TC-AUTO-U05 | Возврат на «Всё меню» показывает все 18 карточек | `StorefrontUiTest` | — |
| TC-AUTO-U06 | Пустая корзина показывает сообщение и скрывает оформление | `StorefrontUiTest` | — |

---

## 🛠 Стек

| Слой | Технология |
|---|---|
| Backend | Node.js 24+, Express 4 |
| БД (Docker) | PostgreSQL 16 |
| БД (локально) | SQLite (встроенный `node:sqlite`) |
| Frontend | Vanilla JS + CSS, без сборки |
| Аутентификация | JWT (HS256) на встроенном `crypto`, вход по телефону (OTP) |
| Тесты (Node.js) | `node:test` + `fetch`, Playwright, визуальная регрессия |
| **Тесты (Java)** | **Java 21 LTS**, **Maven 3.9**, JUnit 5, REST Assured, Selenium 4, AssertJ |
| Документация | Confluence Storage Format, генераторы на Node.js |
| Инфраструктура | Docker, Docker Compose, GitHub Actions |

**Зависимостей в рантайме всего две: `express` и `pg`.** Всё остальное — стандартная библиотека Node.

### Версии Java-инструментов

| Компонент | Версия |
|---|---|
| JDK | 21 LTS (сборка под `release 17`) |
| Maven | 3.9.9 |
| JUnit 5 | 5.10.2 |
| REST Assured | 5.4.0 |
| Selenium | 4.20.0 + ChromeDriver 157 |
| AssertJ | 3.25.3 |
| Surefire | 3.2.5 |

### Альтернативы инструментов

| Задача | В проекте | Возможные альтернативы |
|---|---|---|
| Сборка | Maven | Gradle, Ant |
| Тест-раннер | JUnit 5 | TestNG, Spock |
| API-тесты | REST Assured | Karate DSL, Apache HttpClient + JSONassert, OkHttp |
| UI-тесты | Selenium 4 | Selenide, Playwright Java, Cypress, Serenity + Cucumber |
| Проверки | AssertJ | Hamcrest, JUnit assertions, Google Truth |
| Моки и стабы | не используются | WireMock, Mockito, Testcontainers |
| Проверки БД | SQL-запросы вручную | JDBC + Testcontainers, DbUnit |
| Отчёты | Surefire XML | Allure, ExtentReports |
| CI | GitHub Actions (Node.js) | отдельный job `mvn test` |

---

## 🚀 Быстрый старт

### Вариант 1 — без Docker

```bash
npm install
npm start
```

Открой http://localhost:3000 — база создастся и наполнится автоматически (SQLite в `./data`).

### Вариант 2 — Docker + PostgreSQL

```bash
docker compose up --build -d
```

Подключение из **DBeaver**: `localhost:5432`, база/пользователь/пароль — `shawarma`.

### Вариант 3 — PostgreSQL локально

```bash
DATABASE_URL=postgres://shawarma:shawarma@localhost:5432/shawarma npm start
```

---

## 🔑 Тестовые данные

| Роль | Логин | Пароль |
|---|---|---|
| Администратор | `admin@shawarma.ru` | `Admin123!` |
| Покупатель | `customer@test.ru` | `Test123!` |
| Вход по телефону | любой номер из 10–15 цифр | код показывается на экране (демо) |

**Промокоды:** `SHAWARMA10` (10%), `FIRSTORDER` (15%) — активны; `SUMMER20` — неактивен; `EXPIRED5` — просрочен.

**Тестовые карты:** `4111 1111 1111 1111` — успех; `0000 1111 2222 3333` — отказ банка (402).

---

## 📁 Структура репозитория

```
shawarma-shop/
├── src/                        backend
│   ├── server.js               схема + миграции + сиды + listen
│   ├── app.js                  сборка express-приложения
│   ├── db/                     адаптер PostgreSQL/SQLite, схема, миграции, сиды
│   ├── lib/                    jwt, пароли, валидация, ошибки
│   ├── middleware/             логирование, auth, обработка ошибок
│   └── routes/                 health, menu, auth, promo, orders, cart, admin
├── public/                     витрина и админка (vanilla JS)
├── tests/                      автотесты на Node.js — 79 тестов
│   ├── api.test.js             23 API-теста
│   ├── cart.test.js            16 тестов API корзины
│   ├── e2e/
│   │   ├── pages/              6 Page Object классов
│   │   └── *.spec.js           35 E2E-сценариев
│   └── visual/                 5 визуальных снапшотов
├── java-tests/                 автотесты на Java — 19 тестов
│   ├── pom.xml                 Maven: JUnit 5, REST Assured, Selenium, AssertJ
│   ├── README.md               запуск, локаторы, параметры
│   └── src/test/java/com/shawarma/
│       ├── api/CartApiTest.java        8 тестов API корзины
│       ├── api/OrdersApiTest.java      5 тестов API заказов
│       └── ui/StorefrontUiTest.java    6 UI-тестов на Selenium
├── load/                       нагрузочное тестирование — JMeter
│   ├── plan.jmx                план: 21 виртуальный пользователь, 60 с
│   ├── metrics.json            метрики прогона: RPS, перцентили, ошибки
│   ├── presentation/           7 слайдов с результатами нагрузки
│   └── README.md               профиль нагрузки и инструкция запуска
├── presentation/               8 слайдов о проекте и процессе тестирования
├── handover/                   пакет для передачи проекта на ревью
├── qa-docs/
│   ├── content/                данные документации (единый источник)
│   ├── build.mjs               сайт + Confluence-страницы + CSV
│   ├── build-package.mjs       полный пакет из 4 разделов
│   ├── publish-*.mjs           публикация в Confluence и Jira
│   └── pkg/                    24 готовых HTML-страницы
├── docs/                       QA-документация и скриншоты
├── .github/workflows/ci.yml    4 job'а CI
└── docker-compose.yml
```

---

## 🔌 API

Единый формат ошибок:

```json
{ "error": { "code": "MIN_ORDER_AMOUNT", "message": "Минимальная сумма заказа с доставкой — 500 руб.", "details": null } }
```

| Метод | Путь | Доступ | Назначение |
|---|---|---|---|
| GET | `/api/health` | — | работоспособность и драйвер БД |
| GET | `/api/menu` | — | Категории с товарами |
| GET | `/api/products/:id` | — | Товар по id |
| GET | `/api/extras` | — | Дополнители |
| POST | `/api/auth/register` | — | Регистрация |
| POST | `/api/auth/login` | — | Вход по email |
| GET | `/api/auth/me` | Bearer | Текущий пользователь |
| POST | `/api/auth/phone/request-code` | — | Код на телефон |
| POST | `/api/auth/phone/verify` | — | Вход по коду |
| POST | `/api/promo/validate` | — | Проверка промокода |
| GET | `/api/cart` | опц. | Получить корзину |
| POST | `/api/cart/items` | опц. | Добавить товар в корзину |
| PATCH | `/api/cart/items/:id` | опц. | Изменить количество |
| DELETE | `/api/cart/items/:id` | опц. | Удалить позицию |
| DELETE | `/api/cart` | опц. | Очистить корзину |
| POST | `/api/orders` | опц. | Создание заказа |
| POST | `/api/orders/:publicId/pay` | опц. | Оплата картой |
| GET | `/api/orders` | Bearer | Мои заказы |
| GET | `/api/orders/:publicId` | — | Заказ по номеру |
| GET | `/api/orders/:publicId/history` | — | История статусов |
| GET | `/api/admin/orders` | admin | Очередь заказов |
| PATCH | `/api/admin/orders/:id/status` | admin | Смена статуса |
| GET | `/api/admin/stats` | admin | Статистика |
| GET/POST/PATCH/DELETE | `/api/admin/products` | admin | Управление меню |

Полная спецификация — [openapi.yaml](openapi.yaml), коллекция — `postman/`.

---

## 📏 Бизнес-правила

1. Минимальная сумма заказа **с доставкой** — 500 ₽; для самовывоза минимума нет.
2. Скидка считается от суммы товаров, округление вниз.
3. Статусы: `NEW → CONFIRMED → COOKING → DELIVERING → DONE`; отмена из любого, кроме финальных.
4. Один товар с разным набором допов — разные позиции корзины.
5. Скрытый товар (`is_available = 0`) заказать нельзя.
6. Код входа живёт 5 минут, максимум 5 попыток.
7. Повторная оплата заказа запрещена (409 `ALREADY_PAID`).

---

## ✅ Автотесты — 98 штук

| Уровень | Кол-во | Время | Команда |
|---|---|---|---|
| API на Node.js (`node:test`) | 39 | ~3 с | `npm test` |
| E2E (Playwright) | 35 | ~52 с | `npm run test:e2e` |
| Визуальные | 5 | ~7 с | `npm run test:visual` |
| **Java** (JUnit 5 + REST Assured + Selenium) | **19** | ~22 с | `mvn test` в `java-tests/` |

Две независимые ветки автотестов: Node.js и Java.

### API-тесты

```bash
npm test                  # все API-тесты
npm run test:api          # только файл API
npm run test:smoke        # только smoke
npm run test:no-isolation # если среда не даёт запускать дочерние процессы
```

### E2E-тесты

```bash
npx playwright install chromium
npm run test:e2e          # 35 сценариев
npm run test:e2e:headed   # с видимым браузером
npm run test:e2e:ui       # интерактивный режим
npm run report            # HTML-отчёт
```

Построены на **Page Object Model**: `StorefrontPage`, `ProductModal`, `CartDrawer`, `CheckoutModal`, `AdminPage`, `AuthModal`. Селекторов в тестах нет.

### Сквозной сценарий покупателя

```bash
npm run test:journey      # 5 тестов: вход → корзина → оплата → уведомление
npm run demo:journey      # видимый браузер + скриншоты
```

### Визуальная регрессия

```bash
npm run test:visual         # сравнить с эталонами
npm run test:visual:update  # перегенерировать эталоны
```

### Отчёт Allure

```bash
npm run test:e2e && npm run allure:generate && npm run allure:open
```

---

## ☕ Java-автотесты

Отдельный Maven-проект в каталоге [`java-tests/`](java-tests/): **19 тестов** на JUnit 5, REST Assured и Selenium 4.

| Класс | Что проверяет | Тестов |
|---|---|---|
| `CartApiTest` | API корзины: создание, добавление, слияние, допы, границы, изменение | 8 |
| `OrdersApiTest` | API заказов: создание, минимальная сумма, валидация, права | 5 |
| `StorefrontUiTest` | UI витрины через Selenium: модалка, счётчик, фильтр категорий | 6 |

```bash
cd java-tests
mvn test                                  # все 19
mvn test -Dtest=CartApiTest               # только API корзины
mvn test -Dtest=StorefrontUiTest          # только UI
```

Кнопки ищутся **XPath-локаторами по видимому тексту**:

```java
By ADD_TO_CART_BUTTON = By.xpath("//button[normalize-space()='В корзину']");
By TAB_DRINKS = By.xpath("//button[normalize-space()='Напитки']");
```

Требования: JDK 17+, Maven 3.9+, Chrome для UI-тестов.

## ⚡ Нагрузочное тестирование

Профиль для Apache JMeter 5.6.3 в каталоге [`load/`](load/): 21 виртуальный пользователь, 60 секунд, профиль «каталог → корзина → заказ».

| Метрика | Значение |
|---|---|
| Пропускная способность | **990 запросов/с** |
| Всего запросов | 69 205 |
| Среднее время отклика | 17 мс |
| 95-й перцентиль | 29 мс |
| 99-й перцентиль | 126 мс |
| Доля ошибок | 0% |

По эндпоинтам:

| Эндпоинт | Запросов | Среднее | p95 | Максимум |
|---|---|---|---|---|
| `GET /api/menu` | 32 261 | 15 мс | 19 мс | 82 мс |
| `GET /api/products/1` | 32 253 | 10 мс | 13 мс | 68 мс |
| `GET /api/cart` | 1 660 | 79 мс | 118 мс | 220 мс |
| `POST /api/cart/items` | 1 658 | 95 мс | 141 мс | 247 мс |
| `POST /api/orders` | 1 373 | 44 мс | 68 мс | 117 мс |

### Почему возникают всплески задержек

Чтение стабильно: 10–15 мс среднего и 19 мс по 95-му перцентилю. Запись медленнее и заметно разбросана: среднее 79–95 мс, максимум 247 мс. Причина не в сети — узкие места в коде и конфигурации БД, и это видно при сравнении двух прогонов.

| Причина | Где проявляется | Механизм |
|---|---|---|
| **N+1 запросов в корзине** | `POST /api/cart/items`, `GET /api/cart` | `loadCart` отдельно запрашивает каждую позицию, затем каждый дополнитель: 3–7 запросов вместо одного JOIN |
| **Пул из 10 соединений** | Все POST-эндпоинты | 21 виртуальный пользователь конкурирует за 10 соединений; при всплеске запросы ждут в очереди пула, ожидание попадает в метрику |
| **Отсутствие транзакции в заказе** | `POST /api/orders` | Каждый `INSERT` — отдельный round-trip к БД, соединение удерживается дольше обычного |
| **Однопоточный Node.js** | Под пиком | Сериализация JSON и SQL-вызовы делят один event loop, тяжёлые ответы тормозят остальные запросы |
| **Нет кэша меню** | `GET /api/menu` | 33 109 запросов = столько же SELECT с JOIN к трём таблицам; данные меняются редко, но читаются каждый раз |
| **Замер с той же машины** | Все метрики | JMeter, Node.js и PostgreSQL делили CPU и диск — часть задержек относится к тестовой среде, а не к сервису |

**Наблюдение из двух прогонов.** Первый прогон добавлял в корзину один и тот же товар: среднее на `POST /api/cart/items` было 56 мс, максимум — 2 739 мс. Второй прогон берёт товары из CSV, то есть в корзине накапливается до 18 разных позиций: среднее выросло до 95 мс, зато максимум упал до 247 мс.

Это прямое подтверждение гипотезы про N+1: время растёт не от объёма данных, а от числа позиций, для каждой из которых выполняется отдельный запрос. Одновременно ушла конкуренция за одну строку товара — отсюда падение максимума в 11 раз.

### Рекомендации по улучшению

Порядок — по соотношению «эффект / трудозатраты».

| Приоритет | Что сделать | Ожидаемый эффект |
|---|---|---|
| **1** | Заменить N+1 в `loadCart` на один запрос с `LEFT JOIN` по `cart_items → products → extras` | Сокращение числа запросов в 3–7 раз на операцию корзины, снижение максимумов |
| **1** | Обернуть создание заказа в транзакцию: `BEGIN`, multi-row `INSERT` позиций, `COMMIT` | 5–6 round-trip превращаются в 2; попутно закрывается дефект BUG-006 |
| **2** | Увеличить пул соединений до 20–30 и включить `statement_timeout` | Меньше ожидания в очереди под пиком, быстрый отказ вместо зависания |
| **2** | Кэшировать `GET /api/menu` в памяти на 30–60 секунд либо отдавать по `ETag` | До 90% запросов обслуживаются без обращения к БД |
| **3** | Запустить несколько процессов Node (cluster или PM2, по числу ядер) | Утилизация всех ядер вместо одного event loop |
| **3** | Включить `gzip` и `Cache-Control` для статики и изображений | Меньше трафика, короче загрузка витрины |
| **3** | Проверить планы запросов через `EXPLAIN ANALYZE` для меню и заказов | Убедиться, что индексы используются, нет seq scan по `products` |
| **4** | Ввести rate limiting и backpressure на `POST /api/orders` | Защита от деградации при злоупотреблении |

**Как проверять результат:** после каждой правки — повторный прогон того же профиля нагрузки и сравнение метрик. Целевые значения: `p99 < 100 мс`, максимум `< 500 мс`, доля ошибок `0%`.

### Запуск

```bash
jmeter -n -t load/plan.jmx -l load/results.jtl
node .tmp/parse-load.mjs      # метрики в load/metrics.json
node .tmp/build-slides.mjs    # слайды в load/presentation
```

Презентация с результатами — [`load/presentation/`](load/presentation/) (7 слайдов, 1920×1080).

### Файлы для запуска

| Файл | Что это | В git |
|---|---|---|
| [`load/plan.jmx`](load/plan.jmx) | План теста: три группы потоков, CSV-источник данных, HTTP-запросы | да |
| [`load/test-data.csv`](load/test-data.csv) | Тестовые данные: товар, количество, имя, телефон, способ получения | да |
| `load/results.jtl` | Сырые результаты прогона, создаётся JMeter при запуске | нет, 12 МБ |
| `load/metrics.json` | Агрегированные метрики: RPS, перцентили, ошибки | да |
| `load/jmeter.log` | Лог прогона | нет |

**`test-data.csv`** — 18 строк, по одной на каждый товар из seed. Подключается элементом CSV Data Set Config в плане:

```csv
productId,quantity,customerName,phone,deliveryType
1,1,Нагрузочный Тест,+7 900 000-00-01,pickup
2,1,Нагрузочный Тест,+7 900 000-00-02,pickup
3,2,Нагрузочный Тест,+7 900 000-00-03,pickup
...
18,1,Нагрузочный Тест,+7 900 000-00-18,pickup
```

В плане значения подставляются в тело запросов:

```json
{ "customerName": "${customerName}", "phone": "${phone}",
  "deliveryType": "${deliveryType}",
  "items": [ { "productId": ${productId}, "quantity": ${quantity} } ] }
```

**`results.jtl`** в репозиторий не кладётся: 70 тысяч строк и 12 МБ. Он создаётся при запуске и служит входом для `parse-load.mjs`, который собирает `metrics.json`:

```bash
jmeter -n -t load/plan.jmx -l load/results.jtl   # прогон
node .tmp/parse-load.mjs                          # results.jtl -> metrics.json
``` Кейсы — эпик [⚡ Нагрузочное тестирование](https://boysporting.atlassian.net/browse/SCRUM-111): 6 пройдено, 2 в бэклоге (soak и стресс).

![Результаты нагрузочного тестирования](load/presentation/slide-1-1920.png)

## 🗂 Тесты и CI: что где лежит и когда запускается

Все автотесты лежат **в одном репозитории с кодом**, но разделены по каталогам и запускаются разными джобами.

| Набор | Где | Когда запускается | Время |
|---|---|---|---|
| API на Node.js (39) | [`tests/`](tests/) | каждый push и pull request | ~3 с |
| E2E Playwright (35) | [`tests/e2e/`](tests/e2e/) | каждый push и pull request | ~52 с |
| Визуальные (5) | [`tests/visual/`](tests/visual/) | каждый push и pull request, не блокирует merge | ~7 с |
| **Java smoke (13)** | [`java-tests/`](java-tests/) | каждый push и pull request | ~35 с |
| Java полный (19) | [`java-tests/`](java-tests/) | локально или вручную | ~22 с |
| Нагрузочные (8) | [`load/`](load/) | вручную, по расписанию | ~70 с |

Конфигурация — [`.github/workflows/ci.yml`](.github/workflows/ci.yml), пять джоб: `api-tests`, `e2e-tests`, `visual-tests`, `java-smoke`, `docker-build`.

### Почему Java-тесты лежат рядом с кодом

Один репозиторий — один pull request. Если меняется контракт `POST /api/cart/items`, то правка кода и правка теста приходят вместе, и CI не пропустит рассинхрон. Отдельный репозиторий потребовал бы двух PR, синхронизации версий и отдельного триггера.

Когда тесты всё же выносят:

| Ситуация | Куда | Почему |
|---|---|---|
| Один продукт, одна команда | **тот же репозиторий**, отдельный модуль | проще, атомарные изменения |
| Несколько продуктов, общий фреймворк | отдельный репозиторий | тесты переиспользуются между сервисами |
| Тесты пишет отдельная QA-команда на многих продуктах | отдельный репозиторий + свой CI | своя зрелость, свой релизный цикл |
| Тесты нужны на нескольких стендах | тот же репозиторий, параметры через конфиг | код один, окружения разные |

### Что запускается на сборке

На каждый pull request идут быстрые наборы: API на Node.js, Java smoke (только API корзины и заказов, без браузера), E2E и визуальные. Нагрузочные тесты и полный Java-набор в CI не запускаются — они долгие и требуют отдельного стенда.

```bash
# то, что гоняет CI
npm test
npx playwright test
mvn -B -f java-tests/pom.xml test -Dtest=CartApiTest,OrdersApiTest

# то, что гоняют вручную
mvn -B -f java-tests/pom.xml test     # все 19
jmeter -n -t load/plan.jmx -l load/results.jtl
```

## 🧾 Документация

Вся документация генерируется из одного источника в `qa-docs/content/`.

```bash
npm run docs:build                    # сайт + Confluence + CSV
node qa-docs/build-package.mjs        # полный пакет из 4 разделов
node qa-docs/publish-package.mjs      # публикация в Confluence
node qa-docs/update-jira-cases.mjs    # обновление тест-кейсов в Jira
```

| Результат | Куда |
|---|---|
| `qa-docs/pkg/*.html` | 24 страницы в формате Confluence Storage Format |
| `qa-docs/site/index.html` + PDF | Документация одним файлом |
| `qa-docs/jira/*.csv` | 66 кейсов и 10 багов для импорта |

---

## 🔄 CI/CD

Четыре job'а при каждом push:

| Job | Что делает |
|---|---|
| `api-tests` | 23 API-теста на Node 24 |
| `e2e-tests` | 35 Playwright-тестов + генерация Allure |
| `visual-tests` | 5 визуальных тестов (windows-latest) |
| `docker-build` | Сборка образа + проверка `/api/health` |

Конфигурация — [.github/workflows/ci.yml](.github/workflows/ci.yml).

---

## 🐛 Дефекты, найденные тестами

| ID | Серьёзность | Суть | Статус |
|---|---|---|---|
| BUG-009 | Blocker | Модалки не скрывались — витрина была некликабельна | Исправлен |
| BUG-010 | Major | Неверный пароль в админке не показывал ошибку | Исправлен |
| BUG-005 | Critical | Заказ читается по номеру без авторизации | Открыт |
| BUG-006 | Major | Создание заказа без транзакции | Открыт |

Полный список — [фильтр «QA · Баг-репорты»](https://boysporting.atlassian.net/issues/?filter=10002).

---

## 📸 Скриншоты

| Экран | Файл |
|---|---|
| Витрина с фотографиями блюд | [menu-final.png](docs/screenshots/menu-final.png) |
| Форма оплаты | [journey-3-payment.png](docs/screenshots/journey-3-payment.png) |
| Уведомление «заказ готов» | [journey-5-ready.png](docs/screenshots/journey-5-ready.png) |
| Отчёт Allure | [allure-report.png](docs/screenshots/allure-report.png) |
| Пространство Confluence | [confluence-space.png](docs/screenshots/confluence-space.png) |

---

## ⚠️ Ограничения

- Оплата имитируется — реального эквайринга нет
- Код подтверждения возвращается в ответе API (демо-режим, нет SMS-шлюза)
- Нет транзакций при создании заказа (BUG-006)
- Заказ доступен по номеру без авторизации (BUG-005)
- Пагинации и фильтров в админке нет
- Xray не установлен: тест-кейсы живут как задачи Jira с меткой `test-case`

## 🗺 Планы

- Транзакции и резервирование промокода
- Refresh-токены и rate limiting
- Пагинация и поиск в админке
- Уведомления в Telegram вместо опроса статуса
- Подключение Xray при переходе на платный тариф

---

## 📄 Лицензия

Учебный проект. Свободно для использования и практики.
Фотографии блюд — Wikimedia Commons, атрибуция в [docs/IMAGE-CREDITS.md](docs/IMAGE-CREDITS.md).
