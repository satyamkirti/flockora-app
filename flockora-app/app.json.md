# Notes on `app.json`

`app.json` is plain JSON and can't hold inline comments, so anything needing explanation lives here instead.

- **`android.predictiveBackGestureEnabled: false`** — an intentional scaffold default carried over from `npx create-expo-app`, not an oversight. No screen in this app relies on Android 14+'s predictive-back preview/animation behavior, so it's left off rather than opted into without a reason to.
