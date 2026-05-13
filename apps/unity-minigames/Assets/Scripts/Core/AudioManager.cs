using System.Collections.Generic;
using UnityEngine;

namespace TheVault.Core
{
    // Tiny shared SFX/BGM wrapper. Games drop AudioClips into
    // Assets/Audio/<gameId>/ and register them by string id once at startup.
    // Avoids each game spawning its own AudioSource pool.
    public class AudioManager : MonoBehaviour
    {
        public static AudioManager Instance { get; private set; }

        [SerializeField] private int _sfxVoices = 6;

        private readonly Dictionary<string, AudioClip> _clips = new Dictionary<string, AudioClip>();
        private AudioSource[] _sfx;
        private AudioSource _bgm;
        private int _nextVoice;

        private void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
            DontDestroyOnLoad(gameObject);

            _sfx = new AudioSource[_sfxVoices];
            for (var i = 0; i < _sfxVoices; i++)
            {
                _sfx[i] = gameObject.AddComponent<AudioSource>();
                _sfx[i].playOnAwake = false;
            }
            _bgm = gameObject.AddComponent<AudioSource>();
            _bgm.loop = true;
            _bgm.playOnAwake = false;
        }

        public void Register(string id, AudioClip clip)
        {
            if (string.IsNullOrEmpty(id) || clip == null) return;
            _clips[id] = clip;
        }

        public void PlaySfx(string id, float volume = 1f, float pitch = 1f)
        {
            if (!_clips.TryGetValue(id, out var clip) || clip == null) return;
            var voice = _sfx[_nextVoice];
            _nextVoice = (_nextVoice + 1) % _sfx.Length;
            voice.pitch = pitch;
            voice.PlayOneShot(clip, Mathf.Clamp01(volume));
        }

        public void PlayBgm(string id, float volume = 0.6f)
        {
            if (!_clips.TryGetValue(id, out var clip) || clip == null) return;
            if (_bgm.clip == clip && _bgm.isPlaying) return;
            _bgm.clip = clip;
            _bgm.volume = Mathf.Clamp01(volume);
            _bgm.Play();
        }

        public void StopBgm()
        {
            _bgm.Stop();
            _bgm.clip = null;
        }
    }
}
