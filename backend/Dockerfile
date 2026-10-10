# Build the backend from source so application code and Flyway migrations stay in sync.
FROM maven:3.9.9-eclipse-temurin-21-alpine AS build
WORKDIR /workspace

COPY pom.xml ./pom.xml
COPY src ./src
RUN mvn -B -DskipTests package

# Runtime image with a non-root user.
FROM eclipse-temurin:21-jre-alpine AS runner
WORKDIR /app

RUN apk add --no-cache curl \
    && addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=build /workspace/target/backend-0.0.1-SNAPSHOT.jar /app/app.jar
RUN chown -R appuser:appgroup /app

USER appuser

ENV JAVA_OPTS="-XX:+UseG1GC -XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError"
EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
  CMD curl -f http://localhost:8080/api/v1/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
