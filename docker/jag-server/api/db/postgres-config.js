import pkg from 'pg';
const {Pool} = pkg;

// or --  const { Pool } = require('pg')

const pool = new Pool({
    host: `api-postgres`,
    database: `teamworks`,
    user: `teamworks`,
    password: `teamworks`,
    port: `5432` //  postgresql.conf (locate)
});

function query(text, params, callback) {
    return pool.query(text, params, callback);
}

export {query};
