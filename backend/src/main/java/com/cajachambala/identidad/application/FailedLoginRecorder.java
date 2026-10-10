package com.cajachambala.identidad.application;

import com.cajachambala.identidad.domain.AppUser;
import com.cajachambala.identidad.infrastructure.persistence.AppUserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.UUID;

@Service
public class FailedLoginRecorder {
    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final Duration LOCK_DURATION = Duration.ofMinutes(15);
    private final AppUserRepository users;

    public FailedLoginRecorder(AppUserRepository users) { this.users = users; }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public short record(UUID userId) {
        AppUser user = users.findByIdForUpdate(userId).orElseThrow();
        user.recordFailedLogin(MAX_FAILED_ATTEMPTS, LOCK_DURATION);
        return user.getFailedLoginCount();
    }
}
