/* eslint-env jest */
import plugin = require('.');
import {heading, link, paragraph, root, text} from 'mdast-builder';

beforeAll((): void => {
  process.env.NODE_ENV = 'production';
});

const nodes = [
  {
    markdownAST: root([
      heading(2, text('this is a test')),
      paragraph([
        text('please click '),
        link('/page2', 'page 2', text('this link'))
      ])
    ]),
    markdownNode: {
      id: 'foo',
      contentDigest: '1',
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
      id: 'bar',
      contentDigest: '2',
      fields: {
        slug: '/page2'
      }
    }
  }
];

test('throws on broken links', (): void => {
  expect(
    async (): Promise<void> => {
      for (const {markdownAST, markdownNode} of nodes) {
        await plugin({
          markdownAST,
          markdownNode,
          files: [],
          getNode: () => {},
          cache: {},
          getCache: () => {},
          pathPrefix: ''
        });
      }
    }
  ).toThrow();
});
