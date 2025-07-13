# Resume Craft Packages

This directory contains shared packages used across Resume Craft services in our monorepo.

## Package Structure

### 📋 `resume-craft-api-contracts`

**Purpose**: TypeScript API contracts and validation schemas

**Contains**:

- Request/Response type definitions
- Validation schemas using TypeBox/AJV
- API constants and enums
- Common validation helpers

**Usage**:

```typescript
import { GetUserProfileRequest, GetUserProfileResponse } from 'resume-craft-api-contracts';
import { USER_CONSTANTS } from 'resume-craft-api-contracts/constants';
```

**Export Structure**:

- Main exports: All contracts and types
- `/constants`: Constants and enums
- `/contracts`: Contract definitions
- `/helpers`: Validation helpers

### 🛠️ `resume-craft-common`

**Purpose**: Common NestJS modules, utilities, and services

**Contains**:

- NestJS modules (Configuration, Logger, ODM, etc.)
- Shared services (Axios, Database, etc.)
- Common decorators and pipes
- Exception handling
- Middleware and interceptors

**Usage**:

```typescript
import { ConfigurationModule, LoggerModule } from 'resume-craft-common';
import { BaseDbService } from 'resume-craft-common';
```

## Development Guidelines

### Adding New Packages

1. **Create package structure**:

    ```bash
    mkdir packages/resume-craft-[name]
    cd packages/resume-craft-[name]
    npm init -y
    ```

2. **Update package.json**:

    - Set `"private": true` for internal packages
    - Add proper metadata (description, keywords, author)
    - Configure exports for better tree-shaking

3. **Add to workspace**:
    - Packages are automatically detected by `pnpm-workspace.yaml`
    - Update root `package.json` if needed

### Package Dependencies

- **Internal packages**: Use `workspace:*` for monorepo packages
- **External packages**: Use specific versions in root `package.json`
- **Peer dependencies**: Use for packages that services should provide

### Best Practices

1. **Keep packages focused**: Single responsibility principle
2. **Use TypeScript**: All packages should be TypeScript-first
3. **Export properly**: Use modern ESM/CJS dual exports
4. **Test thoroughly**: Each package should have its own test suite
5. **Document APIs**: Export clear interfaces and types

## Building and Testing

```bash
# Build all packages
pnpm build

# Test all packages
pnpm test

# Development mode
pnpm dev

# Clean all packages
pnpm clean:workspaces
```

## Package Consumption

Services consume packages using workspace references:

```json
{
    "dependencies": {
        "resume-craft-common": "workspace:*",
        "resume-craft-api-contracts": "workspace:*"
    }
}
```

This enables:

- **Fast builds**: No need to publish/install
- **Live updates**: Changes reflect immediately
- **Type safety**: Full TypeScript support
- **Shared dependencies**: Hoisted to root level

## Suggested Additional Packages

Consider creating these packages as your platform grows:

- `resume-craft-types`: Shared TypeScript types and interfaces
- `resume-craft-utils`: Pure utility functions
- `resume-craft-auth`: Authentication/authorization modules
- `resume-craft-notifications`: Notification services
- `resume-craft-email`: Email templates and services
- `resume-craft-pdf`: PDF generation utilities
