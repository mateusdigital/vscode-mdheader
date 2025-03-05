
//
// Imports
//

// -----------------------------------------------------------------------------
import fs from 'fs';
import path from 'path';
import {execSync} from 'child_process';
// -----------------------------------------------------------------------------
import {DateUtils} from './DateUtils';

//
//
//

// -----------------------------------------------------------------------------
export class GitUtils
{
  // -----------------------------------------------------------------------------
  static GetInitialFileDate(filename: string): Date
  {
    const dirname = path.dirname(filename);
    const cmd     = [
      'git',
      '-C',
      dirname,
      'log',
      '--format=%ad',
      '--date=iso',
      '--reverse',
      '--',
      filename
    ].join(' ');

    // @XXX: Make this Date object....
    const stdout = execSync(cmd);

    const log      = stdout.toString();
    const date_str = log.split(' ')[0];
    const date     = DateUtils.From_YYYY_MM_DD(date_str);

    return date;
  }

  // -----------------------------------------------------------------------------
  static GetRoot(filename: string): string
  {
    const dirname = path.dirname(filename);
    const cmd     = `git -C ${dirname} rev-parse --git-dir`;
    try {
      const stdout = execSync(cmd);
      const log    = stdout.toString();

      const project_dir  = path.dirname(log);
      const project_name = path.basename(project_dir);

      return project_name;
    }
    catch (error) {
      const project_name = path.basename(dirname);
      return project_name;
    }
  }
}
