/**
 * Splits a SQL script into single statements, because SQLite's prepare() only accepts one
 * at a time. Semicolons inside strings, quoted identifiers ("x", `x`, [x]) and comments are
 * ignored, and so are the ones inside a CREATE TRIGGER ... BEGIN ... END body.
 *
 * Comment-only fragments are dropped, so a trailing "-- note" doesn't become a statement.
 */
export function splitSQLStatements(sql: string): string[] {
  const statements: string[] = [];

  let start = 0;
  // Words seen outside strings/comments in the current statement, upper-cased. Only the
  // first few matter (to spot CREATE [TEMP] TRIGGER), plus BEGIN/CASE/END for nesting.
  let words: string[] = [];
  let hasCode = false;
  let isTrigger = false;
  let depth = 0;

  const push = (end: number) => {
    const text = sql.slice(start, end).trim();
    if (hasCode && text) statements.push(text);
    start = end + 1;
    words = [];
    hasCode = false;
    isTrigger = false;
    depth = 0;
  };

  let i = 0;
  while (i < sql.length) {
    const ch = sql[i];
    const next = sql[i + 1];

    // -- line comment
    if (ch === '-' && next === '-') {
      const end = sql.indexOf('\n', i);
      i = end === -1 ? sql.length : end + 1;
      continue;
    }

    // /* block comment */
    if (ch === '/' && next === '*') {
      const end = sql.indexOf('*/', i + 2);
      i = end === -1 ? sql.length : end + 2;
      continue;
    }

    // 'string', "identifier", `identifier` — a doubled quote is an escaped quote.
    if (ch === "'" || ch === '"' || ch === '`') {
      hasCode = true;
      let j = i + 1;
      while (j < sql.length) {
        if (sql[j] === ch) {
          if (sql[j + 1] === ch) {
            j += 2;
            continue;
          }
          break;
        }
        j++;
      }
      i = j + 1;
      continue;
    }

    // [identifier]
    if (ch === '[') {
      hasCode = true;
      const end = sql.indexOf(']', i + 1);
      i = end === -1 ? sql.length : end + 1;
      continue;
    }

    if (/[A-Za-z_]/.test(ch)) {
      hasCode = true;
      let j = i + 1;
      while (j < sql.length && /[A-Za-z0-9_$]/.test(sql[j])) j++;
      const word = sql.slice(i, j).toUpperCase();
      words.push(word);

      if (words.length <= 3 && words[0] === 'CREATE' && word === 'TRIGGER') isTrigger = true;
      if (isTrigger) {
        if (word === 'BEGIN' || word === 'CASE') depth++;
        else if (word === 'END') depth--;
      }

      i = j;
      continue;
    }

    if (ch === ';') {
      if (!(isTrigger && depth > 0)) push(i);
      i++;
      continue;
    }

    if (!/\s/.test(ch)) hasCode = true;
    i++;
  }

  push(sql.length);
  return statements;
}
