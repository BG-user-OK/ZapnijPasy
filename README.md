# Zapnij Pasy — vGPT_2.17.0

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

PWA vGPT_2.15.0: confirmation draws synchronized green checks, holds 3 s, shows one golden thumbs-up with three growths, holds 4 s, fades and immediately restores the clock through the mechanical flaps. Existing pilot vGPT_2.3.0 needs no update.

Visual correction vGPT_2.15.0: dark green, thicker marker checks; the thumbs-up is a transparent overlay over the unchanged belt graphics and completed checks throughout the animation. Only the thumb fades; clock restoration and all timings are unchanged.

PWA vGPT_2.15.0: fixed left-person/right-buckle passenger layout; no alternating belt screens. Only the right tongue repeats. Confirmation, clock/message cycle, assets and pilot vGPT_2.3.0 remain unchanged.

PWA vGPT_2.15.0 replaces the simultaneous camera/piggy pair: camera 4 s entrance + 30 s fully visible downward movement + 4 s exit, black 3 s, rolling piggy 4 s entrance + 11 s upright hold + 4 s exit. Original assets and piggy size preserved. Resume uses elapsed time; passenger commands cancel the scene. Other behavior and Android vGPT_2.3.0 unchanged.

Completed camera/piggy scenes stop all travel animation and retain the final black frame before clock flap snapshots, including timer fallback and expired resume. This prevents cloned icons from replaying during the clock return.

In PASSENGER, both belt strips on the seated person alternate red/original at one-second intervals. The person and sign stay unchanged. Confirmation immediately restores the original belt. Reduced Motion keeps the belt steadily red while waiting.

The red reminder covers the complete lap-belt contour, including both outer ends beyond the torso. The reference sign clarifies belt extent only; the existing blue icon and original appearance are retained.

Current motion: after confirmation, the entire scene fades to black over 800 ms and holds black 200 ms. Clock flaps continue deeper past their resting position into two clearly visible diminishing swings over 1000 ms. The station-board shuffle is completely removed. Clock returns show actual device time directly. Buckle insertion and retraction each take 800 ms, with a one-second hold at each endpoint. The green check stays within the white circle with a margin. Other scenes and the native pilot remain unchanged.

Settling now renders only the moving lower leaf, with shared perspective and an inward-first free edge followed by two diminishing oscillations. Stationary lower content is restored on completion or interruption. Settling remains 1000 ms; graphic entrance timing and all other scenes are unchanged.

The fall and settling tracks are pre-scheduled on one CSS timeline. Speed carries through the bottom continuously and decelerates at the rear turning point; phase callbacks only manage layers. Geometry, total durations and all other scenes remain unchanged.

Brightness: upper-left quarter opens six levels (10/20/35/50/75/100%). A choice applies immediately and closes the bar. Day and night have independent persistent levels: a daytime choice saves the day profile, a nighttime choice saves the night profile. Sunrise/sunset selects the saved counterpart, including after a reboot or a later day. Defaults are day 100%, night 20% only without a saved choice; the previous night level and legacy daytime choice migrate under the existing local key. Device geolocation is sampled periodically only while visible; a recent coarse local fix or Katowice provides fallback. Solar times are calculated offline; no location is uploaded. Allow browser location permission on the actual display. Lower-left retains passenger control and both left quarters retain the three-second pairing hold. All belt/check/thumb content stays full-brightness; ordinary scenes and their flap snapshots follow the profile. This changes rendered content, not the Toyota backlight.
Solar reference: https://www.gml.noaa.gov/grad/solcalc/calcdetails.html ; independent development checks: https://aa.usno.navy.mil/data/api .

Clock-only driving: tap the lower-left quarter. Current content gently fades to black, then the existing mechanical clock returns. Tap the same lower-left quarter again to fade the outgoing scene and begin the normal prohibition signs immediately, without listening, belt reminders or celebration. The local clock-only/normal selection survives reload/offline reopening; passenger START still takes priority. Portrait shows one wide mechanical date flap above the continuous clock, with Polish weekday and day/full month; the device calendar updates at midnight. Landscape shows only the full clock. Brightness follows the existing profile. No Android update is needed.

## Acoustic passenger control — vGPT_2.15.0

With the updated paired Pilot vGPT_2.5.0, the lower-right quarter requests Pixel listening instead of immediately showing belts. The existing image/clock cycle continues until an actual alarm command arrives. A visible request/receipt notice distinguishes delivery from healthy-microphone acknowledgment. A tap during an active session requests manual STOP; an active local belt scene confirms immediately as before. Clock-only requests microphone STOP too. Unpaired/offline local operation retains manual control. No microphone audio or new GPS is collected by the PWA.

The Pixel owns the four-second healthy quiet threshold and fifteen-second watch from confirmed celebration startup. A renewed tone issues a fresh START to interrupt the existing celebration through the same cancellable display controller. Existing graphics/flaps/brightness/layouts/timings stay unchanged. The new listenRequest/listenState paths are pair-isolated, expiring and server-claimed; stale/reconnected snapshots cannot trigger listening. No public APK hosting. Older historical behavior descriptions above are superseded by this section where they conflict.


Optional TBox music slide (vGPT_2.16.0): landscape only. In the normal cycle, live cover/title/artist appears for 60 seconds after the complete camera/gap/piggy sequence, then the mechanical clock returns. Existing clock-minute gates and all graphic durations remain unchanged. In clock-only/Jadę sam, repeat 120 seconds of live clock then 60 seconds of cover, timed from completed clock entrance. Portrait never shows the cover. Settings retain the paired local connection and an On/Off choice; previous nonzero intervals migrate to On, zero stays Off. Paused/stopped/missing artwork, permission or connection skips/ends the cover without playback changes. Belt reminders/listening, layout changes and suspension cancel stale work; foreground recovery starts a fresh solo wait without catch-up. The separate native Media companion needs no update.

All four invisible quadrant controls remain visually invisible when focused, including after steering-wheel MODE; visible menu controls retain their focus indication. Layout, music interval and its existing local connection remain saved independently on this display. This PWA update does not modify any Android APK, media filter or Pixel detector.

Passenger-facing display: technical Pixel request, connection, success and failure notices are shown only in the existing Pilot settings, with no main-screen banner. Communication, receipt handling and detection are unchanged. The bottom of the brightness menu identifies the running PWA version, including offline; it does not claim to show the newest remote release.


PWA vGPT_2.17.0: discreet solo-to-presentation clock intro, five-second post-flip delay, ordinary landscape durations aligned near :54, and dimmed confirmation after recognised quiet. Portrait retains its continuous clock and baseline upper timing. Pilot vGPT_2.6.0 adds optional session-only GPS silent departure (20 km/h /100 m /10 healthy seconds) through separately acknowledged START_PRESENTATION; no belts or congratulations are fabricated. A manual solo choice invalidates older pending commands. Native binaries, diagrams, source instructions and recordings are not hosted here.

Current controls (vGPT_2.20.0): Q3 lower-left toggles solo/presentation; Q4 lower-right arms/stops Pixel listening. Top quarters, stored preferences, animations and protocol identities are unchanged. Pilot vGPT_2.9.0 starts after the first reliable GPS movement following a >=10-second stop, prioritizes alarm commands and publishes actual microphone health on change. Silence never starts slides. Four-second healthy quiet and fifteen-second watch remain unchanged.

Brightness menu quick reference (vGPT_2.20.0): the six brightness choices sit above a brief four-quadrant guide and white/green/yellow hour-mark legend. The running version stays at the bottom. The existing 13px hour square is white when idle, green for fresh work/readiness, or pulsing yellow for healthy microphone (priority). No separate gap dots. The persistent iT toggle omits camera and its black gap, retaining piggy.

Explicit controls: confirmed MODE pause selects solo clock; confirmed resume starts presentation without belt reminder. Q3 toggles solo/presentation without controlling music. The 30-second Pixel departure button requests presentation plus one-use PLAY, never pause; ignoring it leaves the current display alone. Real belt warnings take priority. Existing paired Media vGPT_1.6.0 uses read-only local MODE events; all native installers and backend rules remain local.
