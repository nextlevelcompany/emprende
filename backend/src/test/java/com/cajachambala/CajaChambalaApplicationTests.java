package com.cajachambala;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import javax.sql.DataSource;
import java.sql.Connection;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("test")
class CajaChambalaApplicationTests {

    @Autowired(required = false)
    private DataSource dataSource;

    @Test
    @DisplayName("El contexto de Spring Boot levanta correctamente y Flyway aplica migraciones V1 a V3 sin errores")
    void contextLoads() throws Exception {
        assertNotNull(dataSource, "El DataSource debe estar configurado");
        try (Connection conn = dataSource.getConnection()) {
            assertTrue(conn.isValid(5), "La conexión a PostgreSQL debe ser válida");
        }
    }
}
