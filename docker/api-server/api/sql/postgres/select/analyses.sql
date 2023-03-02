
SELECT
    a.analysis_id AS "id",
    a.analysis_desc AS "desc",
    a.analysis_is_locked AS "isLocked",
    a.analysis_name AS "name",
    a.analysis_root_urn AS "rootUrn",
    a.analysis_team AS "team"
FROM analysis a
