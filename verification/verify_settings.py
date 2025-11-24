from playwright.sync_api import sync_playwright

def verify_changes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            # Navigate to the app
            page.goto("http://localhost:3000")

            # Wait for the canvas to be ready
            page.wait_for_selector(".tl-canvas", timeout=15000)
            page.wait_for_timeout(3000)

            # Try to select everything
            page.keyboard.press("Control+a")

            # Wait a bit for selection to register
            page.wait_for_timeout(1000)

            # Take a screenshot to see if selection handles are visible
            page.screenshot(path="verification/selection_state.png")
            print("Screenshot taken: verification/selection_state.png")

            # Wait for the settings panel
            page.wait_for_selector(".tl-live-image-settings", timeout=5000)

            # Take a screenshot of the panel
            page.screenshot(path="verification/settings_panel.png")
            print("Screenshot taken: verification/settings_panel.png")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error_state.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_changes()
