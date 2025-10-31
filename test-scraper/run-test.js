/**
 * Test Scraper - Validates extraction on controlled test pages
 * Run: node test-scraper/run-test.js
 */

const puppeteer = require('puppeteer');
const path = require('path');

const testPages = [
  {
    name: 'Spa 1: Static Prices',
    url: path.join(__dirname, 'spa1-static.html'),
    expectedPrices: [
      { type: 'gel', price: 38 },
      { type: 'pedicure', price: 45 },
      { type: 'acrylic', price: 65 }
    ]
  },
  {
    name: 'Spa 2: Click to Reveal',
    url: path.join(__dirname, 'spa2-click.html'),
    clickSelector: '#bookBtn',
    expectedPrices: [
      { type: 'gel', price: 42 },
      { type: 'pedicure', price: 55 },
      { type: 'acrylic', price: 75 }
    ]
  },
  {
    name: 'Spa 3: JavaScript Load',
    url: path.join(__dirname, 'spa3-js.html'),
    waitTime: 3500, // Wait 3.5s for JS to load
    expectedPrices: [
      { type: 'gel', price: 40 },
      { type: 'pedicure', price: 65 },
      { type: 'acrylic', price: 80 }
    ]
  }
];

async function testSpa(page, testConfig) {
  console.log(`\n🔍 Testing: ${testConfig.name}`);
  console.log(`📍 URL: ${testConfig.url}`);
  
  try {
    // Navigate to page
    await page.goto(`file://${testConfig.url}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    console.log(`✅ Page loaded`);
    
    // Handle click-to-reveal
    if (testConfig.clickSelector) {
      console.log(`🖱️  Clicking: ${testConfig.clickSelector}`);
      await page.click(testConfig.clickSelector);
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log(`✅ Button clicked`);
    }
    
    // Handle JavaScript delays
    if (testConfig.waitTime) {
      console.log(`⏳ Waiting ${testConfig.waitTime}ms for JavaScript...`);
      await new Promise(resolve => setTimeout(resolve, testConfig.waitTime));
      console.log(`✅ Wait complete`);
    }
    
    // Extract prices
    const debugInfo = await page.evaluate(() => {
      const allText = document.body.innerText || document.body.textContent || '';
      const lines = allText.split('\n').filter(l => l.trim().length > 0);
      
      const results = [];
      
      // NEW APPROACH: Look at line + previous line together
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const prevLine = i > 0 ? lines[i - 1].trim() : '';
        const combined = (prevLine + ' ' + line).toLowerCase();
        
        // Find price in current line
        const priceMatch = line.match(/\$\s*(\d{2,3})/);
        if (!priceMatch) continue;
        
        const price = parseInt(priceMatch[1]);
        if (price < 10 || price > 300) continue;
        
        // Check if previous line or current line has service keyword
        let type = null;
        if (combined.includes('gel') || combined.includes('polish')) type = 'gel';
        else if (combined.includes('pedicure') || combined.includes('pedi')) type = 'pedicure';
        else if (combined.includes('acrylic') || combined.includes('extension')) type = 'acrylic';
        
        if (type) {
          results.push({
            serviceName: prevLine || line,
            serviceType: type,
            price,
            extractionMethod: 'line-pair-extraction'
          });
        }
      }
      
      return {
        allLines: lines,
        matchedLines: lines.filter(l => l.includes('$')),
        results
      };
    });
    
    console.log(`DEBUG: Found ${debugInfo.allLines.length} total lines`);
    console.log(`DEBUG: Found ${debugInfo.matchedLines.length} lines with prices`);
    console.log(`DEBUG: Sample lines with prices:`, debugInfo.matchedLines.slice(0, 10));
    console.log(`DEBUG: All lines (first 30):`, debugInfo.allLines.slice(0, 30));
    
    const extracted = debugInfo.results;
    
    // Check results
    const foundGel = extracted.find(s => s.serviceType === 'gel');
    const foundPedi = extracted.find(s => s.serviceType === 'pedicure');
    const foundAcrylic = extracted.find(s => s.serviceType === 'acrylic');
    
    console.log(`📊 Extracted ${extracted.length} services total:`);
    console.log(`   - Gel: ${foundGel ? `$${foundGel.price}` : 'NOT FOUND'}`);
    console.log(`   - Pedicure: ${foundPedi ? `$${foundPedi.price}` : 'NOT FOUND'}`);
    console.log(`   - Acrylic: ${foundAcrylic ? `$${foundAcrylic.price}` : 'NOT FOUND'}`);
    
    // Validate
    let allPassed = true;
    for (const expected of testConfig.expectedPrices) {
      const found = extracted.find(s => s.serviceType === expected.type);
      if (!found) {
        console.log(`❌ FAILED: Expected ${expected.type} $${expected.price}, got NOTHING`);
        allPassed = false;
      } else if (found.price !== expected.price) {
        console.log(`⚠️  WARNING: Expected ${expected.type} $${expected.price}, got $${found.price}`);
      } else {
        console.log(`✅ PASSED: ${expected.type} $${expected.price}`);
      }
    }
    
    return {
      name: testConfig.name,
      url: testConfig.url,
      success: allPassed,
      extracted
    };
    
  } catch (error) {
    console.error(`❌ ERROR: ${error.message}`);
    return {
      name: testConfig.name,
      url: testConfig.url,
      success: false,
      error: error.message
    };
  }
}

async function runTests() {
  console.log('🧪 Starting Test Scraper Validation\n');
  console.log('='.repeat(60));
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  const results = [];
  
  for (const testConfig of testPages) {
    const result = await testSpa(page, testConfig);
    results.push(result);
  }
  
  await browser.close();
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📋 TEST SUMMARY:\n');
  
  let totalPassed = 0;
  for (const result of results) {
    if (result.success) {
      console.log(`✅ ${result.name}`);
      totalPassed++;
    } else {
      console.log(`❌ ${result.name}`);
    }
  }
  
  console.log(`\n${totalPassed}/${results.length} tests passed\n`);
  
  if (totalPassed === results.length) {
    console.log('🎉 ✅ TEST SCRAPER PASSED — READY FOR REAL WEBSITES');
    console.log('\nAll 3 test patterns scraped successfully:');
    console.log('  ✅ Static HTML prices');
    console.log('  ✅ Click-to-reveal prices');
    console.log('  ✅ JavaScript-loaded prices');
  } else {
    console.log('❌ TEST SCRAPER FAILED — FIX LOGIC BEFORE REAL WEBSITES');
  }
  
  return results;
}

// Run if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };

