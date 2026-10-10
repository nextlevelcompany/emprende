package com.cajachambala.shared.application;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class RegistroInstitucionalService {
    private final JdbcTemplate jdbc;
    private final ObjectMapper mapper;

    public RegistroInstitucionalService(JdbcTemplate jdbc, ObjectMapper mapper) {
        this.jdbc = jdbc;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public List<JsonNode> listar(UUID cajaId, String categoria) {
        return jdbc.query("SELECT payload::text FROM registro_institucional WHERE caja_id = ? AND categoria = ? ORDER BY CASE WHEN categoria = 'actas' THEN payload->>'fecha' END DESC, CASE WHEN categoria = 'accionistas' THEN (payload->>'codigo')::integer END ASC NULLS LAST, registro_id",
                (rs, row) -> parse(rs.getString(1)), cajaId, categoria);
    }

    @Transactional(readOnly = true)
    public JsonNode obtener(UUID cajaId, String categoria, String id) {
        return jdbc.query("SELECT payload::text FROM registro_institucional WHERE caja_id = ? AND categoria = ? AND registro_id = ?",
                (rs, row) -> parse(rs.getString(1)), cajaId, categoria, id)
                .stream().findFirst().orElse(null);
    }

    @Transactional
    public JsonNode guardar(UUID cajaId, String categoria, String id, JsonNode payload) {
        try {
            jdbc.update("""
                    INSERT INTO registro_institucional (caja_id, categoria, registro_id, payload)
                    VALUES (?, ?, ?, ?::jsonb)
                    ON CONFLICT (caja_id, categoria, registro_id)
                    DO UPDATE SET payload = EXCLUDED.payload, updated_at = now()
                    """, cajaId, categoria, id, mapper.writeValueAsString(payload));
            return payload;
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new IllegalArgumentException("No se pudo serializar el registro", e);
        }
    }

    @Transactional
    public boolean eliminar(UUID cajaId, String categoria, String id) {
        return jdbc.update("DELETE FROM registro_institucional WHERE caja_id = ? AND categoria = ? AND registro_id = ?",
                cajaId, categoria, id) > 0;
    }

    @Transactional
    public int siguienteCodigoAccionista(UUID cajaId, com.cajachambala.shared.infrastructure.persistence.CorrelativoService correlativos) {
        Integer maximo = jdbc.queryForObject("SELECT COALESCE(MAX((payload->>'codigo')::integer), 0) FROM registro_institucional WHERE caja_id = ? AND categoria = 'accionistas'",
                Integer.class, cajaId);
        return correlativos.siguiente(cajaId, "ACCIONISTA_HISTORICO", (maximo == null ? 0 : maximo) + 1);
    }

    private JsonNode parse(String value) {
        try {
            return mapper.readTree(value);
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new IllegalStateException("Registro institucional inválido en la base de datos", e);
        }
    }
}
