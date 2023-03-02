INSERT INTO activity (
    activity_urn,
    activity_author,
    activity_collapsed,
    connector_exec,
    connector_oper,
    connector_rtns,
    activity_created_date,
    activity_description,
    activity_expected_duration,
    activity_is_locked,
    activity_locked_by,
    activity_modified_date,
    activity_name)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
ON CONFLICT (activity_urn) DO UPDATE SET
                                         activity_author = excluded.activity_author,
                                         activity_collapsed = excluded.activity_collapsed,
                                         connector_exec = excluded.connector_exec,
                                         connector_oper = excluded.connector_oper,
                                         connector_rtns = excluded.connector_rtns,
                                         activity_created_date = excluded.activity_created_date,
                                         activity_description = excluded.activity_description,
                                         activity_expected_duration = excluded.activity_expected_duration,
                                         activity_is_locked = excluded.activity_is_locked,
                                         activity_locked_by = excluded.activity_locked_by,
                                         activity_modified_date = excluded.activity_modified_date,
                                         activity_name = excluded.activity_name