UPDATE sch_seguridad.usuario_sistema 
SET password_hash = 'pbkdf2-sha256$100000$EEjQivuxO/t9xi8GtN7Sig==$5PdkPlUAB2mFVItqLCRAL8jGqWgXxkRIf76GK67R95M=',
    estado = 'ACTIVO'
WHERE username = 'admin';

SELECT username, estado, password_hash FROM sch_seguridad.usuario_sistema WHERE username='admin';
