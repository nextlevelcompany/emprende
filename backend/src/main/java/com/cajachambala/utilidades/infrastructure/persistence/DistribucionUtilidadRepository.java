package com.cajachambala.utilidades.infrastructure.persistence;

import com.cajachambala.utilidades.domain.DistribucionUtilidad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DistribucionUtilidadRepository extends JpaRepository<DistribucionUtilidad, UUID> {

    Optional<DistribucionUtilidad> findByIdAndCajaId(UUID id, UUID cajaId);

    Optional<DistribucionUtilidad> findByCajaIdAndEjercicio(UUID cajaId, Short ejercicio);

    List<DistribucionUtilidad> findByCajaIdOrderByEjercicioDesc(UUID cajaId);
}
