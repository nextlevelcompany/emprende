package com.cajachambala.identidad.infrastructure.bootstrap;

import com.cajachambala.identidad.domain.AppUser;
import com.cajachambala.identidad.domain.UserRole;
import com.cajachambala.identidad.infrastructure.audit.AuditService;
import com.cajachambala.identidad.infrastructure.persistence.AppUserRepository;
import com.cajachambala.identidad.infrastructure.security.PasswordService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Component
public class BootstrapAdminRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(BootstrapAdminRunner.class);
    private static final UUID DEFAULT_CAJA_ID = UUID.fromString("a0000000-0000-0000-0000-000000000001");

    private final AppUserRepository appUserRepository;
    private final PasswordService passwordService;
    private final AuditService auditService;
    private final String defaultEmail;
    private final String defaultPassword;

    public BootstrapAdminRunner(
            AppUserRepository appUserRepository,
            PasswordService passwordService,
            AuditService auditService,
            @Value("${ADMIN_DEFAULT_EMAIL:admin@cajachambala.pe}") String defaultEmail,
            @Value("${ADMIN_DEFAULT_PASSWORD:Admin12345678#Chambala}") String defaultPassword
    ) {
        this.appUserRepository = appUserRepository;
        this.passwordService = passwordService;
        this.auditService = auditService;
        this.defaultEmail = defaultEmail;
        this.defaultPassword = defaultPassword;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        boolean hasAdmin = appUserRepository.existsByCajaIdAndRole(DEFAULT_CAJA_ID, UserRole.ADMIN);
        if (!hasAdmin) {
            log.info("No se encontró usuario administrador inicial. Creando administrador por defecto para Caja Chambala...");
            String passwordHash = passwordService.encode(defaultPassword);
            AppUser admin = AppUser.create(
                    DEFAULT_CAJA_ID,
                    defaultEmail,
                    passwordHash,
                    UserRole.ADMIN,
                    null,
                    true // Forzar cambio de contraseña en primer inicio
            );
            AppUser saved = appUserRepository.save(admin);
            auditService.log(
                    DEFAULT_CAJA_ID,
                    saved.getId(),
                    UserRole.ADMIN,
                    "ADMIN_BOOTSTRAPPED",
                    "app_user",
                    saved.getId(),
                    null,
                    "{\"email\":\"" + defaultEmail + "\",\"must_change_password\":true}",
                    "127.0.0.1",
                    "system-bootstrap",
                    null
            );
            log.info("Usuario administrador inicial creado exitosamente con email: {}", defaultEmail);
        }
    }
}
