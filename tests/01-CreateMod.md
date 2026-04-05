# 01 - Create Mod

## Overview

This test covers the end-to-end flow of logging in as a mocked user, navigating to My Mods, creating a new mod with full metadata, and publishing a release with an asset and symbolic link.

---

## Prerequisites

- The application is running at `http://localhost:3000`
- The mock authentication backend is available
- No prior state is required (clean environment)

---

## Test Data

### Mod

| Field       | Value                                                                 |
|-------------|-----------------------------------------------------------------------|
| Name        | `Hello World Mod`                                                     |
| Description | `A simple mod that logs hello world to the console on DCS startup`    |
| Category    | `OTHER`                                                               |
| Tags        | `hello`                                                               |
| Thumbnail   | `https://raw.githubusercontent.com/flying-dice/dcs-dropzone-registry/refs/heads/main/registry/example-mod/index.png` |
| Visibility  | `PUBLIC`                                                              |
| Content     | See detailed description below                                        |

**Detailed Description (Markdown):**
```
# Example Hello World Mod

DCS world Hello World Mod

On DCS Startup logs hello world to the console

> This content is presented to the user when they open the mod page
```

### Release

| Field      | Value   |
|------------|---------|
| Version    | `0.1.0` |
| Visibility | `PUBLIC` |
| Changelog  | `RC1`   |

### Asset

| Field      | Value         |
|------------|---------------|
| Name       | `hello-world` |
| URL        | `https://github.com/flying-dice/hello-world-mod/releases/download/0.1.0/hello-world.lua` |
| Is Archive | `false`       |

### Symbolic Link

| Field            | Value                          |
|------------------|--------------------------------|
| Name             | `hello-world.lua`              |
| Source Path      | `hello-world.lua`              |
| Destination Root | `DCS Working Directory`        |
| Destination Path | `Scripts/Hooks/hello-world.lua`|

---

## Steps

### Step 1 — Login

1. Navigate to `http://localhost:3000`
2. Verify the **Dashboard** page is shown with the **Login** button visible in the top-right corner
3. Click the **Login** button
4. **Expected:** The mock authentication completes automatically. The Login button is replaced by a user avatar icon. The sidebar now shows **My Mods** as an active/available link.

---

### Step 2 — Navigate to My Mods

1. In the left sidebar, click **My Mods**
2. **Expected:** The URL changes to `/#/user-mods`. The page shows:
   - A **Published Mods** stat card (showing `0`)
   - A **Total Downloads** stat card (showing `0`)
   - A **+ Publish New Mod** button in the top-right of the content area
   - An empty list (no mods yet)

---

### Step 3 — Open the Create Mod Dialog

1. Click the **+ Publish New Mod** button
2. **Expected:** A **Create New Mod** dialog appears with:
   - A **Mod Name** field (pre-filled with `New Mod`)
   - A **Short Description** textarea
   - A **Category** dropdown (defaulting to `MOD`)
   - **Cancel** and **Create Mod** buttons

---

### Step 4 — Fill in the Create Mod Form

1. Clear the **Mod Name** field and type: `Hello World Mod`
2. Click into the **Short Description** field and type: `A simple mod that logs hello world to the console on DCS startup`
3. Click the **Category** dropdown and select `OTHER`
4. Click **Create Mod**
5. **Expected:** The dialog closes. The app navigates to the mod detail/edit page at `/#/user-mods/<mod-id>`. The page shows:
   - **Basic information** section with the entered name, category, and description pre-populated
   - **Detailed Description** section with a markdown editor (Write/Preview tabs)
   - **Tags** input
   - **Dependencies** section
   - **Releases** section showing `No Releases Added` and a **New Release** button
   - **Thumbnail** panel on the right
   - **Visibility & Permissions** panel (defaulting to `PRIVATE`)

---

### Step 4b — Set Thumbnail

1. Click the **Change Thumbnail** button in the **Thumbnail** panel (right side)
2. **Expected:** A **Change Thumbnail** dialog appears with an **Image URL** textarea and a **Save** button
3. Enter the thumbnail URL: `https://raw.githubusercontent.com/flying-dice/dcs-dropzone-registry/refs/heads/main/registry/example-mod/index.png`
4. Click **Save**
5. **Expected:** The dialog closes. The thumbnail image is shown in the Thumbnail panel.

---

### Step 5 — Fill in Mod Details

1. In the **Detailed Description** editor (Write tab), clear any placeholder text and enter the following markdown:
   ```
   # Example Hello World Mod

   DCS world Hello World Mod

   On DCS Startup logs hello world to the console

   > This content is presented to the user when they open the mod page
   ```
2. In the **Tags** field, type `hello` and press **Enter**. Verify the `hello` tag badge appears.
3. In the **Visibility** dropdown (right panel), click to open and select `PUBLIC` (raw enum value shown in options)
4. Do **not** click Save Changes yet — continue to create the release first.

---

### Step 6 — Create a New Release

1. Scroll down to the **Releases** section
2. Click the **New Release** button
3. **Expected:** A **Create New Release** dialog appears with a **Release Version** text field, **Cancel** and **Create Release** buttons
4. Enter `0.1.0` in the **Release Version** field
5. Click **Create Release**
6. **Expected:** The dialog closes. The app navigates to the release edit page at `/#/user-mods/<mod-id>/releases/<release-id>`. The page shows:
   - **Release Information** section with Release Version `0.1.0` and Visibility `Public`
   - **Detailed Changelog** section with a markdown editor
   - **Assets** section showing `No assets added` with an **Add Asset** button
   - **Symbolic Links** section showing `No symbolic links configured` with an **Add Symbolic Link** button
   - **Mission Scripts** section
   - **Summary** panel on the right showing `0.1.0`, asset count `0`, and `PUBLIC`

---

### Step 7 — Add the Changelog

1. Click into the **Detailed Changelog** editor (Write tab)
2. Type: `RC1`

---

### Step 8 — Add an Asset

1. Click the **Add Asset** button in the **Assets** section
2. **Expected:** An **Add Asset** dialog appears with:
   - An **Asset Name** field
   - An **Asset URLs** section with an **Add URL** button
   - An **Is Archive** checkbox
   - A **Save** button
3. In the **Asset Name** field, enter: `hello-world`
4. Click **Add URL**
5. **Expected:** A URL input row appears in the Asset URLs section
6. In the URL field, enter: `https://github.com/flying-dice/hello-world-mod/releases/download/0.1.0/hello-world.lua`
7. Leave **Is Archive** unchecked (the asset is a raw `.lua` file, not an archive)
8. Click **Save**
9. **Expected:** The dialog closes. The asset `hello-world` now appears in the Assets list with the URL shown. The Summary panel updates the asset count to `1`.

---

### Step 9 — Add a Symbolic Link

1. Click the **Add Symbolic Link** button in the **Symbolic Links** section
2. **Expected:** An **Add Symbolic Link** dialog appears with:
   - A **Link Name** field
   - A **Source Path** field (path relative to the mod download directory)
   - A **Destination Root** dropdown (options: `DCS Working Directory`, `DCS Install Directory`)
   - A **Destination Path** field (path relative to the selected destination root)
   - A **Save** button
3. In the **Link Name** field, enter: `hello-world.lua`
4. In the **Source Path** field, enter: `hello-world.lua`
5. The **Destination Root** defaults to `DCS Working Directory` — no change required
6. In the **Destination Path** field, enter: `Scripts/Hooks/hello-world.lua`
7. Click **Save**
8. **Expected:** The dialog closes. The symbolic link `hello-world.lua` now appears in the Symbolic Links list showing the source → destination mapping.

---

### Step 10 — Save the Release

1. Click **Save Changes** in the Summary panel (top-right)
2. **Expected:** A success notification appears. The release is saved with version `0.1.0`, `PUBLIC` visibility, changelog `RC1`, one asset (`hello-world`), and one symbolic link.

---

### Step 11 — Return to Mod Page and Save

1. Click **Back to Mod Page**
2. **Expected:** The app navigates back to the mod edit page at `/#/user-mods/<mod-id>`
3. In the **Releases** section, verify the release version `0.1.0` is listed with a `PUBLIC` visibility badge
4. Click **Save Changes**
5. **Expected:** A success notification appears. The mod is saved with all metadata.

---

### Step 12 — Verify on My Mods Page

1. Click **Back to Mods Page**
2. **Expected:** The `Hello World Mod` appears in the mod list showing:
   - The mod name: `Hello World Mod`
   - The description: `A simple mod that logs hello world to the console on DCS startup`
   - The `OTHER` category badge
   - A download count of `0`

---

## Expected Final State

| Item                        | Expected Value                                                                 |
|-----------------------------|--------------------------------------------------------------------------------|
| Mod Name                    | `Hello World Mod`                                                              |
| Category                    | `OTHER`                                                                        |
| Description                 | `A simple mod that logs hello world to the console on DCS startup`             |
| Visibility                  | `PUBLIC`                                                                       |
| Tags                        | `hello`                                                                        |
| Latest Release              | `0.1.0`                                                                        |
| Release Visibility          | `PUBLIC`                                                                       |
| Release Changelog           | `RC1`                                                                          |
| Asset Name                  | `hello-world`                                                                  |
| Asset URL                   | `https://github.com/flying-dice/hello-world-mod/releases/download/0.1.0/hello-world.lua` |
| Asset Is Archive            | `false`                                                                        |
| Symlink Name                | `hello-world.lua`                                                              |
| Symlink Source              | `hello-world.lua`                                                              |
| Symlink Destination Root    | `DCS_WORKING_DIR`                                                              |
| Symlink Destination Path    | `Scripts/Hooks/hello-world.lua`                                                |
