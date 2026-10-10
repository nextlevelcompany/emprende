package com.cajachambala.identidad.infrastructure.persistence;

import com.cajachambala.identidad.domain.OneTimeToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;
import com.cajachambala.identidad.domain.TokenProposito;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.time.Instant;

@Repository
public interface OneTimeTokenRepository extends JpaRepository<OneTimeToken, UUID> {
    Optional<OneTimeToken> findByTokenHash(String tokenHash);
    Optional<OneTimeToken> findByTokenHashAndProposito(String tokenHash, TokenProposito proposito);
    long deleteByPropositoAndExpiresAtBefore(TokenProposito proposito, Instant before);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM OneTimeToken t WHERE t.tokenHash = :hash AND t.proposito = :proposito")
    Optional<OneTimeToken> findByTokenHashAndPropositoForUpdate(@Param("hash") String hash, @Param("proposito") TokenProposito proposito);
}
