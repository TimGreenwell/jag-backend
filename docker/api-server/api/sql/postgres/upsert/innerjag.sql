INSERT INTO innerjag (
    innerjag_id,
    innerjag_urn,
    innerjag_parent_fk)
VALUES ($1, $2, $3)
ON CONFLICT (innerjag_id)
    DO UPDATE SET
                  innerjag_urn            = excluded.innerjag_urn,
                  innerjag_parent_fk        = excluded.innerjag_parent_fk