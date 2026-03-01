import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useDispatch, useSelector} from 'react-redux';
import {MainTabScreenProps} from '../../types/navigation';
import {RootState, AppDispatch} from '../../store/store';
import {logout} from '../../store/slices/authSlice';
import {COLORS, TYPOGRAPHY, SPACING} from '../../utils/constants';

type Props = MainTabScreenProps<'Home'>;

// Keep backend URL easy to update for local development.
// Example: http://192.168.1.10:5001
const API_BASE_URL = 'https://unvenomous-quirkily-mac.ngrok-free.dev';
const USER_PROFILE_KEY = 'user_profile';

interface ComplaintStats {
  total: number;
  by_priority: {
    Critical?: number;
    High?: number;
    Medium?: number;
    Low?: number;
    [key: string]: number | undefined;
  };
}

const HomeScreen: React.FC<Props> = ({navigation}) => {
  const dispatch = useDispatch<AppDispatch>();
  const {user} = useSelector((state: RootState) => state.auth);

  const [refreshing, setRefreshing] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [stats, setStats] = useState<ComplaintStats | null>(null);
  const [storedProfileName, setStoredProfileName] = useState('');

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Logout', style: 'destructive', onPress: () => dispatch(logout())},
    ]);
  };

  const navigateToScreen = (screen: keyof any) => {
    navigation.navigate(screen);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return 'Good Morning';
    }
    if (hour < 17) {
      return 'Good Afternoon';
    }
    return 'Good Evening';
  };

  const fetchComplaintStats = async (isRefresh = false) => {
    // During pull-to-refresh, keep the section visible and only show refresh spinner.
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoadingStats(true);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/complaints/stats`);

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data: ComplaintStats = await response.json();
      setStats(data);
      setStatsError(null);
    } catch (error: any) {
      setStatsError(error?.message || 'Unable to fetch complaint statistics.');
    } finally {
      setLoadingStats(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchComplaintStats();
  }, []);

  useEffect(() => {
    const loadStoredProfileName = async () => {
      try {
        const savedProfileRaw = await AsyncStorage.getItem(USER_PROFILE_KEY);
        if (!savedProfileRaw) return;

        const savedProfile = JSON.parse(savedProfileRaw);
        setStoredProfileName(savedProfile?.name?.trim() || '');
      } catch (error) {
        setStoredProfileName('');
      }
    };

    loadStoredProfileName();
  }, []);

  const priorityStats = [
    {label: 'Total Complaints', value: stats?.total ?? 0, color: COLORS.primary},
    {label: 'Critical', value: stats?.by_priority?.Critical ?? 0, color: '#D7263D'},
    {label: 'High', value: stats?.by_priority?.High ?? 0, color: '#F46036'},
    {label: 'Medium', value: stats?.by_priority?.Medium ?? 0, color: '#F6AE2D'},
    {label: 'Low', value: stats?.by_priority?.Low ?? 0, color: '#2E86AB'},
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchComplaintStats(true)} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}!</Text>
            <Text style={styles.userName}>{user?.name?.trim() || storedProfileName || 'Guest'}</Text>
            <Text style={styles.subtitle}>Resolve360 - Making cities better together</Text>
          </View>
          <TouchableOpacity style={styles.profileButton} onPress={handleLogout}>
            <Ionicons name="person-circle-outline" size={26} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="flash-outline" size={24} color={COLORS.text} />
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={[styles.actionCard, {backgroundColor: '#FF6B6B20'}]}
            onPress={() => navigateToScreen('ReportIssue')}
          >
            <Ionicons name="create-outline" size={32} color={COLORS.text} style={styles.actionIcon} />
            <Text style={styles.actionTitle}>Report Issue</Text>
            <Text style={styles.actionSubtitle}>Report a new civic problem</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, {backgroundColor: '#FFE66D20'}]}
            onPress={() => navigateToScreen('MyReports')}
          >
            <Ionicons name="list-outline" size={32} color={COLORS.text} style={styles.actionIcon} />
            <Text style={styles.actionTitle}>My Reports</Text>
            <Text style={styles.actionSubtitle}>Track your submissions</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="stats-chart-outline" size={24} color={COLORS.text} />
          <Text style={styles.sectionTitle}>Complaint Statistics</Text>
        </View>

        {loadingStats ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading complaint statistics...</Text>
          </View>
        ) : statsError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Could not load statistics</Text>
            <Text style={styles.errorText}>{statsError}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchComplaintStats()}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.statsGrid}>
            {priorityStats.map(item => (
              <View key={item.label} style={styles.statCard}>
                <Text style={[styles.statNumber, {color: item.color}]}>{item.value}</Text>
                <Text style={styles.statLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Resolve360 - Making cities better, one report at a time</Text>
        <Text style={styles.versionText}>Version 2.0 - Team Resolve360</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  greeting: {
    ...TYPOGRAPHY.body,
    color: COLORS.white,
    opacity: 0.9,
  },
  userName: {
    ...TYPOGRAPHY.h1,
    color: COLORS.white,
    marginVertical: SPACING.xs,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.white,
    opacity: 0.8,
  },
  profileButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIcon: {
    fontSize: 24,
  },
  section: {
    padding: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: 0,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: 16,
    marginBottom: SPACING.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: SPACING.sm,
  },
  actionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  actionSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  loadingContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  errorContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: '#FFD3D3',
  },
  errorTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.error,
    marginBottom: SPACING.xs,
  },
  errorText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    ...TYPOGRAPHY.h2,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  footer: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  footerText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  versionText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
