
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTimer } from './hooks/useTimer';
import { SessionType } from './types';
import { WORK_DURATION, BREAK_DURATION } from './constants';

const NOTIFICATION_SOUND_URL = 'https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg';

// --- Reusable SVG Icons ---
const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
  </svg>
);

const PauseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

const ResetIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
  </svg>
);

const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
  </svg>
);

const SoundOnIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
    </svg>
);

const SoundOffIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);

// --- Child Components ---

interface TimerDisplayProps {
  timeLeft: number;
}
const TimerDisplay: React.FC<TimerDisplayProps> = ({ timeLeft }) => {
  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');
  return (
    <div className="text-8xl md:text-9xl font-bold text-slate-100 tracking-wider font-mono">
      <span>{minutes}</span>
      <span>:</span>
      <span>{seconds}</span>
    </div>
  );
};

interface ControlsProps {
  isActive: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  sessionType: SessionType;
}
const Controls: React.FC<ControlsProps> = ({ isActive, onStart, onPause, onReset, sessionType }) => {
  const buttonColor = sessionType === SessionType.WORK 
    ? 'bg-sky-500 hover:bg-sky-600 text-white'
    : 'bg-teal-500 hover:bg-teal-600 text-white';

  return (
    <div className="flex items-center justify-center space-x-6 mt-10">
      <button onClick={onReset} className="p-3 text-slate-400 hover:text-slate-200 transition-colors duration-200">
        <ResetIcon />
      </button>
      <button
        onClick={isActive ? onPause : onStart}
        className={`w-24 h-24 rounded-full flex items-center justify-center shadow-lg transform hover:scale-105 transition-all duration-200 ${buttonColor}`}
        aria-label={isActive ? 'Pause timer' : 'Start timer'}
      >
        {isActive ? <PauseIcon /> : <PlayIcon />}
      </button>
      <div className="w-6 h-6 p-3"></div> {/* Placeholder for symmetry */}
    </div>
  );
};

interface StatsProps {
  focusedMinutes: number;
}
const Stats: React.FC<StatsProps> = ({ focusedMinutes }) => (
  <div className="absolute bottom-4 left-4 text-sm text-slate-400 bg-black/20 px-3 py-1.5 rounded-lg">
    Today's focused minutes: <span className="font-bold text-slate-200">{focusedMinutes}</span>
  </div>
);

interface SettingsProps {
    soundEnabled: boolean;
    onSoundToggle: () => void;
    notificationsEnabled: boolean | null;
    onRequestNotifications: () => void;
}
const Settings: React.FC<SettingsProps> = ({ soundEnabled, onSoundToggle, notificationsEnabled, onRequestNotifications }) => (
    <div className="absolute top-4 right-4 flex flex-col sm:flex-row items-end sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
        <button
            onClick={onSoundToggle}
            className={`flex items-center px-3 py-1.5 rounded-full text-xs transition-colors duration-200 ${soundEnabled ? 'bg-white/20 text-white' : 'bg-black/20 text-slate-300 hover:bg-black/30'}`}
        >
           {soundEnabled ? <SoundOnIcon /> : <SoundOffIcon />} {soundEnabled ? 'Sound ON' : 'Sound OFF'}
        </button>
        {notificationsEnabled !== true && (
             <button
                onClick={onRequestNotifications}
                disabled={notificationsEnabled === true}
                className="flex items-center px-3 py-1.5 rounded-full text-xs bg-black/20 text-slate-300 hover:bg-black/30 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
             >
                <BellIcon /> Enable Notifications
             </button>
        )}
    </div>
);


// --- Main App Component ---

function App() {
  const [stats, setStats] = useState({ date: '', minutes: 0 });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const showNotification = (sessionType: SessionType) => {
    if (notificationPermission !== 'granted') return;
    const title = sessionType === SessionType.WORK ? 'Time for a break!' : 'Time to focus!';
    const body = sessionType === SessionType.WORK ? 'Great work! Your break session is starting.' : 'Your work session is starting now.';
    new Notification(title, { body });
  };
  
  const handleSessionEnd = useCallback((completedSession: SessionType) => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(e => console.error("Error playing sound:", e));
    }
    showNotification(completedSession);

    if (completedSession === SessionType.WORK) {
      setStats(prevStats => {
        const newMinutes = prevStats.minutes + Math.floor(WORK_DURATION / 60);
        const newStats = { ...prevStats, minutes: newMinutes };
        localStorage.setItem('focusFlowStats', JSON.stringify(newStats));
        return newStats;
      });
    }
    
    // Switch to the next session
    const nextSession = completedSession === SessionType.WORK ? SessionType.BREAK : SessionType.WORK;
    switchSession(nextSession);

  }, [soundEnabled, notificationPermission]); // `switchSession` will be from useTimer

  const { timeLeft, sessionType, isActive, start, pause, reset, switchSession } = useTimer({
      onSessionEnd: handleSessionEnd,
  });

  // Load stats and settings from localStorage on initial render
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    try {
      const storedStats = localStorage.getItem('focusFlowStats');
      if (storedStats) {
        const parsedStats = JSON.parse(storedStats);
        if (parsedStats.date === today) {
          setStats(parsedStats);
        } else {
          const newStats = { date: today, minutes: 0 };
          setStats(newStats);
          localStorage.setItem('focusFlowStats', JSON.stringify(newStats));
        }
      } else {
        const newStats = { date: today, minutes: 0 };
        setStats(newStats);
        localStorage.setItem('focusFlowStats', JSON.stringify(newStats));
      }
      
      if ('Notification' in window) {
        setNotificationPermission(Notification.permission);
      }

    } catch (error) {
      console.error("Failed to access localStorage:", error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update document title with timer
  useEffect(() => {
    const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const seconds = (timeLeft % 60).toString().padStart(2, '0');
    if (isActive) {
      document.title = `${minutes}:${seconds} - ${sessionType === SessionType.WORK ? 'Focus' : 'Break'} | FocusFlow`;
    } else {
      document.title = 'FocusFlow - Pomodoro Timer';
    }
  }, [timeLeft, isActive, sessionType]);

  const requestNotificationPermission = () => {
    if (!('Notification' in window)) {
        alert("This browser does not support desktop notification");
        return;
    }
    if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            setNotificationPermission(permission);
        });
    }
  };

  // --- Dynamic Styling ---
  const theme = {
    [SessionType.WORK]: {
        bg: 'bg-slate-900',
        timerCircle: 'bg-sky-900/40',
        label: 'Focus'
    },
    [SessionType.BREAK]: {
        bg: 'bg-teal-900',
        timerCircle: 'bg-teal-800/40',
        label: 'Break'
    }
  };
  const currentTheme = theme[sessionType];

  return (
    <div className={`min-h-screen w-full flex flex-col items-center justify-center p-4 relative antialiased transition-colors duration-1000 ${currentTheme.bg}`}>
      <div className={`w-full max-w-md mx-auto aspect-square rounded-full flex flex-col items-center justify-center transition-colors duration-500 ${currentTheme.timerCircle}`}>
        <div className="mb-4 text-lg font-semibold uppercase tracking-widest text-slate-300">
          {currentTheme.label}
        </div>
        <TimerDisplay timeLeft={timeLeft} />
      </div>
      
      <Controls isActive={isActive} onStart={start} onPause={pause} onReset={reset} sessionType={sessionType}/>

      <Stats focusedMinutes={stats.minutes} />
      <Settings 
        soundEnabled={soundEnabled}
        onSoundToggle={() => setSoundEnabled(prev => !prev)}
        notificationsEnabled={notificationPermission === 'granted'}
        onRequestNotifications={requestNotificationPermission}
      />
      
      <audio ref={audioRef} src={NOTIFICATION_SOUND_URL} preload="auto"></audio>
    </div>
  );
}

export default App;
