ALTER TABLE app_user
    ADD COLUMN display_name varchar(100),
    ADD COLUMN phone varchar(30),
    ADD COLUMN locale varchar(20) NOT NULL DEFAULT 'es-PE',
    ADD COLUMN notifications_enabled boolean NOT NULL DEFAULT true,
    ADD COLUMN pending_email citext,
    ADD COLUMN email_change_token_hash varchar(64),
    ADD COLUMN email_change_expires_at timestamptz;

CREATE UNIQUE INDEX ux_app_user_pending_email ON app_user (pending_email) WHERE pending_email IS NOT NULL;
