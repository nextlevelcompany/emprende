package com.cajachambala.shared.infrastructure.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Value("${app.cors.allowed-origin:http://localhost:3000}")
    private String allowedOrigin;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtAuthenticationFilter jwtFilter) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .headers(headers -> headers
                .frameOptions(HeadersConfigurer.FrameOptionsConfig::deny)
                .httpStrictTransportSecurity(hsts -> hsts.includeSubDomains(true).maxAgeInSeconds(31536000))
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/actuator/**",
                    "/docs/**",
                    "/swagger-ui/**",
                    "/swagger-ui.html",
                    "/v3/api-docs/**",
                    "/auth/login",
                    "/auth/admin/login",
                    "/auth/socio/login",
                    "/auth/mfa/verify",
                    "/auth/email-change/confirm",
                    "/auth/refresh",
                    "/api/v1/actuator/**",
                    "/api/v1/docs/**",
                    "/api/v1/swagger-ui/**",
                    "/api/v1/swagger-ui.html",
                    "/api/v1/v3/api-docs/**",
                    "/api/v1/auth/login",
                    "/api/v1/auth/admin/login",
                    "/api/v1/auth/socio/login",
                    "/api/v1/auth/mfa/verify",
                    "/api/v1/auth/email-change/confirm",
                    "/api/v1/auth/refresh"
                ).permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        // OWASP ASVS recomendado: Argon2id (saltLength: 16, hashLength: 32, parallelism: 1, memory: 65536 KiB = 64MB, iterations: 3)
        return new Argon2PasswordEncoder(16, 32, 1, 65536, 3);
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(allowedOrigin));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Idempotency-Key", "X-Request-ID"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
