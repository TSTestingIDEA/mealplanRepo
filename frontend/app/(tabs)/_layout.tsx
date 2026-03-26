import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../src/constants/theme';
import { BookOpen, Calendar, ShoppingBag } from 'lucide-react-native';

function TabIcon({ icon: Icon, label, focused }: { icon: any; label: string; focused: boolean }) {
  return (
    <View style={tabStyles.iconContainer}>
      <Icon size={22} color={focused ? colors.accent : colors.textTertiary} strokeWidth={focused ? 2.2 : 1.5} />
      <Text style={[tabStyles.label, focused && tabStyles.labelActive]}>{label}</Text>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  iconContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 6 },
  label: { fontSize: 10, color: colors.textTertiary, marginTop: 2, fontWeight: '500' },
  labelActive: { color: colors.accent, fontWeight: '600' },
});

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.elevated,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 64,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="recipes"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon={BookOpen} label="Recipes" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="planner"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon={Calendar} label="Planner" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="grocery"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon={ShoppingBag} label="Grocery" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
