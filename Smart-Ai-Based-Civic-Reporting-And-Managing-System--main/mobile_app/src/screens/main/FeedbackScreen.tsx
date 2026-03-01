import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING } from '../../utils/constants';
import API_CONFIG from '../../config/api';

interface FeedbackScreenProps {
  route: {
    params: {
      reportId: string;
      taskId: string;
      reportTitle: string;
    };
  };
  navigation: any;
}

const FeedbackScreen: React.FC<FeedbackScreenProps> = ({ route, navigation }) => {
  const { reportId, taskId, reportTitle } = route.params;
  
  const [overallRating, setOverallRating] = useState(0);
  const [timeliness, setTimeliness] = useState(0);
  const [quality, setQuality] = useState(0);
  const [communication, setCommunication] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const StarRating = ({ rating, onRatingChange, label }: any) => (
    <View style={styles.ratingContainer}>
      <Text style={styles.ratingLabel}>{label}</Text>
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onRatingChange(star)}
            style={styles.starButton}
          >
            <Text style={[
              styles.star,
              { color: star <= rating ? COLORS.warning : COLORS.border }
            ]}>
              ★
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const submitFeedback = async () => {
    if (overallRating === 0) {
      Alert.alert('Rating Required', 'Please provide an overall rating.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(API_CONFIG.getUrl('/feedback'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportId,
          taskId,
          citizenId: 'citizen_001', // In real app, get from auth
          citizenName: 'John Doe', // In real app, get from auth
          rating: overallRating,
          comment: comment.trim(),
          serviceAspects: {
            timeliness,
            quality,
            communication,
          },
        }),
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert(
          'Thank You!',
          'Your feedback has been submitted successfully.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        throw new Error(result.error || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('❌ Failed to submit feedback:', error);
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Service Feedback</Text>
        <Text style={styles.subtitle}>
          How was your experience with the resolution of:
        </Text>
        <Text style={styles.reportTitle}>"{reportTitle}"</Text>
      </View>

      <View style={styles.content}>
        <StarRating
          rating={overallRating}
          onRatingChange={setOverallRating}
          label="Overall Satisfaction"
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rate Specific Aspects</Text>
          
          <StarRating
            rating={timeliness}
            onRatingChange={setTimeliness}
            label="Timeliness"
          />
          
          <StarRating
            rating={quality}
            onRatingChange={setQuality}
            label="Quality of Work"
          />
          
          <StarRating
            rating={communication}
            onRatingChange={setCommunication}
            label="Communication"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Comments</Text>
          <TextInput
            style={styles.commentInput}
            placeholder="Share your experience or suggestions..."
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.buttonDisabled]}
          onPress={submitFeedback}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </Text>
        </TouchableOpacity>
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
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  reportTitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: '600',
  },
  content: {
    padding: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  ratingContainer: {
    marginBottom: SPACING.lg,
  },
  ratingLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    marginBottom: SPACING.sm,
    fontWeight: '500',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  starButton: {
    padding: SPACING.xs,
  },
  star: {
    fontSize: 32,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.md,
    minHeight: 100,
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  submitButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.white,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default FeedbackScreen;