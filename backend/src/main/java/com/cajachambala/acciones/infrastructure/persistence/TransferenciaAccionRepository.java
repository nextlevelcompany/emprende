package com.cajachambala.acciones.infrastructure.persistence;

import com.cajachambala.acciones.domain.TransferenciaAccion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TransferenciaAccionRepository extends JpaRepository<TransferenciaAccion, UUID> {

    List<TransferenciaAccion> findByCajaIdOrderByNumeroTransferenciaDesc(UUID cajaId);

    @Query("SELECT COALESCE(MAX(t.numeroTransferencia), 0) FROM TransferenciaAccion t WHERE t.cajaId = :cajaId")
    Integer findMaxNumeroTransferenciaByCajaId(@Param("cajaId") UUID cajaId);
}
