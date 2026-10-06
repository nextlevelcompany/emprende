package com.cajachambala.caja.infrastructure.persistence;

import com.cajachambala.caja.domain.Operacion;
import com.cajachambala.caja.domain.OperacionEstado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OperacionRepository extends JpaRepository<Operacion, UUID> {

    Optional<Operacion> findByIdAndCajaId(UUID id, UUID cajaId);

    List<Operacion> findByCajaIdAndPeriodoIdAndEstadoOrderByFechaAscNroReciboAsc(UUID cajaId, UUID periodoId, OperacionEstado estado);

    List<Operacion> findByPeriodoIdOrderByFechaAscNroReciboAsc(UUID periodoId);

    List<Operacion> findByCajaIdAndSocioIdAndEstadoOrderByFechaDesc(UUID cajaId, UUID socioId, OperacionEstado estado);

    @Query("SELECT COALESCE(MAX(o.nroRecibo), 0) FROM Operacion o WHERE o.cajaId = :cajaId AND o.estado = 'VIGENTE'")
    Integer findMaxNroReciboByCajaId(@Param("cajaId") UUID cajaId);
}
