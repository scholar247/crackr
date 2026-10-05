// Side-effect import: registers KaTeX's mhchem extension (`\ce{H2O}`, `\pu{1.5 mol}`) on the
// shared katex instance. Import this wherever math is rendered — the blog preview, inline
// markdown, and the editor's formula nodes — so chemistry looks identical everywhere.
import 'katex/contrib/mhchem';
