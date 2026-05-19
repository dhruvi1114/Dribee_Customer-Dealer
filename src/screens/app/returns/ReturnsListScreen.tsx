import { useCallback } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '@/theme/ThemeContext';
import { Header } from '@/components/common/Header';
import { EmptyState } from '@/components/common/EmptyState';
import { ReturnListCard } from '@/components/returns/ReturnListCard';
import { useReturns } from '@/services/returns/returns.query';
import { Spacing } from '@/constants/spacing';
import type { AppTabParamList, ProfileStackParamList } from '@/navigation/types';
import type { Return } from '@/types/return';

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<ProfileStackParamList>,
  BottomTabNavigationProp<AppTabParamList>
>;

export function ReturnsListScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const { data, isLoading, refetch, isRefetching } = useReturns();

  const returns = data ?? [];

  const handleOpenReturn = useCallback(
    (ret: Return) => {
      navigation.navigate('ReturnStatus', { returnId: ret.id, initialReturn: ret });
    },
    [navigation],
  );

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bgApp },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: Spacing.lg, paddingBottom: 40 },
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Returns" showBack />
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brandNavy} />
        </View>
      ) : (
        <FlatList
          data={returns}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ReturnListCard ret={item} onPress={() => handleOpenReturn(item)} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={isRefetching}
          onRefresh={() => void refetch()}
          ListEmptyComponent={
            <EmptyState
              title="No returns yet"
              subtitle="Return requests you submit from orders will show up here."
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
