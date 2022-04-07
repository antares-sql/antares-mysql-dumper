import { SIMPLE } from "./sql-data";
import { createClient, dump, script } from "./test-tools";

test("Basic export", async () => {
  const client = await createClient();
  await script(client.connection, SIMPLE);
  await dump(client, "test.sql");
  await client.connection.destroy();
});
