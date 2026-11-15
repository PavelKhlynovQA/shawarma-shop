# Java-автотесты «Шаурма-Мастер»

Стек: **Java 17+, Maven, JUnit 5, REST Assured, Selenium 4, AssertJ**.

## Что внутри

| Класс | Что проверяет | Тестов |
|---|---|---|
| `CartApiTest` | API корзины: создание, добавление, слияние позиций, допы, границы, изменение, удаление | 8 |
| `OrdersApiTest` | API заказов: создание, минимальная сумма, валидация телефона, права, чтение заказа | 5 |
| `StorefrontUiTest` | UI витрины через Selenium: заголовок, модалка товара, счётчик корзины, фильтр категорий, пустая корзина | 6 |

Итого **19 тестов**.

## Требования

- JDK 17 или новее
- Maven 3.9+
- Google Chrome (для UI-тестов, драйвер подтянется автоматически через Selenium Manager)

## Запуск

```bash
# приложение должно быть запущено на http://localhost:3000
mvn test
```

Проверено: **19 из 19 тестов проходят** на JDK 21 + Maven 3.9.9 + Chrome 157.

Если Selenium не может сам скачать драйвер (закрытая сеть), укажите путь вручную:

```bash
mvn test -Dwebdriver.chrome.driver=/path/to/chromedriver
```

Для окружений с ограниченной записью во временные каталоги задайте TEMP внутри проекта:

```powershell
$env:TEMP = "$PWD/.tmp/chrome-temp"
$env:TMP = $env:TEMP
```

Параметры можно переопределить:

```bash
mvn test -Dapi.base=http://localhost:3000 -Dui.base=http://localhost:3000
```

Smoke-набор, который запускается в CI (только API, без браузера):

```bash
mvn test -Dtest=CartApiTest,OrdersApiTest
```

Только API или только UI:

```bash
mvn test -Dtest=CartApiTest,OrdersApiTest
mvn test -Dtest=StorefrontUiTest
```

## Локаторы

Все кнопки и вкладки ищутся **XPath-локаторами по видимому тексту**, а не по CSS-классам:

```java
By ADD_TO_CART_BUTTON = By.xpath("//button[normalize-space()='В корзину']");
By TAB_DRINKS = By.xpath("//button[normalize-space()='Напитки']");
By MODAL_ADD_BUTTON = By.xpath("//button[@id='modalAdd']");
```

Почему XPath: тексты кнопок видны пользователю и меняются реже, чем вёрстка. Но учтите — при смене языка или формулировки кнопки локатор сломается.
