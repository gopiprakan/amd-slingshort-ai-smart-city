import type {StackScreenProps} from '@react-navigation/stack';
import type {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import type {CompositeScreenProps} from '@react-navigation/native';
import {Issue} from './index';

// Auth Stack Navigation Types
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

// Main Tab Navigation Types
export type MainTabParamList = {
  Home: undefined;
  ReportIssue: undefined;
  MyReports: undefined;
  Map: undefined;
  Profile: undefined;
};

// Issue Stack Navigation Types
export type IssueStackParamList = {
  IssueDetail: {issueId: string};
  EditIssue: {issue: Issue};
  IssueComments: {issueId: string};
};

// Root Stack Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  IssueStack: undefined;
  Onboarding: undefined;
};

// Screen Props Types
export type AuthScreenProps<T extends keyof AuthStackParamList> = 
  StackScreenProps<AuthStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = 
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    StackScreenProps<RootStackParamList>
  >;

export type IssueScreenProps<T extends keyof IssueStackParamList> = 
  StackScreenProps<IssueStackParamList, T>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
