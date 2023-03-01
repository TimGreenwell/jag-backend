INSERT INTO subactivity (
    subactivity_id,
    subactivity_urn,
    subactivity_parent_fk)
VALUES ($1, $2, $3)
ON CONFLICT (subactivity_id)
    DO UPDATE SET
                  subactivity_urn            = excluded.subactivity_urn,
                  subactivity_parent_fk        = excluded.subactivity_parent_fk