import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { ActivityIndicator, TouchableOpacity } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";

export function GradientIconButton({
  icon,
  colors,
  size = 64,
  iconSize = 24,
  loading,
  disabled,
  onPress,
  borderColor,
}: {
  icon: keyof typeof Feather.glyphMap;
  colors: [string, string];
  size?: number;
  iconSize?: number;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
  borderColor?: string;
}) {
  const shimmerX = useSharedValue(-size);
  useEffect(() => {
    shimmerX.value = -size;
    shimmerX.value = withRepeat(withTiming(size, { duration: 2200, easing: Easing.linear }), -1, false);
  }, [size, shimmerX]);
  const shimmerStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shimmerX.value }, { rotate: "-28deg" }] }));

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled || loading), busy: Boolean(loading) }}
      hitSlop={4}
      style={{ alignSelf: "center", opacity: disabled && !loading ? 0.55 : 1 }}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          ...(borderColor
            ? { borderWidth: 3, borderColor }
            : null),
        }}
      >
        <Animated.View pointerEvents="none" style={[{ position: "absolute", top: -size * 0.4, left: 0, width: size * 0.35, height: size * 1.8 }, shimmerStyle]}>
          <LinearGradient colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.32)", "rgba(255,255,255,0)"]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ flex: 1 }} />
        </Animated.View>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Feather name={icon} size={iconSize} color="#fff" />
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}
