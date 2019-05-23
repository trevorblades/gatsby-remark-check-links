const visit = require('unist-util-visit');

function getCacheKey(node) {
  return `remark-check-links-${node.internal.contentDigest}`;
}

function getHeadingsMapKey(link, slug) {
  let key = link;
  const hashIndex = link.indexOf('#');
  const hasHash = hashIndex !== -1;
  if (hasHash) {
    key = link.startsWith('#') ? slug : link.slice(0, hashIndex);
  }

  return {
    key,
    hasHash,
    hashIndex
  };
}

module.exports = async ({
  markdownAST,
  markdownNode,
  files,
  getNode,
  cache,
  getCache
}) => {
  if (!markdownNode.fields) {
    // let the file pass if it has no fields
    return markdownAST;
  }

  const links = [];
  const headings = [];

  visit(markdownAST, 'link', (node, index, parent) => {
    if (parent.type === 'heading') {
      headings.push(parent.data.id);
      return;
    }

    if (node.url.startsWith('#') || /^\.{0,2}\//.test(node.url)) {
      links.push(node.url);
    }
  });

  const {slug} = markdownNode.fields;
  const parent = await getNode(markdownNode.parent);
  cache.set(getCacheKey(parent), {
    slug,
    links,
    headings
  });

  // wait to see if all of the Markdown and MDX has been visited
  const linksMap = {};
  const headingsMap = {};
  for (const file of files) {
    if (/^mdx?$/.test(file.extension)) {
      const key = getCacheKey(file);
      const visited = await cache.get(key);
      if (visited) {
        linksMap[visited.slug] = visited.links;
        headingsMap[visited.slug] = visited.headings;
        continue;
      }

      if (getCache) {
        // the cache provided to `gatsby-mdx` has its own namespace, and it
        // doesn't have access to `getCache`, so we have to check to see if
        // those files have been visited here.
        const mdxCache = getCache('gatsby-mdx');
        const mdxVisited = await mdxCache.get(key);
        if (mdxVisited) {
          linksMap[mdxVisited.slug] = mdxVisited.links;
          headingsMap[mdxVisited.slug] = mdxVisited.headings;
          continue;
        }
      }

      // don't continue if a page hasn't been visited yet
      return;
    }
  }

  let totalBrokenLinks = 0;
  for (const slug in linksMap) {
    const linksForSlug = linksMap[slug];
    if (linksForSlug.length) {
      const brokenLinks = linksForSlug.filter(link => {
        // return true for broken links
        const {key, hasHash, hashIndex} = getHeadingsMapKey(link, slug);
        const headings = headingsMap[key];
        if (headings) {
          if (hasHash) {
            const id = link.slice(hashIndex + 1);
            return !headings.includes(id);
          }

          return false;
        }

        return true;
      });

      const brokenLinkCount = brokenLinks.length;
      totalBrokenLinks += brokenLinkCount;
      if (brokenLinkCount) {
        console.warn(`${brokenLinkCount} broken links found on ${slug}`);
        for (const link of brokenLinks) {
          console.warn(`- ${link}`);
        }
        console.log('');
      }
    }
  }

  if (totalBrokenLinks) {
    const message = `${totalBrokenLinks} broken links found`;
    if (process.env.NODE_ENV === 'production') {
      // break builds with broken links before they get deployed for reals
      throw new Error(message);
    }

    console.error(message);
  }

  return markdownAST;
};
