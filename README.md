# gatsby-remark-check-links

A sub-plugin for `gatsby-transformer-remark` that detects broken links to pages and headings among your website's markdown pages. This is useful if your page slugs or heading IDs are being automatically generated. Heading IDs might be created by [`gatsby-remark-autolink-headers`](https://www.gatsbyjs.org/packages/gatsby-remark-autolink-headers/), for example.

It will provide output about the broken links in the terminal when your site builds and as you make changes to pages. In production, your build will break if there are any broken links.

## Installation

```bash
$ npm install gatsby-remark-check-links
```

## Usage

```js
// gatsby-config.js
module.exports = {
  plugins: [
    {
      resolve: 'gatsby-transformer-remark',
      options: {
        plugins: [
          'gatsby-remark-autolink-headers',
          'gatsby-remark-check-links'
        ]
      }
    }
  ]
};
```

## Making exceptions

If you need to exempt some pages from registering as broken links, you can pass an `exceptions` option to the plugin. Provide an array of page slugs, and any links pointing to it or a heading on its page will not be judged for broken-ness.

```js
// gatsby-config.js
module.exports = {
  plugins: [
    {
      resolve: 'gatsby-transformer-remark',
      options: {
        plugins: [
          'gatsby-remark-autolink-headers',
          {
            resolve: 'gatsby-remark-check-links',
            options: {
              exceptions: '/page/with/false-positives/'
            }
          }
        ]
      }
    }
  ]
};
```

## Caveats

Once a markdown page has been cached by Gatsby, you won't see any output about its broken links until the file changes or your cache gets cleared. If you want to see link check output for *all* files every time you run `npm start`, you can set up your npm script like this:

```json
{
  "scripts": {
    "start": "rm -rf .cache && gatsby develop"
  }
}
```

## License

MIT
