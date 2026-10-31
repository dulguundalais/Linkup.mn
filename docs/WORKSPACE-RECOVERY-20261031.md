# Workspace recovery after a failed startup

PR #76 commit `858cc2ac6f4a5e293ba2ef3e20625d70bcb0fd31` passed real isolated Supabase tests but its final mocked browser run finished 90/91. [The failure](https://github.com/dulguundalais/Hustle.mn/actions/runs/41079592647/job/124144839980) timed out waiting for the seller conversation after Refresh. The artifact snapshot showed the overview, even though the user had clicked Messages.

The first load can establish the account role before a required request fails. Its initial route is still pending. Refresh previously cleared the error immediately and ran `load()` while the navigation remained available. A user could open Messages before the recovered load's initial route selected the overview. The window-focus refresh used the same unguarded path.

The regression now holds the successful recovery response deliberately. On the previous production source it fails deterministically: `.workspace-loading` does not exist while recovery is pending. This identifies a product race rather than merely a short test timeout; no timeout increase or retry was added.

`reloadWorkspace()` now guards recovery until both data loading and post-login routing finish. It is shared by action refreshes and window-focus refreshes. Already initialized workspaces continue normal refreshes without replacing the active conversation with a loading screen. Layout, styles, Auth/RLS rules, migrations and payments are unchanged.

Acceptance in `qa/browser/workspace-startup.spec.mjs`:

- Delayed initial data at 390/768/1440 and delayed initial route keep navigation hidden.
- After a failed startup, manual Refresh and window-focus recovery each keep navigation hidden during both delayed data and delayed routing.
- Recovery clears the old error, opens the selected seller conversation and preserves it on page reload.
- A refresh after a successful startup keeps the current conversation visible while data is pending, and preserves it after completion.

These checks use synthetic mocked data to control timing. The separate full Supabase suite verifies real Auth/API/Storage flows. Current tested SHAs and results belong in the PR description/checks; this report does not claim unexecuted acceptance or production deployment.
