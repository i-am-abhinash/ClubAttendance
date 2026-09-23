import React, { useState, useRef } from 'react';
import * as xlsx from 'xlsx';
import { UploadCloud, CheckCircle, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';

const AttendanceImport = () => {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const fileInputRef = useRef();

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError('');
    setResult(null);
    setPreview(null);
    setLoading(true);

    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = xlsx.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

      if (rows.length === 0) {
        throw new Error("The Excel file is empty.");
      }

      const headers = Object.keys(rows[0]);
      
      const regdKey = headers.find(h => h.toLowerCase().includes('regd no') || h.toLowerCase() === 'regdno');
      if (!regdKey) {
        throw new Error("Could not find a 'Regd No' column in the Excel file.");
      }

      // Detect date columns (assume keys that parse to a valid date or look like dates)
      const dateColumns = headers.filter(h => {
        if (h === regdKey || h.toLowerCase().includes('name') || h.toLowerCase().includes('branch') || h.toLowerCase().includes('team') || h.toLowerCase().includes('percentage')) return false;
        // Simple check: if it can be parsed as a date
        const parsed = new Date(h);
        return !isNaN(parsed.getTime());
      });

      if (dateColumns.length === 0) {
        throw new Error("Could not find any date columns for attendance.");
      }

      // Fetch all users to match by Regd No
      const usersSnap = await getDocs(collection(db, 'users'));
      const dbUsers = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      let matched = 0;
      let notFound = 0;
      let presentCount = 0;
      let absentCount = 0;
      
      const parsedRecords = [];
      const notFoundList = [];

      rows.forEach(row => {
        const rawRegd = row[regdKey]?.toString().trim().toUpperCase();
        if (!rawRegd) return;

        const matchedUser = dbUsers.find(u => u.regdNo?.toUpperCase() === rawRegd);
        if (!matchedUser) {
          notFound++;
          notFoundList.push(rawRegd);
          return;
        }

        matched++;

        dateColumns.forEach(dateCol => {
          const val = row[dateCol];
          if (val === true || (typeof val === 'string' && val.trim().toLowerCase() === 'true')) {
            presentCount++;
            parsedRecords.push({
              userId: matchedUser.id,
              teamId: matchedUser.teamId || null,
              dateStr: format(new Date(dateCol), 'yyyy-MM-dd'),
              status: 'Present'
            });
          } else if (val === false || (typeof val === 'string' && val.trim().toLowerCase() === 'false')) {
            absentCount++;
            parsedRecords.push({
              userId: matchedUser.id,
              teamId: matchedUser.teamId || null,
              dateStr: format(new Date(dateCol), 'yyyy-MM-dd'),
              status: 'Absent'
            });
          }
        });
      });

      setPreview({
        totalExcelRows: rows.length,
        matched,
        notFound,
        notFoundList,
        dateColumnsCount: dateColumns.length,
        presentCount,
        absentCount,
        parsedRecords
      });

    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to parse Excel file.");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!preview || !preview.parsedRecords.length) return;
    
    setLoading(true);
    setError('');
    
    try {
      const recordsToProcess = preview.parsedRecords;
      
      // We need to fetch existing attendance to see what to update/create
      const attendanceSnap = await getDocs(collection(db, 'attendance'));
      const existingRecords = new Map();
      attendanceSnap.docs.forEach(d => {
        existingRecords.set(d.id, d.data());
      });

      let created = 0;
      let updated = 0;
      let unchanged = 0;
      
      const batches = [];
      let currentBatch = writeBatch(db);
      let opCount = 0;

      recordsToProcess.forEach(record => {
        const recordId = `${record.userId}_${record.dateStr}`;
        const existing = existingRecords.get(recordId);

        if (!existing) {
          // Create
          const docRef = doc(db, 'attendance', recordId);
          currentBatch.set(docRef, {
            userId: record.userId,
            teamId: record.teamId,
            date: record.dateStr,
            status: record.status,
            markedBy: user.uid,
            markedAt: new Date().toISOString()
          });
          created++;
          opCount++;
        } else if (existing.status !== record.status) {
          // Update
          const docRef = doc(db, 'attendance', recordId);
          currentBatch.update(docRef, {
            status: record.status,
            markedBy: user.uid,
            markedAt: new Date().toISOString()
          });
          updated++;
          opCount++;
        } else {
          // Unchanged
          unchanged++;
        }

        if (opCount >= 450) { // Firestore batch limit is 500
          batches.push(currentBatch);
          currentBatch = writeBatch(db);
          opCount = 0;
        }
      });

      if (opCount > 0) {
        batches.push(currentBatch);
      }

      for (const batch of batches) {
        await batch.commit();
      }

      setResult({
        created,
        updated,
        unchanged,
        notFound: preview.notFound,
        studentsProcessed: preview.matched
      });
      setPreview(null);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

    } catch (err) {
      console.error(err);
      setError("An error occurred during update: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-theme-border-subtle p-6 bg-theme-surface/50 flex items-center gap-3">
        <FileSpreadsheet className="w-5 h-5 text-theme-accent" />
        <h3 className="text-lg font-bold text-theme-primary">Attendance Data Import</h3>
      </div>
      
      <div className="p-6">
        <p className="text-sm text-theme-text-secondary mb-6">
          Upload an Excel file to synchronize attendance records. Only TRUE (Present) and FALSE (Absent) values in date columns will be processed. Blank cells are ignored.
        </p>

        {error && (
          <div className="bg-theme-absent-bg text-theme-absent p-4 rounded-xl text-sm border border-theme-absent/20 font-medium mb-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div>{error}</div>
          </div>
        )}

        {result && (
          <div className="bg-theme-present-bg text-theme-present p-5 rounded-xl border border-theme-present/20 mb-6">
            <div className="flex items-center gap-3 font-bold text-lg mb-4">
              <CheckCircle className="w-6 h-6" />
              Attendance Update Completed
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm font-medium">
              <div>Students Processed: <span className="font-bold">{result.studentsProcessed}</span></div>
              <div>Records Created: <span className="font-bold">{result.created}</span></div>
              <div>Records Updated: <span className="font-bold">{result.updated}</span></div>
              <div>Records Unchanged: <span className="font-bold">{result.unchanged}</span></div>
              <div>Students Not Found: <span className="font-bold">{result.notFound}</span></div>
              <div>Invalid Records: <span className="font-bold">0</span></div>
            </div>
          </div>
        )}

        {!preview ? (
          <div>
            <input 
              type="file" 
              accept=".xlsx, .xls"
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="w-full border-2 border-dashed border-theme-border hover:border-theme-accent hover:bg-theme-accent/5 rounded-xl p-8 flex flex-col items-center justify-center gap-3 transition-colors text-theme-text-secondary"
            >
              <UploadCloud className="w-8 h-8" />
              <span className="font-medium">{loading ? 'Processing file...' : 'Select Excel File'}</span>
              <span className="text-xs">.xlsx formats only</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-5 border border-theme-border rounded-xl bg-theme-surface-elevated">
              <h4 className="font-bold text-theme-primary mb-4 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-theme-muted" /> 
                Attendance Import Preview
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm text-theme-text-secondary mb-4">
                <div>Students in Excel: <span className="font-bold text-theme-primary">{preview.totalExcelRows}</span></div>
                <div>Matched Members: <span className="font-bold text-theme-primary">{preview.matched}</span></div>
                <div>Not Found: <span className="font-bold text-theme-absent">{preview.notFound}</span></div>
                <div>Dates Found: <span className="font-bold text-theme-primary">{preview.dateColumnsCount}</span></div>
                <div>Present Records: <span className="font-bold text-theme-present">{preview.presentCount}</span></div>
                <div>Absent Records: <span className="font-bold text-theme-absent">{preview.absentCount}</span></div>
              </div>
              
              {preview.notFound > 0 && (
                <div className="text-xs text-theme-text-secondary bg-theme-bg p-3 rounded-lg border border-theme-border">
                  <span className="font-bold text-theme-absent">Missing Regd Nos:</span> {preview.notFoundList.slice(0, 10).join(', ')}
                  {preview.notFoundList.length > 10 ? ' ...' : ''}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={handleUpdate}
                disabled={loading}
                className="btn-primary flex-1"
              >
                {loading ? 'Updating Firestore...' : 'Update Attendance'}
              </button>
              <button 
                onClick={() => {
                  setPreview(null);
                  setFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl font-bold text-sm bg-theme-surface-higher text-theme-text hover:bg-theme-surface-elevated border border-theme-border transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceImport;
