import Vue from 'vue';

export const state = () => ({
  forceInsecure: null,
  projects: null,
  containers: null,
  emails: null,
  notificationsEnabled: null
});

export const mutations = {
  SET (state, { key, value }) {
    Vue.set(state, key, value);
  }
};

export const actions = {
  async fetchStatus ({ state, commit }) {
    const { forceInsecure } = await this.$axios.$get('/status');
    commit('SET', { key: 'forceInsecure', value: forceInsecure });
  },
  async fetchProjects ({ state, commit }) {
    if (state.projects === null) {
      const projects = await this.$axios.$get('/projects');
      commit('SET', { key: 'projects', value: projects });
    }
  },
  async fetchContainers ({ state, commit }, force) {
    if (force || state.containers === null) {
      const containers = await this.$axios.$get('/containers');
      commit('SET', { key: 'containers', value: containers });
    }
  },
  async fetchEmails ({ state, commit }, force) {
    if (state.emails === null) {
      const emails = await this.$axios.$get('/user/emails');
      commit('SET', { key: 'emails', value: emails });
    }
  },
  async fetchNotificationsEnabled({ state, commit }, force) {
    if (state.notificationsEnabled === null) {
      const notificationsEnabled = await this.$axios.$get('/user/notifications/enabled');
      commit('SET', { key: 'notificationsEnabled', value: notificationsEnabled });
    }
  },
  emailLogin (ctx, email) {
    return this.$axios.$post('/user/login', { email });
  }
};
