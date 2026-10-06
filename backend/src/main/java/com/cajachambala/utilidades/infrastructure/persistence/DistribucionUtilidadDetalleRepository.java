package com.cajachambala.utilidades.infrastructure.persistence;

import com.cajachambala.utilidades.domain.DistribucionDetalleId;
import com.cajachambala.utilidades.domain.DistribucionUtilidadDetalle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DistribucionUtilidadDetalleRepository extends JpaRepository<DistribucionUtilidadDetalle, DistribucionDetalleId> {

    List<DistribucionUtilidadDetalle> findByIdDistribucionId(UUID distribucionId);

    List<DistribucionUtilidadDetalle> findByIdSocioId(UUID socioId);
}
