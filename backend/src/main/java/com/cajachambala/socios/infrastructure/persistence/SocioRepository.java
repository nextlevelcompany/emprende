package com.cajachambala.socios.infrastructure.persistence;

import com.cajachambala.socios.domain.Socio;
import com.cajachambala.socios.domain.SocioEstado;
import com.cajachambala.socios.domain.SocioTipo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SocioRepository extends JpaRepository<Socio, UUID>, JpaSpecificationExecutor<Socio> {

    Optional<Socio> findByIdAndCajaId(UUID id, UUID cajaId);

    Optional<Socio> findByCajaIdAndCodigo(UUID cajaId, Integer codigo);

    Optional<Socio> findByCajaIdAndDocumentoTipoAndDocumentoHash(UUID cajaId, String documentoTipo, String documentoHash);

    boolean existsByCajaIdAndDocumentoHashAndDeletedAtIsNull(UUID cajaId, String documentoHash);

    @Query("SELECT COALESCE(MAX(s.codigo), 0) FROM Socio s WHERE s.cajaId = :cajaId")
    Integer findMaxCodigoByCajaId(@Param("cajaId") UUID cajaId);

    List<Socio> findByCajaIdAndDeletedAtIsNullOrderByCodigoAsc(UUID cajaId);

    List<Socio> findByCajaIdAndEstadoAndDeletedAtIsNullOrderByCodigoAsc(UUID cajaId, SocioEstado estado);
}
