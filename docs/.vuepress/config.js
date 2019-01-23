module.exports = {
  locales: {
    '/': {
      lang: 'en-US',
      title: 'Nodepack',
      description: '📦 Modern node development'
    },
  },
  serviceWorker: true,
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
            message: "New content is available.",
            buttonText: "Refresh"
          }
        },
        nav: [
          {
            text: 'Learn',
            items: [
              {
                text: 'Guide',
                link: '/guide/'
              },
              {
                text: 'Config Reference',
                link: '/config/'
              },
              {
                text: 'Plugin Dev Guide',
                link: '/plugin-dev-guide/'
              },
            ]
          },
          {
            text: 'Community',
            link: 'https://spectrum.chat/nodepack'
          },
        ],
        sidebar: {
          '/guide/': [
            '/guide/',
            '/guide/installation',
            {
              title: 'Essentials',
              collapsable: false,
              children: [
                '/guide/creating-a-project',
                '/guide/plugins',
                '/guide/service',
              ]
            },
            {
              title: 'Going further',
              collapsable: false,
              children: [
                '/guide/env-mode',
                '/guide/maintenance',
                '/guide/app-migrations',
                '/guide/env-migrations',
                '/guide/preset',
                '/guide/deployment',
              ]
            },
          ],
          '/config/': [
            '/config/',
          ],
          '/plugin-dev-guide/': [
            '/plugin-dev-guide/',
          ],
        }
      },
    }
  }
}
