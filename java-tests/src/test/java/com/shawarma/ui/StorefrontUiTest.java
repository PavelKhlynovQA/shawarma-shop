package com.shawarma.ui;

import com.shawarma.config.TestConfig;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * UI-тесты витрины. Кнопки и вкладки ищутся XPath-локаторами по видимому тексту.
 */
@DisplayName("UI витрины")
class StorefrontUiTest {

    private WebDriver driver;
    private WebDriverWait wait;

    // XPath-локаторы кнопок
    private static final By ADD_TO_CART_BUTTON = By.xpath("//button[normalize-space()='В корзину']");
    private static final By TAB_DRINKS = By.xpath("//button[normalize-space()='Напитки']");
    private static final By TAB_ALL = By.xpath("//button[normalize-space()='Всё меню']");
    private static final By CART_BUTTON = By.xpath("//button[@id='cartButton']");
    private static final By CART_COUNTER = By.xpath("//*[@id='cartCount']");
    private static final By MODAL_ADD_BUTTON = By.xpath("//button[@id='modalAdd']");
    private static final By PRODUCT_CARDS = By.xpath("//div[contains(@class,'card')]");

    @BeforeEach
    void openBrowser() {
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--window-size=1440,900");
        options.addArguments("--disable-gpu");
        driver = new ChromeDriver(options);
        wait = new WebDriverWait(driver, Duration.ofSeconds(15));
        driver.get(TestConfig.uiBase());
    }

    @AfterEach
    void closeBrowser() {
        if (driver != null) {
            driver.quit();
        }
    }

    @Test
    @DisplayName("Главная страница открывается и содержит заголовок витрины")
    void storefrontOpens() {
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.xpath("//*[contains(text(),'Шаурма')]")));
        assertThat(driver.getTitle()).contains("Шаурма");
    }

    @Test
    @DisplayName("Кнопка «В корзину» открывает модальное окно товара")
    void addToCartButtonOpensModal() {
        WebElement button = wait.until(ExpectedConditions.elementToBeClickable(ADD_TO_CART_BUTTON));
        button.click();

        WebElement modalAdd = wait.until(ExpectedConditions.visibilityOfElementLocated(MODAL_ADD_BUTTON));
        assertThat(modalAdd.isDisplayed()).isTrue();
    }

    @Test
    @DisplayName("Добавление товара увеличивает счётчик корзины до 1")
    void cartCounterIncreases() {
        wait.until(ExpectedConditions.elementToBeClickable(ADD_TO_CART_BUTTON)).click();
        wait.until(ExpectedConditions.elementToBeClickable(MODAL_ADD_BUTTON)).click();

        WebElement counter = wait.until(ExpectedConditions.visibilityOfElementLocated(CART_COUNTER));
        wait.until(d -> "1".equals(counter.getText()));
        assertThat(counter.getText()).isEqualTo("1");
    }

    @Test
    @DisplayName("Вкладка «Напитки» оставляет только напитки")
    void drinksTabFiltersCards() {
        wait.until(ExpectedConditions.elementToBeClickable(TAB_DRINKS)).click();

        wait.until(d -> d.findElements(PRODUCT_CARDS).size() == 4);
        List<WebElement> cards = driver.findElements(PRODUCT_CARDS);
        assertThat(cards).hasSize(4);
    }

    @Test
    @DisplayName("Возврат на «Всё меню» показывает все товары")
    void allMenuTabRestoresCards() {
        wait.until(ExpectedConditions.elementToBeClickable(TAB_DRINKS)).click();
        wait.until(d -> d.findElements(PRODUCT_CARDS).size() == 4);

        wait.until(ExpectedConditions.elementToBeClickable(TAB_ALL)).click();
        wait.until(d -> d.findElements(PRODUCT_CARDS).size() == 18);

        assertThat(driver.findElements(PRODUCT_CARDS)).hasSize(18);
    }

    @Test
    @DisplayName("Кнопка корзины открывает панель с пустым состоянием")
    void cartPanelShowsEmptyState() {
        wait.until(ExpectedConditions.elementToBeClickable(CART_BUTTON)).click();

        WebElement empty = wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.xpath("//*[contains(text(),'Корзина пуста')]")));
        assertThat(empty.isDisplayed()).isTrue();
    }
}
