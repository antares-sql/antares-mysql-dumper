export const SIMPLE = `
    CREATE TABLE t1(id INT, value INT);
    INSERT INTO t1(id, value) VALUES (1, 2);
`;

export const MORE_TABLES = `
    CREATE TABLE t1(id INT, value INT);
    INSERT INTO t1(id, value) VALUES (1, 2);

    CREATE TABLE t2(id INT, value INT);
    INSERT INTO t2(id, value) VALUES (3, 4);
`;
