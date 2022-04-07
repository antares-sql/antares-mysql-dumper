import moment from "moment";
import { BaseDumper } from "./BaseDumper";
import { MySqlDumperOptions } from "./MySqlDumperOptions";

export class SqlDumper extends BaseDumper {
  _client: any;
  _commentChar: string;

  constructor(client, tables, options: MySqlDumperOptions) {
    super(tables, options);
    this._client = client;
    this._commentChar = "#";
  }

  get schemaName() {
    return this._client.schema;
  }

  // get host() {
  //   return this._client._params.host;
  // }

  async getServerVersion() {
    const version = await this._client.getVersion();
    return `${version.name} ${version.number}`;
  }

  async loadTables(): Promise<string[]> {
    return [];
  }

  async ensureTables() {
    if (!this._tables) {
      this._tables = (await this.loadTables()).map((table) => ({
        table,
        includeStructure: true,
        includeContent: true,
        includeDropStatement: true,
      }));
    }
  }

  async dump() {
    await this.ensureTables();

    const includes = this._options.includes || {
      views: true,
      triggers: true,
      routines: true,
      functions: true,
      schedulers: true,
    };
    const extraItems = Object.keys(includes).filter((key) => includes[key]);
    const totalTableToProcess = this._tables.filter(
      (t) => t.includeStructure || t.includeContent || t.includeDropStatement
    ).length;
    const processingItemCount = totalTableToProcess + extraItems.length;

    const exportState = {
      totalItems: processingItemCount,
      currentItemIndex: 0,
      currentItem: "",
      op: "",
    };

    const header = await this.getSqlHeader();
    this.writeString(header);
    this.writeString("\n\n\n");

    for (const item of this._tables) {
      // user abort operation
      if (this.isCancelled) return;

      // skip item if not set to output any detail for them
      if (
        !item.includeStructure &&
        !item.includeContent &&
        !item.includeDropStatement
      )
        continue;

      exportState.currentItemIndex++;
      exportState.currentItem = item.table;
      exportState.op = "FETCH";

      this.emitUpdate(exportState);

      const tableHeader = this.buildComment(
        `Dump of table ${item.table}\n------------------------------------------------------------`
      );
      this.writeString(tableHeader);
      this.writeString("\n\n");

      if (item.includeDropStatement) {
        const dropTableSyntax = this.getDropTable(item.table);
        this.writeString(dropTableSyntax);
        this.writeString("\n\n");
      }

      if (item.includeStructure) {
        const createTableSyntax = await this.getCreateTable(item.table);
        this.writeString(createTableSyntax);
        this.writeString("\n\n");
      }

      if (item.includeContent) {
        exportState.op = "WRITE";
        this.emitUpdate(exportState);
        for await (const sqlStr of this.getTableInsert(item.table)) {
          if (this.isCancelled) return;
          this.writeString(sqlStr);
        }

        this.writeString("\n\n");
      }

      this.writeString("\n\n");
    }

    for (const item of extraItems) {
      const processingMethod = `get${
        item.charAt(0).toUpperCase() + item.slice(1)
      }`;
      exportState.currentItemIndex++;
      exportState.currentItem = item;
      exportState.op = "PROCESSING";
      this.emitUpdate(exportState);

      if (this[processingMethod]) {
        const data = await this[processingMethod]();
        if (data !== "") {
          const header =
            this.buildComment(
              `Dump of ${item}\n------------------------------------------------------------`
            ) + "\n\n";

          this.writeString(header);
          this.writeString(data);
          this.writeString("\n\n");
        }
      }
    }

    const footer = await this.getSqlFooter();
    this.writeString(footer);
  }

  buildComment(text) {
    return text
      .split("\n")
      .map((txt) => `${this._commentChar} ${txt}`)
      .join("\n");
  }

  async getSqlHeader() {
    if (this._options.getHeader) {
      const serverVersion = await this.getServerVersion();
      const header = this._options.getHeader({
        serverVersion,
        schema: this.schemaName,
      });
      if (header) {
        return this.buildComment(header);
      }
    }
    return "";
  }

  async getSqlFooter() {
    if (this._options.getFooter) {
      return this.buildComment(this._options.getFooter());
    }
    return "";
  }

  getCreateTable(tableName) {
    throw new Error('Sql Exporter must implement the "getCreateTable" method');
  }

  getDropTable(tableName) {
    throw new Error('Sql Exporter must implement the "getDropTable" method');
  }

  getTableInsert(tableName): any {
    throw new Error('Sql Exporter must implement the "getTableInsert" method');
  }
}
