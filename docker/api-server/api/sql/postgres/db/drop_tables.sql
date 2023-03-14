DROP TABLE IF EXISTS assessment;                -- ref: agent
DROP TABLE IF EXISTS agent_assessment;          -- ref: agent
DROP TABLE IF EXISTS agent;                     -- ref: team
DROP TABLE IF EXISTS performer;                 -- ref: team
DROP TABLE IF EXISTS subscription;              -- ref: livenode
DROP TABLE IF EXISTS livenode;                      -- ref: livenode (itself)
DROP TABLE IF EXISTS binding;                   -- ref: endpoint and jag
DROP TABLE IF EXISTS innerjag;               -- ref: jag
DROP TABLE IF EXISTS endpoint;                  -- ref: jag
DROP TABLE IF EXISTS team;
DROP TABLE IF EXISTS analysis;
DROP TABLE IF EXISTS jag;