SELECT
    s.subactivity_id AS "id",
    s.subactivity_urn AS "urn"
--     s.subactivity_parent_fk AS "fk"
FROM subactivity s
ORDER BY s.subactivity_urn