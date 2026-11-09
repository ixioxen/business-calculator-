<!-- <script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  text: {
    type: String,
    default: ' wish you were here with me',
  },
  speed: { type: Number, default: 70 }, // ms per character
})

const displayed = ref('')
let timer = null

onMounted(() => {
  let i = 0
  timer = setInterval(() => {
    displayed.value = props.text.slice(0, ++i)
    if (i >= props.text.length) clearInterval(timer)
  }, props.speed)
})

onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <div class="box">
    <p>{{ displayed }}<span class="cursor"></span></p>
  </div>
</template>

<style scoped>
.box { padding: 24px; border-radius: 16px; background: #1e293b; color: #e2e8f0; }
p { min-height: 5em; line-height: 1.7; }
.cursor {
  display: inline-block; width: 2px; height: 1.1em;
  background: #38bdf8; margin-left: 2px; vertical-align: text-bottom;
  animation: blink 1s steps(1,end) infinite;
}
@keyframes blink { 50% { opacity: 0; } }
</style> -->
<script setup>
import { ref, onMounted } from 'vue'

const inputRef = ref(null)

onMounted(() => {
    inputRef.value.focus()
})
</script>

<template>
    <input ref="inputRef" type="text" placeholder="Type something..." />
    <div>Hello, World!</div>
    <div>Welcome to the Vue.js application!</div>
</template>