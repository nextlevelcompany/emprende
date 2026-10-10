package com.cajachambala.shared.infrastructure.security;

import com.cajachambala.identidad.domain.AppUser;
import com.cajachambala.identidad.infrastructure.persistence.AppUserRepository;
import com.cajachambala.identidad.infrastructure.security.JwtService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final AppUserRepository appUserRepository;

    public JwtAuthenticationFilter(JwtService jwtService, AppUserRepository appUserRepository) {
        this.jwtService = jwtService;
        this.appUserRepository = appUserRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7).trim();
            Claims claims = jwtService.extractClaims(token);

            if (claims != null && "ACCESS".equals(claims.get("type", String.class))) {
                try {
                    UUID userId = UUID.fromString(claims.getSubject());
                    AppUser user = appUserRepository.findById(userId).orElse(null);

                    if (user != null && jwtService.isAccessTokenValid(claims, user) && user.isAuthenticationAllowed()) {
                        String role = claims.get("role", String.class);
                        UUID cajaId = UUID.fromString(claims.get("caja", String.class));
                        String socioIdStr = claims.get("socio_id", String.class);
                        UUID socioId = (socioIdStr != null && !socioIdStr.isBlank()) ? UUID.fromString(socioIdStr) : null;
                        String email = claims.get("email", String.class);

                        UserContext userContext = new UserContext(userId, cajaId, role, socioId, email);
                        UserContextHolder.setContext(userContext);

                        var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role));
                        var authentication = new UsernamePasswordAuthenticationToken(userContext, null, authorities);
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    }
                } catch (Exception ignored) {
                    // Si ocurre cualquier error al parsear o validar, el contexto no se establece
                }
            }
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            UserContextHolder.clear();
        }
    }
}
