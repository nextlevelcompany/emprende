package com.cajachambala.caja.infrastructure.persistence;

import com.cajachambala.caja.domain.Periodo;
import com.cajachambala.caja.domain.PeriodoEstado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PeriodoRepository extends JpaRepository<Periodo, UUID> {

    Optional<Periodo> findByIdAndCajaId(UUID id, UUID cajaId);

    @Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Periodo p where p.id = :id and p.cajaId = :cajaId")
    Optional<Periodo> findByIdAndCajaIdForUpdate(@Param("id") UUID id, @Param("cajaId") UUID cajaId);

    Optional<Periodo> findByCajaIdAndAnioAndMes(UUID cajaId, Short anio, Short mes);

    Optional<Periodo> findFirstByCajaIdAndEstadoOrderByAnioDescMesDesc(UUID cajaId, PeriodoEstado estado);

    List<Periodo> findByCajaIdOrderByAnioDescMesDesc(UUID cajaId);
}
