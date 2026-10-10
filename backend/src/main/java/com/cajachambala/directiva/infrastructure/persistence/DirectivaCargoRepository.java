package com.cajachambala.directiva.infrastructure.persistence;

import com.cajachambala.directiva.domain.DirectivaCargo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DirectivaCargoRepository extends JpaRepository<DirectivaCargo, UUID> {

    List<DirectivaCargo> findByCajaIdAndActivoTrueOrderByOrdenAsc(UUID cajaId);

    List<DirectivaCargo> findByCajaIdOrderByOrdenAsc(UUID cajaId);

    Optional<DirectivaCargo> findByIdAndCajaId(UUID id, UUID cajaId);

    Optional<DirectivaCargo> findByCajaIdAndCargo(UUID cajaId, String cargo);
}
