# Passport plugin for Nodepack

```
nodepack add passport
```

## Tutorial

In this tutorial we will manually implement a Google OAuth 2.0 strategy to authenticate our users.

### Setup

Start by creating a Typescript + Express application with `nodepack create`.

Then, in the project, install the relevant google oauth package:

```
yarn add passport-google-oauth20
```

Let's also create a new `passport.ts` file where we will setup our Google OAuth:

```ts
// src/passport.ts

import { useStrategy, deserializeUser } from '@nodepack/plugin-passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { ExpressContext } from '@nodepack/plugin-express'
import passport from 'passport'

// Usage storage where you would usually use a database
const users: { [key: string]: any } = {}

const googleStrategy = new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET',
  callbackURL: 'http://localhost:4242/passport/google/callback',
}, (accessToken, refreshToken, profile, done) => {
  // Create or update user account
  users[profile.id] = {
    ...profile,
    accessToken,
    refreshToken,
  }
  done(null, profile)
})

useStrategy(googleStrategy, (ctx: ExpressContext) => {
  // Setup google oauth routes
  const { express: app } = ctx
  app.get('/passport/google', passport.authenticate('google', {
    scope: ['profile'],
  }))
  app.get('/passport/google/callback', passport.authenticate('google', {
    failureRedirect: '/login',
  }), (req, res) => {
    res.redirect('/')
  })
})

deserializeUser((ctx, { serialized }) => {
  // You would usually do a database request
  return users[serialized]
})
```

Import the file in your entry point:

```ts
// src/index.ts

import './passport'
```

Create a `.env.local` file at the project root to setup our environment variables (you'll need to get them from your Google Developer Console):

```
GOOGLE_CLIENT_ID=xxxxxxxxxxxxxxxx
GOOGLE_CLIENT_SECRET=xxxxxxxxxxxxxxxx
COOKIE_SECRET=xxxxxxxxxxxxxxxxx
```

Don't forget to add `http://localhost:4242/passport/google/callback` to the callback URLs on the Google Developer Console.

For `COOKIE_SECRET`, you can generate a random secret at https://duckduckgo.com/?q=uuid.

Finally, setup the session cookies by creating a `config/cookie.ts` file:

```ts
// config/cookie.ts

// Cookie config
// See: https://github.com/expressjs/cookie-session#options

export default {
  secret: process.env.COOKIE_SECRET,
}
```

The setup is now complete!

### Usage in app

Run the app with:

```
PORT=4242 nodepack
```

Navigate to http://localhost:4242/passport/google to sign in using your Google account.

You can use `req.user` in an Express context. For example, here a route that render the user profile:

```ts
// src/routes/profile.ts

import { ExpressContext } from '@nodepack/plugin-express'
import profile from '@/views/profile.ejs'

export default function ({ express: app }: ExpressContext) {
  app.get('/profile', (req, res) => {
    res.send(profile({ user: req.user }))
  })
}
```

With the following EJS view:

```ejs
<!-- src/views/profile.ejs -->

<p>
  ID: <%= user.id %><br/>
  Name: <%= user.displayName %><br/>
  <% if (user.emails) { %>
  Email: <%= user.emails[0].value %><br/>
  <% } %>
</p>
```
