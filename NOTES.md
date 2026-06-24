# NOTES

## Phase 1 — Make it run

### What I tested

I tested the app locally using two browser sessions:

* One normal Chrome window
* One incognito/private Chrome window
* Different mocked geolocations through Chrome DevTools Sensors

The goal was to check if two anonymous users could see each other on the map, connect, chat, and start a video call.

### Issues found

During testing, I found a few issues in the main connection flow:

* Chat messages were not working.
* User B could not reliably connect to User A.
* The user dot status was inconsistent between the two browsers.
* From User B’s point of view, User A appeared as a red dot.
* From User A’s point of view, User B appeared as a green dot.
* This made the app confusing because both users were not seeing the same connection/presence state.

### How I investigated it

I focused on the parts of the app related to:

* user presence
* polling
* connection request state
* WebRTC offer/answer flow
* ICE candidate exchange
* data channel setup
* dot status rendering

I tested the app from both directions:

* User A connects to User B
* User B connects to User A
* User A sends a message to User B
* User B sends a message to User A
* One user closes the tab

This helped confirm that the issue was not only a UI problem. The two clients were not always agreeing on the same connection state.

### What I fixed

I worked on stabilizing the connection and presence flow so that both users see the same state.

The fixes focused on:

* making the connection state more consistent between both users
* checking that the correct sender and receiver IDs are used
* making sure WebRTC signaling messages are handled in the right direction
* making sure the data channel is created and opened correctly
* making sure chat messages are sent only after the data channel is ready
* improving how user dot statuses are shown on the map
* making stale or disconnected users stop appearing as active users

### Result

After the fixes, the app is able to run end-to-end locally:

* two users can see each other on the map
* User A can connect to User B
* User B can connect to User A
* chat messages work both ways
* the connection status is clearer
* the dot colors/statuses are more consistent
* video call flow still works
* closed/inactive users are handled better

### Manual test used

I verified the fix with this flow:

1. Open the app in a normal Chrome window.
2. Open the app again in an incognito/private window.
3. Set different mocked geolocations in DevTools Sensors.
4. Refresh both pages.
5. Confirm that both users appear on the map.
6. Connect from User A to User B.
7. Send a message from User A to User B.
8. Send a message from User B to User A.
9. Start a video call.
10. Disconnect or close one browser window.
11. Check that the other browser updates correctly.

---

## Phase 2 — Make it good

### What I changed

For the UI/UX phase, I focused on making the app feel cleaner, easier to understand, and more presentable.

The main improvements were:

* improved the overall map layout
* added a cleaner main interface around the globe
* improved the visual hierarchy of the app
* made the connection flow easier to follow
* improved the chat area
* improved user dot styling and status display
* made the interface feel more modern and polished
* improved spacing, buttons, and basic responsiveness

### Design thinking

The original app already had an interesting idea, but the flow needed to feel more intentional. Since Pulse is about anonymous strangers appearing on a live globe, I wanted the interface to feel simple, modern, and slightly futuristic without making it too complicated.

I tried to keep the map as the main focus. The other UI elements should support the experience, not cover the whole screen.

The connection flow also needed clearer states, because users should understand when they are:

* idle
* viewing another user
* sending a request
* receiving a request
* connected
* disconnected

For chat, I focused on making the conversation area easier to read and less plain. I also wanted the empty state to feel friendlier instead of looking broken when there are no messages yet.

### Result

The app now feels more demo-ready. The main interaction is easier to follow, and the UI gives better feedback during connection and chat states.

---

## Phase 3 — Make it secure

### Issues reviewed

For the security phase, I reviewed the API and app behavior before treating it as something ready to ship.

The main areas I checked were:

* API request validation
* presence updates
* connection and signaling requests
* location privacy
* stale user/session cleanup
* possible user spoofing
* unnecessary data exposure
* abuse risks from repeated polling or requests

### Security concerns found

#### High priority

* API routes should not trust client input without validation.
* Presence and signaling endpoints need to reject malformed or missing values.
* User/session IDs should be checked carefully so one client cannot easily act as another user.
* Exact user location should not be exposed to other users.

#### Medium priority

* Stale users, old connection requests, and old signaling records should expire.
* Polling endpoints can be abused if there is no rate limiting or request control.
* Payload sizes should be limited to avoid unnecessary server load.

#### Lower priority

* Error messages should avoid exposing too much internal detail.
* The app should keep a consistent pattern for client/server data handling.
* Some abuse prevention would be better with stronger server-side session handling.

### What I fixed or improved

I focused on the practical security issues that fit the scope of the take-home project:

* added or improved validation for important API inputs
* checked presence and signaling payloads before using them
* kept the anonymous/no-history design intact
* made sure location display stays approximate
* improved handling for stale or inactive presence data
* avoided storing chat messages on the server
* kept chat and video peer-to-peer through WebRTC

### What I would improve with more time

If I had more time, I would add:

* stronger server-side rate limiting
* better temporary session verification
* more complete cleanup for old signaling records
* stricter origin checks
* better abuse/report handling
* improved automated tests for connection and API behavior

---

## Phase 4 — Make it better

### Feature built

I added a feature called Pulse Signals.

Pulse Signals let a user choose a temporary status or vibe for their current anonymous session, such as:

* Open to chat
* Coding
* Gaming
* Chill
* Music
* Late night
* Deep talk

### Why I built it

The app already lets users see anonymous dots on a globe, but the dots can feel too random without context.

Pulse Signals make the map feel more alive while still keeping the no-account and no-history idea. A user can get a small idea of what another person is open to before connecting, without revealing personal information.

I chose this feature because it improves both product feel and safety:

* users get more context before connecting
* the map feels more active
* the feature does not require accounts
* the signal is temporary
* it fits the anonymous design of the app

### How it works

The selected signal is treated as part of the user’s temporary presence/session state.

Other users can see the signal when viewing or connecting to a dot. The signal does not create a profile and does not store long-term user history.

### Result

Pulse feels less empty and more interactive. Instead of just seeing anonymous dots, users can now see a small reason to connect.

### What I would improve next

With more time, I would improve Pulse Signals by adding:

* filtering by signal
* safer connection preferences
* temporary block or hide controls
* better moderation/reporting flow
* smarter matching between users with similar signals

---

## Final testing

Before deployment, I tested the main flow again:

* app loads locally
* map loads correctly
* two browser sessions can appear as separate users
* mocked geolocations work
* users can see each other
* connection requests work
* chat works both ways
* video call flow works
* inactive users are handled better
* UI remains usable after the changes

I also checked for major console errors during the normal flow.

---

## Deployment notes

The app uses environment variables for services like the database and Mapbox.

For local development, these are stored in `.env`.

For Vercel deployment, the same required environment variables need to be added in:

Vercel Project Settings → Environment Variables

The database schema also needs to be pushed using Prisma before testing the deployed version.

---

## Known limitations

There are still some limitations that are acceptable for this project scope:

* The app uses HTTP polling instead of WebSockets because it is designed for Vercel serverless.
* WebRTC uses STUN only, so some strict networks may still fail to connect media.
* There is no full moderation system yet.
* There is no account system by design.
* Chat and video are not stored, which is intentional for the product concept.
* More complete rate limiting would be needed before a real public launch.

---

## Summary

The final version focuses on four things:

* making the core connection flow work
* improving the UI and overall product feel
* reviewing and improving security where practical
* adding Pulse Signals to make the app feel more alive while keeping it anonymous

The main tradeoff was keeping the scope realistic. I avoided adding large unfinished systems and focused on making the existing product more stable, usable, and clear.
