package com.cajachambala.caja.infrastructure.persistence;

import com.cajachambala.caja.domain.Concepto;
import com.cajachambala.caja.domain.FlujoTipo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConceptoRepository extends JpaRepository<Concepto, Short> {

    List<Concepto> findByActivoTrueOrderByOrdenAsc();

    List<Concepto> findByTipoAndActivoTrueOrderByOrdenAsc(FlujoTipo tipo);

    Optional<Concepto> findByCodigo(String codigo);
}
