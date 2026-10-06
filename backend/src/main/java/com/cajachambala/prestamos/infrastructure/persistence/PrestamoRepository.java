package com.cajachambala.prestamos.infrastructure.persistence;

import com.cajachambala.prestamos.domain.Prestamo;
import com.cajachambala.prestamos.domain.PrestamoEstado;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PrestamoRepository extends JpaRepository<Prestamo, UUID>, JpaSpecificationExecutor<Prestamo> {

    Optional<Prestamo> findByIdAndCajaId(UUID id, UUID cajaId);

    @Query("SELECT COALESCE(MAX(p.numero), 0) FROM Prestamo p WHERE p.cajaId = :cajaId")
    Integer findMaxNumeroByCajaId(@Param("cajaId") UUID cajaId);

    List<Prestamo> findByCajaIdAndSocioIdOrderByNumeroDesc(UUID cajaId, UUID socioId);

    List<Prestamo> findByCajaIdAndEstadoOrderByNumeroDesc(UUID cajaId, PrestamoEstado estado);

    long countByCajaIdAndEstado(UUID cajaId, PrestamoEstado estado);
}
