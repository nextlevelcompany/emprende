package com.cajachambala.socios.application;

import com.cajachambala.identidad.domain.AppUser;
import com.cajachambala.identidad.infrastructure.audit.AuditService;
import com.cajachambala.identidad.infrastructure.persistence.AppUserRepository;
import com.cajachambala.identidad.infrastructure.security.AesGcmCryptoService;
import com.cajachambala.identidad.infrastructure.security.PasswordService;
import com.cajachambala.shared.infrastructure.security.UserContext;
import com.cajachambala.shared.infrastructure.security.UserContextHolder;
import com.cajachambala.socios.application.dto.SocioDtos.*;
import com.cajachambala.socios.domain.Socio;
import com.cajachambala.socios.domain.SocioEstado;
import com.cajachambala.socios.domain.SocioTipo;
import com.cajachambala.socios.infrastructure.persistence.SocioRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SocioServiceTest {

    @Mock
    private SocioRepository socioRepository;

    @Mock
    private AppUserRepository appUserRepository;

    @Mock
    private AesGcmCryptoService cryptoService;

    @Mock
    private PasswordService passwordService;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private SocioService socioService;

    private final UUID cajaId = UUID.fromString("a0000000-0000-0000-0000-000000000001");
    private final UUID userId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        UserContextHolder.setContext(new UserContext(userId, cajaId, "ADMIN", null, "admin@cajachambala.pe"));
    }

    @AfterEach
    void tearDown() {
        UserContextHolder.clear();
    }

    @Test
    @DisplayName("Debe registrar un nuevo socio con DNI cifrado AES-256-GCM y HMAC-SHA256")
    void debeCrearSocioExitosamente() {
        CrearSocioRequest req = new CrearSocioRequest(
                SocioTipo.SOCIO,
                "Juan Carlos",
                "Pérez Quispe",
                "DNI",
                "12345678",
                "987654321",
                "juan@correo.com",
                "Av. Las Flores 123",
                LocalDate.of(2023, 7, 1),
                null
        );

        when(cryptoService.hmacSha256("12345678")).thenReturn("hash-hmac-12345678");
        when(socioRepository.existsByCajaIdAndDocumentoHashAndDeletedAtIsNull(cajaId, "hash-hmac-12345678")).thenReturn(false);
        when(cryptoService.encryptString("12345678")).thenReturn("encrypted-dni".getBytes());
        when(socioRepository.findMaxCodigoByCajaId(cajaId)).thenReturn(24);
        when(socioRepository.save(any(Socio.class))).thenAnswer(inv -> inv.getArgument(0));

        SocioResponse resp = socioService.crearSocio(req);

        assertThat(resp).isNotNull();
        assertThat(resp.codigo()).isEqualTo(25);
        assertThat(resp.nombres()).isEqualTo("Juan Carlos");
        assertThat(resp.apellidos()).isEqualTo("Pérez Quispe");
        assertThat(resp.estado()).isEqualTo(SocioEstado.ACTIVO);

        verify(socioRepository).save(any(Socio.class));
        verify(auditService).registrar(eq(cajaId), eq(userId), any(), eq("SOCIO_CREADO"), eq("socio"), any(), isNull(), any(), any(), any());
    }

    @Test
    @DisplayName("Debe rechazar creación si el documento ya se encuentra registrado (HMAC)")
    void debeRechazarDocumentoDuplicado() {
        CrearSocioRequest req = new CrearSocioRequest(
                SocioTipo.SOCIO,
                "María",
                "Gonzales",
                "DNI",
                "87654321",
                null,
                null,
                null,
                LocalDate.of(2023, 7, 1),
                null
        );

        when(cryptoService.hmacSha256("87654321")).thenReturn("hash-dup");
        when(socioRepository.existsByCajaIdAndDocumentoHashAndDeletedAtIsNull(cajaId, "hash-dup")).thenReturn(true);

        assertThatThrownBy(() -> socioService.crearSocio(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Ya existe un socio registrado");

        verify(socioRepository, never()).save(any());
    }

    @Test
    @DisplayName("Debe dar de baja a un socio e inhabilitar su usuario web")
    void debeDarDeBajaSocioEInhabilitarUsuario() {
        UUID socioId = UUID.randomUUID();
        Socio socio = new Socio(
                cajaId,
                10,
                SocioTipo.SOCIO,
                "Pedro",
                "Castillo",
                "DNI",
                "enc".getBytes(),
                "hash",
                null,
                "pedro@correo.com",
                null,
                LocalDate.of(2023, 7, 1),
                userId
        );

        AppUser user = AppUser.create(cajaId, "pedro@correo.com", "hash", com.cajachambala.identidad.domain.UserRole.SOCIO, socioId, false);

        when(socioRepository.findByIdAndCajaId(socioId, cajaId)).thenReturn(Optional.of(socio));
        when(socioRepository.save(any(Socio.class))).thenAnswer(inv -> inv.getArgument(0));
        when(appUserRepository.findBySocioId(socio.getId())).thenReturn(Optional.of(user));

        BajaSocioRequest req = new BajaSocioRequest(LocalDate.of(2024, 1, 15), "Retiro voluntario");
        SocioResponse resp = socioService.darDeBaja(socioId, req);

        assertThat(resp.estado()).isEqualTo(SocioEstado.RETIRADO);
        assertThat(socio.getFechaRetiro()).isEqualTo(LocalDate.of(2024, 1, 15));
        assertThat(user.isAccountLocked()).isTrue();

        verify(appUserRepository).save(user);
        verify(auditService).registrar(eq(cajaId), eq(userId), any(), eq("SOCIO_DADO_DE_BAJA"), eq("socio"), any(), isNull(), any(), any(), any());
    }

    @Test
    @DisplayName("Debe habilitar acceso web a un socio con contraseña temporal")
    void debeHabilitarAccesoWeb() {
        UUID socioId = UUID.randomUUID();
        Socio socio = new Socio(
                cajaId,
                5,
                SocioTipo.SOCIO,
                "Rosa",
                "Flores",
                "DNI",
                "enc".getBytes(),
                "hash",
                null,
                "rosa@correo.com",
                null,
                LocalDate.of(2023, 7, 1),
                userId
        );

        when(socioRepository.findByIdAndCajaId(socioId, cajaId)).thenReturn(Optional.of(socio));
        when(appUserRepository.findBySocioId(socioId)).thenReturn(Optional.empty());
        when(appUserRepository.findByEmail("rosa@correo.com")).thenReturn(Optional.empty());
        when(passwordService.encode(anyString())).thenReturn("argon2-hash");

        HabilitarAccesoRequest req = new HabilitarAccesoRequest("rosa@correo.com", "TemporalPass#2026");
        socioService.habilitarAccesoWeb(socioId, req);

        verify(passwordService).validatePasswordStrength("TemporalPass#2026", "rosa@correo.com");
        verify(appUserRepository).save(any(AppUser.class));
        verify(auditService).registrar(eq(cajaId), eq(userId), any(), eq("SOCIO_ACCESO_WEB_HABILITADO"), eq("app_user"), any(), isNull(), any(), any(), any());
    }
}
