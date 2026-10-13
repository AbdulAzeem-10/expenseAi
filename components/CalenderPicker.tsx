import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useState } from "react";
import { Modal, Platform, Text, TouchableOpacity, View } from "react-native";

export function CalendarPicker({
  visible,
  value,
  onChange,
  onClose,
  maximumDate,
}: {
  visible: boolean;
  value: Date;
  onChange: (date: Date) => void;
  onClose: () => void;
  maximumDate?: Date;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (visible) setDraft(value);
  }, [visible, value]);

  const commit = () => {
    onChange(draft);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <TouchableOpacity className="absolute inset-0" activeOpacity={1} onPress={onClose} accessibilityLabel="Close date picker" />
        <View className="rounded-t-3xl bg-brand-body px-5 pt-5 pb-8">
          <View className="mb-3 flex-row items-center justify-between">
            <TouchableOpacity onPress={onClose} className="py-2"><Text className="text-brand-text-secondary">Cancel</Text></TouchableOpacity>
            <Text className="text-brand-bg text-base font-semibold">Choose date</Text>
            <TouchableOpacity onPress={commit} className="py-2"><Text className="text-brand-blue font-semibold">Done</Text></TouchableOpacity>
          </View>
          <DateTimePicker
            value={draft}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            maximumDate={maximumDate}
            onChange={(event, selectedDate) => {
              if (event.type === "dismissed") {
                if (Platform.OS === "android") onClose();
                return;
              }
              if (selectedDate) {
                setDraft(selectedDate);
                if (Platform.OS === "android") {
                  onChange(selectedDate);
                  onClose();
                }
              }
            }}
          />
        </View>
      </View>
    </Modal>
  );
}
