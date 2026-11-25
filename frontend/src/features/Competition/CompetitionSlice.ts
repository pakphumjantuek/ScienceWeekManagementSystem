import { createSlice } from "@reduxjs/toolkit";
import type { Competition } from "./type";

export const emptyCompetitionState: Competition = {
  competitionID: 0,
  competitionName: "",
  competitionTypeID: 0,
  coordinatorName: "",
  coordinatorPhone: "",
  requiresProject: false,
  competitionTypeName: "",
};

export const competitionSlice = createSlice({
  name: "competition",
  initialState: emptyCompetitionState,
  reducers: {
    setCompetition: (state, action) => {
      state.competitionID = action.payload.competitionID;
      state.competitionName = action.payload.competitionName;
      state.competitionTypeID = action.payload.competitionTypeID;
      state.coordinatorName = action.payload.coordinatorName;
      state.coordinatorPhone = action.payload.coordinatorPhone;
      state.requiresProject = action.payload.requiresProject;
      state.competitionTypeName = action.payload.competitionTypeName;
    },
  },
});

export const { setCompetition } = competitionSlice.actions;
export const competitionReducer = competitionSlice.reducer;
