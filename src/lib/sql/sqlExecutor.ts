import Database from "better-sqlite3";
import fs from "fs/promises";
import path from "path";
import { performance } from "perf_hooks";

import { splitSQLStatements } from "./sqlTokenizer";
import { validateSQL } from "./validator";

export interface ExecuteRequest {

    template: string;

    sql: string;

}

export interface ExecuteResponse {

    status: boolean;

    executionTime: number;

    result?: unknown;

    error?: string;

}

const TEMPLATE_DIRECTORY = path.join(
    process.cwd(),
    "src",
    "templates"
);

export async function executeSQL(
    request: ExecuteRequest
): Promise<ExecuteResponse> {

    const started = performance.now();

    let db: Database.Database | null = null;

    try {

        validateSQL(request.sql);

        const templateFile = path.join(
            TEMPLATE_DIRECTORY,
            `${request.template}.sql`
        );

        const templateSQL = await fs.readFile(
            templateFile,
            "utf8"
        );

        db = new Database(":memory:");

        configureDatabase(db);

        /*
            Build template
        */

        db.exec(templateSQL);

        /*
            User transaction
        */

        db.exec("BEGIN");

        const statements =
            splitSQLStatements(request.sql);

        let result: unknown = null;

        for (const statement of statements) {

            const prepared =
                db.prepare(statement);

            if (prepared.reader) {

                result =
                    prepared.all();

            }

            else {

                const info =
                    prepared.run();

                result = {

                    changes:
                        info.changes,

                    lastInsertRowid:
                        Number(
                            info.lastInsertRowid
                        )

                };

            }

        }

        db.exec("ROLLBACK");

        db.close();

        return {

            status: true,

            executionTime:
                Math.round(
                    performance.now() - started
                ),

            result

        };

    }

    catch (err: any) {

        try {

            if (db) {

                try {

                    db.exec("ROLLBACK");

                }

                catch {}

                db.close();

            }

        }

        catch {}

        return {

            status: false,

            executionTime:
                Math.round(
                    performance.now() - started
                ),

            error:
                err.message

        };

    }

}

function configureDatabase(
    db: Database.Database
) {

    db.pragma("foreign_keys = ON");

    db.pragma("journal_mode = MEMORY");

    db.pragma("temp_store = MEMORY");

    db.pragma("busy_timeout = 3000");

    db.pragma("trusted_schema = OFF");

}