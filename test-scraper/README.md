# 🧪 Test Scraper Environment

## Purpose
Validate extraction logic on controlled test pages BEFORE touching real websites.

## Test Pages

### ✅ Spa 1: Static Prices (`spa1-static.html`)
- Prices visible directly in HTML on page load
- **Expected results**: Gel $38, Pedicure $45, Acrylic $65

### 🖱️ Spa 2: Click-to-Reveal (`spa2-click.html`)  
- Prices hidden until "Book Now" button is clicked
- Scraper MUST click the button first
- **Expected results**: Gel $42, Pedicure $55, Acrylic $75

### ⏱️ Spa 3: JavaScript Load (`spa3-js.html`)
- Prices inserted via JavaScript after 3 seconds
- Scraper MUST wait for JS to execute
- **Expected results**: Gel $40, Pedicure $65, Acrylic $80

## Running Tests

```bash
# Start a simple HTTP server in test-scraper directory
python -m http.server 8080
# or
npx http-server -p 8080

# Access: http://localhost:8080/index.html
```

## Success Criteria

✅ All 3 test pages must scrape successfully  
✅ No null results  
✅ Correct prices extracted  
✅ Proper extraction method logged  

**Only then:** Say "✅ Test scraper passed — ready for real websites"

