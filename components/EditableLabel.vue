<template>
  <div class="editable-label" :class="{editing}">
    <form class="ajax-form editable-editor">
      <input class="form-control" :title="title" :placeholder="placeholder" type="text"
             ref="input" :value="value" @input="event => $emit('input', event.target.value)" @blur="stopEdit()">
    </form>
    <div class="editable-value">
      <h4 v-text="value"></h4>
      <span class="icon edit editable-toggle" @click.prevent="startEdit()"></span>
    </div>
  </div>
</template>
<script>
  export default {
    name: 'EditableLabel',
    props: {
      value: String,
      title: String,
      placeholder: String
    },
    data () {
      return {
        editing: false
      };
    },
    methods: {
      startEdit () {
        this.editing = true;
        this.$nextTick(() => {
          this.$refs.input.focus();
        });
      },
      stopEdit() {
        this.editing = false;
        this.$emit('submit');
      }
    }
  };
</script>

<style scoped>
  .editable-value > * {
    margin: 0;
    vertical-align: middle;
    display: inline-block;
  }

  .editable-label:not(.editing) .editable-editor,
  .editable-label.editing .editable-value {
    display: none;
  }

  .editable-editor {
    width: 100%;
    display: flex;
  }

  .editable-editor > input {
    flex: 1;
  }

  .editable-toggle {
    margin-left: 10px;
    cursor: pointer;
  }
</style>
