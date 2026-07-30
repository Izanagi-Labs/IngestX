export interface Parser {
  parse(): Promise<Record<string, string>[]>;
}
