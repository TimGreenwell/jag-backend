SELECT
    s.innerjag_id AS "id",
    s.innerjag_urn AS "urn"
--     s.innerjag_parent_fk AS "fk"
FROM innerjag s
WHERE s.innerjag_parent_fk = $1
ORDER BY s.innerjag_urn