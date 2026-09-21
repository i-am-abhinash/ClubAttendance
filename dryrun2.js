import xlsx from 'xlsx';
const data = xlsx.utils.sheet_to_json(xlsx.readFile('teams allocation.xlsx').Sheets[xlsx.readFile('teams allocation.xlsx').SheetNames[0]]);
data.forEach(row => {
  if (!row['Regd No'] || !row['Name']) { console.log('Missing data:', row); }
  else {
    const t = (row['Team'] || '').trim().toUpperCase();
    if (!['AI','VC','IC','MK',''].includes(t)) console.log('Invalid team:', row);
  }
});
