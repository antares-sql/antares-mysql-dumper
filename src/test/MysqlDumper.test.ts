import { SIMPLE } from "./sql-data";
import { createClient, dump, dumpTest, script } from "./test-tools";
import fs from "fs";

test("Basic export", async () => {
  await dumpTest(SIMPLE, async (client) => {
    const { rows } = await client.raw("select * from t1 where id=1");

    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          value: 2,
        }),
      ])
    );
  });
});
