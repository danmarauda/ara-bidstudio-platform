## Responsive Layout

The application was primarily designed to be viewed around 1080p. We've built in some quick and dirty (honestly, hacks)
to display a usable layout at other resolutions. A more thorough redesign / refactor is in order, again if
there's sufficient interest. What's available now should handle a lot of situations ok. If you find
performance / layout is not looking great at your given resolution, try to use a desktop browser at a 1080p resolution.

## Frontend Testing

The frontend includes a comprehensive test suite using modern testing frameworks:

### Testing Frameworks
- **Vitest**: Unit testing framework for components and utilities
- **Playwright**: End-to-end (E2E) and component testing
- **React Testing Library**: Component testing utilities

### Available Test Commands
```bash
# Run unit tests
npm run test:unit

# Run E2E tests
npm run test:e2e

# Run component tests
npm run test:ct

# Generate coverage report
npm run test:coverage
```

### Test Coverage
The test suite includes:
- Unit tests for utilities and type guards (`src/utils/__tests__/`)
- Component tests for critical UI components (`src/components/*/__tests__/`)
- Integration tests for navigation and routing (`src/__tests__/`)
- Permission flow tests (`tests/DocumentPermissionFlow.spec.tsx`)
- Metadata validation tests (`src/types/metadata.test.ts`)

While test coverage continues to expand, contributions to improve testing are always welcome!
