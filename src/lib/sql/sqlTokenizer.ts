export function splitSQLStatements(sql: string): string[] {

    const statements: string[] = [];

    let current = "";

    let singleQuote = false;
    let doubleQuote = false;
    let backtick = false;
    let bracket = false;

    let lineComment = false;
    let blockComment = false;

    for (let i = 0; i < sql.length; i++) {

        const ch = sql[i];
        const next = sql[i + 1];

        /* ------------------------------
           Line Comment
        -------------------------------*/

        if (!singleQuote &&
            !doubleQuote &&
            !backtick &&
            !bracket &&
            !blockComment &&
            ch === "-" &&
            next === "-") {

            lineComment = true;
        }

        if (lineComment) {

            current += ch;

            if (ch === "\n") {
                lineComment = false;
            }

            continue;
        }

        /* ------------------------------
           Block Comment
        -------------------------------*/

        if (!singleQuote &&
            !doubleQuote &&
            !backtick &&
            !bracket &&
            !lineComment &&
            ch === "/" &&
            next === "*") {

            blockComment = true;
        }

        if (blockComment) {

            current += ch;

            if (ch === "*" && next === "/") {

                current += "/";

                i++;

                blockComment = false;
            }

            continue;
        }

        /* ------------------------------
           Single Quotes
        -------------------------------*/

        if (!doubleQuote &&
            !backtick &&
            !bracket &&
            ch === "'") {

            if (singleQuote) {

                if (next === "'") {

                    current += "''";

                    i++;

                    continue;

                }

                singleQuote = false;

            } else {

                singleQuote = true;

            }

        }

        /* ------------------------------
           Double Quotes
        -------------------------------*/

        else if (!singleQuote &&
            !backtick &&
            !bracket &&
            ch === '"') {

            doubleQuote = !doubleQuote;

        }

        /* ------------------------------
           Backticks
        -------------------------------*/

        else if (!singleQuote &&
            !doubleQuote &&
            !bracket &&
            ch === "`") {

            backtick = !backtick;

        }

        /* ------------------------------
           Square Brackets
        -------------------------------*/

        else if (!singleQuote &&
            !doubleQuote &&
            !backtick) {

            if (ch === "[") {

                bracket = true;

            }

            else if (ch === "]") {

                bracket = false;

            }

        }

        /* ------------------------------
           Statement End
        -------------------------------*/

        if (
            ch === ";" &&
            !singleQuote &&
            !doubleQuote &&
            !backtick &&
            !bracket
        ) {

            const statement = current.trim();

            if (statement.length > 0) {

                statements.push(statement);

            }

            current = "";

            continue;

        }

        current += ch;

    }

    const remaining = current.trim();

    if (remaining.length > 0) {

        statements.push(remaining);

    }

    return statements;

}