package com.cajachambala.identidad.infrastructure.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;

@Service
public class AesGcmCryptoService {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int IV_LENGTH_BYTE = 12;
    private static final int TAG_LENGTH_BIT = 128;

    private final SecretKey secretKey;
    private final SecureRandom secureRandom = new SecureRandom();

    public AesGcmCryptoService(@Value("${security.crypto.secret}") String rawKey) {
        try {
            MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
            byte[] keyBytes = sha256.digest(rawKey.getBytes(StandardCharsets.UTF_8));
            this.secretKey = new SecretKeySpec(keyBytes, "AES");
        } catch (Exception e) {
            throw new IllegalStateException("Error al inicializar la clave de cifrado AES-GCM", e);
        }
    }

    public byte[] encrypt(byte[] plaintext) {
        if (plaintext == null) {
            return null;
        }
        try {
            byte[] iv = new byte[IV_LENGTH_BYTE];
            secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(TAG_LENGTH_BIT, iv);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, parameterSpec);

            byte[] cipherText = cipher.doFinal(plaintext);

            // Prefijar IV: [IV (12 bytes)][Ciphertext + AuthTag]
            ByteBuffer byteBuffer = ByteBuffer.allocate(iv.length + cipherText.length);
            byteBuffer.put(iv);
            byteBuffer.put(cipherText);
            return byteBuffer.array();
        } catch (Exception e) {
            throw new IllegalStateException("Error al cifrar datos con AES-GCM", e);
        }
    }

    public byte[] decrypt(byte[] encryptedData) {
        if (encryptedData == null || encryptedData.length < IV_LENGTH_BYTE) {
            return null;
        }
        try {
            ByteBuffer byteBuffer = ByteBuffer.wrap(encryptedData);
            byte[] iv = new byte[IV_LENGTH_BYTE];
            byteBuffer.get(iv);

            byte[] cipherText = new byte[byteBuffer.remaining()];
            byteBuffer.get(cipherText);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(TAG_LENGTH_BIT, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, parameterSpec);

            return cipher.doFinal(cipherText);
        } catch (Exception e) {
            throw new IllegalStateException("Error al descifrar datos con AES-GCM: autenticación fallida o datos alterados", e);
        }
    }

    public byte[] encryptString(String text) {
        if (text == null) return null;
        return encrypt(text.getBytes(StandardCharsets.UTF_8));
    }

    public String decryptString(byte[] encryptedData) {
        byte[] decrypted = decrypt(encryptedData);
        if (decrypted == null) return null;
        return new String(decrypted, StandardCharsets.UTF_8);
    }

    public String hmacSha256(String text) {
        if (text == null || text.isBlank()) return null;
        try {
            javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
            mac.init(secretKey);
            byte[] hmacBytes = mac.doFinal(text.trim().getBytes(StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(hmacBytes);
        } catch (Exception e) {
            throw new IllegalStateException("Error al calcular HMAC-SHA256", e);
        }
    }
}
