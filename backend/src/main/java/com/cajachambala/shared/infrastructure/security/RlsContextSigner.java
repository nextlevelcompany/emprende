package com.cajachambala.shared.infrastructure.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.security.GeneralSecurityException;
import java.util.HexFormat;
import java.util.Locale;
import java.util.UUID;

/** Signs transaction-local RLS claims so application SQL cannot invent a tenant or role. */
@Component
public final class RlsContextSigner {

    private final byte[] secret;

    public RlsContextSigner(@Value("${app.security.rls-context-hmac-secret-hex}") String secretHex) {
        if (secretHex == null || !secretHex.matches("(?i)[0-9a-f]{64}")) {
            throw new IllegalStateException("RLS_CONTEXT_HMAC_SECRET_HEX must contain exactly 64 hexadecimal characters");
        }
        this.secret = HexFormat.of().parseHex(secretHex);
    }

    public String sign(UUID cajaId, UUID socioId, String role) {
        if (cajaId == null) {
            throw new IllegalArgumentException("cajaId is required to sign the RLS context");
        }
        String normalizedRole = role == null ? "" : role.toUpperCase(Locale.ROOT);
        if (!normalizedRole.equals("ADMIN") && !normalizedRole.equals("SOCIO")) {
            throw new IllegalArgumentException("Unsupported role for RLS context");
        }

        String payload = cajaId + "\n" + (socioId == null ? "" : socioId) + "\n" + normalizedRole;
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret, "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(payload.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("Could not sign the RLS context", exception);
        }
    }
}
