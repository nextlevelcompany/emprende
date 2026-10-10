package com.cajachambala.acciones.application;

import com.cajachambala.acciones.application.dto.AccionDtos.*;
import com.cajachambala.acciones.domain.CertificadoAccion;
import com.cajachambala.acciones.domain.TransferenciaAccion;
import com.cajachambala.acciones.infrastructure.persistence.CertificadoAccionRepository;
import com.cajachambala.acciones.infrastructure.persistence.TransferenciaAccionRepository;
import com.cajachambala.identidad.domain.UserRole;
import com.cajachambala.identidad.infrastructure.audit.AuditService;
import com.cajachambala.identidad.infrastructure.security.AesGcmCryptoService;
import com.cajachambala.shared.infrastructure.security.UserContext;
import com.cajachambala.shared.infrastructure.security.UserContextHolder;
import com.cajachambala.shared.infrastructure.persistence.CorrelativoService;
import com.cajachambala.socios.domain.Socio;
import com.cajachambala.socios.infrastructure.persistence.SocioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AccionService {

    private final CertificadoAccionRepository certificadoRepository;
    private final TransferenciaAccionRepository transferenciaRepository;
    private final SocioRepository socioRepository;
    private final AuditService auditService;
    private final AesGcmCryptoService cryptoService;
    private final CorrelativoService correlativoService;

    public AccionService(
            CertificadoAccionRepository certificadoRepository,
            TransferenciaAccionRepository transferenciaRepository,
            SocioRepository socioRepository,
            AuditService auditService,
            AesGcmCryptoService cryptoService,
            CorrelativoService correlativoService
    ) {
        this.certificadoRepository = certificadoRepository;
        this.transferenciaRepository = transferenciaRepository;
        this.socioRepository = socioRepository;
        this.auditService = auditService;
        this.cryptoService = cryptoService;
        this.correlativoService = correlativoService;
    }

    @Transactional(readOnly = true)
    public ResumenMatriculaDto getResumenMatricula() {
        UUID cajaId = getCajaIdActual();
        List<CertificadoAccion> allCerts = certificadoRepository.findByCajaIdOrderByNumeroCertificadoDesc(cajaId);

        int totalAccionesEmitidas = 0;
        int totalAccionesActivas = 0;
        int totalAccionesDevueltas = 0;
        int maxSerie = 0;

        Set<UUID> sociosConAcciones = new HashSet<>();

        for (CertificadoAccion c : allCerts) {
            if ("ACTIVO".equals(c.getEstado())) {
                totalAccionesActivas += c.getCantidad();
                if (c.getSocio() != null) {
                    sociosConAcciones.add(c.getSocio().getId());
                }
            } else if ("DEVUELTO_RETIRO".equals(c.getEstado())) {
                totalAccionesDevueltas += c.getCantidad();
            }
            if (c.getSerieFin() > maxSerie) {
                maxSerie = c.getSerieFin();
            }
        }

        totalAccionesEmitidas = totalAccionesActivas + totalAccionesDevueltas;
        BigDecimal capitalSocialActivo = BigDecimal.valueOf(totalAccionesActivas).multiply(BigDecimal.valueOf(30.00));

        return new ResumenMatriculaDto(
                totalAccionesEmitidas,
                totalAccionesActivas,
                totalAccionesDevueltas,
                capitalSocialActivo,
                sociosConAcciones.size(),
                allCerts.size(),
                maxSerie
        );
    }

    @Transactional(readOnly = true)
    public List<SocioMatriculaDto> listarSociosMatricula() {
        UUID cajaId = getCajaIdActual();
        List<Socio> socios = socioRepository.findByCajaIdAndDeletedAtIsNullOrderByCodigoAsc(cajaId);
        List<CertificadoAccion> certsActivos = certificadoRepository.findByCajaIdAndEstadoOrderBySerieInicioAsc(cajaId, "ACTIVO");

        Map<UUID, List<CertificadoAccion>> certsPorSocio = certsActivos.stream()
                .filter(c -> c.getSocio() != null)
                .collect(Collectors.groupingBy(c -> c.getSocio().getId()));

        List<SocioMatriculaDto> resultado = new ArrayList<>();
        for (Socio s : socios) {
            List<CertificadoAccion> socioCerts = certsPorSocio.getOrDefault(s.getId(), Collections.emptyList());
            int totalAcc = socioCerts.stream().mapToInt(CertificadoAccion::getCantidad).sum();

            List<String> rangos = socioCerts.stream()
                    .map(c -> c.getCantidad() == 1 ? "#" + c.getSerieInicio() : "#" + c.getSerieInicio() + " al #" + c.getSerieFin())
                    .toList();

            resultado.add(new SocioMatriculaDto(
                    s.getId(),
                    s.getCodigo(),
                    s.getNombreCompleto(),
                    s.getEstado().name(),
                    totalAcc,
                    BigDecimal.valueOf(totalAcc).multiply(BigDecimal.valueOf(30.00)),
                    rangos,
                    socioCerts.size()
            ));
        }

        return resultado;
    }

    @Transactional(readOnly = true)
    public List<CertificadoAccionDto> listarCertificados(UUID socioId, String estado, String buscar) {
        UUID cajaId = getCajaIdActual();
        UserContext context = UserContextHolder.getContext();
        if (context != null && "SOCIO".equalsIgnoreCase(context.role())) {
            if (context.socioId() == null) {
                throw new org.springframework.security.access.AccessDeniedException("La cuenta no está asociada a un socio");
            }
            socioId = context.socioId();
        }
        final UUID socioFiltro = socioId;
        List<CertificadoAccion> list = certificadoRepository.findByCajaIdOrderByNumeroCertificadoDesc(cajaId);

        return list.stream()
                .filter(c -> socioFiltro == null || (c.getSocio() != null && c.getSocio().getId().equals(socioFiltro)))
                .filter(c -> estado == null || estado.isBlank() || c.getEstado().equalsIgnoreCase(estado))
                .filter(c -> {
                    if (buscar == null || buscar.isBlank()) return true;
                    String b = buscar.trim().toLowerCase();
                    boolean matchNum = String.valueOf(c.getNumeroCertificado()).contains(b);
                    boolean matchSerie = (c.getSerieInicio() <= parseIntOrDefault(b, -1) && parseIntOrDefault(b, -1) <= c.getSerieFin());
                    boolean matchSocio = c.getSocio() != null && c.getSocio().getNombreCompleto().toLowerCase().contains(b);
                    return matchNum || matchSerie || matchSocio;
                })
                .map(this::toCertificadoDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public CertificadoAccionDto obtenerCertificado(UUID id) {
        UUID cajaId = getCajaIdActual();
        CertificadoAccion c = certificadoRepository.findByIdAndCajaId(id, cajaId)
                .orElseThrow(() -> new IllegalArgumentException("Certificado no encontrado"));
        return toCertificadoDto(c);
    }

    @Transactional(readOnly = true)
    public List<TransferenciaAccionDto> listarTransferencias() {
        UUID cajaId = getCajaIdActual();
        return transferenciaRepository.findByCajaIdOrderByNumeroTransferenciaDesc(cajaId).stream()
                .map(this::toTransferenciaDto)
                .toList();
    }

    @Transactional
    public TransferenciaAccionDto registrarTransferencia(RegistrarTransferenciaRequest req) {
        UUID cajaId = getCajaIdActual();
        UUID userId = getUserIdActual();

        CertificadoAccion certOrigen = certificadoRepository.findByIdAndCajaIdForUpdate(req.certificadoOrigenId(), cajaId)
                .orElseThrow(() -> new IllegalArgumentException("Certificado de origen no encontrado"));

        if (!"ACTIVO".equals(certOrigen.getEstado()) && !"EN_CARTERA".equals(certOrigen.getEstado()) && !"DEVUELTO_RETIRO".equals(certOrigen.getEstado())) {
            throw new IllegalStateException("El certificado de origen no se encuentra disponible para transferencia (estado: " + certOrigen.getEstado() + ")");
        }

        if (req.cantidad() > certOrigen.getCantidad()) {
            throw new IllegalArgumentException("La cantidad a transferir (" + req.cantidad() + ") excede la cantidad disponible del certificado (" + certOrigen.getCantidad() + ")");
        }

        Socio socioDestino = socioRepository.findByIdAndCajaId(req.socioDestinoId(), cajaId)
                .orElseThrow(() -> new IllegalArgumentException("Socio destino no encontrado"));

        Socio socioOrigen = certOrigen.getSocio();

        int transSerieInicio = certOrigen.getSerieInicio();
        int transSerieFin = transSerieInicio + req.cantidad() - 1;

        int nextCertNum = correlativoService.siguiente(cajaId, "CERTIFICADO", certificadoRepository.findMaxNumeroCertificadoByCajaId(cajaId) + 1);
        int nextTransNum = correlativoService.siguiente(cajaId, "TRANSFERENCIA", transferenciaRepository.findMaxNumeroTransferenciaByCajaId(cajaId) + 1);

        LocalDate fecha = req.fecha() != null ? req.fecha() : LocalDate.now();
        BigDecimal precio = req.precioUnitario() != null ? req.precioUnitario() : BigDecimal.valueOf(30.00);

        CertificadoAccion certDestino;

        if (req.cantidad().equals(certOrigen.getCantidad())) {
            // Transferencia total del lote
            certOrigen.marcarTransferido("Transferido totalmente a " + socioDestino.getNombreCompleto());
            certificadoRepository.save(certOrigen);

            certDestino = new CertificadoAccion(
                    cajaId,
                    nextCertNum,
                    socioDestino,
                    transSerieInicio,
                    transSerieFin,
                    precio,
                    fecha,
                    null,
                    null,
                    "ACTIVO",
                    "TRASPASO_VENTA",
                    certOrigen.getId(),
                    "Adquirido por traspaso de " + (socioOrigen != null ? socioOrigen.getNombreCompleto() : "Tesorería de Caja"),
                    userId
            );
            certificadoRepository.save(certDestino);
        } else {
            // Transferencia parcial con desdoblamiento
            int retainedSerieInicio = transSerieFin + 1;
            int retainedSerieFin = certOrigen.getSerieFin();

            // 1. Crear nuevo certificado para el destino con las acciones transferidas
            certDestino = new CertificadoAccion(
                    cajaId,
                    nextCertNum,
                    socioDestino,
                    transSerieInicio,
                    transSerieFin,
                    precio,
                    fecha,
                    null,
                    null,
                    "ACTIVO",
                    "TRASPASO_VENTA",
                    certOrigen.getId(),
                    "Adquirido por traspaso parcial de " + (socioOrigen != null ? socioOrigen.getNombreCompleto() : "Tesorería de Caja"),
                    userId
            );
            certificadoRepository.save(certDestino);

            // 2. Modificar el origen para conservar solo el remanente
            certOrigen.actualizarRango(retainedSerieFin);
            certOrigen.marcarTransferido("Traspaso parcial de " + req.cantidad() + " acciones a " + socioDestino.getNombreCompleto());
            // Mantener activo el remanente con un nuevo número o ajustando
            CertificadoAccion certRemanente = new CertificadoAccion(
                    cajaId,
                    nextCertNum + 1,
                    socioOrigen,
                    retainedSerieInicio,
                    retainedSerieFin,
                    certOrigen.getValorNominal(),
                    certOrigen.getFechaEmision(),
                    certOrigen.getPeriodoId(),
                    certOrigen.getOperacionId(),
                    certOrigen.getEstado(),
                    "DESDOBLAMIENTO",
                    certOrigen.getId(),
                    "Remanente retenido tras traspaso de " + req.cantidad() + " acciones",
                    userId
            );
            certificadoRepository.save(certRemanente);
        }

        TransferenciaAccion trans = new TransferenciaAccion(
                cajaId,
                nextTransNum,
                socioOrigen,
                socioDestino,
                certOrigen,
                certDestino,
                transSerieInicio,
                transSerieFin,
                precio,
                fecha,
                null,
                null,
                req.motivo() != null ? req.motivo() : "VENTA_ENTRE_SOCIOS",
                req.documentoActa(),
                req.observaciones(),
                userId
        );
        transferenciaRepository.save(trans);

        UserContext userCtx = UserContextHolder.getContext();
        UserRole actorRole = UserRole.ADMIN;
        if (userCtx != null && userCtx.role() != null) {
            try {
                actorRole = UserRole.valueOf(userCtx.role());
            } catch (Exception ignored) {}
        }
        auditService.registrar(
                cajaId,
                userId,
                actorRole,
                "TRANSFERENCIA_ACCION",
                "transferencia_accion",
                trans.getId(),
                null,
                Map.of(
                        "numeroTransferencia", nextTransNum,
                        "cantidad", req.cantidad(),
                        "serieInicio", transSerieInicio,
                        "serieFin", transSerieFin,
                        "origen", socioOrigen != null ? socioOrigen.getNombreCompleto() : "Tesorería de Caja",
                        "destino", socioDestino.getNombreCompleto()
                ),
                "127.0.0.1",
                "Internal"
        );

        return toTransferenciaDto(trans);
    }

    private CertificadoAccionDto toCertificadoDto(CertificadoAccion c) {
        String docTipo = (c.getSocio() != null && c.getSocio().getDocumentoTipo() != null)
                ? c.getSocio().getDocumentoTipo() : "DNI";
        String docNum = null;
        if (c.getSocio() != null && c.getSocio().getDocumentoEnc() != null) {
            try {
                docNum = cryptoService.decryptString(c.getSocio().getDocumentoEnc());
            } catch (Exception ignored) {}
        }

        return new CertificadoAccionDto(
                c.getId(),
                c.getNumeroCertificado(),
                c.getSocio() != null ? c.getSocio().getId() : null,
                c.getSocio() != null ? c.getSocio().getCodigo() : null,
                c.getSocio() != null ? c.getSocio().getNombreCompleto() : "Tesorería de Caja",
                c.getSerieInicio(),
                c.getSerieFin(),
                c.getCantidad(),
                c.getValorNominal(),
                c.getTotalMonto(),
                c.getFechaEmision(),
                c.getPeriodoId(),
                c.getOperacionId(),
                c.getEstado(),
                c.getTipoOrigen(),
                c.getCertificadoOrigenId(),
                c.getObservaciones(),
                docTipo,
                docNum
        );
    }

    private TransferenciaAccionDto toTransferenciaDto(TransferenciaAccion t) {
        return new TransferenciaAccionDto(
                t.getId(),
                t.getNumeroTransferencia(),
                t.getSocioOrigen() != null ? t.getSocioOrigen().getId() : null,
                t.getSocioOrigen() != null ? t.getSocioOrigen().getCodigo() : null,
                t.getSocioOrigen() != null ? t.getSocioOrigen().getNombreCompleto() : "Tesorería de Caja",
                t.getSocioDestino() != null ? t.getSocioDestino().getId() : null,
                t.getSocioDestino() != null ? t.getSocioDestino().getCodigo() : null,
                t.getSocioDestino() != null ? t.getSocioDestino().getNombreCompleto() : "Tesorería de Caja",
                t.getCertificadoOrigen() != null ? t.getCertificadoOrigen().getId() : null,
                t.getCertificadoOrigen() != null ? t.getCertificadoOrigen().getNumeroCertificado() : null,
                t.getCertificadoDestino() != null ? t.getCertificadoDestino().getId() : null,
                t.getCertificadoDestino() != null ? t.getCertificadoDestino().getNumeroCertificado() : null,
                t.getSerieInicio(),
                t.getSerieFin(),
                t.getCantidad(),
                t.getPrecioUnitario(),
                t.getTotalMonto(),
                t.getFecha(),
                t.getMotivo(),
                t.getDocumentoActa(),
                t.getObservaciones()
        );
    }

    private int parseIntOrDefault(String s, int def) {
        try {
            return Integer.parseInt(s.replaceAll("[^0-9]", ""));
        } catch (Exception e) {
            return def;
        }
    }

    private UUID getCajaIdActual() {
        UserContext ctx = UserContextHolder.getContext();
        return (ctx != null && ctx.cajaId() != null) ? ctx.cajaId() : UUID.fromString("a0000000-0000-0000-0000-000000000001");
    }

    private UUID getUserIdActual() {
        UserContext ctx = UserContextHolder.getContext();
        return (ctx != null) ? ctx.userId() : null;
    }
}
