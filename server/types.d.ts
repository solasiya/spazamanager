declare module 'express-mysql-session' {
  import { SessionStore } from 'express-session';
  
  interface MySQLStoreOptions {
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string;
    clearExpired?: boolean;
    checkExpirationInterval?: number;
    expiration?: number;
    createDatabaseTable?: boolean;
    schema?: {
      tableName?: string;
      columnNames?: {
        session_id?: string;
        expires?: string;
        data?: string;
      };
    };
  }
  
  function MySQLStore(session: any): {
    new (options: MySQLStoreOptions, connection?: any): SessionStore;
  };
  
  export = MySQLStore;
}



