// Singleton audio instance for notification sounds
let notificationSound: HTMLAudioElement | null = null
let isAudioInitialized = false
let userHasInteracted = false
let audioContext: AudioContext | null = null

// Programmatically create a simple beep sound as fallback
function createBeepSound(): Promise<HTMLAudioElement> {
  return new Promise((resolve, reject) => {
    try {
      // Create AudioContext if not available
      if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      }

      // Create a simple beep using Web Audio API
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime) // 800Hz beep
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
      
      // Create a fake audio element that plays the beep
      const fakeAudio = {
        play: () => {
          return new Promise<void>((playResolve) => {
            const osc = audioContext!.createOscillator()
            const gain = audioContext!.createGain()
            
            osc.connect(gain)
            gain.connect(audioContext!.destination)
            
            osc.frequency.setValueAtTime(800, audioContext!.currentTime)
            osc.type = 'sine'
            
            gain.gain.setValueAtTime(0, audioContext!.currentTime)
            gain.gain.linearRampToValueAtTime(0.3, audioContext!.currentTime + 0.01)
            gain.gain.exponentialRampToValueAtTime(0.01, audioContext!.currentTime + 0.3)
            
            osc.start(audioContext!.currentTime)
            osc.stop(audioContext!.currentTime + 0.3)
            
            setTimeout(() => playResolve(), 300)
          })
        },
        pause: () => {},
        currentTime: 0,
        volume: 0.5,
        src: 'programmatic-beep'
      } as HTMLAudioElement
      
      resolve(fakeAudio)
    } catch (error) {
      reject(error)
    }
  })
}

// Initialize audio on user interaction
function initializeAudio() {
  if (typeof window === 'undefined') {
    console.log('[Sound] Window is undefined, cannot initialize audio')
    return false
  }
  
  try {
    if (!notificationSound) {
      console.log('[Sound] Creating new audio element')
      
      // Try multiple audio sources for better compatibility
      const audioSources = [
        "/notification-sound.mp3",
        "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyu2keFDaLzPDMjS8EKGq+7+OTTxULTKXj9o8lBjiQ1/LKeicFJHfH8N+UQwQZaLvw6q1VFg9Hntz0tm0gEjWO0vDPfywHL2m77+OQQgUYar3v3Z5OFg5RpOL2iSYGOIzK8t9hGgUzdsfz54lNBQ5SpeP2giMGNYTE6OGJWAwQUMXs54lJBQ1Cn9nzx3kpBjWIyvTBeSAFM3rN+NeuTwsNUaLl+YsiBzhzxujkklIRDUttz3o7CTJ2uvLcn1IOElSn4vaaXwUN" // Simple beep as data URL
      ]
      
      // Try loading the main audio file first
      const tryAudioSource = (src: string): Promise<HTMLAudioElement> => {
        return new Promise((resolve, reject) => {
          const audio = new Audio()
          audio.volume = 0.5
          audio.preload = 'auto'
          
          const onLoad = () => {
            console.log('[Sound] Audio loaded successfully:', src)
            cleanup()
            resolve(audio)
          }
          
          const onError = (error: any) => {
            console.log('[Sound] Audio failed to load:', src, error)
            cleanup()
            reject(error)
          }
          
          const cleanup = () => {
            audio.removeEventListener('canplaythrough', onLoad)
            audio.removeEventListener('error', onError)
          }
          
          audio.addEventListener('canplaythrough', onLoad, { once: true })
          audio.addEventListener('error', onError, { once: true })
          
          audio.src = src
        })
      }
      
      // Try sources in order, fallback to programmatic beep
      const loadAudio = async () => {
        for (const src of audioSources) {
          try {
            notificationSound = await tryAudioSource(src)
            console.log('[Sound] Successfully loaded audio from:', src)
            break
          } catch (error) {
            console.log('[Sound] Failed to load audio from:', src)
            continue
          }
        }
        
        // If all audio sources fail, create programmatic beep
        if (!notificationSound) {
          console.log('[Sound] All audio sources failed, creating programmatic beep')
          try {
            notificationSound = await createBeepSound()
            console.log('[Sound] Programmatic beep created successfully')
          } catch (error) {
            console.error('[Sound] Failed to create programmatic beep:', error)
            return false
          }
        }
        
        // Set up event listeners for real audio elements
        if (notificationSound && notificationSound.src !== 'programmatic-beep') {
          notificationSound.addEventListener('loadeddata', () => {
            console.log('[Sound] Audio data loaded')
          })
          
          notificationSound.addEventListener('play', () => {
            console.log('[Sound] Audio started playing')
          })

          notificationSound.addEventListener('ended', () => {
            console.log('[Sound] Audio finished playing')
          })
        }
        
        isAudioInitialized = true
        return true
      }
      
      // Load audio asynchronously
      loadAudio()
    }
    
    // Try to initialize AudioContext for better browser support
    if (!audioContext) {
      try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        console.log('[Sound] AudioContext created:', audioContext.state)
      } catch (e) {
        console.log('[Sound] AudioContext not available:', e)
      }
    }
    
    console.log('[Sound] Audio initialization complete')
    return true
  } catch (error) {
    console.error("[Sound] Error initializing notification sound:", error)
    return false
  }
}



// Handle user interaction to enable audio
export function enableAudioOnUserInteraction() {
  if (typeof window === 'undefined') return
  
  const enableAudio = async () => {
    console.log('[Sound] User interaction detected, enabling audio')
    userHasInteracted = true
    initializeAudio()
    
    // Resume AudioContext if it exists and is suspended
    if (audioContext && audioContext.state === 'suspended') {
      try {
        await audioContext.resume()
        console.log('[Sound] AudioContext resumed')
      } catch (e) {
        console.log('[Sound] Failed to resume AudioContext:', e)
      }
    }
    
    // Try to play a silent sound to "unlock" audio
    if (notificationSound) {
      try {
        const originalVolume = notificationSound.volume
        notificationSound.volume = 0
        notificationSound.currentTime = 0
        
        const playPromise = notificationSound.play()
        if (playPromise) {
          await playPromise
          notificationSound.pause()
          notificationSound.currentTime = 0
          notificationSound.volume = originalVolume
          console.log('[Sound] Audio unlocked successfully')
        }
      } catch (error) {
        console.log("[Sound] Audio context not yet unlocked:", error)
      }
    }
    
    // Remove event listeners after first interaction
    document.removeEventListener('click', enableAudio)
    document.removeEventListener('keydown', enableAudio)
    document.removeEventListener('touchstart', enableAudio)
  }
  
  // Add event listeners for user interaction
  document.addEventListener('click', enableAudio, { once: true })
  document.addEventListener('keydown', enableAudio, { once: true })
  document.addEventListener('touchstart', enableAudio, { once: true })
}

export async function playNotificationSound() {
  if (typeof window === 'undefined') return
  
  console.log('[Sound] playNotificationSound called')
  
  try {
    // Initialize audio if not already done
    if (!notificationSound) {
      console.log('[Sound] Audio not initialized, initializing now')
      if (!initializeAudio()) {
        console.warn("[Sound] Failed to initialize notification sound")
        return
      }
      // Wait a bit for async initialization
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    // Check if sound is enabled
    if (!isSoundEnabled()) {
      console.log("[Sound] Notification sound is disabled in settings")
      return
    }
    
    // Check if user has interacted (required for autoplay)
    if (!userHasInteracted) {
      console.warn("[Sound] Cannot play notification sound: User has not interacted with the page yet")
      // Set up interaction listeners if not already done
      enableAudioOnUserInteraction()
      return
    }
    
    // Resume AudioContext if suspended
    if (audioContext && audioContext.state === 'suspended') {
      try {
        await audioContext.resume()
        console.log('[Sound] AudioContext resumed for playback')
      } catch (e) {
        console.log('[Sound] Failed to resume AudioContext:', e)
      }
    }
    
    // Attempt playback with fallback
    await attemptPlaybackWithFallback()
    
  } catch (error) {
    console.error("[Sound] Error in playNotificationSound:", error)
  }
}

async function attemptPlaybackWithFallback() {
  if (!notificationSound) return
  
  console.log('[Sound] Attempting to play notification sound')
  
  // Reset audio to beginning (if it's a real audio element)
  if (notificationSound.src !== 'programmatic-beep') {
    notificationSound.currentTime = 0
  }
  
  try {
    const playPromise = notificationSound.play()
    if (playPromise !== undefined) {
      await playPromise
      console.log("[Sound] Notification sound played successfully")
    }
  } catch (error: any) {
    console.error("[Sound] Failed to play notification sound:", error)
    
    // If it's an autoplay error, try to set up user interaction
    if (error.name === 'NotAllowedError') {
      console.warn("[Sound] Autoplay blocked - waiting for user interaction")
      userHasInteracted = false // Reset the flag
      enableAudioOnUserInteraction()
      return
    }
    
    // Try fallback beep if main sound fails and it's not already a beep
    if (notificationSound.src !== 'programmatic-beep') {
      console.log('[Sound] Trying fallback beep')
      try {
        const fallbackBeep = await createBeepSound()
        await fallbackBeep.play()
        console.log('[Sound] Fallback beep played successfully')
      } catch (fallbackError) {
        console.error('[Sound] Fallback beep also failed:', fallbackError)
      }
    }
  }
}

// Function to check if sound is enabled in user preferences
export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true
  
  try {
    const setting = localStorage.getItem("notificationSound")
    const enabled = setting !== "disabled"
    console.log('[Sound] Sound enabled check:', enabled)
    return enabled
  } catch {
    return true // Default to enabled if localStorage is not available
  }
}

// Function to toggle sound preference
export function toggleNotificationSound(enabled: boolean) {
  if (typeof window === 'undefined') return
  
  console.log('[Sound] Toggling sound to:', enabled)
  
  try {
    if (enabled) {
      localStorage.removeItem("notificationSound")
    } else {
      localStorage.setItem("notificationSound", "disabled")
    }
  } catch (error) {
    console.error("Error saving sound preference:", error)
  }
}

// Function to test the notification sound
export function testNotificationSound(): Promise<boolean> {
  return new Promise(async (resolve) => {
    console.log('[Sound] Test notification sound called')
    
    if (typeof window === 'undefined') {
      console.log('[Sound] Window undefined, test failed')
      resolve(false)
      return
    }
    
    // Force user interaction detection
    userHasInteracted = true
    
    if (!notificationSound) {
      console.log('[Sound] Initializing audio for test')
      if (!initializeAudio()) {
        console.log('[Sound] Failed to initialize audio')
        resolve(false)
        return
      }
      
      // Wait for audio to load asynchronously
      console.log('[Sound] Waiting for audio to load...')
      let attempts = 0
      const maxAttempts = 50 // 5 seconds max
      
      while (!notificationSound && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100))
        attempts++
      }
      
      if (!notificationSound) {
        console.log('[Sound] Audio failed to load after waiting')
        resolve(false)
        return
      }
      
      console.log('[Sound] Audio loaded successfully after', attempts * 100, 'ms')
    }
    
    // Check if sound is enabled
    if (!isSoundEnabled()) {
      console.log('[Sound] Sound is disabled, enabling it for test')
      toggleNotificationSound(true)
    }
    
    if (notificationSound) {
      console.log('[Sound] Starting test playback')
      const originalVolume = notificationSound.volume
      notificationSound.volume = 0.3 // Slightly lower for testing
      notificationSound.currentTime = 0
      
      // Set up success/failure handlers
      const onPlay = () => {
        console.log('[Sound] Test sound started playing')
        setTimeout(() => {
          if (notificationSound) {
            notificationSound.volume = originalVolume
          }
        }, 100)
        cleanup()
        resolve(true)
      }
      
      const onError = (error: Event) => {
        console.error('[Sound] Test sound failed:', error)
        if (notificationSound) {
          notificationSound.volume = originalVolume
        }
        cleanup()
        resolve(false)
      }
      
      const cleanup = () => {
        if (notificationSound) {
          notificationSound.removeEventListener('play', onPlay)
          notificationSound.removeEventListener('error', onError)
        }
      }
      
      // Add event listeners
      notificationSound.addEventListener('play', onPlay, { once: true })
      notificationSound.addEventListener('error', onError, { once: true })
      
      // Attempt to play
      const playPromise = notificationSound.play()
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('[Sound] Test playback promise resolved')
            // onPlay handler will be called
          })
          .catch((error) => {
            console.error('[Sound] Test playback promise rejected:', error)
            cleanup()
            notificationSound!.volume = originalVolume
            resolve(false)
          })
      } else {
        console.log('[Sound] Play method returned undefined')
        cleanup()
        notificationSound.volume = originalVolume
        resolve(false)
      }
    } else {
      console.log('[Sound] No audio element available')
      resolve(false)
    }
  })
}

// Debug function to check audio state
export function getAudioDebugInfo() {
  return {
    hasAudio: !!notificationSound,
    isInitialized: isAudioInitialized,
    userInteracted: userHasInteracted,
    soundEnabled: isSoundEnabled(),
    audioContextState: audioContext?.state,
    audioSrc: notificationSound?.src,
    audioVolume: notificationSound?.volume,
    audioReadyState: notificationSound?.readyState,
    audioError: notificationSound?.error
  }
}

// Initialize on import
if (typeof window !== 'undefined') {
  console.log('[Sound] Setting up audio system')
  
  // Set up audio initialization on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('[Sound] DOM loaded, setting up user interaction handlers')
      enableAudioOnUserInteraction()
    })
  } else {
    console.log('[Sound] DOM already loaded, setting up user interaction handlers')
    enableAudioOnUserInteraction()
  }

  // Add global debug function for console access
  (window as any).debugSound = () => {
    const debugInfo = getAudioDebugInfo()
    console.log('🔊 Sound Debug Information:')
    console.table(debugInfo)
    
    if (debugInfo.audioError) {
      console.error('🚨 Audio Error Details:', debugInfo.audioError)
    }
    
    console.log('💡 Tips:')
    console.log('- Try calling window.testSound() to test audio')
    console.log('- Check that /notification-sound.mp3 is accessible')
    console.log('- Ensure you have interacted with the page (clicked somewhere)')
    
    return debugInfo
  }

  // Add global test function for console access
  (window as any).testSound = async () => {
    console.log('🔊 Testing notification sound...')
    try {
      const result = await testNotificationSound()
      console.log(result ? '✅ Test successful!' : '❌ Test failed!')
      return result
    } catch (error) {
      console.error('❌ Test error:', error)
      return false
    }
  }

  console.log('🔊 Sound system ready! Use window.debugSound() or window.testSound() in console for debugging')
} 