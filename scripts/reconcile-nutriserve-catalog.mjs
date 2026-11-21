import fs from 'node:fs';
import ts from 'typescript';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('..', import.meta.url));
function readCatalog(file, variable) {
  const source = ts.createSourceFile(file, fs.readFileSync(root + file, 'utf8'), ts.ScriptTarget.Latest, true);
  let init;
  function find(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(source) === variable) init = node.initializer;
    ts.forEachChild(node, find);
  }
  find(source);
  if (!init) throw new Error('Missing ' + variable);
  const values = [];
  function walk(node) {
    if (ts.isObjectLiteralExpression(node)) {
      const props = new Map(node.properties.filter(ts.isPropertyAssignment).map(p => [p.name.getText(source), p.initializer]));
      if (props.has('id')) {
        const id = props.get('id');
        if (!ts.isStringLiteral(id)) throw new Error('Nonliteral ID');
        const label = props.get('label') || props.get('name');
        values.push({ id: id.text, label: label && ts.isStringLiteral(label) ? label.text : id.text });
      }
    }
    ts.forEachChild(node, walk);
  }
  walk(init);
  if (new Set(values.map(v => v.id)).size !== values.length) throw new Error('Duplicate ID');
  return values;
}
const manifest = JSON.parse(fs.readFileSync(root + 'public/assets/nutriserve/manifest.json'));
const ready = new Set(manifest.characters.map(c => c.id));
const surfacePath = root + 'public/assets/nutriserve/food/manifest.json';
const surfaces = fs.existsSync(surfacePath) ? JSON.parse(fs.readFileSync(surfacePath)).assets : [];
const acceptedTops = new Set(surfaces.filter(a => a.id !== 'katori' && a.review.status === 'accepted-pilot-top').map(a => a.id));
const foods = readCatalog('services/nutriServeFoodData.ts', 'FOOD_LIBRARY');
const customers = readCatalog('services/nutriserveCharacters.ts', 'CUSTOMER_CHARACTERS');
for (const id of ready) if (!customers.some(c => c.id === id)) throw new Error('Unknown accepted sprite ' + id);
for (const id of acceptedTops) if (!foods.some(f => f.id === id)) throw new Error('Unknown accepted food surface ' + id);
const roadmap = {
  sourceFiles: ['services/nutriServeFoodData.ts', 'services/nutriserveCharacters.ts'].map(p => ({ path: p, sha256: crypto.createHash('sha256').update(fs.readFileSync(root + p)).digest('hex') })),
  method: 'TypeScript AST of exact exported array initializers; unrelated tips excluded',
  counts: { foodIds: foods.length, customerIds: customers.length, acceptedIdleSprites: ready.size },
  foods: foods.map(f => ({ ...f, status: acceptedTops.has(f.id) ? 'partial-top-surface' : 'planned-remaster', acceptedStates: acceptedTops.has(f.id) ? ['finish-top-surface'] : [], requiredStates: ['library-icon', 'recipe-dependent-serving-layers'], note: 'Top-surface acceptance does not complete side views or library icons. Existing legacy art is not counted as accepted remaster art' })),
  customers: customers.map(c => ({ ...c, idleStatus: ready.has(c.id) ? 'accepted-pilot-idle' : 'planned', reactionStates: 'planned', walkStates: 'planned' })),
};
fs.writeFileSync(root + 'docs/nutriserve/asset-roadmap.json', JSON.stringify(roadmap, null, 2) + '\n');
console.log(roadmap.counts);
