import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useColors } from '@/constants/colors';
import type { ThemeColors } from '@/constants/colors';
import { Typography } from '@/constants/typography';

interface WheelDatePickerProps {
  /** ISO date string "YYYY-MM-DD"; empty → default today. */
  value: string;
  onChange: (iso: string) => void;
  /** Year range. */
  minYear?: number;
  maxYear?: number;
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function toIso(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  wrap: { alignItems: 'center' },
  androidField: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14 },
  androidFieldText: { fontSize: Typography.lg, fontWeight: Typography.weightBold, color: c.textPrimary },
});

/**
 * 考试日选择器。基于 @react-native-community/datetimepicker。
 * - iOS：内嵌 spinner（原生滚轮），可靠滚动选择。
 * - Android：点击展开系统日期对话框。
 * 对外接口保持 value(ISO) / onChange(ISO) 不变。
 */
export function WheelDatePicker({ value, onChange, minYear, maxYear }: WheelDatePickerProps) {
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  const now = new Date();
  const thisYear = now.getFullYear();
  const current = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : now;

  const minimumDate = useMemo(() => new Date(minYear ?? thisYear, 0, 1), [minYear, thisYear]);
  const maximumDate = useMemo(() => new Date((maxYear ?? thisYear + 3), 11, 31), [maxYear, thisYear]);

  const [androidOpen, setAndroidOpen] = useState(false);

  const handleChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setAndroidOpen(false);
    if (selected) onChange(toIso(selected));
  };

  if (Platform.OS === 'android') {
    return (
      <View style={styles.wrap}>
        <Pressable style={styles.androidField} onPress={() => setAndroidOpen(true)}>
          <Text style={styles.androidFieldText}>{toIso(current)}</Text>
        </Pressable>
        {androidOpen && (
          <DateTimePicker
            value={current}
            mode="date"
            display="calendar"
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            onChange={handleChange}
          />
        )}
      </View>
    );
  }

  // iOS：内嵌滚轮
  return (
    <View style={styles.wrap}>
      <DateTimePicker
        value={current}
        mode="date"
        display="spinner"
        minimumDate={minimumDate}
        maximumDate={maximumDate}
        onChange={handleChange}
        themeVariant={Colors.background === '#0f172a' ? 'dark' : 'light'}
        style={{ alignSelf: 'stretch' }}
      />
    </View>
  );
}
