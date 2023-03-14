INSERT INTO jag (
    jag_urn,
    jag_author,
    jag_collapsed,
    connector_exec,
    connector_oper,
    connector_rtns,
    jag_created_date,
    jag_description,
    jag_expected_duration,
    jag_is_locked,
    jag_locked_by,
    jag_modified_date,
    jag_name)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
ON CONFLICT (jag_urn) DO UPDATE SET
                                         jag_author = excluded.jag_author,
                                         jag_collapsed = excluded.jag_collapsed,
                                         connector_exec = excluded.connector_exec,
                                         connector_oper = excluded.connector_oper,
                                         connector_rtns = excluded.connector_rtns,
                                         jag_created_date = excluded.jag_created_date,
                                         jag_description = excluded.jag_description,
                                         jag_expected_duration = excluded.activity_expected_duration,
                                         activity_is_locked = excluded.activity_is_locked,
                                         activity_locked_by = excluded.activity_locked_by,
                                         activity_modified_date = excluded.activity_modified_date,
                                         activity_name = excluded.activity_name