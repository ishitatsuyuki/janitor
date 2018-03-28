<template>
  <main class="container">
    <h1>Contribute to incredible software</h1>
    <p>In just a few clicks, enter a fully-functional development environment. Yes, it's that easy.</p>
    <div class="grid">
      <div class="card" v-for="(project, id) in projects" :key="project.name">
        <img class="card-image" :src="project.icon" :alt="`${project.name} Logo`">
        <div class="card-content">
          <div class="grow">
            <h2 v-text="project.name"></h2>
            <p v-text="project.description"></p>
          </div>
          <div class="card-actions">
            <div class="grow">
              Built <timeago class="project-timestamp" :since="project.updated"></timeago>.
            </div>
            <button class="btn btn-primary"
                    title="Create a new container for this project"
                    @click.prevent="createContainer(id)">
              New Container
            </button>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script>
  import { mapState } from 'vuex';

  export default {
    head: {
      title: 'Projects'
    },
    fetch ({ store }) {
      return store.dispatch('fetchProjects');
    },
    computed: {
      ...mapState(['projects'])
    },
    methods: {
      createContainer (id) {
        if (this.$auth.state.loggedIn) {
          const project = this.projects[id];
          this.$axios.$put(`/hosts/${project.dockerHost}/containers?project=${id}`);
        } else {
          this.$router.push('/login');
        }
      }
    }
  };
</script>
