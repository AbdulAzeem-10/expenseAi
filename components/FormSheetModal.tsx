import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export function FormSheetModal({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-end"
      >
        <Pressable onPress={onClose} className="absolute inset-0 bg-black/40" accessibilityLabel="Close dialog" />
        <View className="max-h-[88%] rounded-t-3xl bg-brand-body px-5 pt-5 pb-8">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-brand-bg text-base font-semibold">{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12} accessibilityLabel="Close dialog">
              <Text className="text-brand-text-secondary text-lg">×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {children}

            <TouchableOpacity onPress={onClose} className="items-center py-3">
              <Text className="text-brand-text-secondary text-sm">Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
