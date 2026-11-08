package com.cajachambala.identidad.infrastructure.persistence;

import com.cajachambala.identidad.domain.AppUser;
import com.cajachambala.identidad.domain.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import jakarta.persistence.LockModeType;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AppUserRepository extends JpaRepository<AppUser, UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM AppUser u WHERE u.id = :id")
    Optional<AppUser> findByIdForUpdate(@Param("id") UUID id);
    Optional<AppUser> findByEmail(String email);
    Optional<AppUser> findByEmailChangeTokenHash(String emailChangeTokenHash);
    boolean existsByPendingEmail(String pendingEmail);
    Optional<AppUser> findBySocioId(UUID socioId);
    java.util.List<AppUser> findBySocioIdIn(java.util.Collection<UUID> socioIds);
    boolean existsByCajaIdAndRole(UUID cajaId, UserRole role);
}
