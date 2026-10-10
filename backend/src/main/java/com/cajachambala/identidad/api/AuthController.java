package com.cajachambala.identidad.api;

import com.cajachambala.identidad.application.ChangePasswordUseCase;
import com.cajachambala.identidad.application.DisableMfaUseCase;
import com.cajachambala.identidad.application.EmailChangeUseCase;
import com.cajachambala.identidad.application.LoginUseCase;
import com.cajachambala.identidad.application.SetupMfaUseCase;
import com.cajachambala.identidad.application.UpdateAdminProfileUseCase;
import com.cajachambala.identidad.application.VerifyMfaUseCase;
import com.cajachambala.identidad.application.dto.AuthDtos.*;
import com.cajachambala.identidad.domain.AppUser;
import com.cajachambala.identidad.domain.UserRole;
import com.cajachambala.identidad.infrastructure.audit.AuditService;
import com.cajachambala.identidad.infrastructure.persistence.AppUserRepository;
import com.cajachambala.identidad.infrastructure.security.JwtService;
import com.cajachambala.identidad.infrastructure.security.RefreshTokenService;
import com.cajachambala.shared.infrastructure.security.UserContext;
import com.cajachambala.shared.infrastructure.security.UserContextHolder;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final LoginUseCase loginUseCase;
    private final VerifyMfaUseCase verifyMfaUseCase;
    private final SetupMfaUseCase setupMfaUseCase;
    private final ChangePasswordUseCase changePasswordUseCase;
    private final RefreshTokenService refreshTokenService;
    private final JwtService jwtService;
    private final AppUserRepository appUserRepository;
    private final UpdateAdminProfileUseCase updateAdminProfileUseCase;
    private final DisableMfaUseCase disableMfaUseCase;
    private final EmailChangeUseCase emailChangeUseCase;

    public AuthController(
            LoginUseCase loginUseCase,
            VerifyMfaUseCase verifyMfaUseCase,
            SetupMfaUseCase setupMfaUseCase,
            ChangePasswordUseCase changePasswordUseCase,
            RefreshTokenService refreshTokenService,
            JwtService jwtService,
            AppUserRepository appUserRepository,
            UpdateAdminProfileUseCase updateAdminProfileUseCase,
            DisableMfaUseCase disableMfaUseCase,
            EmailChangeUseCase emailChangeUseCase
    ) {
        this.loginUseCase = loginUseCase;
        this.verifyMfaUseCase = verifyMfaUseCase;
        this.setupMfaUseCase = setupMfaUseCase;
        this.changePasswordUseCase = changePasswordUseCase;
        this.refreshTokenService = refreshTokenService;
        this.jwtService = jwtService;
        this.appUserRepository = appUserRepository;
        this.updateAdminProfileUseCase = updateAdminProfileUseCase;
        this.disableMfaUseCase = disableMfaUseCase;
        this.emailChangeUseCase = emailChangeUseCase;
    }

    @PostMapping("/admin/login")
    public ResponseEntity<LoginResponse> loginAdmin(@RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        LoginResponse response = loginUseCase.execute(request, UserRole.ADMIN, httpRequest);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/socio/login")
    public ResponseEntity<LoginResponse> loginSocio(@RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        LoginResponse response = loginUseCase.execute(request, UserRole.SOCIO, httpRequest);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> loginGeneric(@RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        LoginResponse response = loginUseCase.execute(request, null, httpRequest);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/mfa/verify")
    public ResponseEntity<LoginResponse> verifyMfa(@RequestBody VerifyMfaRequest request, HttpServletRequest httpRequest) {
        LoginResponse response = verifyMfaUseCase.execute(request, httpRequest);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<TokenResponse> refresh(@RequestBody RefreshTokenRequest request, HttpServletRequest httpRequest) {
        String ip = AuditService.getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        RefreshTokenService.RotationResult result = refreshTokenService.rotate(request.refreshToken(), ip, userAgent);
        String accessToken = jwtService.generateAccessToken(result.user());
        return ResponseEntity.ok(new TokenResponse(accessToken, result.newRawRefreshToken()));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestBody(required = false) LogoutRequest request) {
        if (request != null && request.refreshToken() != null) {
            refreshTokenService.revokeToken(request.refreshToken());
        }
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/change-password")
    public ResponseEntity<TokenResponse> changePassword(@RequestBody ChangePasswordRequest request, HttpServletRequest httpRequest) {
        UserContext ctx = UserContextHolder.getContext();
        if (ctx == null) {
            throw new BadCredentialsException("No autenticado");
        }
        TokenResponse response = changePasswordUseCase.execute(ctx.userId(), request, httpRequest);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/mfa/setup")
    public ResponseEntity<MfaSetupResponse> setupMfa(@RequestBody SetupMfaRequest request, HttpServletRequest httpRequest) {
        UserContext ctx = UserContextHolder.getContext();
        if (ctx == null) {
            throw new BadCredentialsException("No autenticado");
        }
        MfaSetupResponse response = setupMfaUseCase.initiate(ctx.userId(), request, httpRequest);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/mfa/confirm")
    public ResponseEntity<MfaConfirmedResponse> confirmMfa(@RequestBody SetupMfaConfirmRequest request, HttpServletRequest httpRequest) {
        UserContext ctx = UserContextHolder.getContext();
        if (ctx == null) {
            throw new BadCredentialsException("No autenticado");
        }
        MfaConfirmedResponse response = setupMfaUseCase.confirm(ctx.userId(), request, httpRequest);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/admin/profile")
    public ResponseEntity<Void> updateAdminProfile(@RequestBody UpdateAdminProfileRequest request, HttpServletRequest httpRequest) {
        UserContext ctx = UserContextHolder.getContext();
        if (ctx == null) throw new BadCredentialsException("No autenticado");
        updateAdminProfileUseCase.execute(ctx.userId(), request, httpRequest);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/mfa/disable")
    public ResponseEntity<Void> disableMfa(@RequestBody DisableMfaRequest request, HttpServletRequest httpRequest) {
        UserContext ctx = UserContextHolder.getContext();
        if (ctx == null) throw new BadCredentialsException("No autenticado");
        disableMfaUseCase.execute(ctx.userId(), request, httpRequest);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/admin/email-change")
    public ResponseEntity<Void> requestAdminEmailChange(@RequestBody RequestEmailChangeRequest request, HttpServletRequest httpRequest) {
        UserContext ctx = UserContextHolder.getContext();
        if (ctx == null) throw new BadCredentialsException("No autenticado");
        emailChangeUseCase.request(ctx.userId(), request, httpRequest);
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/email-change/confirm")
    public ResponseEntity<Void> confirmEmailChange(@RequestBody ConfirmEmailChangeRequest request, HttpServletRequest httpRequest) {
        emailChangeUseCase.confirm(request != null ? request.token() : null, httpRequest);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public ResponseEntity<UserProfileDto> getCurrentUser() {
        UserContext ctx = UserContextHolder.getContext();
        if (ctx == null) {
            throw new BadCredentialsException("No autenticado");
        }
        AppUser user = appUserRepository.findById(ctx.userId())
                .orElseThrow(() -> new BadCredentialsException("Usuario no encontrado"));
        return ResponseEntity.ok(LoginUseCase.toProfileDto(user));
    }
}
