package com.cajachambala.identidad.infrastructure.persistence;

import com.cajachambala.identidad.domain.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    Page<AuditLog> findByCajaIdOrderByOccurredAtDesc(UUID cajaId, Pageable pageable);

    @Query("SELECT a FROM AuditLog a WHERE a.cajaId = :cajaId " +
           "AND (:accion IS NULL OR a.accion = :accion) " +
           "AND (:entidad IS NULL OR a.entidad = :entidad) " +
           "ORDER BY a.occurredAt DESC")
    Page<AuditLog> findByCajaIdWithFilters(
            @Param("cajaId") UUID cajaId,
            @Param("accion") String accion,
            @Param("entidad") String entidad,
            Pageable pageable
    );

    @Query("SELECT DISTINCT a.accion FROM AuditLog a WHERE a.cajaId = :cajaId ORDER BY a.accion ASC")
    List<String> findDistinctAccionesByCajaId(@Param("cajaId") UUID cajaId);

    @Query("SELECT DISTINCT a.entidad FROM AuditLog a WHERE a.cajaId = :cajaId AND a.entidad IS NOT NULL ORDER BY a.entidad ASC")
    List<String> findDistinctEntidadesByCajaId(@Param("cajaId") UUID cajaId);
}
