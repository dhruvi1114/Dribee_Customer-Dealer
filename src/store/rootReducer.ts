import { combineReducers } from '@reduxjs/toolkit';

import authReducer from '@/store/slices/authSlice';
import locationReducer from '@/store/slices/locationSlice';
import notificationsReducer from '@/store/slices/notificationsSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  location: locationReducer,
  notifications: notificationsReducer,
});

export default rootReducer;
