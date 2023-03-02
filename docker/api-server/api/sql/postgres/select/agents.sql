
SELECT
    a.agent_id AS "id",
    a.agent_date_created AS "dateCreated",
    a.agent_description AS "description",
    a.agent_is_locked AS "isLocked",
    a.agent_name AS "name",
    a.agent_urn AS "urn"
--     a.agent_team_fk AS "exchangeType"
FROM agent a
