# Changelog

All notable changes to `@p4ni/ui` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.2.0 - 2026-06-11

### Added

- `LockInput` component (Three.js / React Three Fiber), available from the `@p4ni/ui/three` subentry.

## 0.1.1 - 2026-06-11

### Fixed

- `AuraInput`: canvas no longer steals pointer events from the input.
- `AuraInput`: animation speed is now frame-rate independent.
- `AuraInput`: aura is no longer clipped to a rectangle at the canvas bounds.

### Changed

- Include LICENSE and package README in the npm package.

## 0.1.0 - 2026-06-11

### Added

- Initial release.
- `GlowInput` component (CSS), exported from the package root.
- `AuraInput` component (Three.js / React Three Fiber), available from the `@p4ni/ui/aura` subentry.
