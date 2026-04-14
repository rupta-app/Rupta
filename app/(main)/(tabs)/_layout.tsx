import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Compass, Home, Trophy, User, Users } from 'lucide-react-native';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';

import { colors } from '@/constants/theme';

function AnimatedTabIcon({
  Icon,
  color,
  size,
  focused,
}: {
  Icon: typeof Home;
  color: string;
  size: number;
  focused: boolean;
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (focused) {
      scale.value = withSequence(withSpring(1.15, { damping: 8 }), withSpring(1));
    }
  }, [focused, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={style}>
      <Icon color={color} size={size} strokeWidth={focused ? 2.2 : 1.5} />
    </Animated.View>
  );
}

function RaisedHomeIcon({ focused }: { focused: boolean }) {
  return (
    <View
      className={`w-12 h-12 rounded-full -mt-4 items-center justify-center ${
        focused ? 'bg-primary' : 'bg-surfaceElevated border border-border'
      }`}
    >
      <Home
        color={focused ? colors.white : colors.mutedForeground}
        size={24}
        strokeWidth={focused ? 2.2 : 1.5}
      />
    </View>
  );
}

export default function TabsLayout() {
  const { t } = useTranslation();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
          paddingTop: 2,
        },
        tabBarActiveTintColor: colors.foreground,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="explore"
        options={{
          title: t('tabs.explore'),
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon Icon={Compass} color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: t('tabs.groups'),
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon Icon={Users} color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ focused }) => <RaisedHomeIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: t('tabs.ranks'),
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon Icon={Trophy} color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.you'),
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon Icon={User} color={color} size={size} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
