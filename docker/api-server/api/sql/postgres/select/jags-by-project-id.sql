SELECT
    n.node_id AS "id",
    n.node_urn AS "urn",
    n.node_child_id AS "childId",
    n.node_parent_id_fk AS "parentId",
    n.node_project_id AS "projectId",
    n.node_is_expanded As "isExpanded",
    n.node_is_locked AS "isLocked",
    n.node_con_name AS "contextualName",
    n.node_con_desc AS "contextualDescription",
    n.node_x AS "x",
    n.node_y AS "y",
    n.node_return_value AS "returnValue",
    n.node_return_state AS "returnState",
    n.node_test_return_value AS "testReturnValue",
    n.node_test_return_state AS "testReturnState",
    n.node_contextual_expected_duration AS "contextualExpectedDuration"
FROM node n
WHERE n.node_project_id = $1