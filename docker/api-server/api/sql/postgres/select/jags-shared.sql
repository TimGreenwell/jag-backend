SELECT
    a.jag_urn AS "urn",
    a.jag_author AS "author",
    a.jag_collapsed AS "collapsed",
    a.connector_exec AS "execution",
    a.connector_oper AS "operator",
    a.connector_rtns AS "returns",
    a.jag_created_date AS "createdDate",
    a.jag_description AS "description",
    a.jag_expected_duration AS "expectedDuration",
    a.jag_is_locked AS "isLocked",
    a.jag_locked_by AS "lockedBy",
    a.jag_modified_date AS "modifiedDate",
    a.jag_name AS "name"
FROM jag a
ORDER BY a.jag_urn