CREATE TABLE IF NOT EXISTS "jag"
(
    "jag_urn" VARCHAR(255) NOT NULL,
    "jag_author" VARCHAR(255),
    "jag_collapsed" boolean,
    "connector_exec" VARCHAR(255) NOT NULL,
    "connector_oper" VARCHAR(255) NOT NULL,
    "connector_rtns" VARCHAR(255),
    "jag_created_date" timestamp without time zone,
    "jag_description" VARCHAR(255),
    "jag_expected_duration" VARCHAR(255),
    "jag_is_locked" boolean,
    "jag_locked_by" VARCHAR(255),
    "jag_modified_date" timestamp without time zone,
    "jag_name" VARCHAR(255) NOT NULL,
    CONSTRAINT "PK_jag" PRIMARY KEY ("jag_urn")
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
    "endpoint_jag_fk" VARCHAR(255) NOT NULL,
    CONSTRAINT "PK_endpoint" PRIMARY KEY ("endpoint_id"),
    CONSTRAINT "FK_jag_urn" FOREIGN KEY ("endpoint_jag_fk")
        REFERENCES jag ("jag_urn") MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
);



CREATE TABLE IF NOT EXISTS "innerjag"
(
    "innerjag_id" VARCHAR(255) NOT NULL,
    "innerjag_urn" VARCHAR(255) NOT NULL,
    "innerjag_parent_fk" VARCHAR(255),
    CONSTRAINT "PK_innerjag" PRIMARY KEY ("innerjag_id"),
    CONSTRAINT "FK_innerjag_parent" FOREIGN KEY ("innerjag_parent_fk")
        REFERENCES jag ("jag_urn") MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS "binding"
(
    "binding_id" VARCHAR(255) NOT NULL,
    "binding_from" VARCHAR(255) NOT NULL,
    "binding_to" VARCHAR(255) NOT NULL,
    "binding_jag_fk" VARCHAR(255) NOT NULL,
    CONSTRAINT "PK_binding" PRIMARY KEY ("binding_id"),
    CONSTRAINT "FK_binding_from" FOREIGN KEY ("binding_from")
        REFERENCES endpoint ("endpoint_id") MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT "FK_binding_to" FOREIGN KEY ("binding_to")
        REFERENCES endpoint ("endpoint_id") MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT "FK_jag_id" FOREIGN KEY ("binding_jag_fk")
        REFERENCES jag ("jag_urn") MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
);



CREATE TABLE IF NOT EXISTS "livenode"
(
    "livenode_id" VARCHAR(255) NOT NULL,
    "livenode_child_id" VARCHAR(255),
    "livenode_con_desc" VARCHAR(255),
    "livenode_contextual_expected_duration" VARCHAR(255),
    "livenode_con_name" VARCHAR(255),
    "livenode_is_expanded" boolean,
    "livenode_is_locked" boolean,
    "livenode_project_id" VARCHAR(255),
    "livenode_return_state" VARCHAR(255),
    "livenode_return_value" VARCHAR(255),
    "livenode_test_return_state" VARCHAR(255),
    "livenode_test_return_value" VARCHAR(255),
    "livenode_urn" VARCHAR(255),
    "livenode_x" integer,
    "livenode_y" integer,
    "livenode_parent_id_fk" VARCHAR(255),
    CONSTRAINT "PK_livenode" PRIMARY KEY ("livenode_id"),
    CONSTRAINT "FK_livenode_child_parent" FOREIGN KEY ("livenode_parent_id_fk")
        REFERENCES livenode ("livenode_id") MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
);



CREATE TABLE IF NOT EXISTS "subscription"
(
    "subscription_id" VARCHAR(255) NOT NULL,
    "subscription_data" VARCHAR(255),
    "subscription_lrt" timestamp without time zone,
    "subscription_livenode_fk" VARCHAR(255) NOT NULL,
    CONSTRAINT "PK_subscription" PRIMARY KEY ("subscription_id"),
    CONSTRAINT "FK_livenode_id" FOREIGN KEY ("subscription_livenode_fk")
        REFERENCES livenode ("livenode_id") MATCH SIMPLE
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
    "jag" VARCHAR(255) NOT NULL,
    CONSTRAINT "PK_agent_assessment" PRIMARY KEY ("agent_id", "jag"),
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


