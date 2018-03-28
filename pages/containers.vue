<template>
  <main class="container">
    <h2 class="header">Containers</h2>
    <div class="panel" v-for="(machine, index) in containers" :key="machine.id">
      <div class="panel-heading padded">
        <span class="status-icon" :class="statusClass(machine.status)"></span>
        <img class="panel-icon" :src="projects[machine.project].icon"
             :alt="`${projects[machine.project].icon.name} Logo`">
        <div class="grow">
          <EditableLabel class="project-title" title="Project name" v-model="names[index]"
                         :placeholder="`${projects[machine.project].name} #${machine.id}`"
                         @submit="updateName(index)"/>
        </div>
        <div>
          <a class="btn" :href="`https://${machine.dockerHost}/${machine.dockerContainer}/8088/vnc.html`"
             target="_blank">VNC</a>
          <a class="btn btn-primary" :href="`https://${machine.dockerHost}/${machine.dockerContainer}/8089/ide.html`"
             target="_blank">IDE</a>
        </div>
      </div>
      <tabs class="panel-body tabs" :options="{ useUrlFragment: false }">
        <tab name="Info" class="padded">
          <p class="project-updated">
            Built
            <timeago class="project-timestamp" :since="machine.updated"></timeago>
            .
          </p>
        </tab>
        <tab name="Advanced" class="tab-panel">
          <div class="padded">
            <b>Connect via SSH</b>
            <p>Use the following command to connect to your container via SSH:</p>
            <code>ssh -p{{ machine.dockerPorts['22'].port }} user@{{machine.dockerHost}}</code>
          </div>
          <div class="danger-zone padded">
            <b>Danger zone!</b>
            <p>This action can't be undone, please make sure you've backed up everything valuable.</p>
            <form class="ajax-form has-feedback" @submit.prevent="deleteContainer(machine)">
              <button type="submit" class="btn btn-error">Delete {{machine.name}}</button>
            </form>
          </div>
        </tab>
      </tabs>
    </div>
  </main>
</template>

<script>
  import { Tab, Tabs } from 'vue-tabs-component';
  import { mapState } from 'vuex';
  import EditableLabel from '../components/EditableLabel';

  export default {
    head: {
      title: 'Containers'
    },
    middleware: 'auth',
    components: {
      EditableLabel,
      Tab,
      Tabs,
    },
    fetch ({ store }) {
      return Promise.all([store.dispatch('fetchProjects'), store.dispatch('fetchContainers')]);
    },
    data () {
      return {
        names: this.$store.state.containers.map(x => x.name)
      };
    },
    computed: {
      ...mapState(['projects', 'containers'])
    },
    methods: {
      statusClass (status) {
        return {
          started: 'success',
          accepted: 'success',
          rejected: 'warning',
          merged: 'primary'
        }[status] || 'default';
      },
      async deleteContainer (machine) {
        this.$axios.$delete(`/hosts/${machine.dockerHost}/containers/${machine.dockerContainer}`);
        await this.$store.dispatch('fetchContainers', true);
      },
      async updateName (index) {
        const machine = this.$store.state.containers[index];
        try {
          await this.$axios.$patch(`/hosts/${machine.dockerHost}/containers/${machine.dockerContainer}`,
            [{ op: 'add', path: '/name', value: this.names[index] }]);
        } catch (err) {
          console.error(err);
        }
        try {
          await this.$store.dispatch('fetchContainers', true);
        } finally {
          // FIXME: this isn't necessarily consistent
          this.names[index] = this.$store.state.projects[index].name;
        }
      }
    }
  };
</script>

