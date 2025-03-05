
export class DateUtils
{
  //
  // YYYY MM DD
  //

  // ---------------------------------------------------------------------------
  // ---------------------------------------------------------------------------
  static From_YYYY_MM_DD(dateStr: string): Date
  {
    const parts = dateStr.split('-');
    const year  = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const day   = parseInt(parts[2]);

    return new Date(year, month, day);
  }
  // ---------------------------------------------------------------------------
  static To_YYYY_MM_DD(date: Date): string
  {
    const year  = date.getFullYear();
    const month = date.getMonth() + 1;
    const day   = date.getDate();
    return `${year}-${month}-${day}`;
  }
}
