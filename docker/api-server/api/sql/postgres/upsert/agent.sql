INSERT INTO agent (
    agent_id,
    agent_date_created,
    agent_description,
    agent_is_locked,
    agent_name,
    agent_urn,
    agent_team_fk)
VALUES ($1, $2, $3, $4, $5, $6, $7)
ON CONFLICT (agent_id)
    DO UPDATE SET
                  agent_id             = excluded.agent_id,
                  agent_date_created   = excluded.agent_date_created,
                  agent_description    = excluded.agent_description,
                  agent_is_locked      = excluded.agent_is_locked,
                  agent_name           = excluded.agent_name,
                  agent_urn            = excluded.agent_urn,
                  agent_team_fk        = excluded.agent_team_fk
