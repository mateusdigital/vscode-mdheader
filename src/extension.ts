
//
// Imports
//

// -----------------------------------------------------------------------------
import path from "path";
import os, { UserInfo } from "os";
// -----------------------------------------------------------------------------
import * as vscode from "vscode";
// -----------------------------------------------------------------------------
import { VSCodeUtils }  from "../libs/lib-mdViseu/mdViseu/VSUtils";
import { GitUserInfo, GitUtils } from "../libs/lib-mdViseu/mdViseu/GitUtils";
import { DateUtils } from "../libs/lib-mdViseu/mdViseu/DateUtils";
import { FSUtils } from "../libs/lib-mdViseu/mdViseu/FSUtils";
import { ErrorUtils } from "../libs/lib-mdViseu/mdViseu/ErrorUtils";
import { CommentInfo, CommentUtils } from "../libs/lib-mdViseu/mdViseu/CommentUtils";

//
// Public Functions
//

// -----------------------------------------------------------------------------
export function activate(context: vscode.ExtensionContext) {
  // ---------------------------------------------------------------------------
  const disposable = vscode.commands.registerCommand(
    'mdheader.addHeader', () => { _AddHeader(); }
  );

  context.subscriptions.push(disposable);
}

// -----------------------------------------------------------------------------
export function deactivate() { }

//
// Private Functions
//

// -----------------------------------------------------------------------------
function _AddHeader() {

  // Get the file info
  const filepath = VSCodeUtils.GetActiveTextEditorFilePath();
  if (!filepath) {
    ErrorUtils.ShowErrorToUser("No active editor found.");
    return;
  }

  // Get the project info.
  const git_root = GitUtils.GetRoot(filepath);
  const user_info = _GetUserInfo(filepath, git_root);
  const project_name = path.basename((git_root) ? git_root : filepath);
  const file_date = _GetDateFromFile(filepath);

  const comment_info = CommentUtils.CreateCommentInfo(VSCodeUtils.ActiveEditor());
  if (!comment_info) {
    ErrorUtils.ShowErrorToUser("Failed to retrieve comment information.");
    return;
  }

  //
  const header_str = _CreateHeader(
    filepath,
    project_name,
    file_date,
    comment_info,
    user_info
  );

  //
  VSCodeUtils.ActiveEditor().edit(edit_builder => {
    edit_builder.insert(new vscode.Position(0, 0), header_str);
  });
}

//
// Header Creation Functions
//

// -----------------------------------------------------------------------------
function _CreateHeader(
  filepath: string,
  projectName: string,
  fileDate: Date,
  commentInfo: CommentInfo,
  user_info: GitUserInfo
): string {
  const MAX_COLUMNS = 80;
  const HEADER_TEMPLATE = _GetSelectedHeaderTemplate();
  const copyright_year = _CalculateCopyrightYear(fileDate);

  const edge_options = { maxColumns: MAX_COLUMNS, fill: "-", padLeft: true, padRight: true, preferSingleLineComments: true };
  const inner_options = { maxColumns: MAX_COLUMNS, fill: " ", padLeft: false, padRight: true, preferSingleLineComments: true };

  //
  const edge_line = CommentUtils.SurroundWithComments(commentInfo, "", edge_options);

  const header_lines: string[] = [];
  header_lines.push(edge_line);

  for (let i = 0; i < HEADER_TEMPLATE.length; ++i) {
    const line = HEADER_TEMPLATE[i];
    const replaced_line = line
      .replace('FILENAME', path.basename(filepath))
      .replace('PROJECT', projectName)
      .replace('DATE', DateUtils.To_YYYY_MM_DD(fileDate))
      .replace('YEAR', copyright_year)
      .replace("USER_NAME", user_info.name)
      .replace("USER_EMAIL", user_info.email)
      ;

    const commented_line = CommentUtils.SurroundWithComments(
      commentInfo,
      replaced_line,
      inner_options
    );

    header_lines.push(commented_line);
  }

  header_lines.push(edge_line);
  return header_lines.join("\n") + "\n\n";
}


// -----------------------------------------------------------------------------
function _CalculateCopyrightYear(fileDate: Date): string {
  const year = fileDate.getFullYear();
  const curr_year = new Date().getFullYear();

  if (year == curr_year) {
    return year.toString();
  }

  return `${year} - ${curr_year}`;
}

// -----------------------------------------------------------------------------
function _GetDateFromFile(filepath: string) {
  let file_date = GitUtils.GetInitialFileDate(filepath);
  if (!file_date) {
    file_date = FSUtils.GetFileCreationDate(filepath);
  }
  if (!file_date) {
    file_date = new Date();
  }
  return file_date
}

// -----------------------------------------------------------------------------
function _GetSelectedHeaderTemplate(): Array<string> {
  const str = ( ""
    + "  File      : FILENAME \n"
    + "  Project   : PROJECT  \n"
    + "  Date      : DATE     \n"
    + "  Copyright : YEAR     \n"
    + "  Copyright : USER_NAME <USER_EMAIL>"
  ).split("\n");

  return str;
}


// -----------------------------------------------------------------------------
function _GetUserInfo(filepath: string, gitRoot: string | null): GitUserInfo {
  if (gitRoot) {
    return GitUtils.GetUserInfo(gitRoot);
  }

  return { name: os.userInfo().username, email: "" };
}
