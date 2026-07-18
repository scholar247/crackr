import fs from "fs/promises";
import path from "path";
import Database from "better-sqlite3";
import { randomUUID } from "crypto";

import { TEMPLATE_DIR, TEMP_DIR } from "./constants";

export async function createTempDatabase(template: string) {

    const source = path.join(
        TEMPLATE_DIR,
        `${template}.db`
    );

    const filename = `${randomUUID()}.db`;

    const destination = path.join(
        TEMP_DIR,
        filename
    );

    await fs.copyFile(source, destination);

    const db = new Database(destination);

    return {

        db,

        file: destination

    };

}

export async function deleteDatabase(file: string) {

    await fs.unlink(file);

}