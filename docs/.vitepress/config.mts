import llmstxt from "vitepress-plugin-llms";
import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
    vite: {
        plugins: [llmstxt()]
    },
  title: "DCS Dropzone",
  description: "A DCS World Mod Manager",
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Daemon', link: '/daemon/' },
      { text: 'Webapp', link: '/webapp/' },
      { text: 'Launcher', link: '/launcher/' },
    ],

    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'DCS Dropzone', link: '/' },
        ]
      },
      {
        text: 'Guides',
        items: [
          { text: 'How the Daemon works', link: '/guides/how-the-daemon-works' },
          { text: 'How the Webapp works', link: '/guides/how-the-webapp-works' },
          { text: 'How the Launcher works', link: '/guides/how-the-launcher-works' },
          { text: 'Local development', link: '/local-development' },
        ]
      },
      {
        text: 'Reference',
        items: []
      },
      {
        text: 'Spec',
        items: [
          { text: 'Add Release', link: '/daemon/spec/add-release' },
          { text: 'Remove Release', link: '/daemon/spec/remove-release' },
          { text: 'Enable Release', link: '/daemon/spec/enable-release' },
          { text: 'Disable Release', link: '/daemon/spec/disable-release' },
        ]
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/flying-dice/dcs-dropzone' }
    ]
  }
})
