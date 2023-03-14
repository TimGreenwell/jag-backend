INSERT INTO endpoint (
    endpoint_id,
    endpoint_direction,
    endpoint_exchange_name,
    endpoint_exchange_source_urn,
    endpoint_exchange_type,
    endpoint_jag_fk)
VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (endpoint_id)
    DO UPDATE SET
                  endpoint_direction            = excluded.endpoint_direction,
                  endpoint_exchange_name        = excluded.endpoint_exchange_name,
                  endpoint_exchange_source_urn  = excluded.endpoint_exchange_source_urn,
                  endpoint_exchange_type        = excluded.endpoint_exchange_type,
                  endpoint_jag_fk          = excluded.endpoint_jag_fk