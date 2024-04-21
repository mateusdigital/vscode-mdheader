
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
//
const vscode = require("vscode");

//
// Public Methods
//

// -----------------------------------------------------------------------------
function activate(context)
{
  const disposable = vscode.commands.registerCommand("mdheader.addHeader", ()=>{
    const curr_editor = vscode.window.activeTextEditor;
    if(!curr_editor) {
      return;
    }

    // Get the file info
    const uri      = curr_editor.document.uri;
    const filepath = uri.fsPath;
    const filename = path.basename(filepath);

    // Get the project info.
    const project_name = _GetGitFolderName(filepath);

    // Get the date info.
    let file_date =  _GetGitFileDate(filepath);
    if(!file_date) {
      file_date = _GetFSFileDate(filepath);
    }
    if(!file_date) {
      file_date = _GetCurrentDate();
    }

    // Get the comment info.
    const language_id = curr_editor.document.languageId;
    const comment     = _GetCommentForLanguage(language_id);
    if(!comment) {
      return;
    }

    const header_arr = _CreateHeader(
      filename,
      project_name,
      file_date,
      comment
    );

    const header_str = header_arr.join("\n");

    curr_editor.edit(edit_builder => {
      edit_builder.insert(new vscode.Position(0, 0), header_str);
    });
  });



  context.subscriptions.push(disposable);
}

// -----------------------------------------------------------------------------
function deactivate()
{

}

async function asyncToSync(asyncFn, ...args) {
  try {
      return await asyncFn(...args);
  } catch (error) {
      throw error;
  }
}

//
// Private methods
//
// -----------------------------------------------------------------------------
function _GetGitFileDate(filename)
{
  const dirname = path.dirname(filename);
  const cmd = [
    "git",
    "-C", dirname,
    "log",
    "--format=%ad",
    "--date=iso",
    "--reverse",
    "--", filename
  ].join(" ");

  console.log(cmd);

  try {
    const stdout = execSync(cmd);
    const log    = stdout.toString();
    const date   = log.split(" ")[0];
    return date;
  } catch(error) {
    return null;
  }
}

// -----------------------------------------------------------------------------
function _GetFSFileDate(filename)
{
  try {
    const stats = fs.statSync(filename);
    const date = stats.birthtime;

    return _DateToStr(date);
  } catch(error) {
    return null;
  }
}

// -----------------------------------------------------------------------------j
function _GetCurrentDate()
{
  const date = new Date();
  return _DateToStr(date);
}

// -----------------------------------------------------------------------------
function _DateToStr(date)
{
  const year  = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day   = (date.getDate()).toString().padStart(2, "0");

  const str = `${year}-${month}-${day}`;
  return str;
}

function _GetGitFolderName(filename)
{
  const dirname = path.dirname(filename);
  const cmd = `git -C ${dirname} rev-parse --git-dir`;
  try {
    const stdout = execSync(cmd);
    const log    = stdout.toString();

    const project_dir  = path.dirname(log);
    const project_name = path.basename(project_dir);

    return project_name;
  } catch(error) {
    return null;
  }
}



// -----------------------------------------------------------------------------
function _GetCommentForLanguage(languageId)
{
  const rules = {
    "c":          { lineComment: "//", blockComment: ["/*", "*/"] },
    "cpp":        { lineComment: "//", blockComment: ["/*", "*/"] },
    "css":        { lineComment: null, blockComment: ["/*", "*/"] },
    "javascript": { lineComment: "//", blockComment: ["/*", "*/"] },
    "typescript": { lineComment: "//", blockComment: ["/*", "*/"] },
    "python":     { lineComment: "##", blockComment: null },
    "shellscript":{ lineComment: "##", blockComment: null },
  }

  const comment = rules[languageId];
  if(!comment) {
    return null;
  }

  return comment;
}


//
// Header Creation Functions
//

// -----------------------------------------------------------------------------
const HEADER_TEMPLATE = [
  "                               *       +",
  "                         '                  |",
  "                     ()    .-.,=\"``\"=.    - o -",
  "                           '=/_       \\     |",
  "                        *   |  '=._    |",
  "                             \\     `=./`,        '",
  "                          .   '=.__.=' `='      *",
  "                 +                         +",
  "                      O      *        '       .",
  "",
  "  File      : FILENAME",
  "  Project   : PROJECT",
  "  Date      : DATE",
  "  License   : See project's COPYING.TXT for full info.",
  "  Author    : mateus.digital <hello@mateus.digital>",
  "  Copyright : mateus.digital - YEAR",
  "",
  "  Description :",
  "",
];

// -----------------------------------------------------------------------------
function _CreateHeader(filename, project_name, file_date, comment)
{
  const copyright_year = _CalculateCopyrightYear(file_date);

  const comment_start = (comment.lineComment) ? comment.lineComment : comment.blockComment[0];
  const comment_end   = (comment.lineComment) ? comment.lineComment : comment.blockComment[1];
  const comment_len   = (comment_start.length + comment_end.length);

  const MAX_COLUMNS = 80;
  const border_line = comment_start + "-".repeat(MAX_COLUMNS - comment_len) + comment_end;

  const value = [];
  value.push(border_line);

  for(let i = 0; i < HEADER_TEMPLATE.length; ++i) {
    const line = HEADER_TEMPLATE[i];
    const replaced_line = line
    .replace("FILENAME", filename)
    .replace("PROJECT", project_name)
    .replace("DATE", file_date)
    .replace("YEAR", copyright_year);

    const fill = " ".repeat(MAX_COLUMNS - (comment_len + replaced_line.length));
    const filled_line = `${comment_start}${replaced_line}${fill}${comment_end}`;

    value.push(filled_line);
  }

  value.push(border_line);
  value.push("");
  return value;
}

// -----------------------------------------------------------------------------
function _CalculateCopyrightYear(file_date)
{
  const year = file_date.split("-")[0];
  const curr_year = new Date().getFullYear();

  if(year == curr_year) {
    return year;
  }

  return `${year} - ${curr_year}`;
}


// -----------------------------------------------------------------------------
module.exports = {
  activate,
  deactivate
}
