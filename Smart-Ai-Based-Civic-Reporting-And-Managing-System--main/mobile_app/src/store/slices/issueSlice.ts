import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {Issue, IssueFilters, PaginatedResponse} from '@types/index';

interface IssueState {
  issues: Issue[];
  myIssues: Issue[];
  currentIssue: Issue | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  filters: IssueFilters;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

const initialState: IssueState = {
  issues: [],
  myIssues: [],
  currentIssue: null,
  isLoading: false,
  isSubmitting: false,
  error: null,
  filters: {},
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    hasMore: true,
  },
};

// Async thunks
export const fetchIssues = createAsyncThunk(
  'issues/fetchIssues',
  async (params: {page?: number; filters?: IssueFilters}, {rejectWithValue}) => {
    try {
      // TODO: Replace with actual API call
      const mockResponse: PaginatedResponse<Issue> = {
        data: [],
        total: 0,
        page: params.page || 1,
        limit: 10,
        hasMore: false,
      };
      return mockResponse;
    } catch (error) {
      return rejectWithValue('Failed to fetch issues');
    }
  }
);

export const fetchMyIssues = createAsyncThunk(
  'issues/fetchMyIssues',
  async (_, {rejectWithValue}) => {
    try {
      // TODO: Replace with actual API call
      const mockIssues: Issue[] = [];
      return mockIssues;
    } catch (error) {
      return rejectWithValue('Failed to fetch your issues');
    }
  }
);

export const createIssue = createAsyncThunk(
  'issues/createIssue',
  async (issueData: Omit<Issue, 'id' | 'createdAt' | 'updatedAt' | 'upvotes' | 'comments'>, {rejectWithValue}) => {
    try {
      // TODO: Replace with actual API call
      const newIssue: Issue = {
        ...issueData,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
        upvotes: 0,
        comments: [],
      };
      return newIssue;
    } catch (error) {
      return rejectWithValue('Failed to create issue');
    }
  }
);

export const updateIssue = createAsyncThunk(
  'issues/updateIssue',
  async (params: {id: string; updates: Partial<Issue>}, {rejectWithValue}) => {
    try {
      // TODO: Replace with actual API call
      const updatedIssue: Issue = {
        ...params.updates,
        id: params.id,
        updatedAt: new Date(),
      } as Issue;
      return updatedIssue;
    } catch (error) {
      return rejectWithValue('Failed to update issue');
    }
  }
);

export const deleteIssue = createAsyncThunk(
  'issues/deleteIssue',
  async (issueId: string, {rejectWithValue}) => {
    try {
      // TODO: Replace with actual API call
      return issueId;
    } catch (error) {
      return rejectWithValue('Failed to delete issue');
    }
  }
);

const issueSlice = createSlice({
  name: 'issues',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<IssueFilters>) => {
      state.filters = action.payload;
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    setCurrentIssue: (state, action: PayloadAction<Issue | null>) => {
      state.currentIssue = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetPagination: (state) => {
      state.pagination = {
        page: 1,
        limit: 10,
        total: 0,
        hasMore: true,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch issues cases
      .addCase(fetchIssues.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchIssues.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.page === 1) {
          state.issues = action.payload.data;
        } else {
          state.issues = [...state.issues, ...action.payload.data];
        }
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total,
          hasMore: action.payload.hasMore,
        };
      })
      .addCase(fetchIssues.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch my issues cases
      .addCase(fetchMyIssues.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMyIssues.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myIssues = action.payload;
      })
      .addCase(fetchMyIssues.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create issue cases
      .addCase(createIssue.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(createIssue.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.myIssues = [action.payload, ...state.myIssues];
        state.issues = [action.payload, ...state.issues];
      })
      .addCase(createIssue.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload as string;
      })
      // Update issue cases
      .addCase(updateIssue.fulfilled, (state, action) => {
        const index = state.issues.findIndex(issue => issue.id === action.payload.id);
        if (index !== -1) {
          state.issues[index] = action.payload;
        }
        const myIndex = state.myIssues.findIndex(issue => issue.id === action.payload.id);
        if (myIndex !== -1) {
          state.myIssues[myIndex] = action.payload;
        }
        if (state.currentIssue?.id === action.payload.id) {
          state.currentIssue = action.payload;
        }
      })
      // Delete issue cases
      .addCase(deleteIssue.fulfilled, (state, action) => {
        state.issues = state.issues.filter(issue => issue.id !== action.payload);
        state.myIssues = state.myIssues.filter(issue => issue.id !== action.payload);
        if (state.currentIssue?.id === action.payload) {
          state.currentIssue = null;
        }
      });
  },
});

export const {setFilters, clearFilters, setCurrentIssue, clearError, resetPagination} = issueSlice.actions;
export default issueSlice.reducer;