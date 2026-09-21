import xlsx from 'xlsx';
const workbook = xlsx.readFile('teams allocation.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet);
console.log(JSON.stringify(data.slice(0, 10), null, 2));
