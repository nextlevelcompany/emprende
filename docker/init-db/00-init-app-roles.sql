CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

\getenv app_rw_password DB_APP_RW_PASSWORD
\getenv app_ro_password DB_APP_RO_PASSWORD
\if :{?app_rw_password}
\else
  \quit 3
\endif
\if :{?app_ro_password}
\else
  \quit 3
\endif

SELECT format('CREATE ROLE app_rw WITH LOGIN PASSWORD %L', :'app_rw_password')
WHERE NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_rw')
\gexec
ALTER ROLE app_rw WITH LOGIN PASSWORD :'app_rw_password' NOBYPASSRLS;

SELECT format('CREATE ROLE app_ro WITH LOGIN PASSWORD %L', :'app_ro_password')
WHERE NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_ro')
\gexec
ALTER ROLE app_ro WITH LOGIN PASSWORD :'app_ro_password' NOBYPASSRLS;
