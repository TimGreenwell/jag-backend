INSERT INTO team (
    team_id,
    team_name)
VALUES ($1, $2)
ON CONFLICT (team_id)
    DO UPDATE SET
                  team_id             = excluded.team_id,
                  team_name           = excluded.team_name
