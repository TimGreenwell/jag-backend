DROP TABLE IF EXISTS assessment;                -- ref: agent
DROP TABLE IF EXISTS agent_assessment;          -- ref: agent
DROP TABLE IF EXISTS agent;                     -- ref: team
DROP TABLE IF EXISTS performer;                 -- ref: team
DROP TABLE IF EXISTS subscription;              -- ref: node
DROP TABLE IF EXISTS node;                      -- ref: node (itself)
DROP TABLE IF EXISTS binding;                   -- ref: endpoint and activity
DROP TABLE IF EXISTS subactivity;               -- ref: activity
DROP TABLE IF EXISTS endpoint;                  -- ref: activity
DROP TABLE IF EXISTS team;
DROP TABLE IF EXISTS analysis;
DROP TABLE IF EXISTS activity;