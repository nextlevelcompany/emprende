package com.cajachambala.identidad.infrastructure.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.List;
import java.util.UUID;

/** One-shot AES-GCM key rotation. Disabled unless explicitly enabled for a non-web run. */
@Component
@ConditionalOnProperty(name = "app.crypto.key-rotation.enabled", havingValue = "true")
public class AesGcmKeyRotationRunner implements ApplicationRunner {

    private final JdbcTemplate jdbc;
    private final TransactionTemplate transaction;
    private final Environment environment;
    private final AesGcmCryptoService oldCrypto;
    private final AesGcmCryptoService newCrypto;

    public AesGcmKeyRotationRunner(
            JdbcTemplate jdbc,
            PlatformTransactionManager transactionManager,
            Environment environment,
            @Value("${app.crypto.key-rotation.old-key}") String oldKey,
            @Value("${app.crypto.key-rotation.new-key}") String newKey) {
        if (oldKey == null || oldKey.isBlank() || newKey == null || newKey.length() < 64) {
            throw new IllegalStateException("AES key rotation requires the old key and a new 64-character random key");
        }
        if (oldKey.equals(newKey)) {
            throw new IllegalStateException("AES old and new keys must differ");
        }
        this.jdbc = jdbc;
        this.transaction = new TransactionTemplate(transactionManager);
        this.environment = environment;
        this.oldCrypto = new AesGcmCryptoService(oldKey);
        this.newCrypto = new AesGcmCryptoService(newKey);
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!"none".equalsIgnoreCase(environment.getProperty("spring.main.web-application-type", "servlet"))) {
            throw new IllegalStateException("AES key rotation is only allowed in a non-web one-shot process");
        }

        RotationCounts counts = transaction.execute(status -> {
            int socioDocuments = rotate("socio", "documento_enc");
            int mfaSecrets = rotate("app_user", "mfa_secret_enc");
            verify("socio", "documento_enc");
            verify("app_user", "mfa_secret_enc");
            return new RotationCounts(socioDocuments, mfaSecrets);
        });

        if (counts == null) {
            throw new IllegalStateException("AES key rotation did not complete");
        }
        System.out.printf("AES key rotation complete: socio.documento_enc=%d, app_user.mfa_secret_enc=%d%n",
                counts.socioDocuments(), counts.mfaSecrets());
    }

    private int rotate(String table, String column) {
        List<EncryptedValue> values = jdbc.query(
                "SELECT id, " + column + " FROM " + table + " WHERE " + column + " IS NOT NULL FOR UPDATE",
                (rs, row) -> new EncryptedValue(rs.getObject("id", UUID.class), rs.getBytes(column)));

        for (EncryptedValue value : values) {
            String plaintext = oldCrypto.decryptString(value.ciphertext());
            if (plaintext == null) {
                throw new IllegalStateException("Refusing to discard an unreadable encrypted value in " + table + "." + column);
            }
            byte[] rotated = newCrypto.encryptString(plaintext);
            if (!plaintext.equals(newCrypto.decryptString(rotated))) {
                throw new IllegalStateException("AES rotation verification failed for " + table + "." + column);
            }
            int updated = jdbc.update("UPDATE " + table + " SET " + column + " = ? WHERE id = ?", rotated, value.id());
            if (updated != 1) {
                throw new IllegalStateException("Expected exactly one row update in " + table + "." + column);
            }
        }
        return values.size();
    }

    private void verify(String table, String column) {
        List<byte[]> values = jdbc.query(
                "SELECT " + column + " FROM " + table + " WHERE " + column + " IS NOT NULL",
                (rs, row) -> rs.getBytes(column));
        for (byte[] value : values) {
            if (newCrypto.decryptString(value) == null) {
                throw new IllegalStateException("Post-rotation verification failed for " + table + "." + column);
            }
        }
    }

    private record EncryptedValue(UUID id, byte[] ciphertext) { }
    private record RotationCounts(int socioDocuments, int mfaSecrets) { }
}
