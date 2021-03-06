import crypto from "crypto";
import mysql2 from "mysql2";
import fs from "fs";
import { splitQuery, mysqlSplitterOptions } from "dbgate-query-splitter";
import { MySqlDumper } from "../MySqlDumper";
import { MySqlClient } from "../MySqlClient";

function randomDbName() {
  const generatedKey = crypto.randomBytes(6);
  const newKey = generatedKey.toString("hex");
  return `db${newKey}`;
}

function randomFileName() {
  const generatedKey = crypto.randomBytes(6);
  const newKey = generatedKey.toString("hex");
  return `output/file${newKey}.sql`;
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

export async function createClient(): Promise<MySqlClient> {
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
  const client = new MySqlClient(dbConnection, database);
  return client;
}

export function dump(client: MySqlClient, outputFile) {
  return new Promise((resolve, reject) => {
    const dumper = new MySqlDumper({
      connection: client.connection,
      schema: client.schema,
      outputFile,

      // includes: {
      //   views: true,
      //   triggers: true,
      //   routines: true,
      //   functions: true,
      //   schedulers: true,
      // },
      // compress: false,
      // sqlInsertAfter: 250,
      // sqlInsertDivider: "bytes",
    });
    dumper.once("end", () => {
      resolve(true);
    });
    dumper.once("error", (err) => {
      reject(err);
    });
    dumper.run();
  });
}

export async function dumpTest(
  dataSql: string,
  check: (client: MySqlClient) => Promise<void>
) {
  const fileName = randomFileName();

  const client = await createClient();
  await script(client.connection, dataSql);
  await dump(client, fileName);
  await client.connection.destroy();

  const client2 = await createClient();
  await script(
    client2.connection,
    fs.readFileSync(fileName, { encoding: "utf-8" })
  );

  await check(client2);

  await client2.connection.destroy();
}
