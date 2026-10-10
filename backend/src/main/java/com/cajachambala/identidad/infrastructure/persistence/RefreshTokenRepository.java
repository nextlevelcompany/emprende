package com.cajachambala.identidad.infrastructure.persistence;

import com.cajachambala.identidad.domain.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import jakarta.persistence.LockModeType;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM RefreshToken r WHERE r.tokenHash = :tokenHash")
    Optional<RefreshToken> findByTokenHashForUpdate(@Param("tokenHash") String tokenHash);

    @Modifying
    @Query("UPDATE RefreshToken r SET r.revokedAt = CURRENT_TIMESTAMP WHERE r.familyId = :familyId AND r.revokedAt IS NULL")
    void revokeFamily(@Param("familyId") UUID familyId);

    @Modifying
    @Query("UPDATE RefreshToken r SET r.revokedAt = CURRENT_TIMESTAMP WHERE r.userId = :userId AND r.revokedAt IS NULL")
    void revokeAllByUserId(@Param("userId") UUID userId);
}
