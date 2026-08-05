# Sample blog — full Markdown feature showcase

Not seeded into MySQL — this is a standalone reference file. Paste everything **below the
`---`** into the blog editor's content field (or straight into `articles.body` if you're
testing the repository layer directly) to visually verify every Markdown feature the renderer
(`src/components/blog/blog-content.tsx`) supports, all in one article.

Covers: H2–H4 headings, bold/italic/strikethrough/inline code, ordered/unordered/nested/task
lists, tables, fenced code blocks (multiple languages, copy button, language badge), block
quotes, all four callout variants, inline and block KaTeX math, an image, regular + autolinked
links, and a horizontal rule.

One deliberate gap: standard Markdown has no underline syntax, and this renderer doesn't load
`rehype-raw`, so raw `<u>` HTML wouldn't render as underline either — it's called out explicitly
in the text section below rather than silently skipped.

---

## Graph Algorithms Deep Dive: BFS, DFS & Beyond

Graph traversal shows up everywhere in competitive programming and technical interviews —
from shortest-path routing to dependency resolution. This guide walks through the two
foundational traversal strategies, compares them head-to-head, and links out to further
reading.

### Text formatting

You'll see **bold text**, *italic text*, and even ***bold italic*** used throughout guides
like this one. Deprecated approaches are often marked with ~~strikethrough~~ so you know not
to use them. Inline code like `visited.add(node)` stays monospaced within a sentence.

> Underline isn't part of standard Markdown syntax, and this editor doesn't support raw HTML
> passthrough — so there's no way to render literal underlined text here. Bold or italic are
> the intended emphasis tools instead.

### Traversal order matters

Two structures dominate graph traversal:

- **Breadth-First Search (BFS)** — explores level by level using a queue
- **Depth-First Search (DFS)** — explores as deep as possible before backtracking, using a
  stack (or recursion)
  - Pre-order, in-order, and post-order variants exist for trees specifically
  - DFS is naturally recursive, which is both its charm and its stack-overflow risk on deep
    graphs

Typical study order for this topic:

1. Master adjacency list vs. adjacency matrix representation
2. Implement BFS with an explicit queue
3. Implement DFS both recursively and iteratively (explicit stack)
4. Layer in weighted variants — Dijkstra's algorithm, Bellman-Ford
5. Practice on grid-based problems (islands, flood fill) before graph-specific ones

Progress checklist for this module:

- [x] Understand adjacency list vs. matrix trade-offs
- [x] Implement BFS
- [ ] Implement DFS iteratively
- [ ] Solve 10 practice problems
- [ ] Time yourself on a mock contest

### Complexity comparison

| Algorithm       | Time Complexity | Space Complexity | Typical Use Case              |
| ---------------- | :--------------: | :----------------: | ------------------------------ |
| BFS              | `O(V + E)`       | `O(V)`             | Shortest path (unweighted)     |
| DFS               | `O(V + E)`       | `O(V)`             | Cycle detection, topological sort |
| Dijkstra's        | `O((V + E) log V)` | `O(V)`            | Shortest path (weighted, non-negative) |
| Bellman-Ford       | `O(V · E)`        | `O(V)`             | Shortest path (handles negative weights) |

### Reference implementations

BFS in Python, using a deque for O(1) pops from the front:

```python
from collections import deque

def bfs(graph, start):
    visited = {start}
    queue = deque([start])
    order = []

    while queue:
        node = queue.popleft()
        order.append(node)
        for neighbor in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)

    return order
```

The same idea in C++, for when the judge cares about constant factors:

```cpp
vector<int> bfs(vector<vector<int>>& graph, int start) {
    vector<bool> visited(graph.size(), false);
    queue<int> q;
    vector<int> order;

    visited[start] = true;
    q.push(start);

    while (!q.empty()) {
        int node = q.front(); q.pop();
        order.push_back(node);
        for (int neighbor : graph[node]) {
            if (!visited[neighbor]) {
                visited[neighbor] = true;
                q.push(neighbor);
            }
        }
    }
    return order;
}
```

And a one-line reminder of what NOT to do:

```bash
# Don't recurse into DFS on a graph with 10^6 nodes without raising the stack limit first
python3 -S -c "import sys; sys.setrecursionlimit(10**7)"
```

### Worked example

> "The best way to understand a graph algorithm is to trace it by hand on a 6-node graph
> before you ever write code." — every competitive programming mentor, ever

Consider the shortest-path cost between two nodes, where the edge weight function is:

$$
w(u, v) = \sqrt{(x_u - x_v)^2 + (y_u - y_v)^2}
$$

and the total path cost is the familiar summation $\text{cost} = \sum_{i=1}^{n-1} w(v_i, v_{i+1})$,
minimized by Dijkstra's algorithm in $O((V + E) \log V)$ time with a binary heap.

:::info
BFS guarantees the shortest path **only when all edge weights are equal** (or the graph is
unweighted). For weighted graphs, reach for Dijkstra's or Bellman-Ford instead.
:::

:::warning
Forgetting to mark a node as visited *before* enqueueing it (rather than after dequeueing) is
the single most common BFS bug — it lets the same node get added to the queue multiple times.
:::

:::tip
When a problem says "minimum number of steps" or "fewest moves," that's almost always a BFS
signal — think of the grid as an unweighted graph where each cell is a node.
:::

:::danger
Never run unbounded recursive DFS on user-supplied graph input without a depth/visited guard —
a cyclic graph with no cycle check will recurse forever and crash the process.
:::

### Visualizing it

![A graph traversal diagram showing nodes connected by edges](https://picsum.photos/800/450)

### Further reading

- [Introduction to Algorithms (CLRS)](https://mitpress.mit.edu/9780262046305/introduction-to-algorithms/) — the canonical reference
- Full write-up on topological sort: /blogs/topological-sort-explained
- Or just check the source directly at https://github.com — autolinked without needing brackets

---

That's the full feature set. If every section above renders with the right styling — anchored
headings with a working table of contents, syntax-highlighted code with a working copy button,
a scrollable table, four distinctly colored callouts, and properly typeset math — the renderer
is behaving correctly end to end.
