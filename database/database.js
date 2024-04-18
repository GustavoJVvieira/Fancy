import knex from "knex"

const database = knex({
    client: 'mysql2',
    connection: {
      host : '127.0.0.1',
      port : 3306,
      user : 'root',
      
      database : 'fancy_bd_teste'
    }
  });

  export default database;