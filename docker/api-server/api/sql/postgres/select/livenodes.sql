SELECT
    n.livenode_id AS "id",
    n.livenode_urn AS "urn",
    n.livenode_child_id AS "childId",
    n.livenode_parent_id_fk AS "parentId",
    n.livenode_project_id AS "projectId",
    n.livenode_is_expanded As "isExpanded",
    n.livenode_is_locked AS "isLocked",
    n.livenode_con_name AS "contextualName",
    n.livenode_con_desc AS "contextualDescription",
    n.livenode_x AS "x",
    n.livenode_y AS "y",
    n.livenode_return_value AS "returnValue",
    n.livenode_return_state AS "returnState",
    n.livenode_test_return_value AS "testReturnValue",
    n.livenode_test_return_state AS "testReturnState",
    n.livenode_contextual_expected_duration AS "contextualExpectedDuration"
FROM livenode n