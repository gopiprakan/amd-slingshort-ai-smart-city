import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {COLORS, TYPOGRAPHY, SPACING} from '../../utils/constants';
import { getAllComplaints } from "../../services/api";

interface BackendComplaint {
  complaint_id: number;
  description: string;
  latitude: number;
  longitude: number;
  department_id: number | null;
  priority_level: string;
  status: string;
  submitted_time: string;
  image_path?: string;
}

const CATEGORY_INFO = {
  roads: {icon: 'map-outline', name: 'Roads & Traffic', color: '#FF6B6B'},
  water: {icon: 'water-outline', name: 'Water Supply', color: '#4ECDC4'},
  electricity: {icon: 'flash-outline', name: 'Electricity', color: '#FFE66D'},
  waste: {icon: 'trash-outline', name: 'Waste Management', color: '#95E1D3'},
  public: {icon: 'business-outline', name: 'Public Facilities', color: '#A8E6CF'},
  other: {icon: 'list-outline', name: 'Other', color: '#C7CEEA'},
};

const STATUS_INFO = {
  pending: {color: '#FF9800', label: 'Pending Review', icon: 'time-outline'},
  'in-progress': {color: '#2196F3', label: 'In Progress', icon: 'construct-outline'},
  resolved: {color: '#4CAF50', label: 'Resolved', icon: 'checkmark-circle-outline'},
  rejected: {color: '#F44336', label: 'Rejected', icon: 'close-circle-outline'},
};

const PRIORITY_COLORS = {
  low: '#4CAF50',
  medium: '#FF9800',
  high: '#F44336',
  critical: '#9C27B0',
};

const MyReportsScreen: React.FC = () => {
  const [complaints, setComplaints] = useState<BackendComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<BackendComplaint | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in-progress' | 'resolved' | 'rejected'>('all');

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    setLoading(true);

    const result = await getAllComplaints();
    if (result.success) {
      setComplaints(result.data?.complaints || []);
      setError(null);
    } else {
      setError('Failed to load complaints');
    }

    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchComplaints();
    setRefreshing(false);
  };

  const normalizeStatus = (status: string) => {
    const normalized = (status || '').toLowerCase().replace('_', '-');
    if (normalized === 'in-progress' || normalized === 'in progress') return 'in-progress';
    if (normalized === 'resolved') return 'resolved';
    if (normalized === 'rejected') return 'rejected';
    return 'pending';
  };

  const getProgressFromStatus = (status: string) => {
    const normalized = normalizeStatus(status);
    if (normalized === 'resolved') return {step: 4, totalSteps: 4, message: 'Issue resolved successfully.'};
    if (normalized === 'in-progress') return {step: 2, totalSteps: 4, message: 'Work is currently in progress.'};
    if (normalized === 'rejected') return {step: 1, totalSteps: 1, message: 'Report was rejected or marked as duplicate.'};
    return {step: 1, totalSteps: 4, message: 'Report received and pending review.'};
  };

  const getFilteredReports = () => {
    if (filter === 'all') return complaints;
    return complaints.filter(report => normalizeStatus(report.status) === filter);
  };

  const getProgressPercentage = (status: string) => {
    const progress = getProgressFromStatus(status);
    return (progress.step / progress.totalSteps) * 100;
  };

  const renderProgressBar = (status: string) => {
    const percentage = getProgressPercentage(status);
    const progress = getProgressFromStatus(status);
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, {width: `${percentage}%`}]} />
        </View>
        <Text style={styles.progressText}>
          {progress.step}/{progress.totalSteps} steps completed
        </Text>
      </View>
    );
  };

  const renderComplaintCard = ({item}: {item: BackendComplaint}) => {
    const statusKey = normalizeStatus(item.status) as keyof typeof STATUS_INFO;
    const statusInfo = STATUS_INFO[statusKey] || STATUS_INFO.pending;
    const priorityKey = (item.priority_level || 'low').toLowerCase() as keyof typeof PRIORITY_COLORS;

    return (
      <TouchableOpacity
        style={styles.reportCard}
        onPress={() => setSelectedReport(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitle}>
            <Text style={styles.cardTitleText} numberOfLines={1}>Complaint #{item.complaint_id}</Text>
          </View>
          <View style={[styles.statusBadge, {backgroundColor: statusInfo.color}]}>
            <Ionicons name={statusInfo.icon as keyof typeof Ionicons.glyphMap} size={16} color={COLORS.white} />
          </View>
        </View>

        <Text style={styles.cardDescription} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.cardLocation}>
          <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} style={styles.locationIcon} />
          <Text style={styles.locationText} numberOfLines={1}>
            Lat: {item.latitude}, Lng: {item.longitude}
          </Text>
        </View>

        {statusKey !== 'rejected' && renderProgressBar(item.status)}

        <View style={styles.cardFooter}>
          <View style={styles.cardStats}>
            <View style={[styles.priorityBadge, {backgroundColor: PRIORITY_COLORS[priorityKey] || COLORS.gray}]}>
              <Text style={styles.priorityText}>{(item.priority_level || 'LOW').toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.dateText}>Updated: {item.submitted_time}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const getStats = () => {
    return {
      total: complaints.length,
      pending: complaints.filter(r => normalizeStatus(r.status) === 'pending').length,
      inProgress: complaints.filter(r => normalizeStatus(r.status) === 'in-progress').length,
      resolved: complaints.filter(r => normalizeStatus(r.status) === 'resolved').length,
      rejected: complaints.filter(r => normalizeStatus(r.status) === 'rejected').length,
    };
  };

  const stats = getStats();
  const filteredReports = getFilteredReports();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Ionicons name="list-outline" size={26} color={COLORS.white} />
          <Text style={styles.headerTitle}>My Reports</Text>
        </View>
        <Text style={styles.headerSubtitle}>Track your civic issue reports</Text>
      </View>

      {/* Stats Cards */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statCardNumber}>{stats.total}</Text>
          <Text style={styles.statCardLabel}>Total Reports</Text>
        </View>
        <View style={[styles.statCard, {backgroundColor: STATUS_INFO.pending.color + '20'}]}>
          <Text style={[styles.statCardNumber, {color: STATUS_INFO.pending.color}]}>{stats.pending}</Text>
          <Text style={styles.statCardLabel}>Pending</Text>
        </View>
        <View style={[styles.statCard, {backgroundColor: STATUS_INFO['in-progress'].color + '20'}]}>
          <Text style={[styles.statCardNumber, {color: STATUS_INFO['in-progress'].color}]}>{stats.inProgress}</Text>
          <Text style={styles.statCardLabel}>In Progress</Text>
        </View>
        <View style={[styles.statCard, {backgroundColor: STATUS_INFO.resolved.color + '20'}]}>
          <Text style={[styles.statCardNumber, {color: STATUS_INFO.resolved.color}]}>{stats.resolved}</Text>
          <Text style={styles.statCardLabel}>Resolved</Text>
        </View>
      </ScrollView>

      {/* Filter Buttons */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {['all', 'pending', 'in-progress', 'resolved', 'rejected'].map(status => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterButton,
              filter === status && styles.filterButtonActive,
            ]}
            onPress={() => setFilter(status as any)}
          >
            <Text style={[
              styles.filterButtonText,
              filter === status && styles.filterButtonTextActive,
            ]}>
              {status === 'all' ? 'All' : STATUS_INFO[status as keyof typeof STATUS_INFO]?.label || status}
              ({status === 'all' ? complaints.length : complaints.filter(r => normalizeStatus(r.status) === status).length})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Reports List */}
      {loading && (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.emptySubtext}>Loading reports...</Text>
        </View>
      )}

      {!loading && error && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Failed to load reports</Text>
          <Text style={styles.emptySubtext}>{error}</Text>
          <TouchableOpacity style={styles.actionButton} onPress={fetchComplaints}>
            <Text style={styles.actionButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && (
        <FlatList
          data={filteredReports}
          renderItem={renderComplaintCard}
          keyExtractor={item => String(item.complaint_id)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="list-outline" size={48} color={COLORS.textSecondary} style={styles.emptyIcon} />
              <Text style={styles.emptyText}>No reports yet</Text>
              <Text style={styles.emptySubtext}>
                {filter === 'all'
                  ? 'Start reporting issues to see them here'
                  : `No ${filter} reports at the moment`}
              </Text>
            </View>
          }
        />
      )}

      {/* Report Details Modal */}
      <Modal
        visible={selectedReport !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedReport(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedReport && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalTitleRow}>
                    <Text style={styles.modalTitle}>Complaint #{selectedReport.complaint_id}</Text>
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={() => setSelectedReport(null)}
                    >
                      <Text style={styles.closeButtonText}>X</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.modalBadges}>
                    <View style={[styles.badge, {backgroundColor: CATEGORY_INFO.other.color}]}>
                      <View style={styles.badgeRow}>
                        <Ionicons name={CATEGORY_INFO.other.icon as keyof typeof Ionicons.glyphMap} size={14} color={COLORS.white} />
                        <Text style={styles.badgeText}>Other</Text>
                      </View>
                    </View>
                    <View style={[styles.badge, {backgroundColor: STATUS_INFO[normalizeStatus(selectedReport.status) as keyof typeof STATUS_INFO].color}]}>
                      <View style={styles.badgeRow}>
                        <Ionicons
                          name={STATUS_INFO[normalizeStatus(selectedReport.status) as keyof typeof STATUS_INFO].icon as keyof typeof Ionicons.glyphMap}
                          size={14}
                          color={COLORS.white}
                        />
                        <Text style={styles.badgeText}>{STATUS_INFO[normalizeStatus(selectedReport.status) as keyof typeof STATUS_INFO].label}</Text>
                      </View>
                    </View>
                    <View style={[styles.badge, {backgroundColor: PRIORITY_COLORS[(selectedReport.priority_level || 'low').toLowerCase() as keyof typeof PRIORITY_COLORS] || COLORS.gray}]}>
                      <Text style={styles.badgeText}>{(selectedReport.priority_level || 'LOW').toUpperCase()}</Text>
                    </View>
                  </View>
                </View>

                <ScrollView style={styles.modalBody}>
                  <View style={styles.modalSection}>
                    <View style={styles.modalSectionTitleRow}>
                      <Ionicons name="create-outline" size={20} color={COLORS.text} />
                      <Text style={styles.modalSectionTitle}>Description</Text>
                    </View>
                    <Text style={styles.modalSectionText}>{selectedReport.description}</Text>
                  </View>

                  <View style={styles.modalSection}>
                    <View style={styles.modalSectionTitleRow}>
                      <Ionicons name="location-outline" size={20} color={COLORS.text} />
                      <Text style={styles.modalSectionTitle}>Location</Text>
                    </View>
                    <Text style={styles.modalSectionText}>
                      Lat: {selectedReport.latitude}, Lng: {selectedReport.longitude}
                    </Text>
                  </View>

                  <View style={styles.modalSection}>
                    <View style={styles.modalSectionTitleRow}>
                      <Ionicons name="stats-chart-outline" size={20} color={COLORS.text} />
                      <Text style={styles.modalSectionTitle}>Progress Update</Text>
                    </View>
                    <Text style={styles.modalSectionText}>{getProgressFromStatus(selectedReport.status).message}</Text>
                    {normalizeStatus(selectedReport.status) !== 'rejected' && (
                      <View style={styles.modalProgressContainer}>
                        {renderProgressBar(selectedReport.status)}
                      </View>
                    )}
                  </View>

                  <View style={styles.modalSection}>
                    <View style={styles.modalSectionTitleRow}>
                      <Ionicons name="time-outline" size={20} color={COLORS.text} />
                      <Text style={styles.modalSectionTitle}>Timeline</Text>
                    </View>
                    <Text style={styles.modalSectionText}>
                      Reported: {selectedReport.submitted_time}{'\n'}
                      Last Updated: {selectedReport.submitted_time}
                    </Text>
                  </View>
                </ScrollView>

                <View style={styles.modalActions}>
                  {normalizeStatus(selectedReport.status) === 'resolved' ? (
                    <TouchableOpacity 
                      style={[styles.actionButton, {backgroundColor: COLORS.success}]}
                      onPress={() => {
                        // Navigate to feedback screen
                        setSelectedReport(null);
                        // navigation.navigate('Feedback', {
                        //   reportId: selectedReport.id,
                        //   taskId: 'task_001', // In real app, get from API
                        //   reportTitle: selectedReport.title
                        // });
                        Alert.alert('Feedback', 'Rate your experience with this resolution!');
                      }}
                    >
                      <Text style={styles.actionButtonText}>Give Feedback</Text>
                    </TouchableOpacity>
                  ) : (
                    <>
                      <TouchableOpacity style={styles.actionButton}>
                        <Text style={styles.actionButtonText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionButton}>
                        <Text style={styles.actionButtonText}>Share</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  <TouchableOpacity style={[styles.actionButton, {backgroundColor: COLORS.error}]}>
                    <Text style={styles.actionButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  headerTitle: {
    ...TYPOGRAPHY.h1,
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.white,
    opacity: 0.9,
  },
  statsContainer: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  statCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 12,
    marginRight: SPACING.md,
    minWidth: 100,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statCardNumber: {
    ...TYPOGRAPHY.h2,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  statCardLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  filterContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterButtonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  filterButtonTextActive: {
    color: COLORS.white,
  },
  listContainer: {
    padding: SPACING.md,
  },
  reportCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  cardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  cardTitleText: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    flex: 1,
  },
  statusBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIcon: {
    fontSize: 14,
  },
  cardDescription: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  cardLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  locationIcon: {
    fontSize: 14,
    marginRight: SPACING.xs,
  },
  locationText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    flex: 1,
  },
  progressContainer: {
    marginBottom: SPACING.sm,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    marginBottom: SPACING.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  progressText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  statIcon: {
    fontSize: 14,
    marginRight: SPACING.xs,
  },
  statText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  priorityBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
  },
  priorityText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 10,
  },
  dateText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyIcon: {
    marginBottom: SPACING.md,
  },
  emptyText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  emptySubtext: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    flex: 1,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  modalBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  badgeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontWeight: '600',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  modalBody: {
    maxHeight: 300,
  },
  modalSection: {
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalSectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  modalSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  modalSectionText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  modalProgressContainer: {
    marginTop: SPACING.md,
  },
  modalActions: {
    flexDirection: 'row',
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    backgroundColor: COLORS.secondary,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontWeight: '600',
  },
});

export default MyReportsScreen;
