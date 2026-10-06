package com.cajachambala.identidad.infrastructure.security;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
public class PasswordService {

    private final PasswordEncoder passwordEncoder;

    // Lista mínima de contraseñas débiles o por defecto a bloquear (OWASP)
    private static final Set<String> COMMON_PASSWORDS = Set.of(
            "password12345", "123456789012", "admin1234567", "cajachambala2024", "cajachambala2025",
            "emprendechambala", "contraseña1234", "administrador1"
    );

    public PasswordService(PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
    }

    public void validatePasswordStrength(String password, String email) {
        if (password == null || password.length() < 12) {
            throw new IllegalArgumentException("La contraseña debe tener como mínimo 12 caracteres");
        }
        if (password.length() > 128) {
            throw new IllegalArgumentException("La contraseña no debe superar los 128 caracteres");
        }

        String lower = password.toLowerCase();
        if (COMMON_PASSWORDS.contains(lower)) {
            throw new IllegalArgumentException("La contraseña seleccionada es demasiado común y predecible");
        }

        if (email != null && !email.isBlank()) {
            String usernamePart = email.split("@")[0].toLowerCase();
            if (usernamePart.length() >= 4 && lower.contains(usernamePart)) {
                throw new IllegalArgumentException("La contraseña no debe contener fragmentos de tu correo electrónico");
            }
        }
    }

    public String encode(String rawPassword) {
        return passwordEncoder.encode(rawPassword);
    }

    public boolean matches(String rawPassword, String encodedPassword) {
        return passwordEncoder.matches(rawPassword, encodedPassword);
    }
}
