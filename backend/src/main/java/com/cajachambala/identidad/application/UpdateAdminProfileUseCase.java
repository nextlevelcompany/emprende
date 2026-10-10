package com.cajachambala.identidad.application;

import com.cajachambala.identidad.application.dto.AuthDtos.UpdateAdminProfileRequest;
import com.cajachambala.identidad.domain.AppUser;
import com.cajachambala.identidad.domain.UserRole;
import com.cajachambala.identidad.infrastructure.audit.AuditService;
import com.cajachambala.identidad.infrastructure.persistence.AppUserRepository;
import com.cajachambala.identidad.infrastructure.security.PasswordService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class UpdateAdminProfileUseCase {
    private final AppUserRepository users;
    private final PasswordService passwords;
    private final AuditService audit;

    public UpdateAdminProfileUseCase(AppUserRepository users, PasswordService passwords, AuditService audit) {
        this.users = users;
        this.passwords = passwords;
        this.audit = audit;
    }

    @Transactional
    public void execute(UUID userId, UpdateAdminProfileRequest request, HttpServletRequest httpRequest) {
        if (request == null || request.currentPassword() == null) throw new BadCredentialsException("Confirma tu contraseña para guardar los cambios");
        AppUser user = users.findById(userId).orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        if (user.getRole() != UserRole.ADMIN) throw new org.springframework.security.access.AccessDeniedException("Solo administración puede actualizar este perfil");
        if (!passwords.matches(request.currentPassword(), user.getPasswordHash())) {
            audit.logSecurityEvent(user.getCajaId(), user.getId(), user.getRole(), "ADMIN_PROFILE_UPDATE_FAILED", "Contraseña actual incorrecta", httpRequest);
            throw new BadCredentialsException("La contraseña actual no es correcta");
        }

        String displayName = request.displayName() == null ? user.getDisplayName() : request.displayName().trim();
        String phone = request.phone() == null ? user.getPhone() : request.phone().trim();
        if (displayName != null && displayName.isBlank()) displayName = null;
        if (phone != null && phone.isBlank()) phone = null;
        String locale = request.locale() == null ? user.getLocale() : request.locale().trim();
        boolean notifications = request.notificationsEnabled() == null ? user.isNotificationsEnabled() : request.notificationsEnabled();
        if (displayName != null && displayName.length() > 100) throw new IllegalArgumentException("El nombre visible no puede superar 100 caracteres");
        if (phone != null && (phone.length() > 30 || !phone.matches("^[+0-9() .-]{7,30}$"))) throw new IllegalArgumentException("Ingresa un teléfono válido de hasta 30 caracteres");
        if (locale == null || !SET_OF_SUPPORTED_LOCALES.contains(locale)) throw new IllegalArgumentException("Preferencia de idioma no válida");

        Map<String, Object> before = profileSnapshot(user);
        user.updateProfile(displayName, phone == null || phone.isBlank() ? null : phone, locale, notifications);
        users.save(user);
        audit.registrar(user.getCajaId(), user.getId(), user.getRole(), "ADMIN_PROFILE_UPDATED", "APP_USER", user.getId(), before, profileSnapshot(user), null, null);
    }

    private Map<String, Object> profileSnapshot(AppUser user) {
        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("displayName", user.getDisplayName());
        snapshot.put("phone", user.getPhone());
        snapshot.put("locale", user.getLocale());
        snapshot.put("notificationsEnabled", user.isNotificationsEnabled());
        return snapshot;
    }

    private static final java.util.Set<String> SET_OF_SUPPORTED_LOCALES = java.util.Set.of("es-PE", "en-US");
}
