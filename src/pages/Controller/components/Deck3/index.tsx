import Fader from "@/components/Fader";
import VJPlayer from "@/components/VJPlayer";
import type { VJPlayerRef, VJSyncData } from "@/components/VJPlayer/types";
import { INITIAL_SYNC_DATA, LOCAL_STORAGE_KEY } from "@/constants";
import { useStorageSync } from "@/hooks/useStorageSync";
import {
  isYouTubePlaylistInfo,
  isYouTubeVideoId,
  isYouTubeVideoInfo,
  urlParser,
} from "@/pages/Controller/utils/youtube";
import { useCallback, useMemo, useRef, useState } from "react";
import { useControllerAPIContext } from "../../contexts/ControllerAPIContext";
import SeekBar from "../Deck/components/SeekBar";
import { useDeckAPI } from "../Deck/hooks/useDeckAPI";
import styles from "./index.module.css";

interface Deck3Props {
  className?: string;
}

const DECK3_ID = 2;

const Deck3 = ({ className }: Deck3Props) => {
  const { libraryAPI } = useControllerAPIContext();
  const vjPlayerRef = useRef<VJPlayerRef | null>(null);

  const { data: syncData, setData: setSyncData } = useStorageSync<VJSyncData>(
    LOCAL_STORAGE_KEY.deck3,
    { ...INITIAL_SYNC_DATA, paused: true },
    { overwrite: true }
  );
  const syncDataRef = useRef(syncData);
  syncDataRef.current = syncData;

  const [opacity, setOpacity] = useState<number>(0);
  const [isAudioOn, setIsAudioOn] = useState<boolean>(true);
  const [preparedVideoId, setPreparedVideoId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const updateSyncData = useCallback(
    (partialSyncData: Partial<VJSyncData>) => {
      const prev = syncDataRef.current;
      if (!prev) return;
      const next = { ...prev, ...partialSyncData } as VJSyncData;
      setSyncData(next);
    },
    [setSyncData]
  );

  const deckAPIRef = useDeckAPI({
    vjPlayerRef,
    syncDataRef,
    updateSyncData,
    deckId: DECK3_ID,
    onOpacityChange: (val) => setOpacity(val),
    onMuteChange: (isMuted) => setIsAudioOn(!isMuted),
  });

  const getCurrentTime = useCallback(() => vjPlayerRef.current?.getCurrentTime() ?? 0, []);
  const getDuration = useCallback(() => deckAPIRef.current?.getDuration() ?? 0, [deckAPIRef]);

  // 再生/停止イベント（デッキ1・2と同じ）
  const vjPlayerEvents = useMemo(
    () => ({
      onPaused: () => {
        updateSyncData({
          currentTime: vjPlayerRef.current?.getCurrentTime() ?? 0,
          baseTime: Date.now(),
          paused: true,
        });
      },
      onUnpaused: () => {
        updateSyncData({
          baseTime: Date.now(),
          paused: false,
        });
      },
      onEnded: () => {
        updateSyncData({
          currentTime: 0,
          baseTime: Date.now(),
        });
      },
    }),
    [updateSyncData]
  );

  // 縦フェーダーでopacityを直接制御
  const handleFaderChange = useCallback(
    (value: number) => {
      setOpacity(value);
      updateSyncData({
        filters: { ...syncDataRef.current?.filters, opacity: `${value}` },
      });
    },
    [updateSyncData]
  );

  const handleVideoIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (isYouTubeVideoId(value)) {
      setPreparedVideoId(value);
      return;
    }
    const info = urlParser.parse(value);
    if (isYouTubeVideoInfo(info) && inputRef.current) {
      inputRef.current.value = info.id;
      setPreparedVideoId(info.id);
    }
    if (isYouTubePlaylistInfo(info)) {
      libraryAPI?.playlists.addFromYouTubePlaylist(info.list);
    }
  };

  return (
    <div className={`${styles.deck3} ${className ?? ""}`}>
      <div className={styles.header}>DECK 3</div>

      {/* プレイヤー（デッキ1・2と同様に表示） */}
      <VJPlayer
        className={styles.player}
        ref={vjPlayerRef}
        syncKey={LOCAL_STORAGE_KEY.deck3}
        events={vjPlayerEvents}
      />

      {/* シークバー */}
      <SeekBar
        currentTimeFunc={getCurrentTime}
        durationFunc={getDuration}
        hotCues={new Map()}
        loopMarkers={[]}
        onSeek={(time) => deckAPIRef.current?.seekTo(time)}
      />

      {/* Audio オン/オフ */}
      <fieldset className={styles.audioFieldset}>
        <legend>Audio</legend>
        <button
          type="button"
          className={`${styles.audioButton} ${isAudioOn ? styles.audioOn : ""}`}
          onClick={() => {
            deckAPIRef.current?.isMuted()
              ? deckAPIRef.current?.unMute()
              : deckAPIRef.current?.mute();
          }}
        >
          {isAudioOn ? "ON" : "OFF"}
        </button>
      </fieldset>

      {/* Adjustボタン */}
      <fieldset className={styles.adjustFieldset}>
        <legend>Adjust</legend>
        <div className={styles.adjust}>
          <button type="button" onClick={() => deckAPIRef.current?.adjustTiming(-5)}>&lt;</button>
          <span>5s</span>
          <button type="button" onClick={() => deckAPIRef.current?.adjustTiming(5)}>&gt;</button>
          <button type="button" onClick={() => deckAPIRef.current?.adjustTiming(-1)}>&lt;</button>
          <span>1s</span>
          <button type="button" onClick={() => deckAPIRef.current?.adjustTiming(1)}>&gt;</button>
          <button type="button" onClick={() => deckAPIRef.current?.adjustTiming(-0.1)}>&lt;</button>
          <span>0.1s</span>
          <button type="button" onClick={() => deckAPIRef.current?.adjustTiming(0.1)}>&gt;</button>
        </div>
      </fieldset>

      {/* 動画ロード */}
      <fieldset className={styles.loadTrack}>
        <legend>Load Track</legend>
        {preparedVideoId && (
          <img
            className={styles.ytThumbnail}
            alt="YouTube Thumbnail"
            src={`https://img.youtube.com/vi/${preparedVideoId}/default.jpg`}
          />
        )}
        <input
          ref={inputRef}
          type="text"
          placeholder="Enter YouTube ID"
          onChange={handleVideoIdChange}
          onFocus={(e) => e.target.select()}
        />
        <button
          type="button"
          className={styles.loadButton}
          disabled={!preparedVideoId}
          onClick={() => {
            if (preparedVideoId) deckAPIRef.current?.loadVideo(preparedVideoId);
          }}
        >
          Load to Deck 3
        </button>
      </fieldset>

      {/* 縦フェーダー */}
      <fieldset className={styles.faderField}>
        <legend>Overlay</legend>
        <div className={styles.faderWrapper}>
          <span className={styles.faderLabel}>100%</span>
          <Fader
            vertical={true}
            style={{ height: "160px" }}
            min={0}
            max={1}
            value={opacity}
            step={0.01}
            onChange={handleFaderChange}
          />
          <span className={styles.faderLabel}>0%</span>
        </div>
        <div className={styles.opacityValue}>{Math.round(opacity * 100)}%</div>
      </fieldset>
    </div>
  );
};

export default Deck3;
