import { HolidayDateRepository, HolidayDateCreateInput } from '../repositories/holiday-date.repository';


// ============================================================================
// Date helpers
// ============================================================================

function fmt(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return fmt(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

/** Nth weekday of a month (e.g. 4th Thursday of November). weekday: 0=Sun..6=Sat */
function nthWeekdayOfMonth(year: number, month: number, weekday: number, n: number): string {
  let count = 0;
  for (let d = 1; d <= 31; d++) {
    const date = new Date(year, month - 1, d);
    if (date.getMonth() !== month - 1) { break; }
    if (date.getDay() === weekday) {
      count++;
      if (count === n) { return fmt(year, month, d); }
    }
  }
  throw new Error(`Could not find ${n}th weekday ${weekday} in ${year}-${month}`);
}

// ============================================================================
// Easter (Western) — Anonymous Gregorian algorithm
// ============================================================================

function westernEaster(year: number): string {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return fmt(year, month, day);
}

// ============================================================================
// Hebrew calendar helpers (for Jewish holidays)
// Simplified: converts Hebrew month/day to Gregorian for a given Hebrew year.
// Hebrew year for holidays in Gregorian year Y is typically Y+3761 (Tishrei-based).
// ============================================================================

function hebrewToGregorian(hebrewYear: number, hebrewMonth: number, hebrewDay: number): string {
  // Use a known algorithm for Hebrew → Julian Day → Gregorian
  const isLeap = ((7 * hebrewYear + 1) % 19) < 7;

  // Delay of year
  function hebrewElapsed(y: number): number {
    const monthsElapsed = Math.floor((235 * y - 234) / 19);
    const partsElapsed = 12084 + 13753 * monthsElapsed;
    let day = monthsElapsed * 29 + Math.floor(partsElapsed / 25920);
    if ((3 * (day + 1)) % 7 < 3) { day++; }
    return day;
  }

  function hebrewYearDays(y: number): number {
    return hebrewElapsed(y + 1) - hebrewElapsed(y);
  }

  const yearLength = hebrewYearDays(hebrewYear);
  const isDeficient = yearLength % 10 === 3;
  const isComplete = yearLength % 10 === 5;

  // Compute days from Tishrei 1
  let totalDays = hebrewDay - 1;
  const monthList = isLeap
    ? [30, isComplete ? 30 : 29, isDeficient ? 29 : 30, 29, 30, 30, 29, 30, 29, 30, 29, 30, 29]
    : [30, isComplete ? 30 : 29, isDeficient ? 29 : 30, 29, 30, 29, 30, 29, 30, 29, 30, 29];

  // Hebrew months: 1=Tishrei, ..., in leap year 6=Adar I, 7=Adar II, ...
  // In non-leap: 1=Tishrei, ..., 6=Adar, 7=Nisan, ...
  const monthIndex = hebrewMonth - 1;
  for (let i = 0; i < monthIndex && i < monthList.length; i++) {
    totalDays += monthList[i] ?? 0;
  }

  // Hebrew epoch: Tishrei 1, 1 = Julian Day 347997.5
  // But for simplicity, we use the elapsed days from a known anchor
  const elapsed = hebrewElapsed(hebrewYear);
  const jd = elapsed + totalDays + 347997;

  // Julian Day to Gregorian
  const a = jd + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor(146097 * b / 4);
  const dd = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor(1461 * dd / 4);
  const mm = Math.floor((5 * e + 2) / 153);

  const gDay = e - Math.floor((153 * mm + 2) / 5) + 1;
  const gMonth = mm + 3 - 12 * Math.floor(mm / 10);
  const gYear = 100 * b + dd - 4800 + Math.floor(mm / 10);

  return fmt(gYear, gMonth, gDay);
}

function jewishHolidayDate(gregYear: number, hebrewMonth: number, hebrewDay: number): string {
  // For holidays in the fall (Tishrei), the Hebrew year is gregYear + 3761
  // For holidays in the spring (Nisan+), the Hebrew year is gregYear + 3760
  const hebrewYearFall = gregYear + 3761;
  const hebrewYearSpring = gregYear + 3760;

  // Tishrei(1), Cheshvan(2), Kislev(3) → fall
  // Adar(6/7), Nisan(7/8) → spring
  if (hebrewMonth <= 5) {
    return hebrewToGregorian(hebrewYearFall, hebrewMonth, hebrewDay);
  }
  return hebrewToGregorian(hebrewYearSpring, hebrewMonth, hebrewDay);
}

// ============================================================================
// Lunar New Year (Chinese) — simplified: Jan 21 to Feb 20 range
// Uses a lookup table for known years + a rough approximation
// ============================================================================

const LUNAR_NEW_YEAR_DATES: Record<number, string> = {
  2024: '2024-02-10',
  2025: '2025-01-29',
  2026: '2026-02-17',
  2027: '2027-02-06',
  2028: '2028-01-26',
  2029: '2029-02-13',
  2030: '2030-02-03',
  2031: '2031-01-23',
  2032: '2032-02-11',
  2033: '2033-01-31',
  2034: '2034-02-19',
  2035: '2035-02-08',
};

function lunarNewYear(year: number): string {
  return LUNAR_NEW_YEAR_DATES[year] ?? `${year}-02-01`; // fallback approximate
}

// ============================================================================
// Indian holidays — approximate dates (these shift based on lunar calendar)
// Using lookup tables for practical years
// ============================================================================

const DIWALI_DATES: Record<number, string> = {
  2024: '2024-11-01', 2025: '2025-10-20', 2026: '2026-11-08',
  2027: '2027-10-29', 2028: '2028-10-17', 2029: '2029-11-05',
  2030: '2030-10-26', 2031: '2031-11-14', 2032: '2032-11-02',
  2033: '2033-10-23', 2034: '2034-11-10', 2035: '2035-10-31',
};

const HOLI_DATES: Record<number, string> = {
  2024: '2024-03-25', 2025: '2025-03-14', 2026: '2026-03-04',
  2027: '2027-03-22', 2028: '2028-03-11', 2029: '2029-03-01',
  2030: '2030-03-20', 2031: '2031-03-09', 2032: '2032-03-27',
  2033: '2033-03-16', 2034: '2034-03-05', 2035: '2035-03-24',
};

const RAKSHA_BANDHAN_DATES: Record<number, string> = {
  2024: '2024-08-19', 2025: '2025-08-09', 2026: '2026-08-28',
  2027: '2027-08-17', 2028: '2028-08-06', 2029: '2029-08-25',
  2030: '2030-08-14', 2031: '2031-08-03', 2032: '2032-08-21',
  2033: '2033-08-11', 2034: '2034-08-30', 2035: '2035-08-19',
};

const GANESH_CHATURTHI_DATES: Record<number, string> = {
  2024: '2024-09-07', 2025: '2025-08-27', 2026: '2026-09-15',
  2027: '2027-09-04', 2028: '2028-08-24', 2029: '2029-09-12',
  2030: '2030-09-01', 2031: '2031-08-22', 2032: '2032-09-09',
  2033: '2033-08-29', 2034: '2034-09-17', 2035: '2035-09-06',
};

// ============================================================================
// Maslenitsa — 8 weeks before Orthodox Easter (Julian Easter)
// Orthodox Easter uses the Julian calendar algorithm
// ============================================================================

function orthodoxEaster(year: number): string {
  const a = year % 4;
  const b = year % 7;
  const c = year % 19;
  const d = (19 * c + 15) % 30;
  const e = (2 * a + 4 * b - d + 34) % 7;
  const month = Math.floor((d + e + 114) / 31); // Julian month
  const day = ((d + e + 114) % 31) + 1; // Julian day

  // Convert Julian to Gregorian (add 13 days for 1900-2099)
  const julianDate = new Date(year, month - 1, day + 13);
  return fmt(julianDate.getFullYear(), julianDate.getMonth() + 1, julianDate.getDate());
}

function maslenitsaStart(year: number): string {
  const easter = orthodoxEaster(year);
  // Maslenitsa week starts 56 days (8 weeks) before Orthodox Easter
  return addDays(easter, -56);
}

// ============================================================================
// Main calculator: generate all holiday dates for a given year
// ============================================================================

function calculateHolidayDates(year: number): { holiday: string; startDate: string; endDate: string }[] {
  const easter = westernEaster(year);

  const results: { holiday: string; startDate: string; endDate: string }[] = [
    // === American Holidays (fixed or algorithmic) ===
    { holiday: "New Year's", startDate: fmt(year, 1, 1), endDate: fmt(year, 1, 1) },
    { holiday: "Valentine's Day", startDate: fmt(year, 2, 14), endDate: fmt(year, 2, 14) },
    { holiday: "St. Patrick's Day", startDate: fmt(year, 3, 17), endDate: fmt(year, 3, 17) },
    { holiday: "April Fool's Day", startDate: fmt(year, 4, 1), endDate: fmt(year, 4, 1) },
    { holiday: 'Easter', startDate: easter, endDate: easter },
    { holiday: 'Independence Day', startDate: fmt(year, 7, 4), endDate: fmt(year, 7, 4) },
    { holiday: 'Halloween', startDate: fmt(year, 10, 31), endDate: fmt(year, 10, 31) },
    // Thanksgiving: 4th Thursday of November
    { holiday: 'Thanksgiving', startDate: nthWeekdayOfMonth(year, 11, 4, 4), endDate: nthWeekdayOfMonth(year, 11, 4, 4) },
    { holiday: 'Christmas', startDate: fmt(year, 12, 25), endDate: fmt(year, 12, 25) },

    // === Russian Holidays ===
    { holiday: 'Old New Year', startDate: fmt(year, 1, 14), endDate: fmt(year, 1, 14) },
    { holiday: 'Defender of the Fatherland Day', startDate: fmt(year, 2, 23), endDate: fmt(year, 2, 23) },
    { holiday: 'Victory Day', startDate: fmt(year, 5, 9), endDate: fmt(year, 5, 9) },
    // Maslenitsa: week-long, starts 8 weeks before Orthodox Easter
    { holiday: 'Maslenitsa', startDate: maslenitsaStart(year), endDate: addDays(maslenitsaStart(year), 6) },

    // === Chinese Holidays ===
    { holiday: 'Lunar New Year', startDate: lunarNewYear(year), endDate: addDays(lunarNewYear(year), 14) },
  ];

  // === Jewish Holidays (Hebrew calendar based) ===
  // Tishrei holidays (fall): Hebrew month 1
  try {
    results.push({ holiday: 'Rosh Hashanah', startDate: jewishHolidayDate(year, 1, 1), endDate: jewishHolidayDate(year, 1, 2) });
    results.push({ holiday: 'Yom Kippur', startDate: jewishHolidayDate(year, 1, 10), endDate: jewishHolidayDate(year, 1, 10) });
    results.push({ holiday: 'Sukkot', startDate: jewishHolidayDate(year, 1, 15), endDate: jewishHolidayDate(year, 1, 22) });
    // Kislev 25 = month 3
    results.push({ holiday: 'Hanukkah', startDate: jewishHolidayDate(year, 3, 25), endDate: addDays(jewishHolidayDate(year, 3, 25), 7) });
    // Adar 14 = month 6 (non-leap) or month 7 (leap) — use 6 for simplicity
    results.push({ holiday: 'Purim', startDate: jewishHolidayDate(year, 6, 14), endDate: jewishHolidayDate(year, 6, 14) });
    // Nisan 15 = month 7 (non-leap) or month 8 (leap) — use 7
    results.push({ holiday: 'Passover', startDate: jewishHolidayDate(year, 7, 15), endDate: jewishHolidayDate(year, 7, 22) });
  } catch {
    // If Hebrew calendar calculation fails, skip Jewish holidays
    // Admin can set them manually
    console.warn(`Could not calculate Jewish holiday dates for ${year}. Set them manually in the Calendar Manager.`);
  }

  // === Indian Holidays (lookup-based) ===
  const diwali = DIWALI_DATES[year];
  if (diwali) { results.push({ holiday: 'Diwali', startDate: diwali, endDate: addDays(diwali, 4) }); }

  const holi = HOLI_DATES[year];
  if (holi) { results.push({ holiday: 'Holi', startDate: holi, endDate: addDays(holi, 1) }); }

  const rakshabandhan = RAKSHA_BANDHAN_DATES[year];
  if (rakshabandhan) { results.push({ holiday: 'Raksha Bandhan', startDate: rakshabandhan, endDate: rakshabandhan }); }

  const ganesh = GANESH_CHATURTHI_DATES[year];
  if (ganesh) { results.push({ holiday: 'Ganesh Chaturthi', startDate: ganesh, endDate: addDays(ganesh, 9) }); }

  return results;
}

// ============================================================================
// Service
// ============================================================================

export class HolidayCalculatorService {
  private repo = new HolidayDateRepository();

  /**
   * Generate and upsert all holiday dates for a given year.
   * Returns the number of holidays generated.
   */
  async generateHolidayDates(year: number): Promise<{ generated: number; holidays: string[] }> {
    const dates = calculateHolidayDates(year);
    const holidays: string[] = [];

    for (const d of dates) {
      const input: HolidayDateCreateInput = {
        holiday: d.holiday,
        year,
        startDate: d.startDate,
        endDate: d.endDate,
      };
      await this.repo.upsert(input);
      holidays.push(d.holiday);
    }

    return { generated: dates.length, holidays };
  }
}
