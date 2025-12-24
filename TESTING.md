# Testing Guide

## Testing Changes with Playwright

All changes to the application should be tested in a browser using Playwright before finalizing.

### Running the App for Testing

The app can be run without authentication or external dependencies:

```bash
# Start the app with mock auth and in-memory database
cd apps/webapp
bun run dev
```

This will run:

```"AUTH_SERVICE_MOCK='{\"enabled\": true}' bun --hot src/App.tsx"```

Features of this setup:
- Set AUTH_SERVICE_MOCK to enable mock authentication
- Start the server on `http://localhost:3000`
- Use an in-memory MongoDB (no external database needed)
- Use mock authentication (no GitHub OAuth needed)
- Automatically create a mock user in the database on login

### Testing with Playwright

Use Playwright to:
1. Navigate to pages in the running app
2. Interact with UI elements (click, fill forms, etc.)
3. Take screenshots to verify UI changes
4. Verify functionality end-to-end

Always Login as normal (pressing login), but the auth flow will use the mock user.

### Screenshot Guidelines

**Always take screenshots when:**
- Adding new UI components
- Modifying existing UI layouts
- Implementing new user flows
- Fixing UI bugs

Screenshots should show:
- The feature in action
- Different states (empty, with data, error states)
- User interactions (dropdowns open, modals, etc.)

### Example: Testing the Latest Release Feature

1. **Start the app:**
   ```bash
   bun run dev
   ```

2. **Open Playwright and navigate:**
   ```typescript
   await playwright-browser_navigate("http://localhost:3000")
   await playwright-browser_wait_for({ time: 2 })
   ```

3. **Create a mod:**
   - Click "My Mods"
   - Click "Publish New Mod"
   - Fill in mod details
   - Click "Create Mod"

4. **Create releases via API** (if UI is blocked):
   ```bash
   curl -X POST http://localhost:3000/api/user-mods/{mod-id}/releases \
     -H "Content-Type: application/json" \
     -d '{"version": "1.0.0"}'
   ```

5. **Navigate back and take screenshot:**
   ```typescript
   await playwright-browser_navigate("http://localhost:3000/#/user-mods/{mod-id}")
   await playwright-browser_take_screenshot({ filename: "latest-release-selector.png" })
   ```

### Important Notes

- **Mock User**: When `AUTH_DISABLED=true`, a mock user with ID `mock-user-123` is automatically created
- **In-Memory DB**: Data is lost when the server stops
- **Hot Reload**: The dev server has hot reload which may interfere with Playwright clicks
- **Console Errors**: Some errors (Monaco editor, daemon connection) are expected and can be ignored

### Best Practices

1. **Always test changes in browser** before committing
2. **Take screenshots** of UI changes for PR documentation
3. **Test user flows end-to-end** (create → edit → save → verify)
4. **Test edge cases** (empty states, error states, loading states)
5. **Verify responsive behavior** if UI changes affect layout

### Troubleshooting

**Problem**: Playwright clicks are blocked by overlay
- **Solution**: Use `playwright-browser_evaluate` to click elements directly via JavaScript

**Problem**: Data not loading/updating
- **Solution**: Hard refresh the page or navigate directly to the URL

**Problem**: Form submission fails
- **Solution**: Check server logs for errors, verify API endpoints are working

**Problem**: Port 3000 already in use
- **Solution**: Kill existing process: `lsof -ti:3000 | xargs kill -9`

## Configuration for Testing

### Environment Variables

```bash
# Required for testing
AUTH_DISABLED=true              # Use mock authentication
MONGO_URI=mongodb://memory:27017/test  # Use in-memory database (default)

# Optional
PORT=3000                       # Server port (default: 3000)
```

### Mock User Details

When `AUTH_DISABLED=true`, the following mock user is available:

```typescript
{
  id: "mock-user-123",
  username: "mockuser",
  name: "Mock User",
  avatarUrl: "https://avatars.githubusercontent.com/u/1?v=4",
  profileUrl: "https://github.com/mockuser"
}
```

This user:
- Is automatically created in the database
- Has full access to all authenticated endpoints
- Owns all mods created during testing

## CI/CD Testing

For automated testing in CI/CD:

```yaml
- name: Start test server
  run: |
    cd apps/webapp
    AUTH_DISABLED=true bun run dev &
    sleep 5  # Wait for server to start

- name: Run Playwright tests
  run: |
    # Your Playwright test commands here
    
- name: Stop server
  run: |
    lsof -ti:3000 | xargs kill -9
```
