<template>
  <div>
    <header class="navbar navbar-sticky link-list-wrapper" role="navigation">
      <div class="navbar-container">
        <nuxt-link class="brand-logo" to="/">
          <img src="/img/janitor.svg" alt="Janitor Logo">
          <span>Janitor</span>
        </nuxt-link>
        <label for="menu-toggle" class="icon menu"></label>
        <input type="checkbox" class="menu-toggle" id="menu-toggle">
        <ul v-if="loggedIn">
          <li>
            <nuxt-link to="/projects/">Projects</nuxt-link>
          </li>
          <li>
            <nuxt-link to="/containers/">Containers</nuxt-link>
          </li>
          <li>
            <nuxt-link to="/settings/">Settings</nuxt-link>
          </li>
          <li><a @click.prevent="logout">Log Out</a></li>
        </ul>
        <ul v-else>
          <li>
            <nuxt-link to="/login">Log In</nuxt-link>
          </li>
        </ul>
      </div>
    </header>
    <div class="global-alert alert alert-warning text-center" role="alert" v-if="forceInsecure">
      <span class="icon warning"></span>
      <span>Janitor was forced into <strong>insecure mode</strong>. Several security features have been disabled.</span>
    </div>
    <nuxt/>
    <footer class="footer link-list-wrapper">
      <div class="footer-inner-container container">
        <div class="footer-link-container">
          <div class="footer-link-list">
            <span class="bold">Project</span>
            <ul>
              <li>
                <nuxt-link to="/reference/api">API</nuxt-link>
              </li>
              <li><a href="https://github.com/janitortechnology/janitor">GitHub</a></li>
              <li>
                <nuxt-link to="/data/">Data</nuxt-link>
              </li>
              <li><a href="https://github.com/janitortechnology/janitor/blob/master/LICENSE">License</a></li>
              <li><a href="https://github.com/janitortechnology/janitor/issues/new">Report Bug</a></li>
            </ul>
          </div>
          <div class="footer-link-list">
            <span class="bold">Community</span>
            <ul>
              <li>
                <nuxt-link to="/blog/">Blog</nuxt-link>
              </li>
              <li><a href="https://discourse.janitor.technology/">Discourse</a></li>
              <li><a href="https://kiwiirc.com/nextclient/irc.freenode.net/?#janitor">#janitor (IRC)</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-logo-container">
          <a class="brand-logo" href="/">
            <img src="~/assets/img/janitor.svg" alt="Janitor Logo">
            <span>Janitor</span>
          </a>
          <span class="footer-logo-tagline grey-text">The fastest development system in the world.</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
  import { mapState } from 'vuex';

  export default {
    fetch ({ store }) {
      return store.dispatch('fetchStatus');
    },
    computed: {
      ...mapState(['forceInsecure']),
      ...mapState('auth', ['loggedIn'])
    },
    methods: {
      logout () {
        return this.$auth.logout();
      }
    }
  };
</script>

<style>
</style>
