package com.shawarma.api;

import com.shawarma.config.TestConfig;
import io.restassured.http.ContentType;
import io.restassured.response.Response;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static io.restassured.RestAssured.given;
import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("API корзины")
class CartApiTest {

    private String cartId;

    @BeforeEach
    void newCart() {
        cartId = UUID.randomUUID().toString().replace("-", "");
    }

    private io.restassured.specification.RequestSpecification request() {
        return given()
                .baseUri(TestConfig.apiBase())
                .header("X-Cart-Id", cartId)
                .contentType(ContentType.JSON)
                .accept(ContentType.JSON);
    }

    @Test
    @DisplayName("GET /api/cart создаёт пустую корзину")
    void emptyCartIsCreated() {
        Response response = request().when().get("/api/cart");

        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.jsonPath().getList("cart.items")).isEmpty();
        assertThat(response.jsonPath().getInt("cart.subtotal")).isZero();
        assertThat(response.jsonPath().getInt("cart.count")).isZero();
    }

    @Test
    @DisplayName("POST /api/cart/items добавляет товар и считает сумму")
    void addItem() {
        Response response = request()
                .body(Map.of("productId", 1, "quantity", 2))
                .when().post("/api/cart/items");

        assertThat(response.statusCode()).isEqualTo(201);
        assertThat(response.jsonPath().getInt("cart.items[0].unitPrice")).isEqualTo(280);
        assertThat(response.jsonPath().getInt("cart.subtotal")).isEqualTo(560);
        assertThat(response.jsonPath().getInt("cart.count")).isEqualTo(2);
    }

    @Test
    @DisplayName("Повторное добавление увеличивает количество в одной позиции")
    void sameProductMerges() {
        request().body(Map.of("productId", 1, "quantity", 1)).post("/api/cart/items");
        Response response = request()
                .body(Map.of("productId", 1, "quantity", 2))
                .when().post("/api/cart/items");

        assertThat(response.jsonPath().getList("cart.items")).hasSize(1);
        assertThat(response.jsonPath().getInt("cart.items[0].quantity")).isEqualTo(3);
    }

    @Test
    @DisplayName("Другой набор дополнителей создаёт отдельную позицию")
    void differentExtrasSplitsLines() {
        request().body(Map.of("productId", 1, "quantity", 1)).post("/api/cart/items");
        Response response = request()
                .body(Map.of("productId", 1, "quantity", 1, "extras", List.of(1)))
                .when().post("/api/cart/items");

        assertThat(response.jsonPath().getList("cart.items")).hasSize(2);
    }

    @Test
    @DisplayName("Стоимость учитывает дополнительные ингредиенты")
    void extrasAffectPrice() {
        Response response = request()
                .body(Map.of("productId", 1, "quantity", 1, "extras", List.of(1, 2)))
                .when().post("/api/cart/items");

        assertThat(response.jsonPath().getInt("cart.items[0].unitPrice")).isEqualTo(450);
        assertThat(response.jsonPath().getInt("cart.subtotal")).isEqualTo(450);
    }

    @Test
    @DisplayName("Количество 0 отклоняется с 400")
    void zeroQuantityRejected() {
        Response response = request()
                .body(Map.of("productId", 1, "quantity", 0))
                .when().post("/api/cart/items");

        assertThat(response.statusCode()).isEqualTo(400);
        assertThat(response.jsonPath().getString("error.code")).isEqualTo("VALIDATION_ERROR");
        assertThat(response.jsonPath().getString("error.details[0].field")).isEqualTo("quantity");
    }

    @Test
    @DisplayName("Несуществующий товар возвращает 404")
    void unknownProductNotFound() {
        Response response = request()
                .body(Map.of("productId", 9999))
                .when().post("/api/cart/items");

        assertThat(response.statusCode()).isEqualTo(404);
        assertThat(response.jsonPath().getString("error.code")).isEqualTo("NOT_FOUND");
    }

    @Test
    @DisplayName("PATCH меняет количество, значение 0 удаляет позицию")
    void patchQuantity() {
        Response created = request().body(Map.of("productId", 1, "quantity", 1)).post("/api/cart/items");
        int itemId = created.jsonPath().getInt("cart.items[0].id");

        Response updated = request()
                .body(Map.of("quantity", 3))
                .when().patch("/api/cart/items/" + itemId);
        assertThat(updated.jsonPath().getInt("cart.items[0].quantity")).isEqualTo(3);

        Response removed = request()
                .body(Map.of("quantity", 0))
                .when().patch("/api/cart/items/" + itemId);
        assertThat(removed.jsonPath().getList("cart.items")).isEmpty();
    }
}
