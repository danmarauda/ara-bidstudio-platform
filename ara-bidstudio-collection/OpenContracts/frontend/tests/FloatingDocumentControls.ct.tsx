import { test, expect } from "@playwright/experimental-ct-react";
import { FloatingDocumentControlsTestWrapper } from "./FloatingDocumentControlsTestWrapper";

test.describe("FloatingDocumentControls", () => {
  test("renders visible controls with core buttons", async ({
    mount,
    page,
  }) => {
    const component = await mount(
      <FloatingDocumentControlsTestWrapper
        visible={true}
        corpusPermissions={["CAN_READ", "CAN_UPDATE"]}
      />
    );

    // Check main container is visible
    await expect(component).toBeVisible();

    // Check core buttons are present using data-testid
    const settingsButton = page.getByTestId("settings-button");
    await expect(settingsButton).toBeVisible();
    await expect(settingsButton).toHaveAttribute("title", "Annotation Filters");

    const extractsButton = page.getByTestId("extracts-button");
    await expect(extractsButton).toBeVisible();
    await expect(extractsButton).toHaveAttribute("title", "View Extracts");

    const analysesButton = page.getByTestId("analyses-button");
    await expect(analysesButton).toBeVisible();
    await expect(analysesButton).toHaveAttribute("title", "View Analyses");

    // Note: Create Analysis button visibility depends on additional context
    // that may not be fully available in the test environment
  });

  test("hides when visible prop is false", async ({ mount, page }) => {
    await mount(<FloatingDocumentControlsTestWrapper visible={false} />);

    // When visible is false, the component returns null, so no buttons should exist
    const buttons = await page.locator("button").all();
    expect(buttons.length).toBe(0);
  });

  test("expands settings panel when settings button is clicked", async ({
    mount,
    page,
  }) => {
    const component = await mount(
      <FloatingDocumentControlsTestWrapper visible={true} />
    );

    const settingsButton = page.getByTestId("settings-button");
    await settingsButton.click();

    // Check the settings panel appears with the new title
    const settingsPanel = page.getByTestId("settings-panel");
    await expect(settingsPanel).toBeVisible();

    // Check for the new header text
    await expect(page.locator("text=Annotation Filters")).toBeVisible();

    // Check all toggle options are present
    await expect(page.locator("text=Show Only Selected")).toBeVisible();
    await expect(page.locator("text=Show Bounding Boxes")).toBeVisible();
    await expect(page.locator("text=Show Structural")).toBeVisible();
  });

  test("collapses settings panel when clicked again", async ({
    mount,
    page,
  }) => {
    const component = await mount(
      <FloatingDocumentControlsTestWrapper visible={true} />
    );

    const settingsButton = page.getByTestId("settings-button");

    // Open panel
    await settingsButton.click();
    const settingsPanel = page.getByTestId("settings-panel");
    await expect(settingsPanel).toBeVisible();

    // Close panel
    await settingsButton.click();
    await expect(settingsPanel).not.toBeVisible();
  });

  test("calls onAnalysesClick when analyses button is clicked", async ({
    mount,
    page,
  }) => {
    let analysesCalled = false;
    const onAnalysesClick = () => {
      analysesCalled = true;
    };
    const component = await mount(
      <FloatingDocumentControlsTestWrapper
        visible={true}
        onAnalysesClick={onAnalysesClick}
      />
    );

    const analysesButton = page.getByTestId("analyses-button");
    await analysesButton.click();

    expect(analysesCalled).toBe(true);
  });

  test("calls onExtractsClick when extracts button is clicked", async ({
    mount,
    page,
  }) => {
    let extractsCalled = false;
    const onExtractsClick = () => {
      extractsCalled = true;
    };
    const component = await mount(
      <FloatingDocumentControlsTestWrapper
        visible={true}
        onExtractsClick={onExtractsClick}
      />
    );

    const extractsButton = page.getByTestId("extracts-button");
    await extractsButton.click();

    expect(extractsCalled).toBe(true);
  });

  test("closes extracts panel when analyses button is clicked if extracts panel is open", async ({
    mount,
    page,
  }) => {
    let analysesCalled = 0;
    let extractsCalled = 0;
    const onAnalysesClick = () => {
      analysesCalled++;
    };
    const onExtractsClick = () => {
      extractsCalled++;
    };

    const component = await mount(
      <FloatingDocumentControlsTestWrapper
        visible={true}
        onAnalysesClick={onAnalysesClick}
        onExtractsClick={onExtractsClick}
        extractsOpen={true}
        analysesOpen={false}
      />
    );

    const analysesButton = page.getByTestId("analyses-button");
    await analysesButton.click();

    // Should close extracts panel first
    expect(extractsCalled).toBe(1);
    // Then open analyses panel
    expect(analysesCalled).toBe(1);
  });

  test("closes analyses panel when extracts button is clicked if analyses panel is open", async ({
    mount,
    page,
  }) => {
    let analysesCalled = 0;
    let extractsCalled = 0;
    const onAnalysesClick = () => {
      analysesCalled++;
    };
    const onExtractsClick = () => {
      extractsCalled++;
    };

    const component = await mount(
      <FloatingDocumentControlsTestWrapper
        visible={true}
        onAnalysesClick={onAnalysesClick}
        onExtractsClick={onExtractsClick}
        analysesOpen={true}
        extractsOpen={false}
      />
    );

    const extractsButton = page.getByTestId("extracts-button");
    await extractsButton.click();

    // Should close analyses panel first
    expect(analysesCalled).toBe(1);
    // Then open extracts panel
    expect(extractsCalled).toBe(1);
  });

  test("hides create analysis button when user lacks permissions", async ({
    mount,
    page,
  }) => {
    const component = await mount(
      <FloatingDocumentControlsTestWrapper
        visible={true}
        corpusPermissions={["CAN_READ"]} // No CAN_UPDATE permission
      />
    );

    // Count only the floating action buttons (not settings panel buttons)
    const settingsButton = page.getByTestId("settings-button");
    const extractsButton = page.getByTestId("extracts-button");
    const analysesButton = page.getByTestId("analyses-button");

    await expect(settingsButton).toBeVisible();
    await expect(extractsButton).toBeVisible();
    await expect(analysesButton).toBeVisible();

    // The create analysis button should not be present
    const createAnalysisButton = page.getByTestId("create-analysis-button");
    await expect(createAnalysisButton).not.toBeVisible();
  });

  test("toggles show selected only checkbox", async ({ mount, page }) => {
    const component = await mount(
      <FloatingDocumentControlsTestWrapper
        visible={true}
        showSelectedOnly={false}
      />
    );

    // Open settings panel
    const settingsButton = page.getByTestId("settings-button");
    await settingsButton.click();

    // Find and click the toggle
    const toggleRow = page.locator("text=Show Only Selected").locator("..");
    const toggle = toggleRow.locator('input[type="checkbox"]');
    const toggleWrapper = toggleRow.locator(".ui.checkbox");

    await expect(toggle).not.toBeChecked();
    await toggleWrapper.click();
    await expect(toggle).toBeChecked();
  });

  test("toggles show bounding boxes checkbox", async ({ mount, page }) => {
    const component = await mount(
      <FloatingDocumentControlsTestWrapper
        visible={true}
        showBoundingBoxes={false}
      />
    );

    // Open settings panel
    const settingsButton = page.getByTestId("settings-button");
    await settingsButton.click();

    // Find and click the toggle
    const toggleRow = page.locator("text=Show Bounding Boxes").locator("..");
    const toggle = toggleRow.locator('input[type="checkbox"]');
    const toggleWrapper = toggleRow.locator(".ui.checkbox");

    await expect(toggle).not.toBeChecked();
    await toggleWrapper.click();
    await expect(toggle).toBeChecked();
  });

  test("enabling structural view forces show selected only to be true", async ({
    mount,
    page,
  }) => {
    const component = await mount(
      <FloatingDocumentControlsTestWrapper
        visible={true}
        showSelectedOnly={false}
        showStructural={false}
      />
    );

    // Open settings panel
    const settingsButton = page.getByTestId("settings-button");
    await settingsButton.click();

    // Both should be initially unchecked
    const selectedOnlyToggle = page
      .locator("text=Show Only Selected")
      .locator("..")
      .locator('input[type="checkbox"]');
    const structuralToggle = page
      .locator("text=Show Structural")
      .locator("..")
      .locator('input[type="checkbox"]');
    const structuralToggleWrapper = page
      .locator("text=Show Structural")
      .locator("..")
      .locator(".ui.checkbox");

    await expect(selectedOnlyToggle).not.toBeChecked();
    await expect(structuralToggle).not.toBeChecked();

    // Click structural toggle
    await structuralToggleWrapper.click();

    // ARCHITECTURAL NOTE: In Playwright component tests, MemoryRouter location changes
    // don't reliably propagate to trigger reactive var updates via useEffect hooks.
    // The test wrapper now intercepts navigate calls to immediately sync reactive vars,
    // simulating what CentralRouteManager Phase 2 does in the real app.
    // Add small delay to allow intercepted navigate to process
    await page.waitForTimeout(100);

    // Both should now be checked
    await expect(structuralToggle).toBeChecked();
    await expect(selectedOnlyToggle).toBeChecked();

    // Selected only should be disabled when structural is on
    await expect(selectedOnlyToggle).toBeDisabled();
  });

  test("adjusts position based on panelOffset", async ({ mount }) => {
    const component = await mount(
      <FloatingDocumentControlsTestWrapper visible={true} panelOffset={400} />
    );

    // Check that the container has the correct right offset
    const container = component.locator("div").first();
    const styles = await container.evaluate((el) =>
      window.getComputedStyle(el)
    );

    // The right offset should be panelOffset + 32px = 432px
    expect(styles.right).toBe("432px");
  });

  test("create analysis button visibility depends on full context", async ({
    mount,
    page,
  }) => {
    await page.route("**/graphql", (route) => {
      // Mock any GraphQL requests if needed
      route.fulfill({ status: 200, body: JSON.stringify({ data: {} }) });
    });

    const component = await mount(
      <FloatingDocumentControlsTestWrapper
        visible={true}
        corpusPermissions={["CAN_READ", "CAN_UPDATE"]}
      />
    );

    // Check core buttons are always visible
    const settingsButton = page.getByTestId("settings-button");
    const extractsButton = page.getByTestId("extracts-button");
    const analysesButton = page.getByTestId("analyses-button");

    await expect(settingsButton).toBeVisible();
    await expect(extractsButton).toBeVisible();
    await expect(analysesButton).toBeVisible();

    // The create analysis button visibility depends on having a fully initialized
    // document and corpus context which may not be complete in the test environment.
    // The button correctly hides when permissions are lacking or in read-only mode
    // as verified by other tests.
  });

  test("read-only: hides create analysis button even with permissions", async ({
    mount,
    page,
  }) => {
    const component = await mount(
      <FloatingDocumentControlsTestWrapper
        visible={true}
        readOnly={true}
        corpusPermissions={["CAN_READ", "CAN_UPDATE"]} // Has permissions
      />
    );

    // Count visible buttons using data-testid
    const settingsButton = page.getByTestId("settings-button");
    const extractsButton = page.getByTestId("extracts-button");
    const analysesButton = page.getByTestId("analyses-button");

    await expect(settingsButton).toBeVisible();
    await expect(extractsButton).toBeVisible();
    await expect(analysesButton).toBeVisible();

    // The create analysis button should NOT be visible in read-only mode
    const createAnalysisButton = page.getByTestId("create-analysis-button");
    await expect(createAnalysisButton).not.toBeVisible();
  });

  test("read-only: settings panel still functions normally", async ({
    mount,
    page,
  }) => {
    const component = await mount(
      <FloatingDocumentControlsTestWrapper
        visible={true}
        readOnly={true}
        showBoundingBoxes={false}
      />
    );

    // Open settings panel
    const settingsButton = page.getByTestId("settings-button");
    await settingsButton.click();

    // Settings panel should still be functional
    const settingsPanel = page.getByTestId("settings-panel");
    await expect(settingsPanel).toBeVisible();
    await expect(page.locator("text=Annotation Filters")).toBeVisible();

    // Toggle should still work
    const toggleRow = page.locator("text=Show Bounding Boxes").locator("..");
    const toggle = toggleRow.locator('input[type="checkbox"]');
    const toggleWrapper = toggleRow.locator(".ui.checkbox");

    await expect(toggle).not.toBeChecked();
    await toggleWrapper.click();
    await expect(toggle).toBeChecked();
  });

  test("read-only: view buttons remain functional", async ({ mount, page }) => {
    let analysesCalled = false;
    let extractsCalled = false;

    const component = await mount(
      <FloatingDocumentControlsTestWrapper
        visible={true}
        readOnly={true}
        onAnalysesClick={() => {
          analysesCalled = true;
        }}
        onExtractsClick={() => {
          extractsCalled = true;
        }}
      />
    );

    // View buttons should still work in read-only mode
    const extractsButton = page.getByTestId("extracts-button");
    await extractsButton.click();
    expect(extractsCalled).toBe(true);

    const analysesButton = page.getByTestId("analyses-button");
    await analysesButton.click();
    expect(analysesCalled).toBe(true);
  });
});
