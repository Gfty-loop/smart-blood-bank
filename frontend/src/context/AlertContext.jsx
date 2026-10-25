import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const AlertContext = createContext(null);

export function AlertProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchAlerts = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/alerts');
      setAlerts(res.data.alerts || []);
      setUnreadCount(res.data.unread_count || 0);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchAlerts();
    // Poll every 45s for live alerts
    const interval = setInterval(fetchAlerts, 45000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const markAsRead = async (alertId) => {
    try {
      await api.put(`/alerts/${alertId}/read`);
      setAlerts(prev => prev.map(a => a.alert_id === alertId ? { ...a, is_read: 1 } : a));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark alert as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/alerts/mark-all-read');
      setAlerts(prev => prev.map(a => ({ ...a, is_read: 1 })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const triggerScan = async () => {
    setLoading(true);
    try {
      const res = await api.post('/alerts/trigger-check');
      await fetchAlerts();
      return res.data;
    } catch (err) {
      console.error('Failed to trigger scan:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertContext.Provider
      value={{
        alerts,
        unreadCount,
        loading,
        fetchAlerts,
        markAsRead,
        markAllAsRead,
        triggerScan
      }}
    >
      {children}
    </AlertContext.Provider>
  );
}

export function useAlerts() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlerts must be used within an AlertProvider');
  }
  return context;
}
