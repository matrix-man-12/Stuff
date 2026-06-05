Dynamic Element Resolver Design

Goal

Support dynamic collections where:

- Row order changes
- Dropdown order changes
- New items are inserted
- Existing items move
- Data is loaded dynamically

while preserving deterministic execution.

---

Design Philosophy

Skills are resilient to:

- Dynamic data
- Dynamic ordering
- Dynamic collection sizes

Skills are NOT resilient to:

- Portal UI redesigns
- DOM hierarchy changes
- Component structure changes

If the DOM structure changes significantly, the skill should be relearned.

---

Search Strategy

Level 0

Start from the captured element.

Attempt matching:

- Current node
- Direct children
- Descendants

If found:

Return immediately.

---

Level 1+

Move upward one parent at a time.

For each parent level:

1. Enumerate sibling nodes.
2. Reapply the original relative path.
3. Check:
   - Projected node
   - Direct children
   - Descendants
4. Return immediately on first match.

---

Example

Learned:

<tr>
    <td>
        <span>Sony TV</span>
    </td>
</tr>

Captured:

<span>Sony TV</span>

Execution Target:

Discovery HD

Process:

1. Span level search.
2. TD level search.
3. TR level search.
4. Enumerate rows.
5. Reapply path:
   tr → td → span
6. Compare text.
7. Return matching span.

---

Matching Rules

Current implementation:

- Trim whitespace
- Collapse multiple spaces
- Convert to lowercase
- Exact string comparison

Examples:

MATCH

Sony TV
sony tv

MATCH

Sony TV
Sony TV

NO MATCH

Sony
Sony TV

NO MATCH

Sony TV HD
Sony TV

---

Edge Cases

Duplicate Values

Example:

Sony TV
Sony TV

Result:

First match returned.

---

Virtualized Lists

Example:

Target row not rendered.

Result:

Not found.

Separate scrolling support required.

---

Hidden Nodes

Current implementation may read hidden text.

If portals contain hidden labels, additional visibility filtering may be needed.

---

Portal Structure Change

Example:

Before:

div → span

After:

div → section → span

Result:

Skill should fail.

Relearning required.

---

Recommended Defaults

maxParentDepth = 5

maxDescendantDepth = 3

matching = exact text

failFastOnStructureChange = true

---

Why This Approach

The resolver is intentionally deterministic.

A failed skill is preferable to:

- Clicking the wrong row
- Selecting the wrong dropdown option
- Mutating incorrect portal data

The system prioritizes correctness over aggressive recovery.