import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import {COLORS, TYPOGRAPHY, SPACING} from '../../utils/constants';
import { submitReport } from '../../services/api';

interface IssueData {
  title: string;
  description: string;
  priority: string;
  images: string[];
  location: {
    latitude: number;
    longitude: number;
    address: string;
  } | null;
}

const PRIORITIES = [
  {id: 'low', name: 'Low', color: '#4CAF50'},
  {id: 'medium', name: 'Medium', color: '#FF9800'},
  {id: 'high', name: 'High', color: '#F44336'},
  {id: 'critical', name: 'Critical', color: '#9C27B0'},
];

const ReportIssueScreen: React.FC = () => {
  const [issueData, setIssueData] = useState<IssueData>({
    title: '',
    description: '',
    priority: 'medium', // Default priority - citizens don't choose
    images: [],
    location: null,
  });
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      const {status} = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to report issues');
        setLocationLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const addressObj = address[0];
      let formattedAddress = 'Unknown location';
      
      if (addressObj) {
        const parts = [];
        if (addressObj.name) parts.push(addressObj.name);
        if (addressObj.street) parts.push(addressObj.street);
        if (addressObj.district) parts.push(addressObj.district);
        if (addressObj.city) parts.push(addressObj.city);
        if (addressObj.region) parts.push(addressObj.region);
        
        formattedAddress = parts.length > 0 ? parts.join(', ') : 'Unknown location';
      }
      
      console.log('Location data:', {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        rawAddress: addressObj,
        formattedAddress
      });

      setIssueData(prev => ({
        ...prev,
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          address: formattedAddress,
        },
      }));
    } catch (error) {
      Alert.alert('Error', 'Failed to get current location');
    }
    setLocationLoading(false);
  };

  const pickImage = async () => {
    const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Camera permission is required to add photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setIssueData(prev => ({
        ...prev,
        images: [...prev.images, result.assets[0].uri],
      }));
    }
  };

  const takePhoto = async () => {
    const {status} = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Camera permission is required to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setIssueData(prev => ({
        ...prev,
        images: [...prev.images, result.assets[0].uri],
      }));
    }
  };

  const removeImage = (index: number) => {
    setIssueData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const submitIssue = async () => {
    console.log('Submitting report data:', {
      title: issueData.title,
      priority: issueData.priority,
      location: issueData.location,
      description: issueData.description
    });
    if (!issueData.title.trim()) {
      Alert.alert('Error', 'Please enter an issue title');
      return;
    }
    if (!issueData.location) {
      Alert.alert('Error', 'Please enable location access');
      return;
    }

    setLoading(true);
    
    try {
      // Department/category is now classified automatically by backend AI.
      const result = await submitReport(issueData as any);
      setLoading(false);
      
      if (result.success) {
        Alert.alert(
          'Success!',
          'Your issue has been reported successfully. You will receive updates on its progress.',
          [
            {
              text: 'OK',
              onPress: () => {
                setIssueData({
                  title: '',
                  description: '',
                  priority: 'medium',
                  images: [],
                  location: issueData.location,
                });
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to submit report. Please try again.');
      }
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Network error. Please check your connection.');
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="create-outline" size={28} color={COLORS.white} />
          <Text style={styles.title}>Report New Issue</Text>
        </View>
        <Text style={styles.subtitle}>Help improve your community</Text>
      </View>

      {/* Location Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="location-outline" size={22} color={COLORS.text} />
          <Text style={styles.sectionTitle}>Location</Text>
        </View>
        {locationLoading ? (
          <View style={styles.locationLoading}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.locationText}>Getting your location...</Text>
          </View>
        ) : issueData.location ? (
          <View style={styles.locationContainer}>
            <Text style={styles.locationText}>{issueData.location.address}</Text>
            <TouchableOpacity onPress={getCurrentLocation} style={styles.refreshButton}>
              <View style={styles.inlineRow}>
                <Ionicons name="refresh-outline" size={16} color={COLORS.primary} />
                <Text style={styles.refreshText}>Refresh</Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={getCurrentLocation} style={styles.locationButton}>
            <View style={styles.inlineRow}>
              <Ionicons name="location-outline" size={18} color={COLORS.white} />
              <Text style={styles.locationButtonText}>Get Current Location</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Title Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="list-outline" size={22} color={COLORS.text} />
          <Text style={styles.sectionTitle}>Issue Title</Text>
        </View>
        <TextInput
          style={styles.input}
          placeholder="Brief description of the issue"
          value={issueData.title}
          onChangeText={text => setIssueData(prev => ({...prev, title: text}))}
          maxLength={100}
        />
      </View>

      {/* Photos Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="camera-outline" size={22} color={COLORS.text} />
          <Text style={styles.sectionTitle}>Photos</Text>
        </View>
        <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
          <View style={styles.inlineRow}>
            <Ionicons name="camera-outline" size={18} color={COLORS.white} />
            <Text style={styles.photoButtonText}>Take Photo</Text>
          </View>
        </TouchableOpacity>
        
        {issueData.images.length > 0 && (
          <View style={styles.imageGrid}>
            {issueData.images.map((uri, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{uri}} style={styles.image} />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeImage(index)}
                >
                  <Text style={styles.removeButtonText}>X</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Description Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="create-outline" size={22} color={COLORS.text} />
          <Text style={styles.sectionTitle}>Description</Text>
        </View>
        <TextInput
          style={styles.textArea}
          placeholder="Provide detailed description of the issue..."
          value={issueData.description}
          onChangeText={text => setIssueData(prev => ({...prev, description: text}))}
          multiline
          numberOfLines={4}
          maxLength={500}
        />
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={submitIssue}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={COLORS.white} />
        ) : (
          <View style={styles.inlineRow}>
            <Ionicons name="create-outline" size={18} color={COLORS.white} />
            <Text style={styles.submitButtonText}>Submit Issue Report</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.lg,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.white,
    opacity: 0.9,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  priorityRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  priorityCard: {
    flex: 1,
    padding: SPACING.md,
    borderWidth: 2,
    borderRadius: 8,
    alignItems: 'center',
  },
  priorityText: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
  },
  locationLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  locationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationText: {
    ...TYPOGRAPHY.body,
    flex: 1,
  },
  refreshButton: {
    padding: SPACING.sm,
  },
  refreshText: {
    color: COLORS.primary,
    fontSize: 14,
  },
  locationButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  locationButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  photoButton: {
    backgroundColor: COLORS.secondary,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  photoButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: COLORS.error,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    margin: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.white,
  },
  bottomPadding: {
    height: 50,
  },
});

export default ReportIssueScreen;
