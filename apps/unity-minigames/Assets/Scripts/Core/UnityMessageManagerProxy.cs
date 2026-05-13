using System;
using System.Runtime.InteropServices;
using UnityEngine;

namespace TheVault.Core
{
    // Bridges outbound Unity → React Native messages for the
    // @azesmway/react-native-unity package.
    //
    // The package exposes two send paths (see ButtonBehavior.cs in the
    // installed package):
    //   - iOS:     NativeAPI extern `sendMessageToMobileApp(string)` via
    //              the Plugins/iOS/NativeCallProxy.mm bundled by the pkg.
    //   - Android: static method on
    //              com.azesmwayreactnativeunity.ReactNativeUnityViewManager,
    //              invoked through AndroidJavaClass.
    //
    // In the Unity Editor and other targets we just log the payload so
    // gameplay can be iterated without a connected RN runtime.
    internal static class UnityMessageManagerProxy
    {
#if UNITY_IOS && !UNITY_EDITOR
        [DllImport("__Internal")]
        private static extern void sendMessageToMobileApp(string message);
#endif

        public static void Send(string json)
        {
            if (string.IsNullOrEmpty(json)) return;

#if UNITY_IOS && !UNITY_EDITOR
            try
            {
                sendMessageToMobileApp(json);
                return;
            }
            catch (Exception e)
            {
                Debug.LogWarning($"[Bridge] iOS send failed: {e.Message}");
            }
#elif UNITY_ANDROID && !UNITY_EDITOR
            try
            {
                using (var jc = new AndroidJavaClass("com.azesmwayreactnativeunity.ReactNativeUnityViewManager"))
                {
                    jc.CallStatic("sendMessageToMobileApp", json);
                }
                return;
            }
            catch (Exception e)
            {
                Debug.LogWarning($"[Bridge] Android send failed: {e.Message}");
            }
#endif

            // Editor / unsupported platform fallback.
            Debug.Log($"[Bridge] (no native) {json}");
        }
    }
}
