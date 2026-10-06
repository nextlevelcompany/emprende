package com.cajachambala.identidad.infrastructure.security;

import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
public class TotpService {

    private static final int TIME_STEP_SECONDS = 30;
    private static final int DIGITS = 6;
    private static final int MODULUS = 1_000_000;
    private static final String HMAC_ALGORITHM = "HmacSHA1";
    private static final String BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    private static final SecureRandom RANDOM = new SecureRandom();

    /**
     * Genera un secreto Base32 seguro de 20 bytes (160 bits).
     */
    public String generateSecret() {
        byte[] buffer = new byte[20];
        RANDOM.nextBytes(buffer);
        return encodeBase32(buffer);
    }

    /**
     * Valida un código TOTP contra el secreto Base32 con tolerancia de ±1 paso (±30 segundos).
     */
    public boolean verifyCode(String base32Secret, String inputCode) {
        if (base32Secret == null || inputCode == null || inputCode.length() != DIGITS) {
            return false;
        }

        try {
            int code = Integer.parseInt(inputCode.trim());
            byte[] key = decodeBase32(base32Secret);
            long currentStep = Instant.now().getEpochSecond() / TIME_STEP_SECONDS;

            // Validar en ventana [-1, 0, +1]
            for (long step = currentStep - 1; step <= currentStep + 1; step++) {
                if (generateCodeForStep(key, step) == code) {
                    return true;
                }
            }
        } catch (Exception e) {
            return false;
        }
        return false;
    }

    /**
     * Genera el código para un secreto y paso específico (RFC 6238).
     */
    public int generateCodeForStep(byte[] key, long timeStep) throws Exception {
        byte[] data = ByteBuffer.allocate(8).putLong(timeStep).array();
        Mac mac = Mac.getInstance(HMAC_ALGORITHM);
        mac.init(new SecretKeySpec(key, HMAC_ALGORITHM));
        byte[] hash = mac.doFinal(data);

        int offset = hash[hash.length - 1] & 0x0F;
        int binary = ((hash[offset] & 0x7F) << 24)
                | ((hash[offset + 1] & 0xFF) << 16)
                | ((hash[offset + 2] & 0xFF) << 8)
                | (hash[offset + 3] & 0xFF);

        return binary % MODULUS;
    }

    /**
     * Genera la URI otpauth para escanear en Google Authenticator u otras apps.
     */
    public String generateOtpAuthUri(String issuer, String accountEmail, String base32Secret) {
        String encodedIssuer = URLEncoder.encode(issuer, StandardCharsets.UTF_8).replace("+", "%20");
        String encodedAccount = URLEncoder.encode(accountEmail, StandardCharsets.UTF_8).replace("+", "%20");
        return String.format("otpauth://totp/%s:%s?secret=%s&issuer=%s&algorithm=SHA1&digits=%d&period=%d",
                encodedIssuer, encodedAccount, base32Secret, encodedIssuer, DIGITS, TIME_STEP_SECONDS);
    }

    /**
     * Genera 8 códigos de recuperación de 10 caracteres alfanuméricos.
     */
    public List<String> generateRecoveryCodes(int count) {
        List<String> codes = new ArrayList<>(count);
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin I, O, 0, 1 para legibilidad
        for (int i = 0; i < count; i++) {
            StringBuilder sb = new StringBuilder(10);
            for (int j = 0; j < 10; j++) {
                sb.append(chars.charAt(RANDOM.nextInt(chars.length())));
            }
            codes.add(sb.toString());
        }
        return codes;
    }

    /**
     * Calcula hash SHA-256 de un código de recuperación.
     */
    public String hashRecoveryCode(String code) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(code.toUpperCase().trim().getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new IllegalStateException("Error al hashear código de recuperación", e);
        }
    }

    // --- Métodos de codificación Base32 (RFC 4648) ---
    private static String encodeBase32(byte[] data) {
        StringBuilder result = new StringBuilder();
        int buffer = 0;
        int next = 0;
        int bitsLeft = 0;
        while (next < data.length) {
            buffer = (buffer << 8) | (data[next++] & 0xFF);
            bitsLeft += 8;
            while (bitsLeft >= 5) {
                bitsLeft -= 5;
                result.append(BASE32_CHARS.charAt((buffer >> bitsLeft) & 0x1F));
            }
        }
        if (bitsLeft > 0) {
            buffer <<= (5 - bitsLeft);
            result.append(BASE32_CHARS.charAt(buffer & 0x1F));
        }
        return result.toString();
    }

    private static byte[] decodeBase32(String base32) {
        String clean = base32.toUpperCase().replaceAll("[^A-Z2-7]", "");
        int numBytes = clean.length() * 5 / 8;
        byte[] result = new byte[numBytes];
        int buffer = 0;
        int bitsLeft = 0;
        int byteIndex = 0;
        for (char c : clean.toCharArray()) {
            int val = BASE32_CHARS.indexOf(c);
            if (val < 0) continue;
            buffer = (buffer << 5) | val;
            bitsLeft += 5;
            if (bitsLeft >= 8) {
                bitsLeft -= 8;
                if (byteIndex < numBytes) {
                    result[byteIndex++] = (byte) ((buffer >> bitsLeft) & 0xFF);
                }
            }
        }
        return result;
    }
}
