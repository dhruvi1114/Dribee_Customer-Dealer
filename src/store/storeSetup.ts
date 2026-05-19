import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';

import { mmkvStorage } from '@/lib/mmkv';
import rootReducer from '@/store/rootReducer';

import type { Middleware } from '@reduxjs/toolkit';

const persistConfig = {
  key: 'root',
  storage: mmkvStorage,
  whitelist: ['auth', 'location'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const middlewares: Middleware[] = [];

if (__DEV__) {
  // Add dev-only middleware here if needed
}

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(middlewares),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
