import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import workspaceReducer from './workspaceSlice';
import simulatorReducer from './simulatorSlice';

export const store = configureStore({
  reducer: {
    workspace: workspaceReducer,
    simulator: simulatorReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
