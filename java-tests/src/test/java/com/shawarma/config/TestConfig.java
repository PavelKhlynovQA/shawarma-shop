package com.shawarma.config;

/**
 * Настройки окружения. Переопределяются через -Dapi.base / -Dui.base.
 */
public final class TestConfig {

    private TestConfig() {
    }

    public static String apiBase() {
        return System.getProperty("api.base", "http://localhost:3000");
    }

    public static String uiBase() {
        return System.getProperty("ui.base", "http://localhost:3000");
    }

    public static String adminEmail() {
        return System.getProperty("admin.email", "admin@shawarma.ru");
    }

    public static String adminPassword() {
        return System.getProperty("admin.password", "Admin123!");
    }
}
