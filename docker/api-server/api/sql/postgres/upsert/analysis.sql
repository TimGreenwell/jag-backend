INSERT INTO analysis (
    analysis_id,
    analysis_desc,
    analysis_is_locked,
    analysis_name,
    analysis_root_urn,
    analysis_team)
VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (analysis_id)
    DO UPDATE SET
                  analysis_id            = excluded.analysis_id,
                  analysis_desc            = excluded.analysis_desc,
                  analysis_is_locked            = excluded.analysis_is_locked,
                  analysis_name            = excluded.analysis_name,
                  analysis_root_urn            = excluded.analysis_root_urn,
                  analysis_team            = excluded.analysis_team
