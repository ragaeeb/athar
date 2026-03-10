# Deployment And Rollback Checklist

## Before Deploy

1. Confirm scope is frozen for the release candidate.
2. Run the full regression suite:
   - `bun run lint`
   - `bun run typecheck`
   - `bun run test`
   - `bun run test:e2e`
   - `bun run test:perf`
   - `bun run build`
3. Confirm the current commit SHA and branch/tag to deploy.
4. Confirm the asset manifest, save-data verification note, and support matrix are current.
5. Confirm the known advisory warning set is understood:
   - current large-bundle warning during `build`

## Deploy

1. Produce a fresh production build from the release candidate commit.
2. Upload/deploy the built static assets to the chosen host.
3. Record:
   - deployed commit SHA
   - deploy timestamp
   - build command used
   - environment/host target
4. Run post-deploy smoke:
   - home page loads
   - Level 1 route loads
   - completion route from a known save works
   - no immediate blocking runtime overlay appears

## Rollback Trigger

Rollback immediately if any of the following appear after deploy:

- app fails to boot
- chapter routes fail to load
- save-data progression is corrupted or a level lock state regresses
- repeated blocking runtime failures occur on the primary supported browsers
- five-chapter smoke path no longer completes

## Rollback Procedure

1. Identify the last known-good deployed commit.
2. Redeploy that exact commit/artifact.
3. Re-run the post-deploy smoke on the rolled-back build.
4. Mark the failed release candidate commit as blocked until root cause is identified.

## Notes

- If the hosting platform has a built-in rollback button, prefer it.
- If not, redeploy the last known-good build artifact or commit directly.
- Never “hotfix live” without a new commit/build record; keep the rollback path explicit and reproducible.
