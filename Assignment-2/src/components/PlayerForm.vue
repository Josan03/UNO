<script setup lang="ts">
import { ref } from 'vue'

const text = ref('')
</script>

<template>
  <div class="p-2 border-2">
    <input class="bg-green-100 rounded-lg" v-model="text" />
    <p>{{ text }}</p>
  </div>
</template>
