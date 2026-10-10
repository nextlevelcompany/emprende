package com.cajachambala.shared.application;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.UUID;

@Service
public class IdempotencyService {
    private final JdbcTemplate jdbc;
    private final ObjectMapper mapper;

    public IdempotencyService(JdbcTemplate jdbc, ObjectMapper mapper) {
        this.jdbc = jdbc;
        this.mapper = mapper;
    }

    @Transactional
    public <T> T ejecutar(UUID cajaId, String operacion, String key, Object request, Class<T> responseType,
                          java.util.function.Supplier<T> action) {
        if (key == null || key.isBlank() || key.length() > 120) {
            throw new IllegalArgumentException("Se requiere una clave Idempotency-Key válida (máximo 120 caracteres)");
        }
        try {
            String requestJson = mapper.writeValueAsString(request);
            String hash = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(requestJson.getBytes(StandardCharsets.UTF_8)));
            jdbc.update("INSERT INTO idempotency_record (caja_id, operacion, idempotency_key, request_hash) VALUES (?, ?, ?, ?) ON CONFLICT DO NOTHING",
                    cajaId, operacion, key, hash);

            var record = jdbc.query("SELECT request_hash, response::text FROM idempotency_record WHERE caja_id = ? AND operacion = ? AND idempotency_key = ? FOR UPDATE",
                    (rs, row) -> new StoredResponse(rs.getString(1), rs.getString(2)), cajaId, operacion, key)
                    .stream().findFirst().orElseThrow(() -> new IllegalStateException("No se pudo reservar la clave de idempotencia"));
            if (!MessageDigest.isEqual(hash.getBytes(StandardCharsets.UTF_8), record.requestHash().getBytes(StandardCharsets.UTF_8))) {
                throw new IllegalArgumentException("La clave Idempotency-Key ya se usó con datos diferentes");
            }
            if (record.responseJson() != null) return mapper.readValue(record.responseJson(), responseType);

            T result = action.get();
            jdbc.update("UPDATE idempotency_record SET response = ?::jsonb WHERE caja_id = ? AND operacion = ? AND idempotency_key = ?",
                    mapper.writeValueAsString(result), cajaId, operacion, key);
            return result;
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException("No se pudo procesar la solicitud idempotente", e);
        }
    }

    private record StoredResponse(String requestHash, String responseJson) {}
}
