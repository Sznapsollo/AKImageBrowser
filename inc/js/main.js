const mittEventBus = mitt()
app.provide('mittEventBus', mittEventBus)
app.mount('#app')
