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
            String code
    ) {}

    public record ChangePasswordRequest(
            String currentPassword,
            String newPassword
    ) {}

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
            List<String> recoveryCodes
    ) {}

    public record UserProfileDto(
            UUID id,
            UUID cajaId,
            String email,
            UserRole role,
            UserStatus status,
            UUID socioId,
            boolean mustChangePassword,
            boolean mfaEnabled
    ) {}
}
