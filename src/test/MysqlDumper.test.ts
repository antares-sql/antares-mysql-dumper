import { MORE_TABLES, SIMPLE, VIEW } from "./sql-data";
import { dumpTest } from "./test-tools";

test("Basic export", async () => {
  await dumpTest(SIMPLE, async (client) => {
    const res = await client.raw("select * from t1");

    expect(res.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          value: 2,
        }),
      ])
    );
  });
});

test("More tables", async () => {
  await dumpTest(MORE_TABLES, async (client) => {
    const res1 = await client.raw("select * from t1");

    expect(res1.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          value: 2,
        }),
      ])
    );

    const res2 = await client.raw("select * from t2");

    expect(res2.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 3,
          value: 4,
        }),
      ])
    );
  });
});

test("Export view", async () => {
  await dumpTest(VIEW, async (client) => {
    const res = await client.raw("select * from v1");

    expect(res.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          value: 2,
        }),
      ])
    );
  });
});
