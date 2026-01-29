import { Database } from "bun:sqlite";
import { existsSync } from "fs";
import { IcecatDataSource } from "./icecat";

const DB_PATH = "data/icecat-index.db";

export class LocalIcecatDataSource extends IcecatDataSource {
  private db: Database | null = null;
  private findByGtinStmt: any = null;
  private findByMpnStmt: any = null;

  constructor() {
    super();
    if (existsSync(DB_PATH)) {
      try {
        console.log("⚡ [LocalIcecat] Loading high-speed local index...");
        this.db = new Database(DB_PATH, { readonly: true });
        // The index file maps EAN_UPC (comma separated) -> ID
        // Since we want to find if *our* GTIN is inside that string, we use LIKE
        this.findByGtinStmt = this.db.prepare(
          "SELECT id FROM icecat_index WHERE gtins LIKE ? LIMIT 1",
        );
        this.findByMpnStmt = this.db.prepare(
          "SELECT id FROM icecat_index WHERE mpn = ? LIMIT 1",
        );
      } catch (e) {
        console.warn(
          "⚠️ [LocalIcecat] Index file exists but failed to load:",
          e,
        );
        this.db = null;
        this.findByGtinStmt = null;
        this.findByMpnStmt = null;
      }
    } else {
      console.warn("⚠️ [LocalIcecat] Index file not found at " + DB_PATH);
    }
  }

  async findIdByGtin(gtin: string): Promise<string | null> {
    if (!this.db) {
      console.warn(
        "⚠️ [LocalIcecat] DB not ready, falling back to slow stream.",
      );
      return super.findIdByGtin(gtin);
    }

    // Search for %GTIN%
    const result = this.findByGtinStmt.get(`%${gtin}%`) as {
      id: string;
    } | null;
    return result ? result.id : null;
  }

  async findIdByMpn(mpn: string): Promise<string | null> {
    if (!this.db) {
      return super.findIdByMpn(mpn);
    }

    const result = this.findByMpnStmt.get(mpn) as { id: string } | null;
    return result ? result.id : null;
  }
}

export const localIcecatDataSource = new LocalIcecatDataSource();
