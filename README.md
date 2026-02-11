# Event Timeline

> Offline-first event timeline app built with React Native and Expo. Tracks domain, sync, and system events with automatic background synchronization to Supabase.

<video src="https://github.com/user-attachments/assets/9a227bf4-4883-44a1-ad96-9e9168c5bbc7" width="300" autoplay loop muted playsinline></video>

## Features

- **Local-first**: All events persist locally via WatermelonDB and render immediately with optimistic UI updates. No network dependency for core functionality.
- **Background sync**: Automatic synchronization with Supabase including batch processing, exponential backoff retry, and configurable conflict resolution (local wins, remote wins, last-write-wins).
- **Auto-tracking**: Automatically captures app lifecycle events (background/foreground) and network connectivity changes.
- **Timeline UI**: Chronological event list grouped by date with sticky headers, pull-to-refresh, sync status indicators, and glassmorphic design via expo-glass-effect.

## Tech Stack

| Category      | Technology                             |
| ------------- | -------------------------------------- |
| Framework     | React Native 0.81 + Expo 54 (New Arch) |
| Language      | TypeScript 5.9                         |
| Navigation    | Expo Router 6                          |
| Database      | WatermelonDB 0.28 (JSI SQLite)         |
| Backend       | Supabase                               |
| Animations    | Reanimated 4.1                         |
| Gestures      | React Native Gesture Handler 2.28      |
| Optimizations | React Compiler                         |

## Architecture

```
┌─────────────────────────────────────┐
│           UI Layer                  │
│  ├─ Timeline (Reanimated)          │
│  ├─ Filters / Grouping             │
│  └─ Gestures                       │
├─────────────────────────────────────┤
│         Domain Layer                │
│  ├─ Event Model                    │
│  ├─ Event Store (Repository)       │
│  └─ Type Guards                    │
├─────────────────────────────────────┤
│      Infrastructure Layer           │
│  ├─ Local DB (WatermelonDB)        │
│  ├─ Sync Engine (Supabase)         │
│  └─ Event Tracking                 │
└─────────────────────────────────────┘
```

## Project Structure

```
app/                       # Expo Router screens
src/
  domain/
    models/                # Event types & schemas
    store/                 # Event store interface (repository pattern)
  infrastructure/
    db/                    # WatermelonDB implementation
    sync/                  # Sync engine with conflict resolution
    api/                   # Supabase remote API
    tracking/              # Auto-tracking service
  ui/
    components/            # Reusable components
    screens/               # Screen components
    hooks/                 # Custom hooks (useTimelineEvents, useSyncEngine, etc.)
    theme/                 # Theme & styling
```

## Getting Started

```bash
# Install dependencies
bun install

# Start development server
bun start

# iOS
bun ios

# Android
bun android
```

### Environment Variables

Create a `.env` file with your Supabase credentials:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Development

```bash
bun lint        # Lint
bun tsc         # Type check
bun prebuild    # Build native modules
bun clean       # Clean build artifacts
```

## License

MIT
