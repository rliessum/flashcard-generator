// Service Worker registration with update detection
// When a new version is available, we dispatch a custom event that the app can react to.

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // Check for updates periodically (good for static hosting like Netlify)
        setInterval(() => {
          registration.update().catch(() => {})
        }, 1000 * 60 * 30) // every 30 minutes

        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (!newWorker) return

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              window.dispatchEvent(new CustomEvent('sw-update-available', {
                detail: { registration }
              }))
            }
          })
        })
      })
      .catch(() => {
        // Registration can fail in some private/incognito modes or strict networks.
        // The app still works fine because of localStorage + runtime caching.
      })

    // When the new SW takes control, we can optionally auto-reload
    // or let the user decide via the UI toast.
    let refreshing = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return
      refreshing = true
      // Let the app decide how to handle (we'll show a toast + manual reload)
      window.dispatchEvent(new CustomEvent('sw-controller-changed'))
    })
  })
}
