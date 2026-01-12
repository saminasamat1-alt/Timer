
import { useState, useEffect, useRef, useCallback } from 'react';
import { SessionType } from '../types';
import { WORK_DURATION, BREAK_DURATION } from '../constants';

const TIMER_STATE_KEY = 'focusFlowTimerState';

interface TimerState {
  timeLeft: number;
  sessionType: SessionType;
  isActive: boolean;
  timestamp: number;
}

interface UseTimerProps {
  onSessionEnd: (completedSession: SessionType) => void;
}

export const useTimer = ({ onSessionEnd }: UseTimerProps) => {
  const [sessionType, setSessionType] = useState<SessionType>(SessionType.WORK);
  const [timeLeft, setTimeLeft] = useState(WORK_DURATION);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const saveState = useCallback(() => {
    try {
      const state: TimerState = {
        timeLeft,
        sessionType,
        isActive,
        timestamp: Date.now(),
      };
      localStorage.setItem(TIMER_STATE_KEY, JSON.stringify(state));
    } catch (error) {
        console.error("Could not save timer state to localStorage", error);
    }
  }, [timeLeft, sessionType, isActive]);
  
  useEffect(() => {
    // Load and sync state from localStorage on initial mount
    try {
        const savedStateJSON = localStorage.getItem(TIMER_STATE_KEY);
        if (savedStateJSON) {
            const savedState: TimerState = JSON.parse(savedStateJSON);
            
            setSessionType(savedState.sessionType);
            setIsActive(savedState.isActive);

            if (savedState.isActive) {
                const elapsedSeconds = Math.floor((Date.now() - savedState.timestamp) / 1000);
                const newTimeLeft = savedState.timeLeft - elapsedSeconds;

                if (newTimeLeft > 0) {
                    setTimeLeft(newTimeLeft);
                } else {
                    setTimeLeft(0);
                    onSessionEnd(savedState.sessionType);
                }
            } else {
                setTimeLeft(savedState.timeLeft);
            }
        }
    } catch (error) {
        console.error("Could not load timer state from localStorage", error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  useEffect(() => {
    if (isActive) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive]);

  useEffect(() => {
    if (timeLeft <= 0 && isActive) {
      setIsActive(false);
      onSessionEnd(sessionType);
    }
    saveState();
  }, [timeLeft, isActive, sessionType, onSessionEnd, saveState]);

  const start = useCallback(() => {
    setIsActive(true);
  }, []);

  const pause = useCallback(() => {
    setIsActive(false);
  }, []);

  const reset = useCallback(() => {
    setIsActive(false);
    setTimeLeft(sessionType === SessionType.WORK ? WORK_DURATION : BREAK_DURATION);
  }, [sessionType]);

  const switchSession = useCallback((newSessionType: SessionType) => {
    setSessionType(newSessionType);
    setTimeLeft(newSessionType === SessionType.WORK ? WORK_DURATION : BREAK_DURATION);
    setIsActive(true); // Automatically start the next session
  }, []);

  return { timeLeft, sessionType, isActive, start, pause, reset, switchSession };
};
