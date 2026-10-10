package com.cajachambala.identidad.application.dto;

import com.cajachambala.identidad.domain.UserRole;
import com.cajachambala.identidad.domain.UserStatus;

import java.util.List;
import java.util.UUID;

public class AuthDtos {

    public record LoginRequest(
            String email,
            String password
    ) {}

    public record RefreshTokenRequest(
            String refreshToken
    ) {}

    public record LogoutRequest(
            String refreshToken
    ) {}

    public record VerifyMfaRequest(
            String mfaToken,
            String code
    ) {}

    public record SetupMfaConfirmRequest(
            String secret,
            String code,
            String currentPassword
    ) {}

    public record SetupMfaRequest(String currentPassword) {}

    public record ChangePasswordRequest(
            String currentPassword,
            String newPassword,
            String mfaCode
    ) {}

    public record UpdateAdminProfileRequest(
            String currentPassword,
            String displayName,
            String phone,
            String locale,
            Boolean notificationsEnabled
    ) {}

    public record RequestEmailChangeRequest(
            String currentPassword,
            String mfaCode,
            String newEmail
    ) {}

    public record ConfirmEmailChangeRequest(String token) {}

    public record DisableMfaRequest(String currentPassword, String code) {}

    public record LoginResponse(
            boolean mfaRequired,
            String mfaToken,
            String accessToken,
            String refreshToken,
            UserProfileDto user
    ) {}

    public record TokenResponse(
            String accessToken,
            String refreshToken
    ) {}

    public record MfaSetupResponse(
            String secret,
            String otpAuthUri
    ) {}

    public record MfaConfirmedResponse(
            boolean success,
            List<String> recoveryCodes,
            String accessToken,
            String refreshToken
    ) {}

    public record UserProfileDto(
            UUID id,
            UUID cajaId,
            String email,
            UserRole role,
            UserStatus status,
            UUID socioId,
            boolean mustChangePassword,
            boolean mfaEnabled,
            String displayName,
            String phone,
            String locale,
            boolean notificationsEnabled,
            java.time.Instant passwordChangedAt,
            java.time.Instant createdAt,
            java.time.Instant lastLoginAt,
            String pendingEmail
    ) {}
}
