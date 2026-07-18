const KEYWORDS = new Set([
  "SELECT","FROM","WHERE","JOIN","LEFT","RIGHT","INNER","OUTER","FULL","ON","AND","OR",
  "NOT","IN","IS","NULL","AS","ORDER","BY","GROUP","HAVING","LIMIT","OFFSET","INSERT",
  "INTO","VALUES","UPDATE","SET","DELETE","CREATE","TABLE","DROP","ALTER","ADD","COLUMN",
  "INDEX","UNIQUE","PRIMARY","KEY","FOREIGN","REFERENCES","CONSTRAINT","DEFAULT","WITH",
  "UNION","ALL","DISTINCT","CASE","WHEN","THEN","ELSE","END","EXISTS","BETWEEN","LIKE",
  "ILIKE","ASC","DESC","NULLS","LAST","FIRST","CROSS","NATURAL","USING","LATERAL",
  "RECURSIVE","MATERIALIZED","VIEW","PROCEDURE","FUNCTION","TRIGGER","DATABASE","SCHEMA",
  "IF","BEGIN","COMMIT","ROLLBACK","TRANSACTION","EXPLAIN","ANALYZE","VERBOSE","RETURNING",
  "TRUNCATE","CASCADE","RESTRICT","OVER","PARTITION","WINDOW","ROWS","RANGE","PRECEDING",
  "FOLLOWING","CURRENT","ROW","UNBOUNDED","TRUE","FALSE","INT","BIGINT","VARCHAR","TEXT",
  "BOOLEAN","DECIMAL","TIMESTAMPTZ","UUID","SERIAL","BIGSERIAL","FLOAT","REAL","NUMERIC",
]);

const FUNCTIONS = new Set([
  "COUNT","SUM","AVG","MAX","MIN","COALESCE","NULLIF","CAST","CONVERT","TO_CHAR","TO_DATE",
  "TO_TIMESTAMP","NOW","CURRENT_TIMESTAMP","CURRENT_DATE","DATE_TRUNC","EXTRACT","SUBSTRING",
  "TRIM","UPPER","LOWER","LENGTH","CONCAT","REPLACE","ROW_NUMBER","RANK","DENSE_RANK",
  "LAG","LEAD","FIRST_VALUE","LAST_VALUE","ARRAY_AGG","JSON_AGG","STRING_AGG",
  "GENERATE_SERIES","ROUND","FLOOR","CEIL","ABS","MOD","POWER","SQRT","REGEXP_REPLACE",
]);

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function highlightSQL(sql: string): string {
  let result = "";
  let i = 0;
  const len = sql.length;

  while (i < len) {
    // Line comment
    if (sql[i] === "-" && sql[i + 1] === "-") {
      const end = sql.indexOf("\n", i);
      const chunk = end === -1 ? sql.slice(i) : sql.slice(i, end);
      result += `<span class="sh-comment">${esc(chunk)}</span>`;
      i += chunk.length;
      continue;
    }
    // Block comment
    if (sql[i] === "/" && sql[i + 1] === "*") {
      const end = sql.indexOf("*/", i + 2);
      const chunk = end === -1 ? sql.slice(i) : sql.slice(i, end + 2);
      result += `<span class="sh-comment">${esc(chunk)}</span>`;
      i += chunk.length;
      continue;
    }
    // String literal
    if (sql[i] === "'" || sql[i] === '"') {
      const q = sql[i];
      let j = i + 1;
      while (j < len) {
        if (sql[j] === q && sql[j - 1] !== "\\") { j++; break; }
        j++;
      }
      result += `<span class="sh-string">${esc(sql.slice(i, j))}</span>`;
      i = j;
      continue;
    }
    // Number
    if (/[0-9]/.test(sql[i]) && (i === 0 || /[\s,(=<>!+\-*/]/.test(sql[i - 1]))) {
      let j = i;
      while (j < len && /[0-9._]/.test(sql[j])) j++;
      result += `<span class="sh-number">${esc(sql.slice(i, j))}</span>`;
      i = j;
      continue;
    }
    // Identifier / keyword / function
    if (/[a-zA-Z_]/.test(sql[i])) {
      let j = i;
      while (j < len && /[a-zA-Z0-9_]/.test(sql[j])) j++;
      const word = sql.slice(i, j);
      const upper = word.toUpperCase();
      if (KEYWORDS.has(upper)) {
        result += `<span class="sh-keyword">${esc(word)}</span>`;
      } else if (FUNCTIONS.has(upper)) {
        result += `<span class="sh-fn">${esc(word)}</span>`;
      } else {
        result += `<span class="sh-ident">${esc(word)}</span>`;
      }
      i = j;
      continue;
    }
    // Operator
    if (/[=<>!+\-*/,;().]/.test(sql[i])) {
      result += `<span class="sh-op">${esc(sql[i])}</span>`;
      i++;
      continue;
    }
    result += esc(sql[i]);
    i++;
  }
  return result;
}

export function formatSQL(sql: string): string {
  let q = sql;
  const keywords = [
    "SELECT", "FROM", "WHERE", "JOIN", "LEFT JOIN", "RIGHT JOIN", "INNER JOIN",
    "FULL OUTER JOIN", "ON", "AND", "OR", "GROUP BY", "ORDER BY", "HAVING",
    "LIMIT", "OFFSET", "UNION ALL", "UNION",
  ];
  keywords.forEach((kw) => {
    q = q.replace(new RegExp(`\\b${kw}\\b`, "gi"), "\n" + kw);
  });
  return q.replace(/\n{2,}/g, "\n").trim();
}

export function columnTypeColor(type: string): string {
  if (/INT|SERIAL|DECIMAL|FLOAT|NUMERIC|REAL/.test(type)) return "#f9c74f";
  if (/CHAR|TEXT|UUID/.test(type)) return "#3dd68c";
  if (/BOOL/.test(type)) return "#b197fc";
  if (/DATE|TIME|STAMP/.test(type)) return "#4cc9f0";
  return "var(--muted-foreground)";
}
