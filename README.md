# Zapnij Pasy — vGPT_2.2.2

A two-module mechanical H/HH + MM clock PWA for iPhone 7 / iOS 15 in landscape. Hours 0–23 and two-digit minutes each occupy one complete split-flap assembly with two hinge clips. Hours have no leading zero and remain centered. A single square beside the hour replaces the colon. Only changed complete modules flip. Time always comes from the device.

The invisible left hours module controls the passenger procedure. A tap interrupts the normal cycle and shows seat-belt signs on both halves. The person sign holds for two seconds, two mechanical flaps reveal the buckle sign, both tongues insert simultaneously into stationary buckles, and the completed fastening holds for two seconds. This repeats until another deliberate tap. Confirmation freezes the sign for ten seconds and restores the actual clock.

The normal cycle starts on launch and after confirmation: wait for the next visible minute boundary, finish the changed digit flips, wait ten seconds, then show No Smoking + No Eating for sixty seconds after the graphic transition. Restore the clock and repeat with Camera + Piggy Bank. The pairs alternate; a passenger session always resets the next pair to the first.

Two falling upper panels switch between complete views. Digits are bright and signs retain their normal source colors without application brightness filters. Dark matte surfaces and physical rotation shadows remain. Screen brightness is controlled by the user/OS. Only the tongue layers move during fastening; the buckle and blue ring stay fixed. All supplied originals are retained outside public assets. Duplicate taps within 400 ms are ignored. A deliberate tap during the confirmation wait starts a new passenger session.

Background suspension cancels animations and reconciles timestamp deadlines on return without replaying missed views. Passenger mode restarts its visual loop; expired confirmation or graphic holds return to the current clock. Reduced Motion uses static fastening and immediate view changes while retaining state durations.

No audio, notifications, wake-lock dependency, orientation-lock dependency or external service is required. Install through full Safari: Share → Add to Home Screen, then rotate manually. All essential assets are cached for offline reopening after a successful initial online load. Installation identity remains /ZapnijPasy/.

Physical iPhone 7 acceptance remains required for animation smoothness, comfortable brightness, rotation and offline reopening. The phone's brightness and Auto-Lock settings remain under the user's control.

Stage 1 phone acceptance build. Physical-device verification and the native Android controller remain pending.

## Remote communication — Stage 1 acceptance

Hold the hours module for approximately three seconds to open pairing. Ordinary short taps keep their existing passenger behavior. Create a one-time link, open it on the driver's phone, compare the eight-character device identifier on both screens and approve that phone on the iPhone. The invitation expires after two minutes and cannot be reused.

The acceptance controller is [pilot-proof.html](./pilot-proof.html). It explicitly separates a requested command, a committed database write and an acknowledgment from the display after the actual state transition. This remains a temporary phone test page. The native Android companion APK is distributed only from the owner’s local project directory. [The installation guide](./pilot-install.html) explains manual transfer; it provides no APK download.

The paired display uses Firebase Spark Authentication and one Realtime Database in Belgium. Only the two paired identities can use the pair. Commands expire within fifteen seconds, are claimed from the server before execution and never enter an offline send queue. Reconnection rotates the display generation. Duplicate START does not restart an active passenger loop; duplicate confirmation does not extend the ten-second delay.

Local short taps on the hours module use the same session/revision and take priority over a conflicting remote transition. The core clock and local passenger cycle remain available without Firebase or internet. The connection is paused while the display is hidden; delivery while the iPhone is suspended is not guaranteed.

Stage 1 phone communication was accepted by the user on 2026-10-16. The Kotlin companion provides a START shortcut and temporary draggable X after display acknowledgment. Physical native Pixel/Google Maps acceptance remains pending. The APK remains local and is not published to GitHub or Pages. The public installation guide is online-only and is not part of the clock offline cache.

The time flaps use one rigid double-sided leaf over 800 ms. Whole-view transitions take 820 ms; the 2/10/60-second procedure and 800 ms buckle insertion remain unchanged. Native Android APK vGPT_2.1.0 needs no update or re-pairing for this appearance release. Physical iPhone 7 visual/daylight testing remains required.

All active display graphics and installation icons are organized under Grafiki/. Non-piggy sign rings share a thinner consistent width; both prohibition slashes match. The piggy image and buckle mechanism retain their approved appearance.
