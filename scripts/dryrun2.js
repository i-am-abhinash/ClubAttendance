import xlsx from 'xlsx';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const excelPath = path.resolve(__dirname, '../teams allocation.xlsx');

const data = xlsx.utils.sheet_to_json(xlsx.readFile(excelPath).Sheets[xlsx.readFile(excelPath).SheetNames[0]]);
data.forEach(row => {
  if (!row['Regd No'] || !row['Name']) { console.log('Missing data:', row); }
  else {
    const t = (row['Team'] || '').trim().toUpperCase();
    if (!['AI','VC','IC','MK',''].includes(t)) console.log('Invalid team:', row);
  }
});
