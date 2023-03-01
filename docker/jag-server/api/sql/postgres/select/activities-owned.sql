SELECT
    a.activity_urn AS "urn",
    a.activity_author AS "author",
    a.activity_collapsed AS "collapsed",
    a.connector_exec AS "execution",
    a.connector_oper AS "operator",
    a.connector_rtns AS "returns",
    a.activity_created_date AS "createdDate",
    a.activity_description AS "description",
    a.activity_expected_duration AS "expectedDuration",
    a.activity_is_locked AS "isLocked",
    a.activity_locked_by AS "lockedBy",
    a.activity_modified_date AS "modifiedDate",
    a.activity_name AS "name"
FROM activity a
WHERE a.activity_author = $1
ORDER BY a.activity_urn