

export default {
  install(Vue) {
    // Simple standardized error modal
    Vue.prototype.$handleError = err => {
      alert({
        title: 'Error',
        message: err.message,
        okButtonText: 'OK'
      })
    }
  }
}
