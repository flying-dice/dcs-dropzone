# Frontend Architecture

This document describes the frontend architecture and best practices for the DCS Dropzone client application.

## Folder Structure

```
src/app/client/
├── components/          # Reusable UI components
│   ├── ModCard/        # Example: Component with multiple variants
│   │   ├── index.tsx   # Smart component (container)
│   │   ├── GridModCard.tsx    # Presentational component
│   │   ├── ListModCard.tsx    # Presentational component
│   │   └── types.ts    # Shared types
│   ├── EmptyState.tsx  # Simple presentational components
│   └── ...
├── hooks/              # Custom React hooks
│   ├── useBreakpoint.ts       # Responsive design hook
│   ├── useModFilters.ts       # URL parameter management
│   └── useNewModModal.ts      # Modal handling logic
├── pages/              # Page-level components
│   ├── HomePage.tsx
│   ├── ModsPage.tsx
│   └── UserModPage/    # Complex pages with subcomponents
├── services/           # Business logic and data transformations
│   ├── modFilterService.ts    # Filter data transformations
│   └── monacoEditorService.ts # Editor operations
├── utils/              # Pure utility functions
│   ├── showErrorNotification.tsx
│   └── fileToDataUri.ts
├── context/            # React context providers
├── i18n/              # Internationalization
└── _autogen/          # Auto-generated API clients
```

## Architecture Principles

### 1. Separation of Concerns

Components are organized by responsibility:

- **Presentational Components**: Pure UI components that receive data via props and emit events
  - Example: `GridModCard`, `ListModCard`
  - No business logic, no API calls
  - Easy to test and reuse

- **Container Components**: Smart components that manage state and logic
  - Example: `ModCard` (delegates to presentational components)
  - Handle data fetching, state management
  - Pass data to presentational components

### 2. Custom Hooks

Extract reusable logic into custom hooks:

- **State Management**: `useModFilters` manages URL parameters
- **Side Effects**: `useNewModModal` handles modal operations
- **UI Logic**: `useBreakpoint` provides responsive design utilities

### 3. Service Modules

Business logic and data transformations belong in service modules:

- Pure functions for data transformations
- Reusable across components
- Easier to test in isolation

Example:
```typescript
// modFilterService.ts
export const modFilterService = {
  transformCategories: (categories, t) => { ... },
  transformMaintainers: (maintainers) => { ... },
}
```

### 4. Component Composition

Break down complex components into smaller, focused pieces:

**Before:**
```typescript
// 200+ line component with everything mixed together
function ModCard() {
  // rendering logic for grid
  // rendering logic for list
  // data transformation
  // event handling
}
```

**After:**
```typescript
// Smart component
function ModCard(props) {
  return props.variant === 'grid' 
    ? <GridModCard {...props} /> 
    : <ListModCard {...props} />;
}

// Separate presentational components
function GridModCard(props) { /* grid UI only */ }
function ListModCard(props) { /* list UI only */ }
```

## Best Practices

### Component Guidelines

1. **Keep components focused** - Each component should have a single responsibility
2. **Props over state** - Prefer props for data flow when possible
3. **Extract complex logic** - Move business logic to hooks or services
4. **Type everything** - Use TypeScript for all props and return types
5. **Avoid deep nesting** - Extract nested JSX into separate components

### Naming Conventions

- **Components**: PascalCase (e.g., `ModCard`, `UserModsPage`)
- **Hooks**: camelCase with `use` prefix (e.g., `useModFilters`)
- **Services**: camelCase with `Service` suffix (e.g., `modFilterService`)
- **Utils**: camelCase (e.g., `showErrorNotification`)
- **Types**: PascalCase with type suffix (e.g., `ModCardProps`)

### File Organization

- **Complex components**: Create a directory with `index.tsx` as entry point
- **Simple components**: Single `.tsx` file
- **Types**: Export from the component file or create separate `types.ts`
- **Related components**: Group in subdirectories (e.g., `ModCard/`)

### Code Style

- Use existing libraries (Mantine, React Query) consistently
- Follow the repository's linting rules (Biome)
- Match existing code patterns in the file
- Document complex logic with comments sparingly
- Prefer clear names over comments

## Examples

### Creating a New Hook

```typescript
// hooks/useMyFeature.ts
export function useMyFeature() {
  const [state, setState] = useState();
  
  const doSomething = () => {
    // logic here
  };
  
  return { state, doSomething };
}
```

### Creating a Service

```typescript
// services/myService.ts
export const myService = {
  transform: (data) => {
    // transformation logic
    return transformed;
  },
  
  validate: (input) => {
    // validation logic
    return isValid;
  },
};
```

### Splitting a Component

1. Identify distinct UI patterns (grid vs list, mobile vs desktop)
2. Extract common props into `types.ts`
3. Create presentational components for each variant
4. Create container component that delegates to variants
5. Export through `index.tsx`

## Testing

- Focus on testing hooks and services (pure logic)
- Test components with user interactions
- Use existing test patterns in the repository
- Keep tests close to the code being tested

## Migration Guide

When refactoring existing code:

1. **Start small** - Refactor one component at a time
2. **Extract logic first** - Move business logic to hooks/services
3. **Split components** - Break down large components
4. **Update imports** - Update all imports to new structure
5. **Test thoroughly** - Run `bun run check` to verify
6. **Commit frequently** - Small, focused commits

## Resources

- [React Best Practices](https://react.dev/learn)
- [Mantine UI Components](https://mantine.dev/)
- [React Query (TanStack Query)](https://tanstack.com/query)
