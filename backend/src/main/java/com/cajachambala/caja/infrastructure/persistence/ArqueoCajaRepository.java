package com.cajachambala.caja.infrastructure.persistence;

import com.cajachambala.caja.domain.ArqueoCaja;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ArqueoCajaRepository extends JpaRepository<ArqueoCaja, UUID> {
}
