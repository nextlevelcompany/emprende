package com.cajachambala.identidad.application;

import com.cajachambala.identidad.application.dto.AuthDtos.*;
import com.cajachambala.identidad.domain.AppUser;
import com.cajachambala.identidad.infrastructure.audit.AuditService;
import com.cajachambala.identidad.infrastructure.persistence.AppUserRepository;
import com.cajachambala.identidad.infrastructure.security.AesGcmCryptoService;
import com.cajachambala.identidad.infrastructure.security.TotpService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class SetupMfaUseCase {

    private final AppUserRepository appUserRepository;
    private final TotpService totpService;
    private final AesGcmCryptoService aesGcmCryptoService;
    private final AuditService auditService;

    public SetupMfaUseCase(
            AppUserRepository appUserRepository,
            TotpService totpService,
            AesGcmCryptoService aesGcmCryptoService,
            AuditService auditService
    ) {
        this.appUserRepository = appUserRepository;
        this.totpService = totpService;
        this.aesGcmCryptoService = aesGcmCryptoService;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public MfaSetupResponse initiate(UUID userId) {
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        String base32Secret = totpService.generateSecret();
        String otpAuthUri = totpService.generateOtpAuthUri("Caja Chambala", user.getEmail(), base32Secret);

        return new MfaSetupResponse(base32Secret, otpAuthUri);
    }

    @Transactional
    public MfaConfirmedResponse confirm(UUID userId, SetupMfaConfirmRequest request, HttpServletRequest httpRequest) {
        if (request == null || request.secret() == null || request.code() == null) {
            throw new IllegalArgumentException("Datos de confirmación incompletos");
        }

        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        boolean isValid = totpService.verifyCode(request.secret(), request.code());
        if (!isValid) {
            throw new IllegalArgumentException("Código de verificación incorrecto. Asegúrate de haber sincronizado la hora de tu aplicación.");
        }

        byte[] secretEnc = aesGcmCryptoService.encryptString(request.secret());
        List<String> rawRecoveryCodes = totpService.generateRecoveryCodes(8);
        List<String> hashedCodes = rawRecoveryCodes.stream()
                .map(totpService::hashRecoveryCode)
                .toList();

        user.enableMfa(secretEnc, hashedCodes);
        appUserRepository.save(user);

        auditService.logSecurityEvent(user.getCajaId(), user.getId(), user.getRole(), "MFA_ENABLED", "Segundo factor de autenticación configurado exitosamente", httpRequest);

        return new MfaConfirmedResponse(true, rawRecoveryCodes);
    }
}
