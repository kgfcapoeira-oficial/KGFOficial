const fs = require('fs');
const path = require('path');

const filesToRebrand = [
  'views/DashboardAdmin.tsx',
  'views/DashboardProfessor.tsx',
  'views/DashboardAluno.tsx',
  'views/APPoints.tsx',
  'App.tsx'
];

const replacements = [
  { from: /bg-stone-900/g, to: 'bg-slate-950' },
  { from: /bg-stone-950/g, to: 'bg-slate-950' },
  { from: /bg-stone-800/g, to: 'bg-slate-900' },
  { from: /bg-stone-700/g, to: 'bg-slate-800' },
  { from: /border-stone-800/g, to: 'border-blue-900/30' },
  { from: /border-stone-700/g, to: 'border-blue-800/20' },
  { from: /text-orange-500/g, to: 'text-blue-400' },
  { from: /text-orange-600/g, to: 'text-blue-500' },
  { from: /from-orange-600 to-red-600/g, to: 'from-blue-700 to-blue-600' },
  { from: /from-orange-500 to-red-500/g, to: 'from-blue-600 to-blue-500' },
  { from: /focus:border-orange-500/g, to: 'focus:border-blue-500' },
  { from: /hover:bg-stone-800/g, to: 'hover:bg-slate-800' },
  { from: /hover:text-orange-500/g, to: 'hover:text-blue-400' }
];

filesToRebrand.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    replacements.forEach(rep => {
      content = content.replace(rep.from, rep.to);
    });
    fs.writeFileSync(filePath, content);
    console.log(`Rebranded ${file} successfully.`);
  }
});
