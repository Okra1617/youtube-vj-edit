import { useMidiDevicesBase } from "@/hooks/useMidiDevicesBase";
import { useCallback, useState } from "react";
import type { MIDIScriptManager } from "../types/MIDIScriptManager";

export function useMidiController() {
  const [midiAPI, setMidiAPI] = useState<MIDIScriptManager | null>(null);

  const { requestAccess } = useMidiDevicesBase({ executeScript: true });

  const requestAccessWithAPI = useCallback(async () => {
    await requestAccess();
    setMidiAPI({
      requestAccess: () => Promise.resolve(),
      openCustomScriptEditor: () =>
        window.open(`${import.meta.env.BASE_URL}midi-script-editor`, "MidiScriptEditor", "width=640,height=720"),
    });
  }, [requestAccess]);

  const openCustomScriptEditor = useCallback(() => {
    window.open(`${import.meta.env.BASE_URL}midi-script-editor`, "MidiScriptEditor", "width=640,height=720");
  }, []);

  return {
    midiAPI,
    requestAccess: requestAccessWithAPI,
    openCustomScriptEditor,
  };
}
