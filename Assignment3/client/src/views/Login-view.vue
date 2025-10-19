<script setup lang="ts">
import { usePlayerStore } from '@/stores/player_store'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()

const playerStore = usePlayerStore()
const player = ref('')
const enabled = computed(() => player.value !== '')

function login() {
  playerStore.player = player.value
  if (route.query.game) router.replace(`/game/${route.query.game}`)
  else if (route.query.pending) router.replace(`/pending/${route.query.pending}`)
  else router.replace('/')
}
const loginKeyListener = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    e.preventDefault()
    if (enabled.value) login()
  }
}
</script>
<template>
  <h1>Login</h1>
  Username: <input v-model="player" @keypress="loginKeyListener" />
  <button :disabled="!enabled" @click="login()">Login</button>
  <div></div>
</template>
