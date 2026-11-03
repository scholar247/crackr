// Lightweight SQL tokenizer shared by the editor's syntax highlighting and the Format
// button. Styling for the `sh-*` classes lives in globals.css (.sql-highlight).

const KEYWORDS = new Set([
  'ABORT', 'ACTION', 'ADD', 'AFTER', 'ALL', 'ALTER', 'ALWAYS', 'ANALYZE', 'AND', 'AS', 'ASC',
  'AUTOINCREMENT', 'BEFORE', 'BEGIN', 'BETWEEN', 'BY', 'CASCADE', 'CASE', 'CAST', 'CHECK',
  'COLLATE', 'COLUMN', 'COMMIT', 'CONFLICT', 'CONSTRAINT', 'CREATE', 'CROSS', 'CURRENT',
  'CURRENT_DATE', 'CURRENT_TIME', 'CURRENT_TIMESTAMP', 'DEFAULT', 'DEFERRABLE', 'DEFERRED',
  'DELETE', 'DESC', 'DISTINCT', 'DO', 'DROP', 'EACH', 'ELSE', 'END', 'ESCAPE', 'EXCEPT',
  'EXCLUDE', 'EXISTS', 'EXPLAIN', 'FILTER', 'FIRST', 'FOLLOWING', 'FOR', 'FOREIGN', 'FROM',
  'FULL', 'GENERATED', 'GLOB', 'GROUP', 'GROUPS', 'HAVING', 'IF', 'IGNORE', 'IMMEDIATE', 'IN',
  'INDEX', 'INDEXED', 'INITIALLY', 'INNER', 'INSERT', 'INSTEAD', 'INTERSECT', 'INTO', 'IS',
  'ISNULL', 'JOIN', 'KEY', 'LAST', 'LEFT', 'LIKE', 'LIMIT', 'MATCH', 'MATERIALIZED', 'NATURAL',
  'NO', 'NOT', 'NOTHING', 'NOTNULL', 'NULL', 'NULLS', 'OF', 'OFFSET', 'ON', 'OR', 'ORDER',
  'OTHERS', 'OUTER', 'OVER', 'PARTITION', 'PLAN', 'PRAGMA', 'PRECEDING', 'PRIMARY', 'QUERY',
  'RANGE', 'RECURSIVE', 'REFERENCES', 'REGEXP', 'RELEASE', 'RENAME', 'REPLACE', 'RESTRICT',
  'RETURNING', 'RIGHT', 'ROLLBACK', 'ROW', 'ROWS', 'SAVEPOINT', 'SELECT', 'SET', 'TABLE',
  'TEMP', 'TEMPORARY', 'THEN', 'TIES', 'TO', 'TRANSACTION', 'TRIGGER', 'UNBOUNDED', 'UNION',
  'UNIQUE', 'UPDATE', 'USING', 'VALUES', 'VIEW', 'VIRTUAL', 'WHEN', 'WHERE', 'WINDOW', 'WITH',
  'WITHOUT', 'TRUE', 'FALSE',
  // Common type names
  'INT', 'INTEGER', 'BIGINT', 'SMALLINT', 'TINYINT', 'REAL', 'FLOAT', 'DOUBLE', 'NUMERIC',
  'DECIMAL', 'TEXT', 'VARCHAR', 'CHAR', 'BLOB', 'BOOLEAN', 'DATE', 'DATETIME', 'TIMESTAMP',
]);

const FUNCTIONS = new Set([
  'ABS', 'AVG', 'CHANGES', 'CHAR', 'COALESCE', 'COUNT', 'CUME_DIST', 'DATE', 'DATETIME',
  'DENSE_RANK', 'FIRST_VALUE', 'FORMAT', 'GROUP_CONCAT', 'HEX', 'IFNULL', 'IIF', 'INSTR',
  'JSON', 'JSON_ARRAY', 'JSON_EXTRACT', 'JSON_OBJECT', 'JULIANDAY', 'LAG', 'LAST_VALUE',
  'LEAD', 'LENGTH', 'LOWER', 'LTRIM', 'MAX', 'MIN', 'NTH_VALUE', 'NTILE', 'NULLIF',
  'PERCENT_RANK', 'PRINTF', 'RANDOM', 'RANK', 'REPLACE', 'ROUND', 'ROW_NUMBER', 'RTRIM',
  'SIGN', 'STRFTIME', 'STRING_AGG', 'SUBSTR', 'SUBSTRING', 'SUM', 'TIME', 'TOTAL', 'TRIM',
  'TYPEOF', 'UNICODE', 'UPPER', 'CEIL', 'FLOOR', 'SQRT', 'POWER', 'MOD', 'UNIXEPOCH',
]);

type TokenType = 'comment' | 'string' | 'quoted' | 'number' | 'keyword' | 'fn' | 'ident' | 'op' | 'space';

const MULTI_CHAR_OPS = ['->>', '->', '<=', '>=', '<>', '!=', '==', '||', '<<', '>>'];

interface Token {
  type: TokenType;
  text: string;
}

/** Index just past a quoted run starting at `i` (doubled quote = escaped quote). */
function skipQuoted(sql: string, i: number, close: string): number {
  let j = i + 1;
  while (j < sql.length) {
    if (sql[j] === close) {
      if (close !== ']' && sql[j + 1] === close) {
        j += 2;
        continue;
      }
      return j + 1;
    }
    j++;
  }
  return sql.length;
}

export function tokenizeSQL(sql: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < sql.length) {
    const ch = sql[i];
    const next = sql[i + 1];
    let end: number;
    let type: TokenType;

    if (ch === '-' && next === '-') {
      const nl = sql.indexOf('\n', i);
      end = nl === -1 ? sql.length : nl;
      type = 'comment';
    } else if (ch === '/' && next === '*') {
      const close = sql.indexOf('*/', i + 2);
      end = close === -1 ? sql.length : close + 2;
      type = 'comment';
    } else if (ch === "'") {
      end = skipQuoted(sql, i, "'");
      type = 'string';
    } else if (ch === '"' || ch === '`' || ch === '[') {
      end = skipQuoted(sql, i, ch === '[' ? ']' : ch);
      type = 'quoted';
    } else if (/\s/.test(ch)) {
      end = i + 1;
      while (end < sql.length && /\s/.test(sql[end])) end++;
      type = 'space';
    } else if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(next ?? ''))) {
      end = i + 1;
      while (end < sql.length && /[0-9.eE_xXa-fA-F]/.test(sql[end])) end++;
      type = 'number';
    } else if (/[A-Za-z_]/.test(ch)) {
      end = i + 1;
      while (end < sql.length && /[A-Za-z0-9_$]/.test(sql[end])) end++;
      const upper = sql.slice(i, end).toUpperCase();
      // A name followed by "(" is a function call, even if it's also a keyword (REPLACE, DATE).
      const isCall = /^\s*\(/.test(sql.slice(end, end + 8));
      type = isCall && FUNCTIONS.has(upper) ? 'fn' : KEYWORDS.has(upper) ? 'keyword' : 'ident';
    } else {
      const op = MULTI_CHAR_OPS.find((o) => sql.startsWith(o, i));
      end = i + (op?.length ?? 1);
      type = 'op';
    }

    tokens.push({ type, text: sql.slice(i, end) });
    i = end;
  }

  return tokens;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** HTML for the editor's highlight layer. Every character of the input is escaped. */
export function highlightSQL(sql: string): string {
  return tokenizeSQL(sql)
    .map((t) => (t.type === 'space' ? esc(t.text) : `<span class="sh-${t.type}">${esc(t.text)}</span>`))
    .join('');
}

// Keywords that start a new line when formatting. Multi-word clauses are matched as a
// sequence so "LEFT JOIN" stays on one line.
const CLAUSES = [
  ['SELECT'], ['FROM'], ['WHERE'], ['GROUP', 'BY'], ['ORDER', 'BY'], ['HAVING'], ['LIMIT'],
  ['OFFSET'], ['UNION', 'ALL'], ['UNION'], ['INTERSECT'], ['EXCEPT'], ['VALUES'], ['SET'],
  ['RETURNING'], ['WINDOW'],
  ['LEFT', 'OUTER', 'JOIN'], ['RIGHT', 'OUTER', 'JOIN'], ['FULL', 'OUTER', 'JOIN'],
  ['LEFT', 'JOIN'], ['RIGHT', 'JOIN'], ['FULL', 'JOIN'], ['INNER', 'JOIN'], ['CROSS', 'JOIN'],
  ['NATURAL', 'JOIN'], ['JOIN'],
  ['INSERT', 'INTO'], ['UPDATE'], ['DELETE', 'FROM'], ['WITH'],
];
const SUB_CLAUSES = new Set(['AND', 'OR', 'ON']);

/**
 * Re-indents SQL: upper-cases keywords and puts each major clause on its own line.
 * Strings, quoted names and comments are left exactly as written.
 */
export function formatSQL(sql: string): string {
  // Drop whitespace tokens; we decide spacing ourselves.
  const tokens = tokenizeSQL(sql).filter((t) => t.type !== 'space');
  const words = tokens.map((t) => (t.type === 'keyword' || t.type === 'ident' || t.type === 'fn' ? t.text.toUpperCase() : ''));

  let out = '';
  let depth = 0;
  // Inside BETWEEN x AND y, that AND must not start a new line.
  let pendingBetween = false;

  const newline = (extra = 0) => {
    out = out.replace(/[ \t]+$/, '');
    if (out && !out.endsWith('\n')) out += '\n';
    out += '  '.repeat(Math.max(0, depth + extra));
  };
  const space = () => {
    if (out && !/[\s(]$/.test(out)) out += ' ';
  };

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];

    if (t.type === 'comment') {
      if (t.text.startsWith('--')) {
        space();
        out += t.text;
        newline();
      } else {
        space();
        out += t.text;
      }
      continue;
    }

    const clause = CLAUSES.find((c) => c.every((w, k) => words[i + k] === w));
    if (clause) {
      if (clause[0] === 'WITH' && out.trim()) space();
      else newline();
      out += clause.join(' ');
      i += clause.length - 1;
      continue;
    }

    const word = words[i];
    if (word === 'BETWEEN') pendingBetween = true;
    if (SUB_CLAUSES.has(word) && !(word === 'AND' && pendingBetween)) {
      newline(1);
      out += word;
      continue;
    }
    if (word === 'AND') pendingBetween = false;

    if (t.text === '(') {
      // No space between a function name and its "(": COUNT(*), not COUNT (*).
      const prev = tokens[i - 1];
      if (!(prev && (prev.type === 'fn' || prev.type === 'ident' || prev.type === 'quoted'))) space();
      out += '(';
      depth++;
      continue;
    }
    if (t.text === ')') {
      depth = Math.max(0, depth - 1);
      out = out.replace(/\s+$/, '');
      out += ')';
      continue;
    }
    if (t.text === ',') {
      out = out.replace(/\s+$/, '');
      out += ',';
      continue;
    }
    if (t.text === ';') {
      out = out.replace(/\s+$/, '');
      out += ';\n\n';
      depth = 0;
      continue;
    }
    if (t.text === '.') {
      out = out.replace(/\s+$/, '');
      out += '.';
      continue;
    }

    if (!out.endsWith('.')) space();
    out += t.type === 'keyword' ? t.text.toUpperCase() : t.text;
  }

  return out.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}
