const fs = require('fs');

// Segunda passagem: textos que ainda ficaram muito claros
const replacements = [
  // Labels muted que ficaram muito esmaecidos
  [/\btext-slate-400\b/g, 'text-gray-600'],
  [/\btext-slate-500\b/g, 'text-gray-600'],
  [/\btext-gray-500\b/g, 'text-gray-600'],
  // Textos de labels pequenos uppercase (eram text-slate-600 uppercase)
  [/\btext-blue-400\b(?=.*uppercase)/g, 'text-blue-700'],
  // Placeholders e textos "vazios" 
  [/\btext-slate-300\b/g, 'text-gray-500'],
  // Ícones que ficaram muito claros
  [/\btext-sky-300\b/g, 'text-sky-600'],
  [/\btext-sky-400\b/g, 'text-sky-700'],
  [/\btext-blue-300\b/g, 'text-blue-600'],
  [/\btext-blue-400\b/g, 'text-blue-700'],
  // Títulos de seção que eram text-blue-400 (tab labels etc)
  [/\btext-indigo-400\b/g, 'text-indigo-700'],
  [/\btext-purple-400\b/g, 'text-purple-700'],
  [/\btext-green-400\b/g, 'text-green-700'],
  [/\btext-orange-400\b/g, 'text-orange-600'],
  [/\btext-yellow-400\b/g, 'text-yellow-700'],
  [/\btext-red-400\b/g, 'text-red-600'],
  [/\btext-emerald-400\b/g, 'text-emerald-700'],
  [/\btext-teal-400\b/g, 'text-teal-700'],
  [/\btext-cyan-400\b/g, 'text-cyan-700'],
  [/\btext-amber-400\b/g, 'text-amber-700'],
  [/\btext-pink-400\b/g, 'text-pink-700'],
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  for (const [pattern, replacement] of replacements) {
    const before = content;
    content = content.replace(pattern, replacement);
    if (content !== before) changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated: ${filePath}`);
  } else {
    console.log(`⏭  No changes: ${filePath}`);
  }
}

const files = [
  'views/DashboardAdmin.tsx',
  'views/DashboardProfessor.tsx',
  'views/DashboardAluno.tsx',
  'views/Auth.tsx',
  'views/Landing.tsx',
  'views/APPoints.tsx',
  'components/Navbar.tsx',
  'src/components/BannerPopup.tsx',
  'src/components/GlobalChat.tsx',
  'src/pages/ProfileSetup.tsx',
];

for (const f of files) {
  if (fs.existsSync(f)) processFile(f);
  else console.log(`❌ Not found: ${f}`);
}
console.log('\n✨ Contraste de texto otimizado!');
