function normalizeText(text) {
    return (text || "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}

async function resolveDynamicElement(
    page,
    capturedXpath,
    targetValue,
    {
        maxParentDepth = 5,
        maxDescendantDepth = 3
    } = {}
) {
    const locator = page.locator(`xpath=${capturedXpath}`);

    if ((await locator.count()) === 0) {
        throw new Error(
            `Captured xpath not found: ${capturedXpath}`
        );
    }

    const handle = await locator.first().elementHandle();

    const result = await handle.evaluate(
        (
            element,
            {
                targetValue,
                maxParentDepth,
                maxDescendantDepth
            }
        ) => {

            const target =
                targetValue
                    .replace(/\s+/g, " ")
                    .trim()
                    .toLowerCase();

            function normalize(text) {
                return (text || "")
                    .replace(/\s+/g, " ")
                    .trim()
                    .toLowerCase();
            }

            function isMatch(el) {
                if (!el) return false;

                return (
                    normalize(
                        el.innerText ||
                        el.textContent
                    ) === target
                );
            }

            function getPathToTarget(
                ancestor,
                targetNode
            ) {
                const path = [];

                let current = targetNode;

                while (
                    current &&
                    current !== ancestor
                ) {
                    const parent =
                        current.parentElement;

                    if (!parent) {
                        return null;
                    }

                    const index =
                        Array.from(
                            parent.children
                        ).indexOf(current);

                    path.unshift(index);

                    current = parent;
                }

                return current === ancestor
                    ? path
                    : null;
            }

            function followPath(
                ancestor,
                path
            ) {
                let current = ancestor;

                for (const index of path) {

                    if (
                        !current ||
                        !current.children ||
                        current.children.length <= index
                    ) {
                        return null;
                    }

                    current =
                        current.children[index];
                }

                return current;
            }

            function searchChildren(
                node
            ) {
                if (!node) {
                    return null;
                }

                for (const child of node.children) {

                    if (isMatch(child)) {
                        return child;
                    }
                }

                return null;
            }

            function searchDescendants(
                root,
                maxDepth
            ) {
                if (!root) {
                    return null;
                }

                const queue = [
                    {
                        node: root,
                        depth: 0
                    }
                ];

                while (
                    queue.length > 0
                ) {
                    const current =
                        queue.shift();

                    if (
                        current.depth > 0 &&
                        isMatch(
                            current.node
                        )
                    ) {
                        return current.node;
                    }

                    if (
                        current.depth >=
                        maxDepth
                    ) {
                        continue;
                    }

                    for (const child of current.node.children) {
                        queue.push({
                            node: child,
                            depth:
                                current.depth + 1
                        });
                    }
                }

                return null;
            }

            function buildXPath(
                node
            ) {
                const parts = [];

                while (
                    node &&
                    node.nodeType === 1
                ) {

                    let index = 1;

                    let sibling =
                        node.previousElementSibling;

                    while (
                        sibling
                    ) {
                        if (
                            sibling.tagName ===
                            node.tagName
                        ) {
                            index++;
                        }

                        sibling =
                            sibling.previousElementSibling;
                    }

                    parts.unshift(
                        `${node.tagName.toLowerCase()}[${index}]`
                    );

                    node =
                        node.parentElement;
                }

                return (
                    "/" +
                    parts.join("/")
                );
            }

            let ancestor =
                element;

            for (
                let level = 0;
                level <=
                maxParentDepth;
                level++
            ) {

                if (!ancestor) {
                    break;
                }

                const relativePath =
                    getPathToTarget(
                        ancestor,
                        element
                    );

                if (
                    !relativePath
                ) {
                    break;
                }

                const parent =
                    ancestor.parentElement;

                const siblings =
                    parent
                        ? Array.from(
                              parent.children
                          )
                        : [ancestor];

                for (const sibling of siblings) {

                    const projected =
                        followPath(
                            sibling,
                            relativePath
                        );

                    if (
                        isMatch(
                            projected
                        )
                    ) {
                        return {
                            found: true,
                            xpath:
                                buildXPath(
                                    projected
                                )
                        };
                    }

                    const childMatch =
                        searchChildren(
                            projected
                        );

                    if (
                        childMatch
                    ) {
                        return {
                            found: true,
                            xpath:
                                buildXPath(
                                    childMatch
                                )
                        };
                    }

                    const descendantMatch =
                        searchDescendants(
                            projected,
                            maxDescendantDepth
                        );

                    if (
                        descendantMatch
                    ) {
                        return {
                            found: true,
                            xpath:
                                buildXPath(
                                    descendantMatch
                                )
                        };
                    }
                }

                ancestor =
                    ancestor.parentElement;
            }

            return {
                found: false
            };
        },
        {
            targetValue,
            maxParentDepth,
            maxDescendantDepth
        }
    );

    if (!result?.found) {
        return null;
    }

    return page.locator(
        `xpath=${result.xpath}`
    );
}