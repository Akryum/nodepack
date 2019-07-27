module.exports = {
  plugins: [
    '@vuepress/pwa',
  ],
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
        serviceWorker: {
          updatePopup: {
            message: 'New content is available.',
            buttonText: 'Refresh',
          },
        },
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
                '/guide/env-mode',
                '/guide/config',
                '/guide/context',
                '/guide/maintenance',
                '/guide/preset',
                '/guide/deployment',
              ],
            },
            {
              title: 'Advanced',
              collapsable: false,
              children: [
                '/guide/app-migrations',
                '/guide/env-migrations',
                '/guide/db-migrations',
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
