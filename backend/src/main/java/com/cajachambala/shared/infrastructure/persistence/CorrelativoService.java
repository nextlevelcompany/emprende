package com.cajachambala.shared.infrastructure.persistence;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class CorrelativoService {
    private final JdbcTemplate jdbcTemplate;

    public CorrelativoService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /** Returns the next tenant-scoped number, safely under concurrent transactions. */
    public int siguiente(UUID cajaId, String tipo, int valorMinimoActual) {
        if (valorMinimoActual < 1) throw new IllegalArgumentException("El siguiente correlativo debe ser positivo");
        Integer result = jdbcTemplate.queryForObject("""
                INSERT INTO caja_correlativo (caja_id, tipo, ultimo_valor)
                VALUES (?, ?, ?)
                ON CONFLICT (caja_id, tipo) DO UPDATE
                SET ultimo_valor = GREATEST(caja_correlativo.ultimo_valor + 1, EXCLUDED.ultimo_valor),
                    updated_at = now()
                RETURNING ultimo_valor
                """, Integer.class, cajaId, tipo, valorMinimoActual);
        if (result == null) throw new IllegalStateException("No se pudo asignar el correlativo " + tipo);
        return result;
    }
}
