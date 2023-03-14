INSERT INTO binding (
    binding_id,
    binding_to,
    binding_from,
    binding_jag_fk)
VALUES ($1, $2, $3, $4)
ON CONFLICT (binding_id)
    DO UPDATE SET
                  binding_from         = excluded.binding_from,
                  binding_to           = excluded.binding_to,
                  binding_jag_fk  = excluded.binding_jag_fk