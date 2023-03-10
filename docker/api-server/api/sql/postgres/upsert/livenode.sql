INSERT INTO livenode (
    livenode_id,
    livenode_child_id,
    livenode_con_desc,
    livenode_con_name,
    livenode_contextual_expected_duration,
    livenode_is_expanded,
    livenode_is_locked,
    livenode_parent_id_fk,
    livenode_project_id,
    livenode_return_state,
    livenode_return_value,
    livenode_test_return_state,
    livenode_test_return_value,
    livenode_urn,
    livenode_x,
    livenode_y)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
ON CONFLICT (livenode_id) DO UPDATE SET
                                    livenode_child_id = excluded.livenode_child_id,
                                    livenode_con_desc = excluded.livenode_con_desc,
                                    livenode_con_name = excluded.livenode_con_name,
                                    livenode_contextual_expected_duration = excluded.livenode_contextual_expected_duration,
                                    livenode_is_expanded = excluded.livenode_is_expanded,
                                    livenode_is_locked = excluded.livenode_is_locked,
                                    livenode_parent_id_fk = excluded.livenode_parent_id_fk,
                                    livenode_project_id = excluded.livenode_project_id,
                                    livenode_return_state = excluded.livenode_return_state,
                                    livenode_return_value = excluded.livenode_return_value,
                                    livenode_test_return_state = excluded.livenode_test_return_state,
                                    livenode_test_return_value = excluded.livenode_test_return_value,
                                    livenode_urn = excluded.livenode_urn,
                                    livenode_x = excluded.livenode_x,
                                    livenode_y = excluded.livenode_y