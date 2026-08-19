// Deploy with: cd functions && npm install && npm run deploy
// (needs the Firebase CLI: npm install -g firebase-tools, then `firebase login`)
//
// Supabase's third-party auth only treats a Firebase user as `authenticated` (vs. `anon`) once
// their JWT carries a `role: authenticated` custom claim. Firebase doesn't set that on its own,
// so this attaches it to every user right after they're created.
const { initializeApp } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')
const { auth } = require('firebase-functions/v1')

initializeApp()

exports.setAuthenticatedClaim = auth.user().onCreate(async (user) => {
  await getAuth().setCustomUserClaims(user.uid, { role: 'authenticated' })
})
