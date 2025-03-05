import fs from 'fs';

// -----------------------------------------------------------------------------
export class FSUtils
{
  static GetFileCreationDate(filename: string): Date
  {
    const stats = fs.statSync(filename);
    const date  = stats.birthtime;
    return date;
  }
}
