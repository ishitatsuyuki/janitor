const db = require('./server/lib/db');

module.exports = {
  mode: 'universal',

  /*
  ** Head settings of the page
   */
  head: {
    titleTemplate: '%s – Janitor'
  },

  /*
  ** Meta headers of the page
  */
  meta: {
    name: 'Janitor'
  },

  /*
  ** Customize the progress-bar color
  */
  loading: { color: '#3B8070' },

  /*
  ** Global CSS
  */
  css: ['~/assets/css/janitor.css'],

  /*
  ** Plugins to load before mounting the App
  */
  plugins: ['~/plugins/timeago.js'],

  /*
  ** Nuxt.js modules
  */
  modules: [
    // Doc: https://axios.nuxtjs.org/usage.html
    '@nuxtjs/axios',
    // Doc: https://auth.nuxtjs.org/
    '@nuxtjs/auth',
    // Doc: https://pwa.nuxtjs.org/
    '@nuxtjs/pwa',
    // Doc: https://github.com/nuxt-community/analytics-module
    '@nuxtjs/google-analytics'
  ],

  /*
  ** Axios module configuration
  */
  axios: {
    // See https://axios.nuxtjs.org/options.html
    host: db.get('hostname', 'localhost'),
    port: db.get('ports').https,
    prefix: '/api',
    credentials: true
  },

  /*
  ** Auth module configuration
   */
  auth: {
    endpoints: {
      login: false,
      logout: { url: '/user/logout', method: 'post' },
      user: { url: '/user', method: 'get', propertyName: false }
    },
    token: false,
    cookie: false
  },

  /*
  ** Analytics module configuration
   */
  'google-analytics': {
    id: 'UA-62373597-1'
  },

  /*
  ** Build configuration
  */
  build: {
    /*
    ** You can extend webpack config here
    */
    extend (config, ctx) {
      // Run ESLint on save
      if (ctx.isDev && ctx.isClient) {
        config.module.rules.push({
          enforce: 'pre',
          test: /\.(js|vue)$/,
          loader: 'eslint-loader',
          exclude: /(node_modules)/
        });
      }
    }
  }
};
