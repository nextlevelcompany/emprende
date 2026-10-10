package com.cajachambala.identidad.infrastructure.security;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class AccountMailService {
    private final ObjectProvider<JavaMailSender> senderProvider;
    private final String from;
    private final String frontendUrl;

    public AccountMailService(ObjectProvider<JavaMailSender> senderProvider,
            @Value("${app.mail.from:}") String from,
            @Value("${app.mail.frontend-url:http://localhost:3000}") String frontendUrl) {
        this.senderProvider = senderProvider;
        this.from = from;
        this.frontendUrl = frontendUrl.replaceAll("/$", "");
    }

    public void sendEmailChangeVerification(String destination, String rawToken) {
        JavaMailSender sender = requireConfiguredSender();
        String link = frontendUrl + "/auth/confirmar-correo?token=" + rawToken;
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(destination);
        message.setSubject("Confirma el cambio de correo de Caja Emprende Chambala");
        message.setText("Se solicitó cambiar el correo de acceso de tu cuenta administrativa.\n\n"
                + "Confirma el cambio en este enlace, válido por 20 minutos y de un solo uso:\n" + link
                + "\n\nSi no solicitaste este cambio, ignora este mensaje y conserva tu correo actual.");
        sender.send(message);
    }

    public void notifyEmailChanged(String destination) {
        JavaMailSender sender = requireConfiguredSender();
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(destination);
        message.setSubject("Se actualizó el correo de acceso administrativo");
        message.setText("El correo de acceso a Caja Emprende Chambala fue actualizado. "
                + "Si no reconoces este cambio, contacta inmediatamente con otro administrador autorizado.");
        sender.send(message);
    }

    private JavaMailSender requireConfiguredSender() {
        JavaMailSender sender = senderProvider.getIfAvailable();
        if (sender == null || from == null || from.isBlank()) {
            throw new IllegalStateException("El servicio de correo no está configurado. Configura SMTP_HOST y SMTP_FROM para cambiar el correo de acceso.");
        }
        return sender;
    }
}
