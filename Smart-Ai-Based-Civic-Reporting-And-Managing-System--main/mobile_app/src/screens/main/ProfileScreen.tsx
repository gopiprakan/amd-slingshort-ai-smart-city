import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
  Modal,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useDispatch, useSelector} from 'react-redux';
import {RootState, AppDispatch} from '../../store/store';
import {logout, updateUser} from '../../store/slices/authSlice';
import {COLORS, TYPOGRAPHY, SPACING} from '../../utils/constants';

const USER_PROFILE_KEY = 'user_profile';

const ProfileScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {user} = useSelector((state: RootState) => state.auth);

  const [editMode, setEditMode] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    name: '',
    email: '',
  });
  const [notifications, setNotifications] = useState({
    pushNotifications: true,
    emailUpdates: true,
    smsAlerts: false,
    communityUpdates: true,
  });
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const savedProfileRaw = await AsyncStorage.getItem(USER_PROFILE_KEY);

      if (savedProfileRaw) {
        const savedProfile = JSON.parse(savedProfileRaw);
        setEditedProfile({
          name: savedProfile.name || '',
          email: savedProfile.email || '',
        });

        // Keep profile available globally for other screens like Home.
        dispatch(updateUser({name: savedProfile.name, email: savedProfile.email}));
        return;
      }

      setEditedProfile({
        name: user?.name || '',
        email: user?.email || '',
      });
    } catch (error) {
      setEditedProfile({
        name: user?.name || '',
        email: user?.email || '',
      });
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Logout', style: 'destructive', onPress: () => dispatch(logout())},
    ]);
  };

  const handleSaveProfile = async () => {
    const cleanName = editedProfile.name.trim();
    const cleanEmail = editedProfile.email.trim();

    if (!cleanName) {
      Alert.alert('Validation', 'Name is required');
      return;
    }

    if (!cleanEmail) {
      Alert.alert('Validation', 'Email is required');
      return;
    }

    const profileToSave = {
      name: cleanName,
      email: cleanEmail,
    };

    try {
      await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profileToSave));
      dispatch(updateUser(profileToSave));
      setEditedProfile(profileToSave);
      setEditMode(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile');
    }
  };

  const displayName = editedProfile.name.trim() || 'Guest';
  const displayEmail = editedProfile.email.trim() || 'Not set';

  const renderUserHeader = () => (
    <View style={styles.userHeader}>
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{displayName}</Text>
        <Text style={styles.userEmail}>{displayEmail}</Text>
        <View style={styles.userBadge}>
          <Text style={styles.userBadgeText}>Local Profile</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.editButton} onPress={() => setEditMode(true)}>
        <Text style={styles.editButtonText}>Edit</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSettings = () => (
    <View style={styles.section}>
      <TouchableOpacity style={styles.settingsHeader} onPress={() => setShowSettings(!showSettings)}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <Text style={styles.settingsToggle}>{showSettings ? 'v' : '>'}</Text>
      </TouchableOpacity>

      {showSettings && (
        <View style={styles.settingsContent}>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Push Notifications</Text>
            <Switch
              value={notifications.pushNotifications}
              onValueChange={(value) => setNotifications(prev => ({...prev, pushNotifications: value}))}
            />
          </View>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Email Updates</Text>
            <Switch
              value={notifications.emailUpdates}
              onValueChange={(value) => setNotifications(prev => ({...prev, emailUpdates: value}))}
            />
          </View>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>SMS Alerts</Text>
            <Switch
              value={notifications.smsAlerts}
              onValueChange={(value) => setNotifications(prev => ({...prev, smsAlerts: value}))}
            />
          </View>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Community Updates</Text>
            <Switch
              value={notifications.communityUpdates}
              onValueChange={(value) => setNotifications(prev => ({...prev, communityUpdates: value}))}
            />
          </View>
        </View>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Ionicons name="person-circle-outline" size={28} color={COLORS.white} />
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        <Text style={styles.headerSubtitle}>Manage your account settings</Text>
      </View>

      {renderUserHeader()}
      {renderSettings()}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity style={styles.accountAction}>
          <Text style={styles.accountActionText}>Change Password</Text>
          <Text style={styles.accountActionArrow}>></Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.accountAction}>
          <Text style={styles.accountActionText}>Privacy Settings</Text>
          <Text style={styles.accountActionArrow}>></Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.accountAction}>
          <Text style={styles.accountActionText}>Help & Support</Text>
          <Text style={styles.accountActionArrow}>></Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.versionText}>Resolve360 v2.0</Text>
      </View>

      <Modal visible={editMode} animationType="slide" transparent onRequestClose={() => setEditMode(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setEditMode(false)}>
                <Text style={styles.closeButtonText}>X</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editedProfile.name}
                  onChangeText={(text) => setEditedProfile(prev => ({...prev, name: text}))}
                  placeholder="Enter your name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editedProfile.email}
                  onChangeText={(text) => setEditedProfile(prev => ({...prev, email: text}))}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setEditMode(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSaveProfile}>
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  },
  headerSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.white,
    opacity: 0.9,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    margin: SPACING.md,
    marginTop: -SPACING.lg,
    padding: SPACING.lg,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    ...TYPOGRAPHY.h1,
    color: COLORS.white,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  userEmail: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  userBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  userBadgeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  editButton: {
    minWidth: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
  },
  editButtonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  section: {
    margin: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingsToggle: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
  },
  settingsContent: {
    marginTop: SPACING.md,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  accountAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  accountActionText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  accountActionArrow: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  logoutButton: {
    backgroundColor: COLORS.error,
    margin: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.white,
  },
  footer: {
    alignItems: 'center',
    padding: SPACING.lg,
  },
  versionText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
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
  modalBody: {
    padding: SPACING.lg,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    marginBottom: SPACING.sm,
    fontWeight: '500',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  modalButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.border,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  cancelButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  saveButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.white,
    fontWeight: '600',
  },
});

export default ProfileScreen;
