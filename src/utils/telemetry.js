// Get client IP address
export const getClientIP = async () => {
  try {
    // Try multiple IP lookup services for redundancy
    const response = await fetch("https://api.ipify.org?format=json", {
      method: "GET",
    });
    const data = await response.json();
    return data.ip || "Unknown";
  } catch (error) {
    console.error("IP address olishda xato:", error);
    try {
      // Backup IP service
      const response = await fetch("https://ipinfo.io/json?token=YOUR_TOKEN");
      const data = await response.json();
      return data.ip || "Unknown";
    } catch (err) {
      return "Unknown";
    }
  }
};

// Get device name and user agent
export const getDeviceInfo = () => {
  const userAgent = navigator.userAgent;
  let deviceName = "Unknown";

  // Detect device type
  if (/android/i.test(userAgent)) {
    deviceName = "Android Device";
  } else if (/iphone|ipad|ipod/i.test(userAgent)) {
    deviceName = "Apple Device";
  } else if (/windows/i.test(userAgent)) {
    deviceName = `Windows ${getOSVersion(userAgent)}`;
  } else if (/macintosh|mac os x/i.test(userAgent)) {
    deviceName = "macOS Device";
  } else if (/linux/i.test(userAgent)) {
    deviceName = "Linux Device";
  }

  // Try to get browser name
  let browserName = "Unknown Browser";
  if (/chrome/i.test(userAgent)) browserName = "Chrome";
  else if (/firefox/i.test(userAgent)) browserName = "Firefox";
  else if (/safari/i.test(userAgent)) browserName = "Safari";
  else if (/edge/i.test(userAgent)) browserName = "Edge";

  return {
    deviceName: `${deviceName} - ${browserName}`,
    userAgent,
  };
};

// Helper to extract OS version
const getOSVersion = (userAgent) => {
  const match = userAgent.match(/Windows NT (\d+\.\d+)/);
  if (match) {
    const version = parseFloat(match[1]);
    if (version === 10.0) return "10/11";
    if (version === 6.3) return "8.1";
    if (version === 6.2) return "8";
    if (version === 6.1) return "7";
  }
  return "";
};

// Get user location using Geolocation API
export const getUserLocation = async () => {
  // First try browser geolocation API for precise coordinates
  if ("geolocation" in navigator) {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          const location = `${latitude.toFixed(4)}, ${longitude.toFixed(4)} (${accuracy?.toFixed(0) || "Unknown"}m)`;
          resolve(location);
        },
        (error) => {
          console.error("Geolocation xatosi:", error.message);
          // Fallback to IP geolocation if browser geolocation fails
          getIPLocation(resolve);
        },
      );
    });
  } else {
    // Browser doesn't support geolocation, use IP geolocation
    return new Promise((resolve) => {
      getIPLocation(resolve);
    });
  }
};

// Helper function to get location from IP
const getIPLocation = async (resolve) => {
  try {
    const ipResponse = await fetch("https://ipapi.co/json/");
    const locationData = await ipResponse.json();
    const location = `${locationData.city || "Unknown"}, ${locationData.country_name || "Unknown"}`;
    resolve(location);
  } catch (error) {
    console.error("IP joylashuvni olishda xato:", error);
    resolve("Unknown");
  }
};
