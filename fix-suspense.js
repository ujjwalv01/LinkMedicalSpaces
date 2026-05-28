const fs = require('fs');
const path = require('path');

const files = [
  'app/(auth)/signin/page.tsx',
  'app/(auth)/signup/page.tsx',
  'app/(auth)/verify-otp/page.tsx',
  'app/(dashboard)/dashboard/page.tsx',
  'app/add-listing/page.tsx',
  'app/list-your-space/page.tsx',
  'app/pricing/page.tsx',
  'app/search-spaces/page.tsx'
];

for (const file of files) {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Only process if not already wrapped
  if (content.includes('Suspense fallback=')) {
    console.log(`Skipping ${file} - already wrapped`);
    continue;
  }
  
  // Add Suspense import if missing
  if (!content.includes('Suspense')) {
    if (content.includes("from 'react'")) {
      content = content.replace(/from 'react'/, ", Suspense } from 'react'");
      content = content.replace(/\{(\s*)?(\w+)([^}]*)\}(\s*)?, Suspense \}/, '{ $1$2$3, Suspense }');
    } else {
      content = `import { Suspense } from 'react';\n` + content;
    }
  }

  // Find the default export
  const match = content.match(/export default function ([A-Za-z0-9_]+)\s*\(([^)]*)\)\s*\{/);
  if (match) {
    const functionName = match[1];
    
    // Replace export default with regular function
    content = content.replace(`export default function ${functionName}`, `function ${functionName}`);
    
    // Append the wrapper
    content += `\n\nexport default function ${functionName}Wrapper() {\n  return (\n    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>\n      <${functionName} />\n    </Suspense>\n  );\n}\n`;
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Successfully wrapped ${file}`);
  } else {
    console.log(`Could not find default export in ${file}`);
  }
}
