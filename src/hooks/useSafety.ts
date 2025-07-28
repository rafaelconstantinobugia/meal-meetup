import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SafetyChecklist {
  emergency_contact_shared: boolean;
  public_location_chosen: boolean;
  arrival_time_shared: boolean;
  friend_notified: boolean;
  transport_planned: boolean;
}

interface SafetySettings {
  enable_location_sharing: boolean;
  auto_check_in_time: number; // minutes
  emergency_contacts: string[];
  safety_preferences: string[];
}

export const useSafety = () => {
  const [safetySettings, setSafetySettings] = useState<SafetySettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completeSafetyChecklist = useCallback(async (
    matchId: string,
    checklist: SafetyChecklist
  ) => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('meetup_coordination')
        .upsert({
          match_id: matchId,
          emergency_contact_shared: checklist.emergency_contact_shared,
          safety_checklist_completed: Object.values(checklist).every(Boolean),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update safety checklist';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const shareLocation = useCallback(async (
    matchId: string,
    location: { latitude: number; longitude: number }
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Store location in a secure way for emergency contacts
      const { error } = await supabase.functions.invoke('share-safety-location', {
        body: {
          match_id: matchId,
          user_id: user.id,
          location: location,
          timestamp: new Date().toISOString()
        }
      });

      if (error) throw error;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to share location';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const scheduleCheckIn = useCallback(async (
    matchId: string,
    checkInTime: Date
  ) => {
    try {
      const { error } = await supabase.functions.invoke('schedule-safety-checkin', {
        body: {
          match_id: matchId,
          check_in_time: checkInTime.toISOString()
        }
      });

      if (error) throw error;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to schedule check-in';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const reportSafetyIssue = useCallback(async (
    matchId: string,
    issueType: string,
    description: string
  ) => {
    try {
      const { error } = await supabase.functions.invoke('report-safety-issue', {
        body: {
          match_id: matchId,
          issue_type: issueType,
          description: description,
          timestamp: new Date().toISOString()
        }
      });

      if (error) throw error;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to report safety issue';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  return {
    safetySettings,
    loading,
    error,
    completeSafetyChecklist,
    shareLocation,
    scheduleCheckIn,
    reportSafetyIssue
  };
};