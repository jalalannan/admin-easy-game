# Notification Sounds

This directory contains notification sound files for different user types.

## Required Files

Place the following MP3 files in this directory:

- `tutor-notification.mp3` - Sound for tutor notifications
- `student-notification.mp3` - Sound for student notifications  
- `admin-notification.mp3` - Sound for admin notifications
- `default-notification.mp3` - Default notification sound

## File Requirements

- **Format**: MP3 (recommended) or WAV
- **Duration**: 1-3 seconds (short and pleasant)
- **Volume**: Moderate volume (not too loud)
- **Quality**: Good quality but small file size
- **File Size**: Keep under 100KB for fast loading

## Recommended Sound Types

### Tutor Notifications
- Professional, subtle sound
- Lower pitch/tone
- Examples: Soft bell, gentle chime, professional notification

### Student Notifications  
- Friendly, approachable sound
- Higher pitch/tone
- Examples: Light bell, cheerful chime, friendly notification

### Admin Notifications
- Authoritative but not harsh
- Medium pitch/tone
- Examples: Standard bell, notification tone, admin alert

### Default Notifications
- Neutral, pleasant sound
- Medium pitch/tone
- Examples: Standard notification sound, gentle beep

## Fallback System

If MP3 files are not available or fail to load, the system will automatically fall back to:
1. **Web Audio API generated sounds** (different frequencies for each type)
2. **Basic beep sounds** (final fallback)

## Testing

You can test the sounds by:
1. Opening the admin panel
2. Clicking the "Sound" button in the notifications dialog
3. Using the "Test Sounds" buttons for each type
4. Checking browser console for sound loading/playing logs

## Online Sound Resources

Here are some free sound resources you can use:

### Free Sound Websites:
- [Freesound.org](https://freesound.org/) - Creative Commons sounds
- [Zapsplat](https://www.zapsplat.com/) - Professional sound effects (free account)
- [BBC Sound Effects](https://sound-effects.bbcrewind.co.uk/) - BBC sound library
- [Adobe Audition](https://www.adobe.com/products/audition.html) - Professional audio editing

### Search Terms for Notification Sounds:
- "notification bell"
- "soft chime"
- "gentle alert"
- "notification sound"
- "bell ring"
- "message notification"
- "chat notification"
- "alert sound"

### Recommended Search Filters:
- Duration: 1-5 seconds
- License: Free to use / Creative Commons
- Format: MP3 or WAV
- Quality: High quality
- File Size: Small (< 100KB)

## Quick Setup

1. **Download sounds** from any of the above resources
2. **Rename files** to match the required names:
   - `tutor-notification.mp3`
   - `student-notification.mp3`
   - `admin-notification.mp3`
   - `default-notification.mp3`
3. **Place files** in this directory (`/public/sounds/`)
4. **Test sounds** using the sound settings in the admin panel

## Sound Settings

The admin panel includes a sound settings dialog where you can:
- Enable/disable notification sounds
- Adjust volume (0-100%)
- Test each sound type
- Configure sound preferences

Settings are automatically saved to your browser's localStorage.

## Troubleshooting

### No Sound Playing:
1. Check browser console for errors
2. Verify MP3 files are in the correct directory
3. Check file permissions and accessibility
4. Try different file formats (MP3 vs WAV)

### Sound Not Loading:
1. Check file size (should be < 100KB)
2. Verify file format compatibility
3. Check browser audio support
4. Try refreshing the page

### Volume Issues:
1. Use the sound settings to adjust volume
2. Check system volume levels
3. Verify browser audio permissions