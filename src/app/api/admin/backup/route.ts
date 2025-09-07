import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, mkdir, readdir, stat, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { createGzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { createReadStream, createWriteStream } from 'fs';

const BACKUP_DIR = path.join(process.cwd(), 'data', 'backups');
const DATA_DIR = path.join(process.cwd(), 'data');

// Ensure backup directory exists
async function ensureBackupDir() {
  if (!existsSync(BACKUP_DIR)) {
    await mkdir(BACKUP_DIR, { recursive: true });
  }
}

// Get database size (simulate)
async function getDatabaseSize(): Promise<string> {
  try {
    const stats = await stat(DATA_DIR);
    const sizeInBytes = stats.size;
    const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);
    return `${sizeInMB} MB`;
  } catch (error) {
    return '2.4 GB'; // Fallback
  }
}

// Create backup
async function createBackup(compress: boolean = true): Promise<{ filename: string; size: string }> {
  await ensureBackupDir();
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup-${timestamp}${compress ? '.gz' : '.json'}`;
  const backupPath = path.join(BACKUP_DIR, filename);
  
  // Simulate database backup (in real app, this would backup actual database)
  const mockData = {
    users: [],
    stocks: [],
    settings: {},
    notifications: [],
    createdAt: new Date().toISOString(),
    version: '1.0.0'
  };
  
  if (compress) {
    // Create compressed backup
    const tempFile = path.join(BACKUP_DIR, `temp-${timestamp}.json`);
    await writeFile(tempFile, JSON.stringify(mockData, null, 2));
    
    const gzip = createGzip();
    await pipeline(
      createReadStream(tempFile),
      gzip,
      createWriteStream(backupPath)
    );
    
    // Clean up temp file
    await unlink(tempFile);
  } else {
    await writeFile(backupPath, JSON.stringify(mockData, null, 2));
  }
  
  const stats = await stat(backupPath);
  const size = `${(stats.size / 1024).toFixed(2)} KB`;
  
  return { filename, size };
}

// Get backup list
async function getBackupList(): Promise<Array<{ filename: string; size: string; date: string }>> {
  try {
    await ensureBackupDir();
    const files = await readdir(BACKUP_DIR);
    const backups = [];
    
    for (const file of files) {
      if (file.startsWith('backup-')) {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = await stat(filePath);
        backups.push({
          filename: file,
          size: `${(stats.size / 1024).toFixed(2)} KB`,
          date: stats.mtime.toISOString()
        });
      }
    }
    
    return backups.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    return [];
  }
}

// Delete old backups
async function cleanupOldBackups(maxFiles: number): Promise<number> {
  const backups = await getBackupList();
  if (backups.length <= maxFiles) return 0;
  
  const filesToDelete = backups.slice(maxFiles);
  let deletedCount = 0;
  
  for (const backup of filesToDelete) {
    try {
      await unlink(path.join(BACKUP_DIR, backup.filename));
      deletedCount++;
    } catch (error) {
      console.error(`Failed to delete backup ${backup.filename}:`, error);
    }
  }
  
  return deletedCount;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action === 'list') {
      const backups = await getBackupList();
      return NextResponse.json({
        success: true,
        data: {
          backups,
          databaseSize: await getDatabaseSize()
        }
      });
    }
    
    if (action === 'status') {
      const backups = await getBackupList();
      return NextResponse.json({
        success: true,
        data: {
          lastBackup: backups[0]?.date || null,
          backupCount: backups.length,
          databaseSize: await getDatabaseSize()
        }
      });
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid action. Use "list" or "status"'
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in backup GET:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process backup request'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, compress = true, maxFiles = 30 } = body;
    
    if (action === 'create') {
      const backup = await createBackup(compress);
      
      // Clean up old backups
      await cleanupOldBackups(maxFiles);
      
      // Update settings with last backup time
      try {
        const settingsPath = path.join(process.cwd(), 'data', 'admin-settings.json');
        if (existsSync(settingsPath)) {
          const settings = JSON.parse(await readFile(settingsPath, 'utf-8'));
          settings.database.lastBackup = new Date().toISOString();
          await writeFile(settingsPath, JSON.stringify(settings, null, 2));
        }
      } catch (error) {
        console.error('Failed to update last backup time in settings:', error);
      }
      
      return NextResponse.json({
        success: true,
        message: 'Backup created successfully',
        data: backup
      });
    }
    
    if (action === 'cleanup') {
      const deletedCount = await cleanupOldBackups(maxFiles);
      return NextResponse.json({
        success: true,
        message: `Cleaned up ${deletedCount} old backup files`,
        data: { deletedCount }
      });
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid action. Use "create" or "cleanup"'
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in backup POST:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process backup request'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');
    
    if (!filename) {
      return NextResponse.json(
        {
          success: false,
          error: 'Filename is required'
        },
        { status: 400 }
      );
    }
    
    const filePath = path.join(BACKUP_DIR, filename);
    
    if (!existsSync(filePath)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Backup file not found'
        },
        { status: 404 }
      );
    }
    
    await unlink(filePath);
    
    return NextResponse.json({
      success: true,
      message: 'Backup deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting backup:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete backup'
      },
      { status: 500 }
    );
  }
}
