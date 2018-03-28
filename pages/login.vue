<template>
  <main class="container">
    <div class="text-center centered-container">
      <h1>Authenticate</h1>
      <p class="description">
        To log in, please fill in your email address below:
      </p>
      <form class="ajax-form" @submit.prevent="submit">
        <div class="form-control-container">
          <input class="form-control large text-center" name="email" placeholder="you@yourdomain.com" type="email"
                 v-model="email" required>
        </div>
        <!-- FIXME: styling -->
        <p v-if="message" v-text="message"></p>
        <div class="form-control-container">
          <button class="btn btn-primary large" type="submit">Log In</button>
        </div>
      </form>
    </div>
  </main>
</template>

<script>
  export default {
    middleware: 'auth',
    data () {
      return {
        email: '',
        message: ''
      };
    },
    methods: {
      async submit () {
        try {
          const res = await this.$store.dispatch('emailLogin', this.email);
          switch (res.status) {
            case 'logged-in':
              this.message = 'Already logged in';
              break;
            case 'email-sent':
              this.message = 'You should receive an email shortly.';
              break;
          }
        } catch (err) {
          // TODO: check error kind
          console.error(err);
          this.message = 'Error occurred attempting to login';
        }
      }
    }
  };
</script>
