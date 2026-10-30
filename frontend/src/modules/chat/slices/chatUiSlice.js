import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  selectedDocIds: [],
  activeConversationId: null,
  activeCitation: null,
  draftQuestion: '',
};

export const chatUiSlice = createSlice({
  name: 'chatUi',
  initialState,
  reducers: {
    setSelectedDocIds: (state, action) => {
      state.selectedDocIds = Array.isArray(action.payload) ? action.payload : [];
    },
    toggleDocSelection: (state, action) => {
      const docId = action.payload;
      if (state.selectedDocIds.includes(docId)) {
        state.selectedDocIds = state.selectedDocIds.filter((id) => id !== docId);
      } else {
        state.selectedDocIds.push(docId);
      }
    },
    selectAllDocs: (state, action) => {
      state.selectedDocIds = Array.isArray(action.payload) ? action.payload : [];
    },
    clearDocSelection: (state) => {
      state.selectedDocIds = [];
    },
    setActiveConversationId: (state, action) => {
      state.activeConversationId = action.payload;
    },
    setActiveCitation: (state, action) => {
      state.activeCitation = action.payload;
    },
    clearActiveCitation: (state) => {
      state.activeCitation = null;
    },
    setDraftQuestion: (state, action) => {
      state.draftQuestion = action.payload || '';
    },
  },
});

export const {
  setSelectedDocIds,
  toggleDocSelection,
  selectAllDocs,
  clearDocSelection,
  setActiveConversationId,
  setActiveCitation,
  clearActiveCitation,
  setDraftQuestion,
} = chatUiSlice.actions;

export const selectSelectedDocIds = (state) => state.chatUi.selectedDocIds;
export const selectActiveConversationId = (state) => state.chatUi.activeConversationId;
export const selectActiveCitation = (state) => state.chatUi.activeCitation;
export const selectDraftQuestion = (state) => state.chatUi.draftQuestion;

export default chatUiSlice.reducer;

