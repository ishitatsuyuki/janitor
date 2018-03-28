<template>
  <div>
    <div class="container">
      <div class="text-center">
        <h1 class="heading">Janitor</h1> <!-- TODO: random -->
        <h2 class="grey-text description">The fastest development system in the world.</h2>
      </div>
      <div id="intro-video">
        <iframe src="https://www.youtube.com/embed/5sNDMIh-iVw" allowfullscreen></iframe>
      </div>
    </div>
    <div id="quotes" class="landing-section">
      <div class="quote grow">
        <blockquote>Just wanted to say thanks for making Janitor. It just saved me a ton of time debugging a crash.
        </blockquote>
        <span>― Brian Grinstead</span>
      </div>
      <div class="quote grow">
        <blockquote>This will change the lives of a lot of contributors.</blockquote>
        <span>― Michael Kohler</span>
      </div>
      <div class="quote grow">
        <blockquote>Mind blown! This would have literally saved months of my life years ago when I hacked on Firefox.
        </blockquote>
        <span>― Brian King</span>
      </div>
    </div>
    <div class="container">
      <h2>In one click, spin up a complete development environment that:</h2>
      <ul>
        <li>Ships with all the project's dependencies pre-installed.</li>
        <li>Has the source code you need already downloaded and compiled.</li>
        <li>Is fast, and connected to a powerful backbone internet connection.</li>
        <li>Can be accessed anywhere you have an internet connection and a web browser; even a library computer or a
          Chromebook.
        </li>
        <li>Runs Linux.</li>
        <li>Comes with convenience scripts and utilities that the maintainers themselves use to improve their
          productivity.
        </li>
        <li>Gets completely isolated from your own computer, and from your other containers.</li>
        <li>Starts in a few seconds.</li>
      </ul>
    </div>
    <div class="container">
      <h2>Mind-blowing projects you can contribute to</h2>
      <div class="grid">
        <div class="card" v-for="project in projects" :key="project.name">
          <img class="card-image" :src="project.icon" :alt="`${project.name} Logo`">
          <div class="card-content">
            <div class="grow">
              <h2 v-text="project.name"></h2>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="container">
      <h2>Get started now:</h2>
      <div class="form-control-container">
        <input class="form-control large" name="email" placeholder="you@yourdomain.com" spellcheck="false"
               autocapitalize="off" type="email" autocomplete="off" required>
        <button class="btn btn-primary large" disabled>Log In</button>
      </div>
    </div>
    <div class="container">
      <h2>Our awesome partners</h2>
      <div class="partners">
        <a href="https://mozilla.org" class="partner-logo"><img src="~/assets/img/partners/mozilla.svg"></a>
        <a href="https://www.irill.org" class="partner-logo"><img src="~/assets/img/partners/irill.png"></a>
        <a href="https://aws.amazon.com/cloud9/" class="partner-logo"><img src="/img/c9.svg"></a>
        <a href="https://www.datadoghq.com" class="partner-logo"><img src="~/assets/img/partners/datadog.svg"></a>
      </div>
    </div>
  </div>
</template>

<script>
  import { mapState } from 'vuex';

  export default {
    fetch ({ store }) {
      return store.dispatch('fetchProjects');
    },
    computed: { ...mapState(['projects']) }
  };
</script>

<style scoped>
  /* Landing page */

  .heading {
    font-size: 32px;
    font-weight: 300;
  }

  .container, .landing-section {
    font-size: 16px;
  }

  .landing-section {
    padding: 50px 10vw;
  }

  #intro-video {
    max-width: 992px;
    width: 100%;
    height: 50vh;
    margin: 50px auto;
    display: block;
    position: relative;
  }

  #intro-video iframe {
    width: 100%;
    height: 100%;
    border: none;
  }

  #quotes {
    background: #fafafa;
    border-top: solid 1px #eaeaea;
    border-bottom: solid 1px #eaeaea;
    display: flex;
    justify-content: space-around;
  }

  @media screen and (max-width: 768px) {
    #quotes {
      display: block;
    }

    .quote {
      width: 100%;
    }

    .quote:not(:last-child) {
      margin-bottom: 50px;
    }
  }

  .quote {
    overflow: auto;
    text-align: right;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    flex-basis: 0;
  }

  .quote:not(:last-child) {
    margin-right: 10%;
  }

  .quote blockquote {
    font-style: italic;
    text-align: justify;
    line-height: 1.5;
    margin: 0;
    color: #666;
    padding: 0 5px 20px 0;
  }

  .quote blockquote::before, .quote blockquote::after {
    content: '"';
    font-size: 18px;
    font-weight: 700;
  }

  .quote span {
    font-weight: 700;
  }

  .partners {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-around;
  }

  .partner-logo {
    height: 50px;
    margin: 10px;
    display: inline-block;
    flex: 1;
  }

  .partner-logo img {
    height: 100%;
  }
</style>
