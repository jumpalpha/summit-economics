# Builds public/teacher-guide.pdf from scripts/teacher-guide.html (1 printable page).
# Teacher name comes from src/data/config.ts. Run: python3 scripts/teacher-guide.py
import asyncio, re, pathlib
from playwright.async_api import async_playwright
root = pathlib.Path(__file__).resolve().parent.parent
teacher = re.search(r'teacher:\s*"([^"]+)"', (root / "src/data/config.ts").read_text()).group(1)
html = (root / "scripts/teacher-guide.html").read_text().replace("{{TEACHER}}", teacher)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
        pg = await b.new_page()
        await pg.set_content(html, wait_until="load")
        await pg.pdf(path=str(root / "public/teacher-guide.pdf"), format="Letter", print_background=True, prefer_css_page_size=True)
        await b.close()
asyncio.run(main())
