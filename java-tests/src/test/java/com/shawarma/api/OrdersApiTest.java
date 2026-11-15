package com.shawarma.api;

import com.shawarma.config.TestConfig;
import io.restassured.http.ContentType;
import io.restassured.response.Response;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static io.restassured.RestAssured.given;
import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("API заказов")
class OrdersApiTest {

    private io.restassured.specification.RequestSpecification request() {
        return given()
                .baseUri(TestConfig.apiBase())
                .contentType(ContentType.JSON)
                .accept(ContentType.JSON);
    }

    @Test
    @DisplayName("POST /api/orders создаёт заказ и возвращает номер")
    void createOrder() {
        Response response = request()
                .body(Map.of(
                        "customerName", "Иван Тестов",
                        "phone", "+7 900 123-45-67",
                        "deliveryType", "pickup",
                        "items", List.of(Map.of("productId", 1, "quantity", 2))
                ))
                .when().post("/api/orders");

        assertThat(response.statusCode()).isEqualTo(201);
        assertThat(response.jsonPath().getString("order.publicId")).startsWith("SH-");
        assertThat(response.jsonPath().getString("order.status")).isEqualTo("NEW");
        assertThat(response.jsonPath().getString("order.paymentStatus")).isEqualTo("PENDING");
        assertThat(response.jsonPath().getInt("order.subtotal")).isEqualTo(560);
    }

    @Test
    @DisplayName("Заказ с доставкой ниже 500 руб. отклоняется с 409")
    void minDeliveryAmount() {
        Response response = request()
                .body(Map.of(
                        "customerName", "Иван Тестов",
                        "phone", "+7 900 123-45-67",
                        "deliveryType", "delivery",
                        "address", "Волгоград, ул. Мира, 15",
                        "items", List.of(Map.of("productId", 12, "quantity", 1))
                ))
                .when().post("/api/orders");

        assertThat(response.statusCode()).isEqualTo(409);
        assertThat(response.jsonPath().getString("error.code")).isEqualTo("MIN_ORDER_AMOUNT");
    }

    @Test
    @DisplayName("Заказ с некорректным телефоном отклоняется с 400")
    void invalidPhone() {
        Response response = request()
                .body(Map.of(
                        "customerName", "Иван Тестов",
                        "phone", "abc",
                        "deliveryType", "pickup",
                        "items", List.of(Map.of("productId", 1, "quantity", 1))
                ))
                .when().post("/api/orders");

        assertThat(response.statusCode()).isEqualTo(400);
        assertThat(response.jsonPath().getString("error.details[0].field")).isEqualTo("phone");
    }

    @Test
    @DisplayName("Админский метод без токена возвращает 401")
    void adminWithoutToken() {
        Response response = request().when().get("/api/admin/orders");

        assertThat(response.statusCode()).isEqualTo(401);
        assertThat(response.jsonPath().getString("error.code")).isEqualTo("UNAUTHORIZED");
    }

    @Test
    @DisplayName("Созданный заказ доступен по публичному номеру")
    void createdOrderIsReadable() {
        Response created = request()
                .body(Map.of(
                        "customerName", "Иван Тестов",
                        "phone", "+7 900 123-45-67",
                        "deliveryType", "pickup",
                        "items", List.of(Map.of("productId", 1, "quantity", 1))
                ))
                .when().post("/api/orders");

        String publicId = created.jsonPath().getString("order.publicId");

        Response fetched = request().when().get("/api/orders/" + publicId);
        assertThat(fetched.statusCode()).isEqualTo(200);
        assertThat(fetched.jsonPath().getString("order.publicId")).isEqualTo(publicId);
        assertThat(fetched.jsonPath().getList("order.history")).isNotEmpty();
    }
}
