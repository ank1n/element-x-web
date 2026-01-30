# Element X Web - Custom Changes

## Overview
Custom fork of Element Web v1.11.96 with extended functionality based on Element X iOS implementation.

## Implemented Features (Phase 0-2)

### Phase 0: Setup ✅
- Forked Element Web v1.11.96
- Repository: https://github.com/ank1n/element-x-web
- Dependencies installed

### Phase 1: Base Structure ✅

#### 1.1 Data Models
- `src/models/ContactItem.ts` - Contact model
- `src/models/CallHistoryItem.ts` - Call history with CallType enum
- `src/models/AppItem.ts` - Embeddable apps with AppCategory enum
- `src/models/RecordingState.ts` - Recording state management

#### 1.2 Common UI Components
- `src/components/common/FilterChip.tsx` - Filter chip component
- `src/components/common/SearchBar.tsx` - Search bar component
- `src/components/common/EmptyState.tsx` - Empty state component
- `src/components/common/LoadingSkeleton.tsx` - Loading skeleton with shimmer

#### 1.3 CSS Styles
- `res/css/components/common/_FilterChip.pcss`
- `res/css/components/common/_SearchBar.pcss`
- `res/css/components/common/_EmptyState.pcss`
- `res/css/components/common/_LoadingSkeleton.pcss`
- `res/css/structures/_TabBar.pcss`

#### 1.4 Configuration
- `src/config/appConfig.ts` - Application configuration with default apps

### Phase 2: Navigation ✅

#### 2.1 Page Types
- Extended `src/PageTypes.ts` with:
  - `ContactsView` - Contacts tab
  - `CallsView` - Calls tab
  - `AppsView` - Apps tab

#### 2.2 TabBar Component
- `src/components/structures/TabBar.tsx` - Bottom tab bar with 4 tabs:
  - 👥 Contacts
  - 📞 Calls
  - 💬 Chats (existing)
  - 📱 Apps

#### 2.3 View Components (Placeholders)
- `src/components/structures/ContactsView.tsx` - Contacts list view
- `src/components/structures/CallsView.tsx` - Call history view
- `src/components/structures/AppsView.tsx` - Apps catalog view

#### 2.4 Integration
- Updated `src/components/structures/LoggedInView.tsx`:
  - Added TabBar to main layout
  - Added handlers for new page types
  - Implemented tab change logic

#### 2.5 Localization
- Updated `src/i18n/strings/en_EN.json`:
  - Tab labels (contacts, calls, chats, apps)
  - Contacts section strings
  - Calls section strings
  - Apps section strings
  - Recording section strings

## Next Steps

### Phase 3: Contacts Tab
- Implement ContactsService
- Add contacts list with search
- Add filters (All, Online, Favorites)
- Add presence status integration

### Phase 4: Calls Tab
- Implement CallHistoryService
- Add call history list
- Add recording playback
- Add filters (All, Missed, Incoming, Outgoing)

### Phase 5: Apps Tab
- Implement AppsService
- Add apps catalog
- Add iframe integration
- Add category filters

### Phase 6: Call Recording
- Implement RecordingService
- Add recording button to call screen
- Add consent dialog
- Integrate with LiveKit Egress API

## Configuration

Default apps configured in `src/config/appConfig.ts`:
- Security Portal (https://ozzy.implica.ru/security/)
- Flow Labeling (https://ozzy.implica.ru/labeling/)
- MLOps Dashboard (https://ozzy.implica.ru/mlops/)

Recording API URL: https://api.market.implica.ru/api/recording

## Architecture

```
Element X Web (Custom)
├── src/
│   ├── models/           # Data models
│   ├── config/           # Configuration
│   ├── components/
│   │   ├── common/       # Reusable components
│   │   └── structures/   # Main layout components
│   └── i18n/strings/     # Localization
└── res/css/              # Styles
```

## Development

```bash
# Install dependencies
yarn install

# Type check
yarn lint:types:src

# Build
yarn build

# Start dev server
yarn start
```

## References

- Original: element-hq/element-web v1.11.96
- iOS Implementation: Element X iOS Fork
- Technical Spec: tz.md
- Implementation Plan: ELEMENTX-IMPLEMENTATION.md
