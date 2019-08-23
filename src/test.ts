/* eslint-env jest */
import plugin = require('.');
import Cache = require('gatsby/dist/utils/cache');
import getCache = require('gatsby/dist/utils/get-cache');
import {Node} from 'gatsby';
import {Parent} from 'mdast';
import {createContentDigest} from 'gatsby/utils';
import {heading, link, paragraph, root, text} from 'mdast-builder';

const cache = new Cache().init();

const files = [
  {
    id: 'foo',
    extension: 'md',
    internal: {
      contentDigest: createContentDigest(Math.random())
    }
  },
  {
    id: 'bar',
    extension: 'md',
    internal: {
      contentDigest: createContentDigest(Math.random())
    }
  }
];

const filesById = files.reduce(
  (acc, file): object => ({...acc, [file.id]: file}),
  {}
);

async function getNode(id: string): Promise<Node> {
  return new Promise((resolve): void => resolve(filesById[id]));
}

const nodes = [
  {
    markdownAST: root([
      heading(2, text('this is a test')),
      paragraph([
        text('please click '),
        // incorrect link here
        link('/page3', 'page 2', text('this link'))
      ])
    ]),
    markdownNode: {
      parent: 'foo',
      fields: {
        slug: '/'
      }
    }
  },
  {
    markdownAST: root([
      heading(2, text('page2')),
      paragraph(link('/', 'page 2', text('back to home')))
    ]),
    markdownNode: {
      parent: 'bar',
      fields: {
        slug: '/page2'
      }
    }
  }
];

async function visitNodes(nodes): Promise<Parent[]> {
  return Promise.all(
    nodes.map(
      ({markdownAST, markdownNode}): Promise<Parent> =>
        plugin(
          {
            markdownAST,
            markdownNode,
            files,
            getNode,
            cache,
            getCache,
            pathPrefix: ''
          },
          {verbose: false}
        )
    )
  );
}

beforeAll((): void => {
  process.env.NODE_ENV = 'production';
});

test('throws on broken links', async (): Promise<void> => {
  expect.assertions(1);
  await expect(visitNodes(nodes)).rejects.toThrow();
});
