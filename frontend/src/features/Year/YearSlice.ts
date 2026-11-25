import { createSlice } from "@reduxjs/toolkit";
import type { Year } from "./type";

export const emptyCompetitionState: Year = {
  yearID: 0,
  yearName: "",
  yearNumber: 0,
};

export const yearSlice = createSlice({
  name: "year",
  initialState: emptyCompetitionState,
  reducers: {
    setYear: (state, action) => {
      state.yearID = action.payload.yearID;
      state.yearName = action.payload.yearName;
      state.yearNumber = action.payload.yearNumber;
    },
  },
});

export const { setYear } = yearSlice.actions;
export const yearReducer = yearSlice.reducer;
