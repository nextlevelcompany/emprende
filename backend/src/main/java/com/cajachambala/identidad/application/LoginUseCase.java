package com.cajachambala.identidad.application;

import com.cajachambala.identidad.application.dto.AuthDtos.*;
import com.cajachambala.identidad.domain.AppUser;
import com.cajachambala.identidad.domain.UserRole;
import com.cajachambala.identidad.infrastructure.audit.AuditService;
import com.cajachambala.identidad.infrastructure.persistence.AppUserRepository;
import com.cajachambala.identidad.infrastructure.security.JwtService;
import com.cajachambala.identidad.infrastructure.security.PasswordService;
import com.cajachambala.identidad.infrastructure.security.RefreshTokenService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.Optional;

@Service
public class LoginUseCase {

    private final AppUserRepository appUserRepository;
    private final PasswordService passwordService;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final AuditService auditService;

    // Dummy hash para mitigar timing attacks si el usuario no existe
    private static final String DUMMY_HASH = "$argon2id$v=19$m=65536,t=3,p=1$c29tZXNhbHQxNmJ5dGVz$aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final Duration LOCK_DURATION = Duration.ofMinutes(15);

    public LoginUseCase(
            AppUserRepository appUserRepository,
            PasswordService passwordService,
            JwtService jwtService,
            RefreshTokenService refreshTokenService,
            AuditService auditService
    ) {
        this.appUserRepository = appUserRepository;
        this.passwordService = passwordService;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.auditService = auditService;
    }

    @Transactional
    public LoginResponse execute(LoginRequest request, UserRole expectedRole, HttpServletRequest httpRequest) {
        if (request == null || request.email() == null || request.password() == null) {
            throw new BadCredentialsException("Credenciales de acceso incompletas");
        }

        String normalizedEmail = request.email().toLowerCase().trim();
        Optional<AppUser> userOpt = appUserRepository.findByEmail(normalizedEmail);

        if (userOpt.isEmpty()) {
            // Protección contra timing attacks
            passwordService.matches(request.password(), DUMMY_HASH);
            throw new BadCredentialsException("Credenciales no válidas");
        }

        AppUser user = userOpt.get();

        if (user.isAccountLocked()) {
            auditService.logSecurityEvent(user.getCajaId(), user.getId(), user.getRole(), "LOGIN_BLOCKED", "Cuenta temporalmente bloqueada", httpRequest);
            throw new LockedException("Tu cuenta se encuentra temporalmente bloqueada por reiterados intentos fallidos. Intenta más tarde.");
        }

        if (expectedRole != null && user.getRole() != expectedRole) {
            // Protección contra enumeración y separación estricta de portales
            passwordService.matches(request.password(), DUMMY_HASH);
            auditService.logSecurityEvent(user.getCajaId(), user.getId(), user.getRole(), "LOGIN_ROLE_MISMATCH", "Intento de acceso con rol incorrecto", httpRequest);
            throw new BadCredentialsException("Credenciales no válidas para este portal de acceso");
        }

        boolean passwordValid = passwordService.matches(request.password(), user.getPasswordHash());
        if (!passwordValid) {
            user.recordFailedLogin(MAX_FAILED_ATTEMPTS, LOCK_DURATION);
            appUserRepository.save(user);
            auditService.logSecurityEvent(user.getCajaId(), user.getId(), user.getRole(), "LOGIN_FAILED", "Contraseña incorrecta. Intento #" + user.getFailedLoginCount(), httpRequest);
            throw new BadCredentialsException("Credenciales no válidas");
        }

        // Si el usuario requiere MFA (o tiene MFA activado)
        if (user.isMfaEnabled()) {
            String mfaToken = jwtService.generateMfaToken(user);
            auditService.logSecurityEvent(user.getCajaId(), user.getId(), user.getRole(), "LOGIN_MFA_CHALLENGE", "Solicitud de token TOTP", httpRequest);
            return new LoginResponse(true, mfaToken, null, null, null);
        }

        // Si es ADMIN y aún no tiene MFA configurado, en primer inicio puede ingresar con aviso
        user.recordSuccessfulLogin();
        appUserRepository.save(user);

        String ip = AuditService.getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        RefreshTokenService.TokenPair tokenPair = refreshTokenService.createRefreshToken(user.getId(), null, ip, userAgent);
        String accessToken = jwtService.generateAccessToken(user);

        auditService.logSecurityEvent(user.getCajaId(), user.getId(), user.getRole(), "LOGIN_SUCCESS", "Acceso exitoso al sistema", httpRequest);

        UserProfileDto profile = toProfileDto(user);
        return new LoginResponse(false, null, accessToken, tokenPair.rawRefreshToken(), profile);
    }

    public static UserProfileDto toProfileDto(AppUser user) {
        return new UserProfileDto(
                user.getId(),
                user.getCajaId(),
                user.getEmail(),
                user.getRole(),
                user.getStatus(),
                user.getSocioId(),
                user.isMustChangePassword(),
                user.isMfaEnabled()
        );
    }
}
