import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  recordings: [],
  selectedClip: null,
  server: {
    ip: "",
    port: "",
  },
  model: null,
};

const audioSlice = createSlice({
  name: "audio",
  initialState,
  reducers: {
    addRecording: (state, action) => {
      state.recordings.push(action.payload);
    },
    removeRecording: (state, action) => {
      state.recordings = state.recordings.filter(
        (r) => r.name !== action.payload
      );
    },
    setServerInfo: (state, action) => {
      state.server = action.payload;
    },
    setSelectedClip: (state, action) => {
      state.selectedClip = action.payload;
    },
    setModel: (state, action) => {
      state.model = action.payload;
    },
  },
});

export const {
  addRecording,
  removeRecording,
  setServerInfo,
  setSelectedClip,
  setModel,
} = audioSlice.actions;

export default audioSlice.reducer;
