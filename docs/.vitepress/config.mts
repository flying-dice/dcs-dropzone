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
          { text: 'Errors as Values', link: '/guides/errors-as-values' },
          { text: 'Local development', link: '/local-development' },
        ]
      },
      {
        text: 'Reference',
        items: [
          { text: 'Linker', link: '/packages/linker' },
          { text: 'Queue', link: '/packages/queue' },
        ]
      },
      {
        text: 'Daemon Spec',
        items: [
          { text: 'Add Release', link: '/daemon/spec/add-release' },
          { text: 'Remove Release', link: '/daemon/spec/remove-release' },
          { text: 'Enable Release', link: '/daemon/spec/enable-release' },
          { text: 'Disable Release', link: '/daemon/spec/disable-release' },
          { text: 'Toggle Release', link: '/daemon/spec/toggle-release' },
          { text: 'Get All Releases', link: '/daemon/spec/get-all-releases' },
          { text: 'Get Config', link: '/daemon/spec/get-config' },
          { text: 'Get Health', link: '/daemon/spec/get-health' },
          { text: 'Get Settings', link: '/daemon/spec/get-settings' },
          { text: 'Get Settings Suggestions', link: '/daemon/spec/get-settings-suggestions' },
          { text: 'Update Settings', link: '/daemon/spec/update-settings' },
          { text: 'Validate Settings', link: '/daemon/spec/validate-settings' },
        ]
      },
      {
        text: 'Launcher Spec',
        items: [
          { text: 'Check for Updates', link: '/launcher/spec/check-for-updates' },
        ]
      },
      {
        text: 'Webapp Spec — Auth',
        items: [
          { text: 'Login', link: '/webapp/spec/login' },
          { text: 'Logout', link: '/webapp/spec/logout' },
          { text: 'Get Authenticated User', link: '/webapp/spec/get-authenticated-user' },
        ]
      },
      {
        text: 'Webapp Spec — Public Mods',
        items: [
          { text: 'Browse Mods', link: '/webapp/spec/browse-mods' },
          { text: 'Get Mod', link: '/webapp/spec/get-mod' },
          { text: 'Get Mod Releases', link: '/webapp/spec/get-mod-releases' },
          { text: 'Get Mod Release', link: '/webapp/spec/get-mod-release' },
          { text: 'Get Latest Mod Release', link: '/webapp/spec/get-latest-mod-release' },
          { text: 'Register Mod Release Download', link: '/webapp/spec/register-mod-release-download' },
        ]
      },
      {
        text: 'Webapp Spec — Dashboard',
        items: [
          { text: 'Get Server Metrics', link: '/webapp/spec/get-server-metrics' },
          { text: 'Get Featured Mods', link: '/webapp/spec/get-featured-mods' },
          { text: 'Get Popular Mods', link: '/webapp/spec/get-popular-mods' },
          { text: 'Get Categories', link: '/webapp/spec/get-categories' },
          { text: 'Get Tags', link: '/webapp/spec/get-tags' },
        ]
      },
      {
        text: 'Webapp Spec — User Mods',
        items: [
          { text: 'Get User Mods', link: '/webapp/spec/get-user-mods' },
          { text: 'Get User Mod', link: '/webapp/spec/get-user-mod' },
          { text: 'Create Mod', link: '/webapp/spec/create-mod' },
          { text: 'Update Mod', link: '/webapp/spec/update-mod' },
          { text: 'Delete Mod', link: '/webapp/spec/delete-mod' },
        ]
      },
      {
        text: 'Webapp Spec — User Releases',
        items: [
          { text: 'Get User Mod Releases', link: '/webapp/spec/get-user-mod-releases' },
          { text: 'Get User Mod Release', link: '/webapp/spec/get-user-mod-release' },
          { text: 'Create Release', link: '/webapp/spec/create-release' },
          { text: 'Update Release', link: '/webapp/spec/update-release' },
          { text: 'Delete Release', link: '/webapp/spec/delete-release' },
        ]
      },
      {
        text: 'Webapp Spec — Draft',
        items: [
          { text: 'Get Update Information (Experimental)', link: '/webapp/spec/get-update-information' },
        ]
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/flying-dice/dcs-dropzone' }
    ]
  }
})
