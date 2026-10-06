package com.cajachambala.shared.domain;

import com.github.f4b6a3.uuid.UuidCreator;
import java.util.UUID;

/**
 * Generador de identificadores basados en UUIDv7 (time-ordered epoch).
 * Garantiza localidad de índices B-Tree en PostgreSQL y orden temporal secuencial.
 */
public final class IdGenerator {

    private IdGenerator() {
    }

    public static UUID nuevo() {
        return UuidCreator.getTimeOrderedEpoch();
    }

    public static UUID newUuid() {
        return nuevo();
    }

    public static UUID nextId() {
        return nuevo();
    }
}
