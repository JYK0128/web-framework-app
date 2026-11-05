---
name: production-deployment
description: Use whenever the user asks to deploy, release to production, or manually run this repository's production deployment workflow.
---

# Production deployment

Handle production deployment for this repository's apps. Before any deployment action, read the release rules in `docs/apps-deployment-plan.md` and `.github/workflows/cd.yml`.

## Deployment scope and source

- The normal apps deployment path is GitHub Actions. A push to `main` may deploy automatically when the changed paths match the CD workflow.
- `workflow_dispatch` is also a production deployment. It checks out the selected ref, builds and publishes all four app images (`admin-api`, `admin-web`, `service-api`, `service-web`) at that SHA, then updates the full Compose stack and waits for healthchecks. It is not a dry run or an app-scoped deployment.
- Use `main` as the production deployment source. Release branches are integrated into `main` by PR; `dev`, feature branches, and temporary branches are not production sources by default. Do not dispatch another branch to bypass this flow. Use another ref only when the user explicitly names it and the repository has an approved reason to deploy it.
- The normal change path is feature/fix branch → PR to `dev` → `release/vX.Y.Z` branch from reviewed `dev` → versioned PR to `main`. Do not send routine fixes straight to `main`. An explicitly requested emergency exception must be forward-ported to `dev` by PR.
- Do not use the selected-service `deploy:*` helpers for normal releases. They are emergency recovery helpers and require an explicit request for that service recovery.

## Before deploying

- Inspect the current branch and upstream, working tree, `origin/main` SHA, active CD runs, and the release diff. Fetch before relying on remote state.
- Confirm the exact intended commit is on `main`. Local uncommitted or unpushed changes are not included in a workflow run. If the requested change is not on `main`, explain that it must go through the repository's PR/release flow; do not silently commit, push, create or switch branches, cherry-pick, or merge just to make dispatch possible.
- A direct request to deploy authorizes the production workflow. It does not authorize changing the requested source ref or including unrelated changes. If the intended SHA or deployment target is ambiguous, ask before dispatching.
- Tell the user when a manual dispatch will update all four apps, unless that scope is already clear from the request.
- Check for an active production CD run before starting another. Do not launch overlapping or duplicate runs.

## Release PR and commit naming

- Follow the repository's PR/release flow and required CI checks before merging into `main`.
- Before choosing a version, compare existing Git tags, GitHub Releases, first-parent release commits, and the last deployed SHA. If the histories disagree or a prior release is untagged, stop and reconcile rather than guessing or skipping ahead silently.
- Use the requested version in the release PR title, such as `release: v0.9.91 운영 반영`.
- After GitHub assigns the PR number, include it in the squash commit subject: `release: v0.9.91 운영 반영 (#20)`. Read the actual PR number; never guess it. Use the merge strategy enabled by the repository.
- Keep feature commit subjects descriptive and conventional; the release commit subject identifies the version and PR number.

## After deploying

- Verify the workflow URL, selected ref and SHA, quality checks, all four image builds, deploy job, and service healthchecks. Report the exact commit and observed outcome.
- After a successful versioned release deployment, create an annotated `vX.Y.Z` tag at the exact deployed `DEPLOY_SHA`, push it, and verify `git rev-parse vX.Y.Z^{}` matches that SHA. Do not tag a failed deployment or move an existing tag. If the user asked only for a deployment outside a versioned release, do not infer permission to create a release tag.
- If the workflow fails or is cancelled, inspect the deploy logs and current service endpoints before retrying. Deployment may have partially applied; do not assume failure means no server changes or rerun blindly.
- When the job fails on a container healthcheck, preserve the available health/log details and check public readiness endpoints. Report any remaining uncertainty if host-level container or kernel logs are unavailable.
