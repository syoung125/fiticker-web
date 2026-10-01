# Maintainable project structure

## Goal

Deliver a complete cloneable development project, keeping the existing product behavior and public URL.

## Approach

Vite + vanilla JavaScript ES modules. Source code lives in src/, static assets in public/, tests in tests/. npm lockfile pins dependency resolution. dist/ is generated and ignored. A GitHub Actions workflow installs, verifies, builds and deploys only dist/.

## Tasks

- [x] Move source into domain/, media/, ui/, styles/ modules and format it for editing.
- [x] Add dev/build/preview/test/format scripts, Vite config, Node version and lockfile.
- [x] Document clone-to-development and file ownership, data model, deployment and troubleshooting.
- [x] Verify npm ci, tests, formatting, production build, source/artifact separation.
- [x] Commit all project sources, switch Pages to Actions, push and verify deployment.

No feature expansion or framework rewrite; preserve current behavior. Browser visual verification remains subject to available browser tools.

Verification: Node 22.18 npm ci, five tests, formatting, production build, and built asset reference checks passed. Repository deployment status is tracked in GitHub Actions.
