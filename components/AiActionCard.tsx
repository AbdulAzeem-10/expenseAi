import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

const CARD_HEIGHT = 112;

export function AIActionCard({
  icon,
  title,
  subtitle,
  colors,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
  colors: [string, string];
  onPress: () => void;
}) {
  const [width, setWidth] = useState(0);
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (width === 0) return;
    translateX.value = 0;
    translateX.value = withRepeat(
      withTiming(width * 1.8, { duration: 2400, easing: Easing.linear }),
      -1,
      false
    );
  }, [width, translateX]);

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.88} style={{ flex: 1 }} accessibilityRole="button" accessibilityLabel={`${title}. ${subtitle}`}>
      <View
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        style={{
          height: CARD_HEIGHT,
          borderRadius: 18,
          overflow: "hidden",
        }}
      >
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: "absolute", inset: 0 }}
        />
        {width > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: "absolute",
                top: -CARD_HEIGHT * 0.45,
                left: -width * 0.45,
                width: width * 0.45,
                height: CARD_HEIGHT * 1.9,
                transform: [{ rotate: "-20deg" }],
              },
              sweepStyle,
            ]}
          >
            <LinearGradient
              colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.3)", "rgba(255,255,255,0)"]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{ flex: 1 }}
            />
          </Animated.View>
        ) : null}

        <View
          style={{
            position: "absolute",
            inset: 0,
            padding: 16,
          }}
        >
          <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center mb-3">
            <Feather name={icon} size={18} color="#fff" />
          </View>
          <Text className="text-white text-[13px] font-semibold mb-0.5">
            {title}
          </Text>
          <Text className="text-white/70 text-[11px]">{subtitle}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
