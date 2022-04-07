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

  getHeader?: ({ serverVersion, schema }) => string;
  getFooter?: () => string;
}
