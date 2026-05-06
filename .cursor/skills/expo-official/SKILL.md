---
name: expo-official
description: >-
  Expo / React Native in this repo (SDK 54). Use for Router, EAS, SwiftUI
  (@expo/ui), native modules, upgrades, and deployment. Prefer linked official
  skill sources over guessing APIs.
---

# Expo (official skills index)

## When this applies

Use when editing this Expo app: `expo-router`, `@expo/ui`, EAS, native modules, OTA updates, or deployment.

## Authoritative docs

- Discovery index: https://docs.expo.dev/llms.txt
- Expo Skills overview: https://docs.expo.dev/skills/
- SwiftUI + Expo UI guide: https://docs.expo.dev/guides/expo-ui-swift-ui/
- SwiftUI API (match SDK in `package.json`): https://docs.expo.dev/versions/v54.0.0/sdk/ui/swift-ui/

## Official skill sources (copy/paste for agents)

Each skill lives in the Expo repo; open the raw `SKILL.md` when you need step-by-step rules:

- https://github.com/expo/skills/blob/main/plugins/expo/skills/building-native-ui/SKILL.md
- https://github.com/expo/skills/blob/main/plugins/expo/skills/expo-ui-swift-ui/SKILL.md
- https://github.com/expo/skills/blob/main/plugins/expo/skills/expo-module/SKILL.md
- https://github.com/expo/skills/blob/main/plugins/expo/skills/expo-deployment/SKILL.md
- https://github.com/expo/skills/blob/main/plugins/expo/skills/expo-dev-client/SKILL.md
- https://github.com/expo/skills/blob/main/plugins/expo/skills/native-data-fetching/SKILL.md
- https://github.com/expo/skills/blob/main/plugins/expo/skills/upgrading-expo/SKILL.md

(Full list: https://github.com/expo/skills/tree/main/plugins/expo/skills )

## This project: SwiftUI

- Dependency: `@expo/ui`; import UI from `@expo/ui/swift-ui`, modifiers from `@expo/ui/swift-ui/modifiers`.
- Every SwiftUI subtree must be wrapped in `Host`.
- **Not supported in Expo Go.** Use a dev build: `npx expo run:ios` (or EAS dev client).
- Demo route: `app/swift-ui-demo.ios.tsx` / `app/swift-ui-demo.tsx`.

## Install all Expo skills on your machine (Cursor / others)

Non-interactive (installs into Cursor skill paths when available):

```bash
npx skills add expo/skills -y
```

If your CLI version still prompts, run the command in a real terminal and select the skills you want.

## Claude Code (plugin marketplace)

Run **inside Claude Code** (not zsh):

```text
/plugin marketplace add expo/skills
/plugin install expo
```
