-- app_ro no tiene políticas RLS dedicadas ni casos de uso activos. Deshabilita
-- el login para impedir que vuelva a usarse como rol de reportes sin control.
ALTER ROLE app_ro NOLOGIN NOBYPASSRLS;
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM app_ro;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM app_ro;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM app_ro;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM app_ro;
