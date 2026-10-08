package com.cajachambala.acciones.infrastructure.persistence;

import com.cajachambala.acciones.domain.CertificadoAccion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CertificadoAccionRepository extends JpaRepository<CertificadoAccion, UUID> {

    List<CertificadoAccion> findByCajaIdOrderByNumeroCertificadoDesc(UUID cajaId);

    List<CertificadoAccion> findByCajaIdAndSocioIdOrderBySerieInicioAsc(UUID cajaId, UUID socioId);

    List<CertificadoAccion> findByCajaIdAndEstadoOrderBySerieInicioAsc(UUID cajaId, String estado);

    Optional<CertificadoAccion> findByIdAndCajaId(UUID id, UUID cajaId);

    @Query("SELECT COALESCE(MAX(c.numeroCertificado), 0) FROM CertificadoAccion c WHERE c.cajaId = :cajaId")
    Integer findMaxNumeroCertificadoByCajaId(@Param("cajaId") UUID cajaId);

    @Query("SELECT COALESCE(MAX(c.serieFin), 0) FROM CertificadoAccion c WHERE c.cajaId = :cajaId")
    Integer findMaxSerieFinByCajaId(@Param("cajaId") UUID cajaId);

    @Query("SELECT c FROM CertificadoAccion c WHERE c.cajaId = :cajaId AND :numeroSerie BETWEEN c.serieInicio AND c.serieFin")
    List<CertificadoAccion> findByCajaIdAndNumeroSerie(@Param("cajaId") UUID cajaId, @Param("numeroSerie") Integer numeroSerie);
}
