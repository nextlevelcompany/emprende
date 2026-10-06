# ----------------------------------------------------------------------
# Runtime multi-stage con usuario no-root (JAR precompilado)
# ----------------------------------------------------------------------
FROM eclipse-temurin:21-jre-alpine AS runner
WORKDIR /app

RUN apk add --no-cache curl \
    && addgroup -S appgroup && adduser -S appuser -G appgroup

COPY target/*.jar app.jar
RUN chown -R appuser:appgroup /app

USER appuser

ENV JAVA_OPTS="-XX:+UseG1GC -XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError"
EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
  CMD curl -f http://localhost:8080/api/v1/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
