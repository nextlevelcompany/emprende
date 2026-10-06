package com.cajachambala.caja.infrastructure.persistence;

import com.cajachambala.caja.domain.CierrePeriodo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CierrePeriodoRepository extends JpaRepository<CierrePeriodo, UUID> {
}
