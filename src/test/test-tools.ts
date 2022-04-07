import crypto from "crypto";
import mysql2 from "mysql2";
import { splitQuery, mysqlSplitterOptions } from "dbgate-query-splitter";
import { MysqlDumper } from "../MysqlDumper";
import { MySQLClient } from "../MySQLClient";

function randomDbName() {
  const generatedKey = crypto.randomBytes(6);
  const newKey = generatedKey.toString("hex");
  return `db${newKey}`;
}

export function query(connection, sql) {
  return new Promise((resolve, reject) => {
    connection.query(sql, function (error, results, fields) {
      if (error) reject(error);
      resolve(results);
    });
  });
}

export async function script(connection, sql) {
  for (const cmd of splitQuery(sql, mysqlSplitterOptions)) {
    await query(connection, cmd);
  }
}

export async function createClient(): Promise<MySQLClient> {
  const database = randomDbName();
  const options = {
    host: process.env.HOST || "mysql",
    port: process.env.PORT ? parseInt(process.env.PORT) : 3306,
    user: "root",
    password: "TestPwd",
  };
  const connection = mysql2.createConnection(options);
  await query(connection, `CREATE DATABASE ${database}`);
  connection.destroy();

  const dbConnection = mysql2.createConnection({
    ...options,
    database,
  });
  const client = new MySQLClient(dbConnection, database);
  return client;
}

export function dump(client: MySQLClient, outputFile) {
  return new Promise((resolve, reject) => {
    const dumper = new MysqlDumper(
      client,
      [
        {
          table: "t1",
          includeStructure: true,
          includeContent: true,
          includeDropStatement: true,
        },
      ],
      {
        schema: client.schema,
        outputFile,
        includes: {
          views: true,
          triggers: true,
          routines: true,
          functions: true,
          schedulers: true,
        },
        outputFormat: "sql",
        sqlInsertAfter: 250,
        sqlInsertDivider: "bytes",
      }
    );
    dumper.once("end", () => {
      resolve(true);
    });
    dumper.once("error", (err) => {
      reject(err);
    });
    dumper.run();
  });
}
