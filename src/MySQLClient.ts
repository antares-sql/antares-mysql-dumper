import mysql from "mysql2/promise";

export class MySQLClient {
  connection: any;
  schema: string;

  constructor(connection, schema) {
    this.connection = connection;
    this.schema = schema;
  }

  /**
   * @param {Object} params
   * @param {String} params.schema
   * @param {String} params.table
   * @returns {Object} table scructure
   * @memberof MySQLClient
   */
  async getTableColumns({ schema, table }) {
    const { rows } = await this.raw(
      `SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = '${schema}' AND TABLE_NAME='${table}'`
    );

    const { rows: fields } = await this.raw(
      `SHOW CREATE TABLE \`${schema}\`.\`${table}\``
    );

    const remappedFields = fields.map((row) => {
      if (!row["Create Table"]) return false;

      let n = 0;
      return row["Create Table"]
        .split("")
        .reduce((acc, curr) => {
          if (curr === ")") n--;
          if (n !== 0) acc += curr;
          if (curr === "(") n++;
          return acc;
        }, "")
        .replaceAll("\n", "")
        .split(/,\s?(?![^(]*\))/)
        .map((f) => {
          try {
            const fieldArr = f.trim().split(" ");
            const nameAndType = fieldArr.slice(0, 2);
            if (nameAndType[0].charAt(0) !== "`") return false;

            const details = fieldArr.slice(2).join(" ");
            let defaultValue = null;
            if (details.includes("DEFAULT"))
              defaultValue = details
                .match(/(?<=DEFAULT ).*?$/gs)[0]
                .split(" COMMENT")[0];
            // const defaultValueArr = defaultValue.split('');
            // if (defaultValueArr[0] === '\'') {
            //    defaultValueArr.shift();
            //    defaultValueArr.pop();
            //    defaultValue = defaultValueArr.join('');
            // }

            const typeAndLength = nameAndType[1].replace(")", "").split("(");

            return {
              name: nameAndType[0].replaceAll("`", ""),
              type: typeAndLength[0].toUpperCase(),
              length: typeAndLength[1] ? typeAndLength[1] : null,
              default: defaultValue,
            };
          } catch (err) {
            return false;
          }
        })
        .filter(Boolean)
        .reduce((acc, curr) => {
          acc[curr.name] = curr;
          return acc;
        }, {});
    })[0];

    return rows.map((field) => {
      let numLength = field.COLUMN_TYPE.match(/int\(([^)]+)\)/);
      numLength = numLength
        ? +numLength.pop()
        : field.NUMERIC_PRECISION || null;
      const enumValues = /(enum|set)/.test(field.COLUMN_TYPE)
        ? field.COLUMN_TYPE.match(/\(([^)]+)\)/)[0].slice(1, -1)
        : null;

      const defaultValue =
        remappedFields && remappedFields[field.COLUMN_NAME]
          ? remappedFields[field.COLUMN_NAME].default
          : field.COLUMN_DEFAULT;

      return {
        name: field.COLUMN_NAME,
        key: field.COLUMN_KEY.toLowerCase(),
        type:
          remappedFields && remappedFields[field.COLUMN_NAME]
            ? remappedFields[field.COLUMN_NAME].type
            : field.DATA_TYPE.toUpperCase(),
        schema: field.TABLE_SCHEMA,
        table: field.TABLE_NAME,
        numPrecision: field.NUMERIC_PRECISION,
        numScale: Number(field.NUMERIC_SCALE),
        numLength,
        enumValues,
        datePrecision: field.DATETIME_PRECISION,
        charLength: field.CHARACTER_MAXIMUM_LENGTH,
        nullable: field.IS_NULLABLE.includes("YES"),
        unsigned: field.COLUMN_TYPE.includes("unsigned"),
        zerofill: field.COLUMN_TYPE.includes("zerofill"),
        order: field.ORDINAL_POSITION,
        default: defaultValue,
        charset: field.CHARACTER_SET_NAME,
        collation: field.COLLATION_NAME,
        autoIncrement: field.EXTRA.includes("auto_increment"),
        generated: field.EXTRA.toLowerCase().includes("generated"),
        onUpdate: field.EXTRA.toLowerCase().includes("on update")
          ? field.EXTRA.substr(
              field.EXTRA.indexOf("on update") + 9,
              field.EXTRA.length
            ).trim()
          : "",
        comment: field.COLUMN_COMMENT,
      };
    });
  }

  async raw(sql: string): Promise<{ rows: any[] }> {
    return new Promise((resolve, reject) => {
      this.connection.query(sql, function (error, results, fields) {
        if (error) reject(error);
        resolve({ rows: results });
      });
    });
  }
}
