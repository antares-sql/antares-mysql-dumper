[![NPM version](https://img.shields.io/npm/v/antares-mysql-dumper.svg)](https://www.npmjs.com/package/antares-mysql-dumper)

# antares-mysql-dumper

Dumps MySQL database into file. You could use both node-mysql clients, mysql and mysql2.

## Usage

```js
import MySqlDumper from "antares-mysql-dumper";
import mysql2 from "mysql2";

const connection = mysql2.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "test",
  database: "myDatabase",
});

const dumper = new MySqlDumper({
  connection,
  schema: "myDatabase",
  outputFile: "test.sql",
});

await dumper.run();
```

MySqlDumper constructor takes one parameter, options, with following type:

```ts
export interface MySqlDumperOptions_Table {
  table: string;
  includeStructure?: boolean;
  includeContent?: boolean;
  includeDropStatement?: boolean;
}

export interface MySqlDumperOptions_Includes {
  views?: boolean;
  triggers?: boolean;
  routines?: boolean;
  functions?: boolean;
  schedulers?: boolean;
}

export interface MySqlDumperOptions {
  /** mysql client */
  connection: any;
  /** database/schema name */
  schema: string;
  outputFile: string;
  tables?: MySqlDumperOptions_Table[];

  includes?: MySqlDumperOptions_Includes;

  compress?: boolean;
  sqlInsertAfter?: number;
  sqlInsertDivider?: "rows" | "bytes";
}
```
