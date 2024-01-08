import Geolocation from '@react-native-community/geolocation';
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, AppState } from 'react-native';
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import { PERMISSIONS, RESULTS, request } from 'react-native-permissions';

const App = () => {
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [isLockOpen, setLockOpen] = useState(false);
  const [isRequestingLocationPermission, setRequestingLocationPermission] = useState(false);

  const rnBiometrics = useRef(new ReactNativeBiometrics({ allowDeviceCredentials: true }));

  const appStateRef = useRef(AppState.currentState);

  const permissionCheck = () => {
    rnBiometrics.current.isSensorAvailable().then(resultObject => {
      console.log('resultObject', resultObject);
      const { available, biometryType } = resultObject;

      if (available && biometryType === BiometryTypes.TouchID)
        console.log('TouchID is supported');
      else if (available && biometryType === BiometryTypes.FaceID)
        console.log('FaceID is supported');
      else if (available && biometryType === BiometryTypes.Biometrics)
        console.log('Biometrics is supported');
      else console.log('Biometrics not supported');
    });
  };

  const location = () => {
    const successCallback = success => {
      setLatitude(success?.coords?.latitude);
      setLongitude(success?.coords?.longitude);
      setLockOpen(true);
    };

    const errorCallback = error => {
      console.log('error', error);
    };

    const options = {
      enableHighAccuracy: false,
      maximumAge: 0,
    };

    Geolocation.getCurrentPosition(successCallback, errorCallback, options);
  };

  const handleAppStateChange = nextAppState => {
    console.log('App state change:', nextAppState);
    if (nextAppState === 'active' && isLockOpen) {
      console.log('App is active, attempting to unlock...');
      handleUnlock();
    }
  };

  const handleUnlock = () => {
    console.log('Handling unlock...');
    rnBiometrics.current
      .simplePrompt({ promptMessage: 'Unlock with biometrics' })
      .then(resultObject => {
        const { success } = resultObject;
        if (success) {
          console.log('Biometric authentication successful. Unlocking...');
          Alert.alert('Biometric authentication successful. Unlocking...');
        } else {
          console.log('Biometric authentication failed. Lock remains closed.');
        }
      })
      .catch(error => {
        console.error('Biometric authentication error:', error);
      });
  };

  const requestLocationPermission = async () => {
    try {
      setRequestingLocationPermission(true);

      request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION).then(async result => {
        switch (result) {
          case RESULTS.UNAVAILABLE:
            break;
          case RESULTS.DENIED:
            break;
          case RESULTS.GRANTED:
            if (latitude && longitude) {
              handleUnlock();
            }
            break;
          case RESULTS.BLOCKED:
            break;
        }
      });
    } catch (error) {
      console.error('Error on getting location permission', error);
    } finally {
      setRequestingLocationPermission(false);
    }
  };

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [isLockOpen]);

  useEffect(() => {
    location();
    permissionCheck();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Secure Banking</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.locationText}>Latitude: {latitude}</Text>
        <Text style={styles.locationText}>Longitude: {longitude}</Text>

        {isLockOpen ? (
          <TouchableOpacity
            onPress={() => requestLocationPermission()}
            style={styles.lockButton}>
            {isRequestingLocationPermission ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.lockButtonText}>🔓</Text>
                <Text style={styles.lockButtonText}>Unlock</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <Text style={styles.lockClosedText}>Lock closed</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#3498db',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  locationText: {
    fontSize: 18,
    color: '#333',
    marginBottom: 10,
  },
  lockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00cc66',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  lockButtonText: {
    marginLeft: 10,
    color: '#fff',
    fontSize: 18,
  },
  lockClosedText: {
    fontSize: 18,
    color: '#cc0000',
    marginTop: 20,
  },
});

export default App;
