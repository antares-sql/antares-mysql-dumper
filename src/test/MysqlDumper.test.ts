import { MysqlDumper } from "../MysqlDumper";
import { SIMPLE } from "./sql-data";
import { createConnection, dump, script } from "./test-tools";

test("Basic export", async () => {
  const conn = await createConnection();
  await script(conn, SIMPLE);
  await dump(conn, "test.sql");
});
