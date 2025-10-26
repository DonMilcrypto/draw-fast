from playwright.sync_api import Page, expect

def test_draw_fast(page: Page):
    page.goto("http://localhost:3000/")

    # Enter a prompt
    page.dblclick("text=Double click prompt to edit")
    page.keyboard.type("A beautiful landscape")

    # Click the inpaint tool
    page.click('[data-testid="tools.inpaint"]')

    # Draw a mask
    page.mouse.move(200, 200)
    page.mouse.down()
    page.mouse.move(300, 300)
    page.mouse.up()

    # Click the style button
    page.click('[data-testid="style-button"]')

    # Enter a style prompt
    page.type('input[type="text"]', "Van Gogh")

    # Upload a style image
    page.set_input_files('input[type="file"]', 'tests/fixtures/style.jpg')

    # Click the animate button
    page.click('[data-testid="video-button"]')

    # Take a screenshot
    page.screenshot(path="jules-scratch/verification/verification.png")
