// @azesmway/react-native-unity ships its declarations under
// lib/typescript/src/, but its package.json points "types" at
// lib/typescript/index.d.ts (which does not exist). TypeScript therefore
// fails to resolve the package. Until upstream fixes the entry, we redeclare
// the public surface we use.

declare module "@azesmway/react-native-unity" {
  import * as React from "react";
  import type { StyleProp, ViewStyle } from "react-native";

  type UnityMessageEvent = Readonly<{ message: string }>;

  export interface UnityViewProps {
    androidKeepPlayerMounted?: boolean;
    fullScreen?: boolean;
    style?: StyleProp<ViewStyle>;
    onUnityMessage?: (event: { nativeEvent: UnityMessageEvent }) => void;
    onPlayerUnload?: (event: { nativeEvent: UnityMessageEvent }) => void;
    onPlayerQuit?: (event: { nativeEvent: UnityMessageEvent }) => void;
  }

  export default class UnityView extends React.Component<UnityViewProps> {
    postMessage(gameObject: string, methodName: string, message: string): void;
    unloadUnity(): void;
    pauseUnity(pause: boolean): void;
    resumeUnity(): void;
    windowFocusChanged(hasFocus?: boolean): void;
  }
}
