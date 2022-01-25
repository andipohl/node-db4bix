const sasql = require('sqlanywhere');
const debug = require('../../utils/debug-vars')('SASQL');
debug.debug('Init');

class Sasql{

  constructor(){
    Object.assign(this,{
      pool: undefined,
      conf: undefined,
    })
  }

  async init({conf}){
    this.conf = {
      UID: conf.user,
      PWD: conf.password,
      Host: conf.host + ':' + conf.port,
//      database: conf.database,
      server: conf.instance,
      // pool options
      ConnectionPool: 'YES(MaxCached=' + parseInt(conf.pool.max) + ')'
    };
    try{
      const conn = sasql.createConnection();
      conn.connect(this.conf);  //only test
      conn.disconnect();
    }catch(err){
      debug.error(err);
      throw(err); 
    }
    debug.debug("Connection testet");
  }

  close(){
    // Get the pool from the pool cache and close it when no
    // connections are in use, or force it closed after 10 seconds
    // If this hangs, you may need DISABLE_OOB=ON in a sqlnet.ora file
    //const conf = this.conf;
    //pool.disconnect();
    debug.debug('Pool closed');
    //debug.error("Error while closing connection to SaSQL DB "+
    //  JSON.stringify({host: conf.host, server: conf.instance}),
    //  e
    //);
    this.pool = undefined;
  }

  /**
   *
   * @param q - query string
   * @returns Array of Arrays: [[c1,c2,...,cn],[c1,c2,...,cn],..., ] => dimension: rows x columns
   */
  async query(q){
    //assert.ok(this.pool,`Connection pool for DB ${this.conf.instance} hasn't been initialized yet!`);
    let conn;
    let result = undefined;
    try{
      conn = sasql.createConnection();
      conn.connect(this.conf);
      result = conn.exec(q);
    }catch(err){
      debug.error(`Error executing query ${q} on DB ${this.conf.instance}`,err);
      throw(err);
    }finally{
      try{
        conn.disconnect();
      }catch(err){
        debug.error(`Error releasing connection to DB ${this.conf.instance}`,err);
      }
    }

    // we have to flatten all agregations by column names if any
    return result.map(
      (row) => Object.keys(row).reduce(
        (acc, key) => acc.concat(row[key]),
        []
      ).map( c => {
        try{
          return c.trim();
        }catch(e){
          debug.debug("Error on trimming value "+c+": "+e.message);
          return c;
        }
      })
    );
  }

}

module.exports = Sasql;
