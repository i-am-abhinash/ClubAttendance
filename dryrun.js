import xlsx from 'xlsx';
const workbook = xlsx.readFile('teams allocation.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet);
let ai = 0, vc = 0, ic = 0, mk = 0, ext = 0, errors = 0;
data.forEach(row => {
  if (!row['Regd No'] || !row['Name']) { errors++; return; }
  const t = (row['Team'] || '').trim().toUpperCase();
  if (t === 'AI') ai++;
  else if (t === 'VC') vc++;
  else if (t === 'IC') ic++;
  else if (t === 'MK') mk++;
  else if (t === '') ext++;
  else errors++;
});
console.log(`Rows: ${data.length}, AI: ${ai}, VC: ${vc}, IC: ${ic}, MK: ${mk}, Ext: ${ext}, Errors: ${errors}`);
