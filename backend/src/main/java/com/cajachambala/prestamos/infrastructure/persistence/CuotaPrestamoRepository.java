package com.cajachambala.prestamos.infrastructure.persistence;

import com.cajachambala.prestamos.domain.CuotaEstado;
import com.cajachambala.prestamos.domain.CuotaPrestamo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CuotaPrestamoRepository extends JpaRepository<CuotaPrestamo, UUID> {

    List<CuotaPrestamo> findByPrestamoIdOrderByNroCuotaAsc(UUID prestamoId);

    Optional<CuotaPrestamo> findByIdAndPrestamoId(UUID id, UUID prestamoId);

    @Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from CuotaPrestamo c where c.id = :id and c.prestamo.id = :prestamoId")
    Optional<CuotaPrestamo> findByIdAndPrestamoIdForUpdate(@Param("id") UUID id, @Param("prestamoId") UUID prestamoId);

    Optional<CuotaPrestamo> findByPrestamoIdAndNroCuota(UUID prestamoId, Short nroCuota);

    @Query("SELECT c FROM CuotaPrestamo c WHERE c.prestamo.socioId = :socioId AND c.estado IN ('PENDIENTE', 'PARCIAL', 'VENCIDA') ORDER BY c.fechaVencimiento ASC")
    List<CuotaPrestamo> findPendientesPorSocio(@Param("socioId") UUID socioId);

    @Query("SELECT c FROM CuotaPrestamo c WHERE c.prestamo.cajaId = :cajaId AND c.estado IN ('PENDIENTE', 'PARCIAL') AND c.fechaVencimiento < :fechaActual")
    List<CuotaPrestamo> findCuotasParaVencer(@Param("cajaId") UUID cajaId, @Param("fechaActual") LocalDate fechaActual);

    @Query("SELECT c FROM CuotaPrestamo c WHERE c.prestamo.cajaId = :cajaId AND c.prestamo.estado = 'VIGENTE' AND c.estado IN ('PENDIENTE', 'PARCIAL', 'VENCIDA') ORDER BY c.fechaVencimiento ASC, c.nroCuota ASC")
    List<CuotaPrestamo> findPendientesVigentesPorCaja(@Param("cajaId") UUID cajaId);

    @Query("SELECT c FROM CuotaPrestamo c WHERE c.prestamo.cajaId = :cajaId AND c.prestamo.socioId = :socioId AND c.prestamo.estado = 'VIGENTE' AND c.estado IN ('PENDIENTE', 'PARCIAL', 'VENCIDA') ORDER BY c.fechaVencimiento ASC, c.nroCuota ASC")
    List<CuotaPrestamo> findPendientesVigentesPorSocio(@Param("cajaId") UUID cajaId, @Param("socioId") UUID socioId);
}
