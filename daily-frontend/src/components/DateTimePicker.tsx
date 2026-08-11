import React, { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from "react-native";

interface DateTimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
}

const DAYS_HE = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];
const MONTHS_HE = [
  "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export default function DateTimePickerCustom({ value, onChange }: DateTimePickerProps) {
  const [expanded, setExpanded] = useState(false);
  const [viewYear, setViewYear] = useState(value.getFullYear());
  const [viewMonth, setViewMonth] = useState(value.getMonth());
  const [hourText, setHourText] = useState(value.getHours().toString().padStart(2, "0"));
  const [minuteText, setMinuteText] = useState(value.getMinutes().toString().padStart(2, "0"));

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const formatDisplay = (date: Date): string => {
    const d = date.toLocaleDateString("he-IL", { day: "numeric", month: "short", year: "numeric" });
    const t = `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
    return `${d}  •  ${t}`;
  };

  const updateDate = (day: number) => {
    const h = parseInt(hourText) || 0;
    const m = parseInt(minuteText) || 0;
    const updated = new Date(viewYear, viewMonth, day, h, m);
    onChange(updated);
  };

  const commitTime = (hStr: string, mStr: string) => {
    let h = parseInt(hStr);
    let m = parseInt(mStr);
    if (isNaN(h) || h < 0) h = 0;
    if (h > 23) h = 23;
    if (isNaN(m) || m < 0) m = 0;
    if (m > 59) m = 59;
    setHourText(h.toString().padStart(2, "0"));
    setMinuteText(m.toString().padStart(2, "0"));
    const updated = new Date(value);
    updated.setHours(h, m);
    onChange(updated);
  };

  const adjustHour = (delta: number) => {
    let h = (parseInt(hourText) || 0) + delta;
    if (h > 23) h = 0;
    if (h < 0) h = 23;
    const hStr = h.toString().padStart(2, "0");
    setHourText(hStr);
    commitTime(hStr, minuteText);
  };

  const adjustMinute = (delta: number) => {
    let m = (parseInt(minuteText) || 0) + delta;
    if (m > 59) m = 0;
    if (m < 0) m = 55;
    const mStr = m.toString().padStart(2, "0");
    setMinuteText(mStr);
    commitTime(hourText, mStr);
  };

  const handlePrev = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else { setViewMonth(viewMonth - 1); }
  };

  const handleNext = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else { setViewMonth(viewMonth + 1); }
  };

  const isSelected = (day: number) =>
    value.getDate() === day && value.getMonth() === viewMonth && value.getFullYear() === viewYear;

  const isToday = (day: number) => {
    const now = new Date();
    return day === now.getDate() && viewMonth === now.getMonth() && viewYear === now.getFullYear();
  };

  // Build grid
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    const row = cells.slice(i, i + 7);
    while (row.length < 7) row.push(null);
    rows.push(row);
  }

  if (!expanded) {
    return (
      <TouchableOpacity style={styles.field} onPress={() => setExpanded(true)}>
        <Text style={styles.fieldText}>{formatDisplay(value)}</Text>
        <Text style={styles.fieldIcon}>📅</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {/* Month navigation */}
      <View style={styles.monthRow}>
        <TouchableOpacity onPress={handleNext}><Text style={styles.arrow}>›</Text></TouchableOpacity>
        <Text style={styles.monthText}>{MONTHS_HE[viewMonth]} {viewYear}</Text>
        <TouchableOpacity onPress={handlePrev}><Text style={styles.arrow}>‹</Text></TouchableOpacity>
      </View>

      {/* Day labels */}
      <View style={styles.row}>
        {DAYS_HE.map((d, i) => (
          <Text key={i} style={styles.dayLabel}>{d}</Text>
        ))}
      </View>

      {/* Calendar grid */}
      {rows.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map((day, ci) => (
            <TouchableOpacity
              key={ci}
              style={[
                styles.cell,
                day && isSelected(day) && styles.cellSelected,
                day && isToday(day) && !isSelected(day) && styles.cellToday,
              ]}
              disabled={!day}
              onPress={() => day && updateDate(day)}
            >
              <Text style={[
                styles.cellText,
                day && isSelected(day) && styles.cellTextSelected,
                day && isToday(day) && !isSelected(day) && styles.cellTextToday,
              ]}>
                {day ?? ""}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}

      {/* Time row — LTR */}
      <View style={styles.timeRow}>
        <TouchableOpacity style={styles.doneBtn} onPress={() => setExpanded(false)}>
          <Text style={styles.doneText}>אישור</Text>
        </TouchableOpacity>

        <View style={styles.timeGroup}>
          {/* Hour */}
          <View style={styles.timeUnit}>
            <TouchableOpacity onPress={() => adjustHour(1)}>
              <Text style={styles.timeArrow}>▲</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.timeInput}
              value={hourText}
              onChangeText={(t) => setHourText(t.replace(/[^0-9]/g, "").slice(0, 2))}
              onBlur={() => commitTime(hourText, minuteText)}
              keyboardType="number-pad"
              maxLength={2}
              selectTextOnFocus
            />
            <TouchableOpacity onPress={() => adjustHour(-1)}>
              <Text style={styles.timeArrow}>▼</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.timeSep}>:</Text>

          {/* Minute */}
          <View style={styles.timeUnit}>
            <TouchableOpacity onPress={() => adjustMinute(5)}>
              <Text style={styles.timeArrow}>▲</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.timeInput}
              value={minuteText}
              onChangeText={(t) => setMinuteText(t.replace(/[^0-9]/g, "").slice(0, 2))}
              onBlur={() => commitTime(hourText, minuteText)}
              keyboardType="number-pad"
              maxLength={2}
              selectTextOnFocus
            />
            <TouchableOpacity onPress={() => adjustMinute(-5)}>
              <Text style={styles.timeArrow}>▼</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Collapsed field
  field: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#FAFAFA",
  },
  fieldText: { fontSize: 13, color: "#1F2937" },
  fieldIcon: { fontSize: 16 },

  // Expanded picker
  container: {
    backgroundColor: "#FAFBFC",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 10,
    marginTop: 6,
  },
  monthRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  monthText: { fontSize: 13, fontWeight: "600", color: "#374151" },
  arrow: { fontSize: 18, color: "#2563EB", fontWeight: "700", paddingHorizontal: 8 },

  row: { flexDirection: "row", justifyContent: "space-around" },
  dayLabel: { width: 28, textAlign: "center", fontSize: 10, color: "#9CA3AF", fontWeight: "600", marginBottom: 4 },

  cell: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", marginVertical: 1 },
  cellSelected: { backgroundColor: "#2563EB" },
  cellToday: { borderWidth: 1, borderColor: "#2563EB" },
  cellText: { fontSize: 12, color: "#374151" },
  cellTextSelected: { color: "#FFF", fontWeight: "700" },
  cellTextToday: { color: "#2563EB", fontWeight: "600" },

  // Time section — forced LTR
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    writingDirection: "ltr",
  },
  timeGroup: {
    flexDirection: "row",
    alignItems: "center",
    writingDirection: "ltr",
  },
  timeUnit: {
    alignItems: "center",
  },
  timeArrow: { fontSize: 10, color: "#2563EB", fontWeight: "700", padding: 2 },
  timeInput: {
    width: 32,
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2937",
    textAlign: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#D1D5DB",
    paddingVertical: 2,
    writingDirection: "ltr",
  },
  timeSep: { fontSize: 15, fontWeight: "700", color: "#374151", marginHorizontal: 4 },
  doneBtn: { backgroundColor: "#2563EB", paddingHorizontal: 14, paddingVertical: 5, borderRadius: 8 },
  doneText: { color: "#FFF", fontSize: 12, fontWeight: "700" },
});
