package com.cajachambala.shared.infrastructure.security;

import java.util.UUID;

public record UserContext(
        UUID userId,
        UUID cajaId,
        String role,
        UUID socioId,
        String email
) {
    public boolean isAdmin() {
        return "ADMIN".equalsIgnoreCase(role);
    }
}
