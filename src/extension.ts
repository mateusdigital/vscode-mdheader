
//
// Imports
//

// -----------------------------------------------------------------------------
import path from "path";
import * as vscode from "vscode";
// -----------------------------------------------------------------------------
import {DateUtils} from "./DateUtils";
import {FSUtils} from "./FSUtils";
import {GitUtils} from "./GitUtils";
import {VSCodeUtils, ICommentInfo} from "./VSCodeUtils";

//
// Public Functions
//

// -----------------------------------------------------------------------------
export function activate(context: vscode.ExtensionContext)
{
  // ---------------------------------------------------------------------------
  const disposable = vscode.commands.registerCommand(
    'mdheader.addHeader', () => { _AddHeader(); }
  );

  context.subscriptions.push(disposable);
}

// -----------------------------------------------------------------------------
export function deactivate() {}

//
// Private Functions
//

// -----------------------------------------------------------------------------
function _AddHeader()
{
  const curr_editor = vscode.window.activeTextEditor;
  if (!curr_editor) {
    return;
  }

  // Get the file info
  const uri      = curr_editor.document.uri;
  const filepath = uri.fsPath;
  const filename = path.basename(filepath);

  // Get the project info.
  const git_root     = GitUtils.GetRoot(filepath);
  const project_name = path.basename(git_root);

  // Get the date info.
  let file_date = GitUtils.GetInitialFileDate(filepath);
  if (!file_date) {
    file_date = FSUtils.GetFileCreationDate(filepath);
  }
  if (!file_date) {
    file_date = new Date();
  }

  // Get the comment info.
  const language_id  = curr_editor.document.languageId;
  const comment_info = VSCodeUtils.GetCommentInfo(language_id);
  if (!comment_info) {
    return;
  }

  //
  const header_arr =
    _CreateHeader(filename, project_name, file_date, comment_info);

  const header_str = header_arr.join('\n');

  //
  curr_editor.edit(edit_builder => {
    edit_builder.insert(new vscode.Position(0, 0), header_str);
  });
}

//
// Header Creation Functions
//

// -----------------------------------------------------------------------------
function _CreateHeader(
  filename: string,
  projectName: string,
  fileDate: Date,
  commentInfo: ICommentInfo
)
{
  const copyright_year = _CalculateCopyrightYear(fileDate);

  //
  const comment_start = (commentInfo.lineComment) ? commentInfo.lineComment
                                                  : commentInfo.blockComment[0];
  const comment_end   = (commentInfo.lineComment) ? commentInfo.lineComment
                                                  : commentInfo.blockComment[1];

  const comment_length = (comment_start.length + comment_end.length);

  //
  const MAX_COLUMNS = 80;
  const BORDER_LINE =
    comment_start + '-'.repeat(MAX_COLUMNS - comment_length) + comment_end;

  //
  const value = [];
  value.push(BORDER_LINE);

  const HEADER_TEMPLATE = "";
  for (let i = 0; i < HEADER_TEMPLATE.length; ++i) {
    const line          = HEADER_TEMPLATE[i];
    const replaced_line = line.replace('FILENAME', filename)
                            .replace('PROJECT', projectName)
                            .replace('DATE', DateUtils.To_YYYY_MM_DD(fileDate))
                            .replace('YEAR', copyright_year);

    const fill =
      ' '.repeat(MAX_COLUMNS - (comment_length + replaced_line.length));
    const filled_line = `${comment_start}${replaced_line}${fill}${comment_end}`;

    value.push(filled_line);
  }

  value.push(BORDER_LINE);
  value.push('');

  return value;
}

// -----------------------------------------------------------------------------
function _CalculateCopyrightYear(fileDate: Date): string
{
  const year      = fileDate.getFullYear();
  const curr_year = new Date().getFullYear();

  if (year == curr_year) {
    return year.toString();
  }

  return `${year} - ${curr_year}`;
}
