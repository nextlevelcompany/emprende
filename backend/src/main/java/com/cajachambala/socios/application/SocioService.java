package com.cajachambala.socios.application;

import com.cajachambala.identidad.domain.AppUser;
import com.cajachambala.identidad.domain.UserRole;
import com.cajachambala.identidad.domain.UserStatus;
import com.cajachambala.identidad.infrastructure.audit.AuditService;
import com.cajachambala.identidad.infrastructure.persistence.AppUserRepository;
import com.cajachambala.identidad.infrastructure.security.AesGcmCryptoService;
import com.cajachambala.identidad.infrastructure.security.PasswordService;
import com.cajachambala.socios.application.dto.SocioDtos.*;
import com.cajachambala.socios.domain.Socio;
import com.cajachambala.socios.domain.SocioEstado;
import com.cajachambala.socios.domain.SocioTipo;
import com.cajachambala.socios.infrastructure.persistence.SocioRepository;
import com.cajachambala.shared.infrastructure.security.UserContext;
import com.cajachambala.shared.infrastructure.security.UserContextHolder;
import com.cajachambala.shared.infrastructure.persistence.CorrelativoService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class SocioService {

    private final SocioRepository socioRepository;
    private final AppUserRepository appUserRepository;
    private final AesGcmCryptoService cryptoService;
    private final PasswordService passwordService;
    private final AuditService auditService;
    private final CorrelativoService correlativoService;

    public SocioService(
            SocioRepository socioRepository,
            AppUserRepository appUserRepository,
            AesGcmCryptoService cryptoService,
            PasswordService passwordService,
            AuditService auditService,
            CorrelativoService correlativoService
    ) {
        this.socioRepository = socioRepository;
        this.appUserRepository = appUserRepository;
        this.cryptoService = cryptoService;
        this.passwordService = passwordService;
        this.auditService = auditService;
        this.correlativoService = correlativoService;
    }

    @Transactional
    public SocioResponse crearSocio(CrearSocioRequest req) {
        UUID cajaId = getCajaIdActual();
        UUID userId = getUserIdActual();

        String rawDoc = req.numeroDocumento().trim();
        String docHash = cryptoService.hmacSha256(rawDoc);

        if (socioRepository.existsByCajaIdAndDocumentoHashAndDeletedAtIsNull(cajaId, docHash)) {
            throw new IllegalArgumentException("Ya existe un socio registrado con el número de documento proporcionado");
        }

        byte[] docEnc = cryptoService.encryptString(rawDoc);
        Integer nextCodigo = correlativoService.siguiente(cajaId, "SOCIO", socioRepository.findMaxCodigoByCajaId(cajaId) + 1);

        Socio socio = new Socio(
                cajaId,
                nextCodigo,
                req.tipo(),
                req.nombres().trim(),
                req.apellidos().trim(),
                req.documentoTipo() != null ? req.documentoTipo().trim().toUpperCase() : "DNI",
                docEnc,
                docHash,
                req.telefono() != null ? req.telefono().trim() : null,
                req.email() != null ? req.email().trim().toLowerCase() : null,
                req.direccion() != null ? req.direccion().trim() : null,
                req.fechaIngreso(),
                userId
        );

        Socio guardado = socioRepository.save(socio);

        auditService.registrar(
                cajaId,
                userId,
                UserRole.ADMIN,
                "SOCIO_CREADO",
                "socio",
                guardado.getId(),
                null,
                Map.of("codigo", guardado.getCodigo(), "nombreCompleto", guardado.getNombreCompleto(), "tipo", guardado.getTipo().name()),
                "127.0.0.1",
                "Internal"
        );

        return toResponse(guardado);
    }

    @Transactional
    public SocioResponse actualizarSocio(UUID id, ActualizarSocioRequest req) {
        UUID cajaId = getCajaIdActual();
        Socio socio = socioRepository.findByIdAndCajaId(id, cajaId)
                .orElseThrow(() -> new IllegalArgumentException("Socio no encontrado"));

        socio.actualizar(
                req.nombres(),
                req.apellidos(),
                req.telefono(),
                req.email(),
                req.direccion(),
                req.notas()
        );

        Socio actualizado = socioRepository.save(socio);

        auditService.registrar(
                cajaId,
                getUserIdActual(),
                UserRole.ADMIN,
                "SOCIO_ACTUALIZADO",
                "socio",
                actualizado.getId(),
                null,
                Map.of("nombreCompleto", actualizado.getNombreCompleto(), "telefono", String.valueOf(actualizado.getTelefono())),
                "127.0.0.1",
                "Internal"
        );

        return toResponse(actualizado);
    }

    @Transactional
    public SocioResponse darDeBaja(UUID id, BajaSocioRequest req) {
        UUID cajaId = getCajaIdActual();
        Socio socio = socioRepository.findByIdAndCajaId(id, cajaId)
                .orElseThrow(() -> new IllegalArgumentException("Socio no encontrado"));

        socio.darDeBaja(req.fechaRetiro(), req.motivo());
        Socio actualizado = socioRepository.save(socio);

        // Si tiene usuario web, inhabilitarlo
        appUserRepository.findBySocioId(socio.getId()).ifPresent(user -> {
            user.bloquearTemporalmente(java.time.Duration.ofDays(3650));
            appUserRepository.save(user);
        });

        auditService.registrar(
                cajaId,
                getUserIdActual(),
                UserRole.ADMIN,
                "SOCIO_DADO_DE_BAJA",
                "socio",
                actualizado.getId(),
                null,
                Map.of("motivo", req.motivo(), "fechaRetiro", String.valueOf(req.fechaRetiro())),
                "127.0.0.1",
                "Internal"
        );

        return toResponse(actualizado);
    }

    @Transactional(readOnly = true)
    public SocioResponse obtenerSocio(UUID id) {
        UUID cajaId = getCajaIdActual();
        Socio socio = socioRepository.findByIdAndCajaId(id, cajaId)
                .orElseThrow(() -> new IllegalArgumentException("Socio no encontrado"));
        return toResponse(socio);
    }

    @Transactional(readOnly = true)
    public Page<SocioResponse> listarSocios(SocioTipo tipo, SocioEstado estado, String query, Pageable pageable) {
        UUID cajaId = getCajaIdActual();
        org.springframework.data.jpa.domain.Specification<Socio> spec = (root, cq, cb) -> {
            java.util.List<jakarta.persistence.criteria.Predicate> predicates = new java.util.ArrayList<>();
            predicates.add(cb.equal(root.get("cajaId"), cajaId));
            predicates.add(cb.isNull(root.get("deletedAt")));

            if (tipo != null) {
                predicates.add(cb.equal(root.get("tipo"), tipo));
            }
            if (estado != null) {
                predicates.add(cb.equal(root.get("estado"), estado));
            }
            if (query != null && !query.isBlank()) {
                String pattern = "%" + query.trim().toLowerCase() + "%";
                jakarta.persistence.criteria.Predicate porNombre = cb.like(cb.lower(root.get("nombreCompleto")), pattern);
                jakarta.persistence.criteria.Predicate porEmail = cb.like(cb.lower(root.get("email")), pattern);
                predicates.add(cb.or(porNombre, porEmail));
            }

            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        return socioRepository.findAll(spec, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public List<SocioResponse> listarTodos(boolean soloActivos) {
        UUID cajaId = getCajaIdActual();
        List<Socio> socios = soloActivos
                ? socioRepository.findByCajaIdAndEstadoAndDeletedAtIsNullOrderByCodigoAsc(cajaId, SocioEstado.ACTIVO)
                : socioRepository.findByCajaIdAndDeletedAtIsNullOrderByCodigoAsc(cajaId);
        return socios.stream().map(this::toResponse).toList();
    }

    @Transactional
    public void habilitarAccesoWeb(UUID socioId, HabilitarAccesoRequest req) {
        UUID cajaId = getCajaIdActual();
        Socio socio = socioRepository.findByIdAndCajaId(socioId, cajaId)
                .orElseThrow(() -> new IllegalArgumentException("Socio no encontrado"));

        if (appUserRepository.findBySocioId(socioId).isPresent()) {
            throw new IllegalArgumentException("El socio ya cuenta con un usuario web habilitado");
        }

        String rawEmail = req.email().trim().toLowerCase();
        if (appUserRepository.findByEmail(rawEmail).isPresent()) {
            throw new IllegalArgumentException("El correo ya está en uso por otra cuenta");
        }

        if (req.passwordTemporal() == null || req.passwordTemporal().isBlank()) {
            throw new IllegalArgumentException("Debe proporcionar una contraseña temporal segura");
        }
        String password = req.passwordTemporal().trim();

        passwordService.validatePasswordStrength(password, rawEmail);
        String hash = passwordService.encode(password);

        AppUser user = AppUser.create(
                cajaId,
                rawEmail,
                hash,
                UserRole.SOCIO,
                socioId,
                true
        );
        appUserRepository.save(user);

        // Actualizar email del socio si no lo tenía
        if (socio.getEmail() == null || socio.getEmail().isBlank()) {
            socio.actualizar(null, null, socio.getTelefono(), rawEmail, socio.getDireccion(), socio.getNotas());
            socioRepository.save(socio);
        }

        auditService.registrar(
                cajaId,
                getUserIdActual(),
                UserRole.ADMIN,
                "SOCIO_ACCESO_WEB_HABILITADO",
                "app_user",
                user.getId(),
                null,
                Map.of("email", rawEmail, "socioId", socioId.toString()),
                "127.0.0.1",
                "Internal"
        );
    }

    private SocioResponse toResponse(Socio socio) {
        String docEnmascarado = "********";
        if (socio.getDocumentoEnc() != null) {
            try {
                String descifrado = cryptoService.decryptString(socio.getDocumentoEnc());
                if (descifrado != null && descifrado.length() >= 4) {
                    docEnmascarado = "*".repeat(descifrado.length() - 4) + descifrado.substring(descifrado.length() - 4);
                } else if (descifrado != null) {
                    docEnmascarado = descifrado;
                }
            } catch (Exception ignored) {}
        }

        Optional<AppUser> userOpt = appUserRepository.findBySocioId(socio.getId());
        boolean tieneAcceso = userOpt.isPresent();
        String usuarioStatus = userOpt.map(u -> u.getStatus().name()).orElse("SIN_ACCESO");

        return new SocioResponse(
                socio.getId(),
                socio.getCodigo(),
                socio.getTipo(),
                socio.getNombres(),
                socio.getApellidos(),
                socio.getNombreCompleto(),
                socio.getDocumentoTipo(),
                docEnmascarado,
                socio.getTelefono(),
                socio.getEmail(),
                socio.getDireccion(),
                socio.getFechaIngreso(),
                socio.getFechaRetiro(),
                socio.getEstado(),
                socio.getNotas(),
                tieneAcceso,
                usuarioStatus
        );
    }

    private UUID getCajaIdActual() {
        UserContext ctx = UserContextHolder.getContext();
        if (ctx != null && ctx.cajaId() != null) {
            return ctx.cajaId();
        }
        // Fallback a caja por defecto en dev
        return UUID.fromString("a0000000-0000-0000-0000-000000000001");
    }

    private UUID getUserIdActual() {
        UserContext ctx = UserContextHolder.getContext();
        return (ctx != null) ? ctx.userId() : null;
    }
}
