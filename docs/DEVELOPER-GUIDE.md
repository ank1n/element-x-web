# Element X Web - Developer Guide

Руководство разработчика по кастомизации Element X Web.

---

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│         LoggedInView (Main Layout)          │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │          TabBar Navigation           │  │
│  │  👥 Contacts │ 📞 Calls │ 💬 Chats   │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │         Current View                 │  │
│  │  ┌────────────────────────────────┐  │  │
│  │  │  ContactsView / CallsView /    │  │  │
│  │  │  RoomView / AppsView           │  │  │
│  │  └────────────────────────────────┘  │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘

Services Layer:
- ContactsService (Matrix DM rooms)
- CallHistoryService (Call events)
- RecordingService (LiveKit Egress API)

Data Models:
- ContactItem
- CallHistoryItem
- AppItem
- RecordingState
```

---

## Project Structure

```
element-x-web/
├── src/
│   ├── components/
│   │   ├── common/           # Reusable components
│   │   │   ├── FilterChip.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── LoadingSkeleton.tsx
│   │   ├── structures/       # Layout components
│   │   │   ├── TabBar.tsx
│   │   │   ├── ContactsView.tsx
│   │   │   ├── CallsView.tsx
│   │   │   └── AppsView.tsx
│   │   └── views/            # Feature components
│   │       ├── contacts/
│   │       │   └── ContactCard.tsx
│   │       ├── calls/
│   │       │   ├── CallHistoryCard.tsx
│   │       │   └── RecordingControls.tsx
│   │       └── apps/
│   │           ├── AppCard.tsx
│   │           └── AppDetailView.tsx
│   ├── services/             # Business logic
│   │   ├── ContactsService.ts
│   │   ├── CallHistoryService.ts
│   │   └── RecordingService.ts
│   ├── models/               # Type definitions
│   │   ├── ContactItem.ts
│   │   ├── CallHistoryItem.ts
│   │   ├── AppItem.ts
│   │   └── RecordingState.ts
│   ├── config/
│   │   └── appConfig.ts      # App configuration
│   └── PageTypes.ts          # Navigation types
├── res/css/                  # Stylesheets (PCSS)
├── test/                     # Tests
├── k8s/                      # Kubernetes manifests
├── docs/                     # Documentation
└── .github/workflows/        # CI/CD
```

---

## Development Setup

### Prerequisites

- Node.js 18+
- Yarn 1.22+
- Git

### Installation

```bash
# Clone repository
git clone https://github.com/ank1n/element-x-web.git
cd element-x-web

# Install dependencies
yarn install

# Start development server
yarn start
```

### Development Commands

```bash
# Start dev server (http://localhost:8080)
yarn start

# Run tests
yarn test

# Run tests with coverage
yarn coverage

# Run linter
yarn lint

# Fix linting issues
yarn lint:fix

# Type checking
yarn tsc --noEmit

# Build production bundle
yarn build

# Generate localization types
yarn i18n
```

---

## Adding Custom Features

### 1. Create a New Tab

**Step 1: Define Page Type**

```typescript
// src/PageTypes.ts
export enum PageType {
    // ... existing types
    MyCustomView = "my_custom_view",
}
```

**Step 2: Add to TabBar**

```typescript
// src/components/structures/TabBar.tsx
private onCustomClick = (): void => {
    this.props.onTabChange(PageTypes.MyCustomView);
};

// In render():
<AccessibleButton
    className={tabClass}
    onClick={this.onCustomClick}
>
    <div className="mx_TabBar_tab_icon">🎯</div>
    <div className="mx_TabBar_tab_label">{_t("tabs|custom")}</div>
</AccessibleButton>
```

**Step 3: Create View Component**

```typescript
// src/components/structures/MyCustomView.tsx
import React from "react";
import { _t } from "../../languageHandler";

export default class MyCustomView extends React.Component {
    public render(): React.ReactNode {
        return (
            <div className="mx_MyCustomView">
                <div className="mx_MyCustomView_header">
                    <h1>{_t("custom|title")}</h1>
                </div>
                <div className="mx_MyCustomView_content">
                    {/* Your custom content */}
                </div>
            </div>
        );
    }
}
```

**Step 4: Add Route in LoggedInView**

```typescript
// src/components/structures/LoggedInView.tsx
import MyCustomView from "./MyCustomView";

// In renderPageComponent():
case PageTypes.MyCustomView:
    return <MyCustomView />;
```

**Step 5: Add Localization**

```json
// src/i18n/strings/en_EN.json
{
    "tabs|custom": "Custom",
    "custom|title": "My Custom Feature"
}
```

**Step 6: Run i18n generator**

```bash
yarn i18n
```

---

### 2. Create a Custom Service

**Step 1: Define Model**

```typescript
// src/models/MyDataItem.ts
export interface MyDataItem {
    id: string;
    name: string;
    value: number;
    timestamp: Date;
}
```

**Step 2: Create Service**

```typescript
// src/services/MyDataService.ts
import { EventEmitter } from "events";
import { type MatrixClient } from "matrix-js-sdk/src/matrix";
import { type MyDataItem } from "../models/MyDataItem";

export const MY_DATA_UPDATE_EVENT = "my_data_update";

export class MyDataService extends EventEmitter {
    private static instance: MyDataService;
    private client: MatrixClient | null = null;
    private data: MyDataItem[] = [];

    public static sharedInstance(): MyDataService {
        if (!MyDataService.instance) {
            MyDataService.instance = new MyDataService();
        }
        return MyDataService.instance;
    }

    public start(client: MatrixClient): void {
        this.client = client;
        this.loadData();
    }

    public stop(): void {
        this.client = null;
        this.data = [];
    }

    public async getData(): Promise<MyDataItem[]> {
        return this.data;
    }

    private async loadData(): Promise<void> {
        // Your data loading logic
        this.emit(MY_DATA_UPDATE_EVENT, this.data);
    }
}
```

**Step 3: Use in Component**

```typescript
import { MyDataService, MY_DATA_UPDATE_EVENT } from "../../services/MyDataService";

export default class MyComponent extends React.Component<{}, IState> {
    private service: MyDataService;

    public constructor(props: {}) {
        super(props);
        this.service = MyDataService.sharedInstance();
        this.state = { data: [] };
    }

    public componentDidMount(): void {
        this.service.on(MY_DATA_UPDATE_EVENT, this.onDataUpdate);
        this.loadData();
    }

    public componentWillUnmount(): void {
        this.service.removeListener(MY_DATA_UPDATE_EVENT, this.onDataUpdate);
    }

    private onDataUpdate = (data: MyDataItem[]): void => {
        this.setState({ data });
    };

    private async loadData(): Promise<void> {
        const data = await this.service.getData();
        this.setState({ data });
    }
}
```

---

### 3. Add Custom App to Catalog

**Edit appConfig:**

```typescript
// src/config/appConfig.ts
export const defaultConfig: AppConfig = {
    apps: [
        // ... existing apps
        {
            id: "my-custom-app",
            name: "My Custom App",
            description: "Custom application description",
            url: "https://example.com/my-app",
            icon: "🎯",
            isPinned: false,
        },
    ],
};
```

**Or via config.json:**

```json
{
    "apps": [
        {
            "id": "my-custom-app",
            "name": "My Custom App",
            "description": "Custom application description",
            "url": "https://example.com/my-app",
            "icon": "🎯",
            "isPinned": false
        }
    ]
}
```

**CORS Requirements:**

Your app must allow iframe embedding:

```
Access-Control-Allow-Origin: https://app.implica.ru
Content-Security-Policy: frame-ancestors 'self' https://app.implica.ru
X-Frame-Options: ALLOW-FROM https://app.implica.ru
```

---

## Styling Guide

### PCSS (PostCSS)

Element X Web uses PostCSS with nesting:

```pcss
.mx_MyComponent {
    display: flex;
    padding: 16px;

    .mx_MyComponent_header {
        font-size: 24px;
        font-weight: 600;
        color: $primary-content;

        &:hover {
            color: $accent;
        }
    }

    &.mx_MyComponent_active {
        background-color: $system;
    }
}
```

### Theme Variables

Common theme variables:

```pcss
/* Colors */
$primary-content          /* Main text color */
$secondary-content        /* Secondary text */
$tertiary-content         /* Tertiary text */
$quaternary-content       /* Background elements */
$quinary-content          /* Borders */

$accent                   /* Accent color (blue) */
$alert                    /* Alert color (red) */
$system                   /* System background */
$background               /* Main background */

/* Spacing */
$spacing-4   /* 4px */
$spacing-8   /* 8px */
$spacing-12  /* 12px */
$spacing-16  /* 16px */
$spacing-24  /* 24px */
```

### Naming Convention

- **Component root:** `.mx_ComponentName`
- **Child elements:** `.mx_ComponentName_element`
- **Modifiers:** `.mx_ComponentName_modifier`

**Example:**

```pcss
.mx_ContactCard {
    /* Root */

    .mx_ContactCard_avatar {
        /* Child element */
    }

    &.mx_ContactCard_online {
        /* Modifier */
    }
}
```

---

## Testing

### Unit Tests (Services)

```typescript
// test/unit-tests/services/MyService-test.ts
import { MyService } from "../../../src/services/MyService";

describe("MyService", () => {
    let service: MyService;

    beforeEach(() => {
        service = MyService.sharedInstance();
    });

    afterEach(() => {
        service.stop();
    });

    it("should return data", async () => {
        const data = await service.getData();
        expect(data).toBeDefined();
    });

    it("should emit events", () => {
        const listener = jest.fn();
        service.on("update", listener);

        service.triggerUpdate();

        expect(listener).toHaveBeenCalled();
    });
});
```

### Component Tests

```typescript
// test/components/views/MyComponent-test.tsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import MyComponent from "../../../src/components/views/MyComponent";

describe("MyComponent", () => {
    it("should render", () => {
        render(<MyComponent />);
        expect(screen.getByText("My Component")).toBeInTheDocument();
    });

    it("should handle click", () => {
        const onClick = jest.fn();
        render(<MyComponent onClick={onClick} />);

        fireEvent.click(screen.getByRole("button"));

        expect(onClick).toHaveBeenCalled();
    });
});
```

### Run Tests

```bash
# Run all tests
yarn test

# Run specific test file
yarn test MyService-test

# Run with coverage
yarn coverage

# Run in watch mode
yarn test --watch
```

---

## API Integration

### Recording API Example

```typescript
import { RecordingService } from "../services/RecordingService";

const service = RecordingService.sharedInstance();

// Start recording
const state = await service.startRecording(roomId);
console.log("Recording started:", state.egressId);

// Stop recording
await service.stopRecording(roomId);

// Get recordings
const recordings = await service.getRecordingsForRoom(roomId);
```

### Custom API Integration

```typescript
export class CustomApiService {
    private baseUrl: string;

    public constructor() {
        this.baseUrl = "https://api.example.com";
    }

    public async fetchData(): Promise<any> {
        const response = await fetch(`${this.baseUrl}/data`, {
            headers: {
                "Authorization": `Bearer ${this.getAccessToken()}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
        }

        return response.json();
    }

    private getAccessToken(): string {
        // Get Matrix access token
        return MatrixClientPeg.safeGet().getAccessToken();
    }
}
```

---

## Build & Deploy

### Production Build

```bash
# Build
yarn build

# Output: webapp/
```

### Docker Build

```bash
# Build image
docker build -t element-x-web:latest .

# Run container
docker run -p 8080:8080 element-x-web:latest
```

### Kubernetes Deploy

```bash
# Apply manifests
kubectl apply -f k8s/

# Check status
kubectl get pods -n element-x-web

# View logs
kubectl logs -f deployment/element-x-web -n element-x-web
```

---

## Debugging

### Browser DevTools

**Console logging:**

```typescript
console.log("Debug:", data);
console.error("Error:", error);
console.warn("Warning:", warning);
```

**React DevTools:**
- Install React DevTools browser extension
- Inspect component hierarchy
- View props and state

### Network Debugging

**Check API calls:**

```typescript
// Add logging to service
public async fetchData(): Promise<any> {
    console.log("Fetching data from:", this.baseUrl);

    const response = await fetch(this.baseUrl);

    console.log("Response:", response.status, response.statusText);

    return response.json();
}
```

### Matrix Client Events

```typescript
// Listen to all Matrix events
client.on("event", (event) => {
    console.log("Matrix event:", event.getType(), event);
});

// Listen to specific event type
client.on("Room.timeline", (event, room) => {
    console.log("Timeline event in", room.name, ":", event);
});
```

---

## Best Practices

### 1. Use TypeScript

Always define types for your data:

```typescript
// Good
interface MyData {
    id: string;
    value: number;
}

const data: MyData = { id: "123", value: 42 };

// Bad
const data: any = { id: "123", value: 42 };
```

### 2. Use Singleton Services

```typescript
// Good
export class MyService {
    private static instance: MyService;

    public static sharedInstance(): MyService {
        if (!MyService.instance) {
            MyService.instance = new MyService();
        }
        return MyService.instance;
    }
}

// Usage
const service = MyService.sharedInstance();
```

### 3. Use EventEmitter for Updates

```typescript
export class MyService extends EventEmitter {
    private updateData(): void {
        // Update data
        this.emit("update", this.data);
    }
}

// In component
service.on("update", this.onUpdate);
```

### 4. Clean Up Listeners

```typescript
public componentDidMount(): void {
    this.service.on("update", this.onUpdate);
}

public componentWillUnmount(): void {
    this.service.removeListener("update", this.onUpdate);
}
```

### 5. Use Localization

```typescript
// Good
<h1>{_t("my_feature|title")}</h1>

// Bad
<h1>My Feature</h1>
```

---

## Troubleshooting

### Build Errors

**Issue:** `Module not found`

**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules yarn.lock
yarn install
```

**Issue:** TypeScript errors

**Solution:**
```bash
# Regenerate types
yarn tsc --noEmit
```

### Runtime Errors

**Issue:** `Cannot read property 'X' of undefined`

**Solution:** Add null checks:

```typescript
// Before
const value = data.property;

// After
const value = data?.property;
```

**Issue:** EventEmitter memory leak

**Solution:** Always remove listeners in `componentWillUnmount`.

---

## Contributing

### Code Style

- Use ESLint/Prettier
- Follow existing naming conventions
- Add JSDoc comments for public APIs
- Write tests for new features

### Pull Request Process

1. Create feature branch
2. Make changes
3. Run tests: `yarn test`
4. Run linter: `yarn lint`
5. Commit with descriptive message
6. Push and create PR
7. Wait for CI to pass
8. Request review

---

## Resources

- **Matrix JS SDK:** https://github.com/matrix-org/matrix-js-sdk
- **React Docs:** https://react.dev/
- **TypeScript Docs:** https://www.typescriptlang.org/docs/
- **Element Web:** https://github.com/vector-im/element-web
- **PostCSS:** https://postcss.org/

---

**Version:** 1.11.96-custom
**Last Updated:** 2026-01-30
