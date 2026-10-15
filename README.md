# Zapnij Pasy — vGPT_2.0.0

A dark mechanical HH:MM clock PWA for iPhone 7 / iOS 15 in landscape. Four independent digit flaps and their hinges retain the existing clock design. Time always comes from the device.

The invisible first-digit area controls the passenger procedure. A tap interrupts the normal cycle and shows seat-belt signs on both halves. The person sign holds for two seconds, four mechanical flaps reveal the buckle sign, both tongues insert simultaneously into stationary buckles, and the completed fastening holds for two seconds. This repeats until another deliberate tap. Confirmation freezes the sign for ten seconds and restores the actual clock.

The normal cycle starts on launch and after confirmation: wait for the next visible minute boundary, finish the changed digit flips, wait ten seconds, then show No Smoking + No Eating for sixty seconds after the graphic transition. Restore the clock and repeat with Camera + Piggy Bank. The pairs alternate; a passenger session always resets the next pair to the first.

Four falling upper panels switch between complete views. Signs are dimmed for night use. Only the tongue layers move during fastening; the buckle and blue ring stay fixed. All supplied originals are retained outside public assets. Duplicate taps within 400 ms are ignored. A deliberate tap during the confirmation wait starts a new passenger session.

Background suspension cancels animations and reconciles timestamp deadlines on return without replaying missed views. Passenger mode restarts its visual loop; expired confirmation or graphic holds return to the current clock. Reduced Motion uses static fastening and immediate view changes while retaining state durations.

No audio, notifications, wake-lock dependency, orientation-lock dependency or external service is required. Install through full Safari: Share → Add to Home Screen, then rotate manually. All essential assets are cached for offline reopening after a successful initial online load. Installation identity remains /ZapnijPasy/.

Physical iPhone 7 acceptance remains required for animation smoothness, comfortable brightness, rotation and offline reopening. The phone's brightness and Auto-Lock settings remain under the user's control.

Stage 1 phone acceptance build. Physical-device verification and the native Android controller remain pending.

## Remote communication — Stage 1 acceptance

Hold the first digit for approximately three seconds to open pairing. Ordinary short taps keep their existing passenger behavior. Create a one-time link, open it on the driver's phone, compare the eight-character device identifier on both screens and approve that phone on the iPhone. The invitation expires after two minutes and cannot be reused.

The acceptance controller is [pilot-proof.html](./pilot-proof.html). It explicitly separates a requested command, a committed database write and an acknowledgment from the display after the actual state transition. This is a temporary phone test page; the native Android shortcut and floating X are not implemented in this release.

The paired display uses Firebase Spark Authentication and one Realtime Database in Belgium. Only the two paired identities can use the pair. Commands expire within fifteen seconds, are claimed from the server before execution and never enter an offline send queue. Reconnection rotates the display generation. Duplicate START does not restart an active passenger loop; duplicate confirmation does not extend the ten-second delay.

Local short taps use the same session/revision and take priority over a conflicting remote transition. The core clock and local passenger cycle remain available without Firebase or internet. The connection is paused while the display is hidden; delivery while the iPhone is suspended is not guaranteed.

Physical iPhone 7/iOS 15 and Pixel acceptance is pending. The native Android controller remains gated on that Stage 1 acceptance.
