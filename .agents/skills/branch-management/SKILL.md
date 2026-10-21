---
name: branch-management
description: Use for Git branch selection, creation, switching, integration, publishing, or recovery when working on changes in a repository.
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

## Recovering a change on the wrong branch

- Preserve the exact change first. Move only the relevant commit or files to the intended branch, and verify the resulting diff and commit before publishing it.
- Do not delete or rewrite a commit already pushed to a shared branch unless the user explicitly asks to remove it or rewrite that branch's history. A request to move work to another branch alone does not authorize rewriting the source branch; leave it in place and report the situation if removal was not authorized.
- When removal is authorized, inspect the remote tip again and remove only the mistaken commit. Use `--force-with-lease` with the exact expected remote SHA for history rewrites; stop if the lease fails or the branch has advanced. Never use plain `--force`.
- If branch policy blocks the requested correction, report the block and use a revert or pull request only when that achieves the user's intent without altering unrelated commits.

## Completion check

After a branch operation, verify local and remote refs, the commit log, and `git status`. State which branch contains the change and whether the source branch still contains it. If any push or rewrite failed, describe the actual state instead of implying it succeeded.
