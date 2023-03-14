CREATE TABLE IF NOT EXISTS "activity"
(
    "activity_urn" VARCHAR(255) NOT NULL,
    "activity_author" VARCHAR(255),
    "activity_collapsed" boolean,
    "connector_exec" VARCHAR(255) NOT NULL,
    "connector_oper" VARCHAR(255) NOT NULL,
    "connector_rtns" VARCHAR(255),
    "activity_created_date" timestamp without time zone,
    "activity_description" VARCHAR(255),
    "activity_expected_duration" VARCHAR(255),
    "activity_is_locked" boolean,
    "activity_locked_by" VARCHAR(255),
    "activity_modified_date" timestamp without time zone,
    "activity_name" VARCHAR(255) NOT NULL,
    CONSTRAINT "PK_activity" PRIMARY KEY ("activity_urn")
);


CREATE TABLE IF NOT EXISTS "analysis"
(
    "analysis_id" VARCHAR(255) NOT NULL,
    "analysis_desc" VARCHAR(255) ,
    "analysis_is_locked" VARCHAR(255) NOT NULL,
    "analysis_name" VARCHAR(255) NOT NULL,
    "analysis_root_urn" VARCHAR(255) NOT NULL,
    "analysis_team" VARCHAR(255) NOT NULL,
    CONSTRAINT "PK_analysis" PRIMARY KEY ("analysis_id")
);


CREATE TABLE IF NOT EXISTS "team"
(
    "team_id" VARCHAR(255) NOT NULL,
    "team_name" VARCHAR(255) NOT NULL,
    CONSTRAINT "PK_team" PRIMARY KEY ("team_id")
);


CREATE TABLE IF NOT EXISTS "endpoint"
(
    "endpoint_id" VARCHAR(255) NOT NULL,
    "endpoint_direction" VARCHAR(255) NOT NULL,
    "endpoint_exchange_name" VARCHAR(255) NOT NULL,
    "endpoint_exchange_source_urn" VARCHAR(255) NOT NULL,
    "endpoint_exchange_type" VARCHAR(255) NOT NULL,
    "endpoint_activity_fk" VARCHAR(255) NOT NULL,
    CONSTRAINT "PK_endpoint" PRIMARY KEY ("endpoint_id"),
    CONSTRAINT "FK_activity_urn" FOREIGN KEY ("endpoint_activity_fk")
        REFERENCES activity ("activity_urn") MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
);



CREATE TABLE IF NOT EXISTS "subactivity"
(
    "subactivity_id" VARCHAR(255) NOT NULL,
    "subactivity_urn" VARCHAR(255) NOT NULL,
    "subactivity_parent_fk" VARCHAR(255),
    CONSTRAINT "PK_subactivity" PRIMARY KEY ("subactivity_id"),
    CONSTRAINT "FK_subactivity_parent" FOREIGN KEY ("subactivity_parent_fk")
        REFERENCES activity ("activity_urn") MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS "binding"
(
    "binding_id" VARCHAR(255) NOT NULL,
    "binding_from" VARCHAR(255) NOT NULL,
    "binding_to" VARCHAR(255) NOT NULL,
    "binding_activity_fk" VARCHAR(255) NOT NULL,
    CONSTRAINT "PK_binding" PRIMARY KEY ("binding_id"),
    CONSTRAINT "FK_binding_from" FOREIGN KEY ("binding_from")
        REFERENCES endpoint ("endpoint_id") MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT "FK_binding_to" FOREIGN KEY ("binding_to")
        REFERENCES endpoint ("endpoint_id") MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT "FK_activity_id" FOREIGN KEY ("binding_activity_fk")
        REFERENCES activity ("activity_urn") MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
);



CREATE TABLE IF NOT EXISTS "node"
(
    "node_id" VARCHAR(255) NOT NULL,
    "node_child_id" VARCHAR(255),
    "node_con_desc" VARCHAR(255),
    "node_contextual_expected_duration" VARCHAR(255),
    "node_con_name" VARCHAR(255),
    "node_is_expanded" boolean,
    "node_is_locked" boolean,
    "node_project_id" VARCHAR(255),
    "node_return_state" VARCHAR(255),
    "node_return_value" VARCHAR(255),
    "node_test_return_state" VARCHAR(255),
    "node_test_return_value" VARCHAR(255),
    "node_urn" VARCHAR(255),
    "node_x" integer,
    "node_y" integer,
    "node_parent_id_fk" VARCHAR(255),
    CONSTRAINT "PK_node" PRIMARY KEY ("node_id"),
    CONSTRAINT "FK_node_child_parent" FOREIGN KEY ("node_parent_id_fk")
        REFERENCES node ("node_id") MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
);



CREATE TABLE IF NOT EXISTS "subscription"
(
    "subscription_id" VARCHAR(255) NOT NULL,
    "subscription_data" VARCHAR(255),
    "subscription_lrt" timestamp without time zone,
    "subscription_node_fk" VARCHAR(255) NOT NULL,
    CONSTRAINT "PK_subscription" PRIMARY KEY ("subscription_id"),
    CONSTRAINT "FK_node_id" FOREIGN KEY ("subscription_node_fk")
        REFERENCES node ("node_id") MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
);



CREATE TABLE IF NOT EXISTS "performer"
(
    "performer_id" VARCHAR(255) NOT NULL,
    "performer_name" VARCHAR(255) NOT NULL,
    "performer_team_fk" VARCHAR(255) NOT NULL,
    CONSTRAINT "PK_performer" PRIMARY KEY ("performer_id"),
    CONSTRAINT "FK_team_id" FOREIGN KEY ("performer_team_fk")
        REFERENCES team ("team_id") MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
);



CREATE TABLE IF NOT EXISTS "agent"
(
    "agent_id" VARCHAR(255) NOT NULL,
    "agent_date_created" timestamp without time zone,
    "agent_description" VARCHAR(255),
    "agent_is_locked" boolean,
    "agent_name" VARCHAR(255) NOT NULL,
    "agent_urn" VARCHAR(255) NOT NULL,
    "agent_team_fk" VARCHAR(255)  NOT NULL,
    CONSTRAINT "PK_agent" PRIMARY KEY ("agent_id"),
    CONSTRAINT "FK_team_id" FOREIGN KEY ("agent_team_fk")
        REFERENCES team ("team_id") MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
);



CREATE TABLE IF NOT EXISTS "agent_assessment"
(
    "agent_id" VARCHAR(255) NOT NULL,
    "assessment" integer,
    "activity" VARCHAR(255) NOT NULL,
    CONSTRAINT "PK_agent_assessment" PRIMARY KEY ("agent_id", "activity"),
    CONSTRAINT "FK_agent_id" FOREIGN KEY ("agent_id")
        REFERENCES agent ("agent_id") MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
);



CREATE TABLE IF NOT EXISTS "assessment"
(
    "assessment_id" VARCHAR(255) NOT NULL,
    "assessment_score" integer NOT NULL,
    "assessment_agent_fk" VARCHAR(255) NOT NULL,
    CONSTRAINT "PK_assessment" PRIMARY KEY ("assessment_id"),
    CONSTRAINT "FK_assessment_agent" FOREIGN KEY ("assessment_agent_fk")
        REFERENCES agent ("agent_id") MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
);


