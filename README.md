# Zapnij Pasy — vGPT_2.11.0

Landscape round signs now use the available screen: equal paired signs with a 6 px gap and at least 4 px safe margins, individually maximized camera/piggy circles. Red prohibitions roll in from the left over 4 s, hold upright for 60 s after arrival, then roll out to the right over 4 s. The current clock returns through the existing mechanical flaps from the empty black scene. Portrait behavior, original graphics, passenger/confirmation timings and native pilot remain unchanged.


## Portrait split display

Tap the invisible upper-right quarter to switch landscape/portrait; the selection is saved on this display. Portrait centers all graphics in the upper half and keeps the one live flip clock centered in the lower half. The upper normal cycle repeats the existing prohibition pair and camera/black-gap/piggy sequence continuously, without minute-boundary pauses. Passenger/confirmation overrides only that upper half and then resumes the first normal pair. Its full brightness and final black fade do not alter the lower clock brightness. Resize to any split-screen proportion without restarting an active session or timer. The existing landscape procedure and native APK remain unchanged.


Full clock returns retain the selected brightness throughout the falling panels' settling motion. Snapshot dimming is contained per face, without a lower-digit brightness jump at completion.

A two-module mechanical H/HH + MM clock PWA for iPhone 7 / iOS 15 in landscape. Hours 0–23 and two-digit minutes each occupy one complete split-flap assembly with two hinge clips. Hours have no leading zero and remain centered. A single square beside the hour replaces the colon. Only changed complete modules flip. Time always comes from the device.

The invisible left hours module starts a fixed passenger display: seated-person sign on the left, animated fastening buckle on the right. After the initial mechanical entrance, keep both graphics in place. Only the right tongue repeats its two-second open hold, 800 ms insertion and two-second closed hold. Confirmation stops this loop and retains the existing green checks, transparent thumbs-up celebration and mechanical clock return.

The normal cycle starts on launch and after confirmation: wait for the next visible minute boundary, finish the changed digit flips, wait ten seconds, then show No Smoking + No Eating for sixty seconds after the graphic transition. Restore the clock and repeat with the sequential camera/black-gap/rolling-piggy scene. The pairs alternate; a passenger session always resets the next pair to the first.

Two falling upper panels switch between complete views. Digits are bright and signs retain their normal source colors without application brightness filters. Dark matte surfaces and physical rotation shadows remain. Screen brightness is controlled by the user/OS. Only the tongue layers move during fastening; the buckle and blue ring stay fixed. All supplied originals are retained outside public assets. Duplicate taps within 400 ms are ignored. A deliberate tap during the confirmation wait starts a new passenger session.

Background suspension cancels animations and reconciles timestamp deadlines on return without replaying missed views. Passenger mode restarts its visual loop; expired confirmation or graphic holds return to the current clock. Reduced Motion uses static fastening and immediate view changes while retaining state durations.

No audio, notifications, wake-lock dependency, orientation-lock dependency or external service is required. Install through full Safari: Share → Add to Home Screen, then rotate manually. All essential assets are cached for offline reopening after a successful initial online load. Installation identity remains /ZapnijPasy/.

Physical iPhone 7 acceptance remains required for animation smoothness, comfortable brightness, rotation and offline reopening. The phone's brightness and Auto-Lock settings remain under the user's control.

Stage 1 phone acceptance build. Physical-device verification and the native Android controller remain pending.

## Remote communication — Stage 1 acceptance

Hold the hours module for approximately three seconds to open pairing. Ordinary short taps keep their existing passenger behavior. Create a one-time link, open it on the driver's phone, compare the eight-character device identifier on both screens and approve that phone on the iPhone. The invitation expires after two minutes and cannot be reused.

The acceptance controller is [pilot-proof.html](./pilot-proof.html). It explicitly separates a requested command, a committed database write and an acknowledgment from the display after the actual state transition. This remains a temporary phone test page. The native Android companion APK is distributed only from the owner’s local project directory. [The installation guide](./pilot-install.html) explains manual transfer; it provides no APK download.

The paired display uses Firebase Spark Authentication and one Realtime Database in Belgium. Only the two paired identities can use the pair. Commands expire within fifteen seconds, are claimed from the server before execution and never enter an offline send queue. Reconnection rotates the display generation. Duplicate START does not restart an active passenger loop; duplicate confirmation does not restart or extend the celebration.

Local short taps on the hours module use the same session/revision and take priority over a conflicting remote transition. The core clock and local passenger cycle remain available without Firebase or internet. The connection is paused while the display is hidden; delivery while the iPhone is suspended is not guaranteed.

Stage 1 phone communication was accepted by the user on 2026-10-16. The Kotlin companion provides a START shortcut and temporary draggable X after display acknowledgment. Physical native Pixel/Google Maps acceptance remains pending. The APK remains local and is not published to GitHub or Pages. The public installation guide is online-only and is not part of the clock offline cache.

The time flaps use one rigid double-sided leaf over 800 ms. Whole-view transitions take 820 ms; the 2/10/60-second procedure and 800 ms buckle insertion remain unchanged. Native Android APK vGPT_2.1.0 needs no update or re-pairing for this appearance release. Physical iPhone 7 visual/daylight testing remains required.

All active display graphics and installation icons are organized under Grafiki/. Non-piggy sign rings share a thinner consistent width; both prohibition slashes match. The piggy image and buckle mechanism retain their approved appearance.

PWA vGPT_2.11.0: confirmation draws synchronized green checks, holds 3 s, shows one golden thumbs-up with three growths, holds 4 s, fades and immediately restores the clock through the mechanical flaps. Existing pilot vGPT_2.3.0 needs no update.

Visual correction vGPT_2.11.0: dark green, thicker marker checks; the thumbs-up is a transparent overlay over the unchanged belt graphics and completed checks throughout the animation. Only the thumb fades; clock restoration and all timings are unchanged.

PWA vGPT_2.11.0: fixed left-person/right-buckle passenger layout; no alternating belt screens. Only the right tongue repeats. Confirmation, clock/message cycle, assets and pilot vGPT_2.3.0 remain unchanged.

PWA vGPT_2.11.0 replaces the simultaneous camera/piggy pair: camera 4 s entrance + 30 s fully visible downward movement + 4 s exit, black 3 s, rolling piggy 4 s entrance + 11 s upright hold + 4 s exit. Original assets and piggy size preserved. Resume uses elapsed time; passenger commands cancel the scene. Other behavior and Android vGPT_2.3.0 unchanged.

Completed camera/piggy scenes stop all travel animation and retain the final black frame before clock flap snapshots, including timer fallback and expired resume. This prevents cloned icons from replaying during the clock return.

In PASSENGER, both belt strips on the seated person alternate red/original at one-second intervals. The person and sign stay unchanged. Confirmation immediately restores the original belt. Reduced Motion keeps the belt steadily red while waiting.

The red reminder covers the complete lap-belt contour, including both outer ends beyond the torso. The reference sign clarifies belt extent only; the existing blue icon and original appearance are retained.

Current motion: after confirmation, the entire scene fades to black over 800 ms and holds black 200 ms. Clock flaps continue deeper past their resting position into two clearly visible diminishing swings over 1000 ms. The station-board shuffle is completely removed. Clock returns show actual device time directly. Buckle insertion and retraction each take 800 ms, with a one-second hold at each endpoint. The green check stays within the white circle with a margin. Other scenes and the native pilot remain unchanged.

Settling now renders only the moving lower leaf, with shared perspective and an inward-first free edge followed by two diminishing oscillations. Stationary lower content is restored on completion or interruption. Settling remains 1000 ms; graphic entrance timing and all other scenes are unchanged.

The fall and settling tracks are pre-scheduled on one CSS timeline. Speed carries through the bottom continuously and decelerates at the rear turning point; phase callbacks only manage layers. Geometry, total durations and all other scenes remain unchanged.

Brightness: upper-left quarter opens six levels (10/20/35/50/75/100%). A choice applies immediately, including daytime, saves the night level and closes the bar. Default day 100%, initial night 20%; the next sunrise/sunset restores automatic scheduling. Device geolocation is sampled periodically only while visible; a recent coarse local fix or Katowice provides fallback. Solar times are calculated offline; no location is uploaded. Allow browser location permission on the actual display. Lower-left retains passenger control and both left quarters retain the three-second pairing hold. All belt/check/thumb content stays full-brightness; ordinary scenes and their flap snapshots follow the profile. This changes rendered content, not the Toyota backlight.
Solar reference: https://www.gml.noaa.gov/grad/solcalc/calcdetails.html ; independent development checks: https://aa.usno.navy.mil/data/api .

Clock-only driving: tap the lower-right quarter. Current content gently fades to black, then the existing mechanical clock returns. The local choice survives reload/offline reopening until passenger START from the lower-left quarter or Pilot. Portrait shows one wide mechanical date flap above the continuous clock, with Polish weekday and day/full month; the device calendar updates at midnight. Landscape shows only the full clock. Brightness follows the existing profile. No Android update is needed.
