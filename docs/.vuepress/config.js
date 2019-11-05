module.exports = {
  plugins: {
    '@vuepress/pwa': {
      serviceWorker: true,
      updatePopup: {
        '/': {
          message: "New content is available.",
          buttonText: "Refresh"
        },
      },
    },
  },
  locales: {
    '/': {
      lang: 'en-US',
      title: 'Nodepack',
      description: 'A progressive Node.js framework',
    },
  },
  head: [
    ['link', { rel: 'icon', href: '/favicon.png' }],
  ],
  themeConfig: {
    logo: '/favicon.png',
    repo: 'Akryum/nodepack',
    docsDir: 'docs',
    docsBranch: 'master',
    editLinks: true,
    sidebarDepth: 3,
    locales: {
      '/': {
        label: 'English',
        selectText: 'Languages',
        lastUpdated: 'Last Updated',
        editLinkText: 'Edit this page on GitHub',
        nav: [
          {
            text: 'Learn',
            items: [
              {
                text: 'Guide',
                link: '/guide/',
              },
              {
                text: 'Config Reference',
                link: '/config/',
              },
              {
                text: 'Plugin Dev Guide',
                link: '/plugin-dev-guide/',
              },
            ],
          },
          {
            text: 'Browse plugins',
            link: 'https://awesomejs.dev/for/nodepack/',
          },
          {
            text: 'Changelog',
            link: 'https://github.com/Akryum/nodepack/blob/master/CHANGELOG.md',
          },
          {
            text: 'Community',
            link: 'https://spectrum.chat/nodepack',
          },
        ],
        sidebar: {
          '/guide/': [
            {
              title: 'Introduction',
              collapsable: false,
              children: [
                '/guide/',
                '/guide/installation',
                '/guide/quick-start',
              ],
            },
            {
              title: 'Essentials',
              collapsable: false,
              children: [
                '/guide/creating-a-project',
                '/guide/plugins',
                '/guide/service',
              ],
            },
            {
              title: 'Going further',
              collapsable: false,
              children: [
                '/guide/context',
                '/guide/config',
                '/guide/maintenance',
                '/guide/database',
                '/guide/testing',
                '/guide/env-mode',
                '/guide/deployment',
              ],
            },
            {
              title: 'Advanced',
              collapsable: true,
              children: [
                '/guide/app-migrations',
                '/guide/env-migrations',
                '/guide/db-migrations',
                '/guide/preset',
                '/guide/webpack',
                '/guide/native-require',
              ],
            },
          ],
          '/config/': [
            '/config/',
          ],
          '/plugin-dev-guide/': [
            '/plugin-dev-guide/',
          ],
        },
      },
    },
  },
}
