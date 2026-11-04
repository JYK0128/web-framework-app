---
name: branch-management
description: Use for Git branch workflows, publishing, releases, and production deployments tied to repository refs.
---

# Branch management

Keep changes on the branch that matches the task and repository workflow. Preserve unrelated work and shared history.

## Before changing branches or publishing

- Read applicable repository instructions and inspect `git status --short --branch`, the current branch, its upstream, and relevant local and remote refs. Fetch before relying on remote state.
- Determine the target branch from the user's request, the task's integration target, and repository workflow (such as contribution docs, branch protection, or existing pull requests). Branch names and roles vary by project; never assume a particular name or infer the target from the currently checked out branch. “Commit” or “push” alone does not mean publish to the default branch.
- Example from this project (verify current rules before acting): feature branches are integrated through PRs to `dev`; release branches such as `release/vX.Y.Z` have been merged to `main` by PR; pushing to `dev` runs CI, while pushing to `main` triggers production CD. Other repositories may assign different roles to these names or use a different release flow.
- If the target is unstated, use clear repository conventions and task context. If the destination remains ambiguous, keep work local and ask where it should go before publishing. Prefer an isolated working branch for new work when that matches the repository workflow.
- Before checkout, merge, rebase, reset, or cherry-pick, check for uncommitted changes and preserve them. Do not overwrite unrelated work.
- Before committing, verify the current branch and review the staged diff. Before pushing, verify the exact destination and compare its remote tip with the state inspected earlier.
- Follow the repository's contribution and branch protection rules. Integrate changes through the expected review process; do not bypass protections.

## Pull requests

- Before opening a pull request, confirm the source and target branches from the task and repository contribution guidance. Review the complete diff against the target, ensure unrelated changes are excluded, and check the working tree and commit history.
- Create a pull request when requested or when repository policy uses PRs for integration. Do not merge it unless the user requests merging or has clearly authorized that step; creating a PR does not imply approval to merge.
- Use the repository's PR template and include a concise description of the change, relevant verification, and known limitations. Do not claim checks passed unless their results were observed.
- After creating or updating a PR, verify its source branch, target branch, title, diff, and current checks/review state. Report the PR link and whether it is open, merged, or blocked.

## Releases

- Treat releasing as a separate operation from committing, pushing, or merging. Check the repository's release documentation and automation for its versioning, approval, tagging, and deployment process; do not assume a universal branch or tag naming scheme.
- Do not create a release, publish a package, deploy, or create/move a release tag unless the user requested that release action. A request to push code does not by itself authorize a release.
- Before a requested release, confirm the intended version and release target from the user or repository policy, and verify that the release source contains the reviewed changes and has no unintended local changes. Follow required checks and approvals.
- After releasing, verify the resulting version, tag or release record, and deployment/publish result using the repository's available tooling. Report the observed outcome and any incomplete step.

## Manual production deployment

For this repository's apps deployment, read `docs/apps-deployment-plan.md` and `.github/workflows/cd.yml` before triggering production work.

- The normal apps deployment path is GitHub Actions. A push to `main` may deploy automatically when the changed paths match the CD workflow. `workflow_dispatch` is also a production deployment: it checks out the selected ref, builds and publishes all four app images (`admin-api`, `admin-web`, `service-api`, `service-web`) at that SHA, then updates the full Compose stack and waits for all four healthchecks. It is not a dry run or an app-scoped deploy.
- Use `main` as the production deployment source for both automatic and manual CD. This repository's release branches are integrated into `main` by PR; `dev`, feature branches, and temporary branches are not production deployment sources by default. If the requested change is not in `main`, follow the repo's PR/release flow to get it there; do not dispatch another branch to bypass that flow. Use another ref only when the user explicitly names it and the repository has an approved reason to deploy that ref.
- Before dispatching, inspect the current branch, upstream, working tree, `origin/main` SHA, and active CD runs. Confirm the intended change is committed on `main` and the exact SHA to ship. Local uncommitted or unpushed changes are not included in a workflow run; stop and explain what needs to be published. Do not commit, push, create/switch branches, cherry-pick, or merge just to make dispatch possible unless the user asked for that operation or the repository's approved release flow requires it.
- A direct request to deploy authorizes the production workflow, but does not authorize changing the requested source ref or adding unrelated changes to it. If the intended SHA or deployment target is ambiguous, ask before dispatching. State that dispatch updates all four apps when that is not already clear from the user's request.
- Check for an active production CD run before starting another. Do not dispatch a temporary or arbitrary branch merely because GitHub permits it. Use the selected-service `deploy:*` helpers only for an explicitly requested emergency service recovery; they are not the normal release path.
- After dispatch, report the workflow URL, selected ref and SHA, and observed result. Verify quality checks, all four image builds, the deploy job, and healthchecks. If the run fails or is cancelled, distinguish that from a completed deployment; inspect the job outcome before considering a retry.

## Recovering a change on the wrong branch

- Preserve the exact change first. Move only the relevant commit or files to the intended branch, and verify the resulting diff and commit before publishing it.
- Do not delete or rewrite a commit already pushed to a shared branch unless the user explicitly asks to remove it or rewrite that branch's history. A request to move work to another branch alone does not authorize rewriting the source branch; leave it in place and report the situation if removal was not authorized.
- When removal is authorized, inspect the remote tip again and remove only the mistaken commit. Use `--force-with-lease` with the exact expected remote SHA for history rewrites; stop if the lease fails or the branch has advanced. Never use plain `--force`.
- If branch policy blocks the requested correction, report the block and use a revert or pull request only when that achieves the user's intent without altering unrelated commits.

## Completion check

After a branch operation, verify local and remote refs, the commit log, and `git status`. State which branch contains the change and whether the source branch still contains it. If any push or rewrite failed, describe the actual state instead of implying it succeeded.
