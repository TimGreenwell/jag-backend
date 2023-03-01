SELECT
    e.endpoint_id AS "id",
    e.endpoint_direction AS "direction",
    e.endpoint_exchange_name AS "exchangeName",
    e.endpoint_exchange_source_urn AS "exchangeSourceUrn",
    e.endpoint_exchange_type AS "exchangeType"
--     e.endpoint_activity_fk AS "fk"
FROM endpoint e
ORDER BY e.endpoint_id